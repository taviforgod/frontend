import React, { useEffect, useState, useMemo } from "react";
import {
  Typography, Paper, Grid, Card, CardContent,
  LinearProgress, CircularProgress, Box, Button, TextField,
  Stack, MenuItem, Select, FormControl, InputLabel,
  Switch, FormControlLabel, Pagination, Divider, Chip,
  Tooltip, Avatar, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Checkbox,
  FormGroup, Snackbar, Alert
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Users, UserPlus, Award, RefreshCw,
  Search, ShieldCheck, X, Download
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, Tooltip as RcTooltip, XAxis, YAxis, CartesianGrid
} from "recharts";
import { getCellHealthDashboard } from "../services/cellModuleService";

const DEFAULT_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "members_count", label: "Members" },
  { key: "new_members", label: "New members" },
  { key: "attendance_rate", label: "Attendance rate" },
  { key: "avg_visitors", label: "Avg visitors" },
  { key: "health_score", label: "Health score" },
  { key: "last_meeting_date", label: "Last meeting" },
  { key: "last_absentees", label: "Last absentees" },
];

const healthTier = (score) => {
  if (score > 90) return { label: "Excellent", color: "primary" };
  if (score >= 70) return { label: "Good", color: "success" };
  if (score >= 50) return { label: "Average", color: "warning" };
  return { label: "Poor", color: "error" };
};

