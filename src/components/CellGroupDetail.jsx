import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  IconButton,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  getCellGroup,
  getCellHealth,
  listCellGroupMembers,
  addCellGroupMember,
  removeCellGroupMember,
} from "../services/cellService";
import { listVisitors } from "../services/visitorService";
import { Trash2 } from "lucide-react";
import WeeklyReportForm from "../components/WeeklyReportForm";
import ReportsDashboard from "../components/ReportsDashboard";
import { ThemeContext } from "../contexts/ThemeContext";
import { AuthContext } from "../contexts/AuthContext"; // <-- Add this import
import { DateTime } from 'luxon';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function CellGroupDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [tab, setTab] = useState(0);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Members
  const [members, setMembers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [form, setForm] = useState({ member: null, role: "" });

  // Visitors
  const [visitors, setVisitors] = useState([]);

  // Weekly report dialog + snackbar
  const [openReport, setOpenReport] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const params = new URLSearchParams(location.search);
  const newMemberId = params.get("newMemberId");
  const newMemberRef = useRef(null);

  const tabMapping = {
    overview: 0,
    members: 1,
    reports: 2,
    absentees: 3,
    health: 4,
  };
  const reverseMapping = Object.fromEntries(
    Object.entries(tabMapping).map(([k, v]) => [v, k])
  );

  // Theme context
  const { mode, theme } = useContext(ThemeContext);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  // Sync tab from query param
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tabName = query.get("tab");
    if (tabName && tabMapping[tabName] !== undefined) {
      setTab(tabMapping[tabName]);
    }
  }, [location.search]);

  // Load group
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setGroup(await getCellGroup(id, fetchWithAuth));
        if (tab === 4 || tab === 2) {
          const healthData = await getCellHealth(id, fetchWithAuth);
          setHealth(healthData);
        }
      } catch (err) {
        console.error("Error loading group:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, tab, fetchWithAuth]);

  // Load members and visitors
  useEffect(() => {
    if (tab === 1) {
      (async () => {
        setMembers(await listCellGroupMembers(id, fetchWithAuth));
        const res = fetchWithAuth
          ? await fetchWithAuth(`${API_URL}/api/members`, { credentials: "include" })
          : await fetch(`${API_URL}/api/members`, { credentials: "include" });
        setAllMembers(await res.json());
        // Fetch visitors for this cell group
        const allVisitors = fetchWithAuth
          ? await listVisitors(fetchWithAuth)
          : await listVisitors();
        setVisitors(allVisitors.filter(v => v.cell_group_id === Number(id)));
      })();
    }
  }, [tab, id, fetchWithAuth]);

  useEffect(() => {
    if (newMemberRef.current) {
      newMemberRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [group]);

  const handleTabChange = (_, newValue) => {
    setTab(newValue);
    const tabName = reverseMapping[newValue];
    navigate(`/cell-groups/${id}?tab=${tabName}`, { replace: true });
  };

  const handleAddMember = async (selectedMember, role) => {
    if (!selectedMember) return;
    await addCellGroupMember(id, { member_id: selectedMember.id, role });
    setMembers(await listCellGroupMembers(id));
    setOpenAdd(false);
    setForm({ member: null, role: "" });
  };

  if (!group) return <Typography>Loading...</Typography>;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: mode === "dark" ? theme.palette.background.default : "#f9f9f9", // Theme-aware background
        minHeight: "100vh",
        transition: "background 0.2s",
      }}
    >
      <Typography variant="h5" sx={{ mb: 2 }}>
        {group.name}
      </Typography>

      <Tabs value={tab} onChange={handleTabChange}>
        <Tab label="Overview" />
        <Tab label="Members" />
        <Tab label="Reports" />
        <Tab label="Absentees" />
        <Tab label="Health" />
      </Tabs>

      {loading && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {/* ===== Overview ===== */}
      {!loading && tab === 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Leader:</strong>{" "}
            {group.leader_name || "N/A"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Zone:</strong> {group.zone_name || "N/A"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {group.status || "N/A"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Next Meeting:</strong>{" "}
            {group.next_meeting_date
              ? DateTime.fromISO(group.next_meeting_date).toLocaleString(DateTime.DATE_MED)
              : "—"}
          </Typography>
          <Typography variant="body2">
            <strong>Members:</strong> {group.members?.length ?? 0}
          </Typography>
        </Box>
      )}

      {/* ===== Members ===== */}
      {!loading && tab === 1 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Cell Members</Typography>
          {[...members, ...(group.leader_id && !members.some(m => m.id === group.leader_id) && group.leader_name
  ? [{ id: group.leader_id, first_name: group.leader_name.split(" ")[0], surname: group.leader_name.split(" ").slice(1).join(" "), role: "Leader" }]
  : [])].map((m) => (
    <Box
      key={m.id}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
        p: 1,
        border: "1px solid #eee",
        borderRadius: 1,
        background: mode === "dark" ? theme.palette.background.paper : "#fff",
      }}
      ref={m.id === Number(newMemberId) ? newMemberRef : null}
    >
      <Typography>
        {m.first_name} {m.surname} — {m.role}
      </Typography>
      {m.role !== "Leader" && (
        <IconButton
          color="error"
          onClick={async () => {
            await removeCellGroupMember(id, m.id);
            setMembers(members.filter((x) => x.id !== m.id));
          }}
        >
          <Trash2 size={18} />
        </IconButton>
      )}
    </Box>
  ))}

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setOpenAdd(true)}
          >
            Add Member
          </Button>

          {/* Add Member Modal */}
          <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
            <DialogTitle>Add Cell Member</DialogTitle>
            <DialogContent>
              <Autocomplete
                options={allMembers}
                getOptionLabel={(option) =>
                  `${option.first_name} ${option.surname}`
                }
                value={form.member}
                onChange={(e, value) => setForm({ ...form, member: value })}
                renderInput={(params) => (
                  <TextField {...params} label="Select Member" />
                )}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Role"
                fullWidth
                margin="dense"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button
                onClick={() => handleAddMember(form.member, form.role)}
                variant="contained"
                disabled={!form.member}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>

          {/* Visitors Section */}
          {visitors.length > 0 && (
  <>
    <Divider sx={{ my: 2 }} />
    <Typography variant="subtitle1" sx={{ mb: 1 }}>Visitors</Typography>
    {visitors.map((v) => (
      <Box
        key={v.id}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          p: 1,
          border: "1px dashed #bbb",
          borderRadius: 1,
          background: mode === "dark" ? theme.palette.background.paper : "#f9f9f9",
        }}
      >
        <Typography>
          {v.first_name} {v.surname} — Visitor
        </Typography>
      </Box>
    ))}
  </>
)}
        </Box>
      )}

      {/* ===== Reports ===== */}
      {!loading && tab === 2 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Weekly Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Submit this week’s meeting report and attendance, or view the
            combined dashboard.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => setOpenReport(true)}
            >
              Submit Weekly Report
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/reports")}
            >
              View Reports Dashboard
            </Button>
          </Box>

          {/* Local mini health preview */}
          {health ? (
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Recent Attendance Trend</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={health.attendance_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ReTooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#1976d2" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent data yet.
            </Typography>
          )}
        </Box>
      )}

      {/* ===== Absentees ===== */}
      {!loading && tab === 3 && (
        <Box sx={{ mt: 3 }}>
          <ReportsDashboard />
        </Box>
      )}

      {/* ===== Health ===== */}
      {!loading && tab === 4 && health && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: mode === "dark" ? theme.palette.background.paper : "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attendance Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={health.attendance_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <ReTooltip />
                      <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke="#1976d2"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ background: mode === "dark" ? theme.palette.background.paper : "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conversions
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={health.conversions || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey="count" fill="#4caf50" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Health Report */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Health Report
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle1">Attendance Trend (last weeks)</Typography>
            <ul>
              {health.attendance_trend.map((a, i) => (
                <li key={i}>Week {a.week}: {a.attendance} present</li>
              ))}
            </ul>

            <Typography variant="subtitle1" sx={{ mt: 3 }}>Absentees Trend</Typography>
            {health.absentees_trend.length === 0 ? (
              <p>No absentees recorded.</p>
            ) : (
              <ul>
                {health.absentees_trend.map((a, i) => (
                  <li key={i}>Week {a.week}: {a.absentees} absent</li>
                ))}
              </ul>
            )}

            <Typography variant="subtitle1" sx={{ mt: 3 }}>Growth</Typography>
            <ul>
              {health.growth.map((g, i) => (
                <li key={i}>{g.month}: {g.members} new members</li>
              ))}
            </ul>

            <Typography variant="subtitle1" sx={{ mt: 3 }}>Visitors</Typography>
            <p>Active Visitors: {health.visitors.active_visitors}</p>
            <p>Converted Visitors: {health.visitors.converted_visitors}</p>

            <Typography variant="subtitle1" sx={{ mt: 3 }}>Conversions</Typography>
            {health.conversions.length === 0 ? (
              <p>No conversions yet.</p>
            ) : (
              <ul>
                {health.conversions.map((c, i) => (
                  <li key={i}>{c.month}: {c.count} conversions</li>
                ))}
              </ul>
            )}

            <Typography variant="subtitle1" sx={{ mt: 3 }}>Absentees (last meeting)</Typography>
            {health.absentees.length === 0 ? (
              <p>No absentees in last meeting.</p>
            ) : (
              <ul>
                {health.absentees.map((a, i) => (
                  <li key={i}>{a.first_name} {a.surname}</li>
                ))}
              </ul>
            )}
          </Box>
        </Box>
      )}

      {/* NEW Weekly Report Dialog */}
      <WeeklyReportForm
        open={openReport}
        onClose={() => setOpenReport(false)}
        cellId={id}
        onSaved={async () => {
          // refresh health metrics after report
          setHealth(await getCellHealth(id));
          setSnackbar({
            open: true,
            message: "Weekly report submitted successfully.",
            severity: "success",
          });
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