function CircularHealth({ value }) {
  const size = 72, thickness = 6;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const { color } = healthTier(clamped);
  return (
    <Tooltip title={`Health Score: ${clamped}%`} placement="top">
      <Box sx={{ position: "relative", width: size, height: size }}>
        <CircularProgress
          variant="determinate"
          value={clamped}
          size={size}
          thickness={thickness}
          sx={{
            color: (theme) =>
              color === "primary" ? theme.palette.primary.main :
              color === "success" ? theme.palette.success.main :
              color === "warning" ? theme.palette.warning.main :
              theme.palette.error.main,
          }}
        />
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{clamped}%</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

function SparklineDual({ history = [], width = 100, height = 30 }) {
  if (!history || history.length === 0) return <Typography variant="caption">—</Typography>;
  const data = history.map((m) => ({
    date: new Date(m.date).toLocaleDateString(),
    attendance: Math.round((m.attendance || 0) * 100),
    absentees: Number(m.absentees || 0),
  }));
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="attendance" stroke="#1976d2" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="absentees" stroke="#d32f2f" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function HealthDetailsDialog({ open, onClose, group }) {
  if (!group) return null;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {group.name} — Health Details
        <IconButton onClick={onClose} sx={{ float: "right" }}><X size={16} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Attendance Trend</Typography>
        {group.attendance_trend?.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {group.attendance_trend.map((a, i) => (
              <Chip key={i} label={`Week ${a.week}: ${a.attendance}`} size="small" />
            ))}
          </Stack>
        ) : <Typography variant="caption" color="text.secondary">No attendance data</Typography>}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Visitors</Typography>
        <Typography variant="body2">
          Active: {group.visitors?.active_visitors ?? 0}, Converted: {group.visitors?.converted_visitors ?? 0}
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Growth</Typography>
        {group.growth?.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {group.growth.map((g, i) => (
              <Chip key={i} label={`${g.month}: ${g.members} new`} size="small" />
            ))}
          </Stack>
        ) : <Typography variant="caption" color="text.secondary">No growth data</Typography>}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Conversions</Typography>
        {group.conversions?.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {group.conversions.map((c, i) => (
              <Chip key={i} label={`${c.month}: ${c.count} conversions`} size="small" />
            ))}
          </Stack>
        ) : <Typography variant="caption" color="text.secondary">No conversions</Typography>}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Absentees (last meeting)</Typography>
        {group.absentees?.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {group.absentees.map((a, i) => (
              <Chip key={i} label={`${a.first_name} ${a.surname}`} size="small" />
            ))}
          </Stack>
        ) : <Typography variant="caption" color="text.secondary">No absentees</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function HealthCard({ group, onView }) {
  const theme = useTheme();
  const { label, color } = healthTier(group.health_score);
  const lastMeeting = group.last_meeting_date ? new Date(group.last_meeting_date).toLocaleDateString() : "—";
  // Use attendance trend for sparkline
  const attendanceSeries = group.attendance_trend?.map(a => a.attendance) || [];
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <CardContent>
        <Stack direction="row" spacing={2}>
          <CircularHealth value={group.health_score} />
          <Box>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800 }}>{group.name}</Typography>
            <Typography variant="caption" color="text.secondary">Last meeting: {lastMeeting}</Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={label} size="small" color={color} icon={<ShieldCheck size={14} />} />
            </Box>
            <Box sx={{ mt: 1 }}>
              {/* Simple sparkline for attendance */}
              {attendanceSeries.length ? (
                <Box sx={{ display: "flex", gap: 1 }}>
                  {attendanceSeries.map((v, i) => (
                    <Chip key={i} label={v} size="small" />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">No attendance data</Typography>
              )}
            </Box>
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption">Members: {group.members_count}</Typography>
          <Typography variant="caption">Visitors: {group.visitors?.active_visitors ?? group.avg_visitors ?? 0}</Typography>
          <Typography variant="caption">Absentees: {group.absentees?.length ?? group.last_absentees ?? 0}</Typography>
        </Stack>
        <Box sx={{ mt: 1, textAlign: "right" }}>
          <Button size="small" variant="outlined" onClick={() => onView(group)}>View</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function HealthDashboard() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await getCellHealthDashboard();
      setGroups(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHealth(); }, []);

  useEffect(() => {
    let filtered = [...groups];
    if (search) filtered = filtered.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "health") filtered.sort((a,b) => b.health_score - a.health_score);
    else if (sortBy === "members") filtered.sort((a,b) => b.members_count - a.members_count);
    else filtered.sort((a,b) => a.name.localeCompare(b.name));
    setFilteredGroups(filtered);
  }, [groups, search, sortBy]);

  const stats = useMemo(() => {
    const total = filteredGroups.length;
    const totalMembers = filteredGroups.reduce((sum,g) => sum + (g.members_count||0),0);
    const avgAttendance = total ? Math.round(filteredGroups.reduce((s,g) => s + (g.attendance_rate||0)*100,0)/total) : 0;
    const totalAbsentees = filteredGroups.reduce((s,g) => s + (g.absentees?.length || g.last_absentees || 0),0);
    return { total, totalMembers, avgAttendance, totalAbsentees };
  }, [filteredGroups]);

  const handleView = (group) => { setSelectedGroup(group); setDetailsOpen(true); };
  const handleClose = () => { setDetailsOpen(false); setSelectedGroup(null); };

  return (
    <Box sx={{ p:2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight:800 }}>Cell Health</Typography>
      <Paper sx={{ p:2, mb:2 }}>
        <TextField size="small" label="Search groups" value={search} onChange={(e)=>setSearch(e.target.value)} sx={{ mr:2 }} InputProps={{ startAdornment:(<InputAdornment position="start"><Search size={14} /></InputAdornment>) }} />
        <FormControl size="small">
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e)=>setSortBy(e.target.value)}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="members">Members</MenuItem>
            <MenuItem value="health">Health</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p:2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight:700 }}>Summary</Typography>
            <Divider sx={{ my:1 }}/>
            <Typography variant="body2">Groups: {stats.total}</Typography>
            <Typography variant="body2">Members: {stats.totalMembers}</Typography>
            <Typography variant="body2">Avg Attendance: {stats.avgAttendance}%</Typography>
            <Typography variant="body2">Absentees (last mtg): {stats.totalAbsentees}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {loading ? <Typography>Loading...</Typography> : filteredGroups.map((g) => (
              <Grid key={g.id} item xs={12} sm={6} md={4}>
                <HealthCard group={g} onView={handleView} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
      <HealthDetailsDialog open={detailsOpen} onClose={handleClose} group={selectedGroup} />
    </Box>
  );
}
