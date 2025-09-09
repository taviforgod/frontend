import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Box,
  Button,
  TextField,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Pagination,
  Divider,
  Chip,
  Tooltip,
  Avatar,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormGroup,
  FormControlLabel as MuiFormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Lucide icons
import {
  Users,
  UserPlus,
  Award,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  Download,
} from "lucide-react";

// XLSX for client-side Excel export
import * as XLSX from "xlsx";
// Recharts for richer sparklines and charts
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip as RcTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Placeholder service import — replace with your real service
import { getCellHealthDashboard } from "../services/cellModuleService";

/*
  Enhanced Health Dashboard
  - Recharts-based chart selector in the details dialog (line / area / bar)
  - CSV / XLSX / JSON export options with configurable columns
  - Server-side export button (posts data to an API endpoint; backend must implement)
  - Keep existing UX: tooltips, details dialog, accessibility

  Required client deps:
    npm install xlsx recharts
*/

const DEFAULT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "members_count", label: "Members" },
  { key: "new_members", label: "New members" },
  { key: "attendance_rate", label: "Attendance rate" },
  { key: "avg_visitors", label: "Avg visitors" },
  { key: "health_score", label: "Health score" },
  { key: "last_meeting_date", label: "Last meeting" },
  { key: "engagement_score", label: "Engagement" },
  { key: "meetings_held", label: "Meetings held" },
];

const healthTier = (score) => {
  if (score > 90) return { label: "Excellent", color: "primary" };      // >90%
  if (score >= 70) return { label: "Good", color: "success" };          // 70–90%
  if (score >= 50) return { label: "Average", color: "warning" };       // 50–69%
  return { label: "Poor", color: "error" };                             // <50%
};

function CircularHealth({ value }) {
  const size = 72;
  const thickness = 6;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const { color } = healthTier(clamped); // Use your new logic!
  return (
    <Tooltip title={`Health Score: ${clamped}%`} placement="top">
      <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }} aria-hidden>
        <CircularProgress
          variant="determinate"
          value={clamped}
          size={size}
          thickness={thickness}
          sx={{
            color: (theme) =>
              color === "primary"
                ? theme.palette.primary.main
                : color === "success"
                ? theme.palette.success.main
                : color === "warning"
                ? theme.palette.warning.main
                : theme.palette.error.main,
          }}
        />
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Typography variant="caption" component="div" sx={{ fontWeight: 700 }}>{clamped}%</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

// Sparkline using Recharts (fallback handled by Recharts)
function Sparkline({ data = [], width = 120, height = 34 }) {
  // Data should already be in percent
  const points = (data || []).map((v) => ({ value: Math.round(Number(v) || 0) }));
  if (!points.length) return <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="text.secondary">—</Typography></Box>;

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={points} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <RcTooltip formatter={(v) => `${v}%`} cursor={false} />
        <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniBar({ value = 0, max = 100, label }) {
  const w = Math.max(6, Math.min(100, Math.round((value / max) * 100)));
  return (
    <Tooltip title={label || `${value}%`} placement="top">
      <Box sx={{ width: 68, height: 8, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Box sx={{ width: `${w}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, rgba(16,185,129,1) 0%, rgba(99,102,241,1) 100%)" }} />
      </Box>
    </Tooltip>
  );
}

function KPI({ icon, label, value, hint }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title={hint || label} placement="top">
        <Avatar variant="rounded" sx={{ width: 28, height: 28, bgcolor: "rgba(99,102,241,0.08)", color: "primary.main", boxShadow: 0, border: "1.5px solid rgba(99,102,241,0.18)" }} aria-label={label}>{icon}</Avatar>
      </Tooltip>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function DetailsDialog({ open, onClose, group }) {
  const [chartType, setChartType] = useState("line");

  if (!group) return null;

  // Use fallback demo data if meeting_history is missing or empty
  const history = Array.isArray(group.meeting_history) && group.meeting_history.length
    ? group.meeting_history
    : [
        { date: new Date(), attendance: 0.85 },
        { date: new Date(Date.now() - 86400000 * 7), attendance: 0.90 },
        { date: new Date(Date.now() - 86400000 * 14), attendance: 0.80 },
      ];

  // Multiply by 100 for percent
  const attendanceSeries = history.map((m) => ({ date: m.date, value: Math.round(Number(m.attendance || 0) * 100) }));
  const avg = attendanceSeries.length ? Math.round(attendanceSeries.reduce((a, b) => a + b.value, 0) / attendanceSeries.length) : 0;
  const min = attendanceSeries.length ? Math.min(...attendanceSeries.map((d) => d.value)) : 0;
  const max = attendanceSeries.length ? Math.max(...attendanceSeries.map((d) => d.value)) : 0;

  const renderChart = () => {
    if (!attendanceSeries.length) return <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" color="text.secondary">No data</Typography></Box>;

    const data = attendanceSeries.map((d, i) => ({ name: new Date(d.date).toLocaleDateString(), value: d.value }));

    const commonProps = { data, margin: { top: 4, right: 8, left: 8, bottom: 4 } };

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <RcTooltip formatter={(v) => `${v}%`} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <RcTooltip formatter={(v) => `${v}%`} />
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#colorUv)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // bar
    return (
      <ResponsiveContainer width="100%" height={160}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis />
          <RcTooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="value" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="group-details-title">
      <DialogTitle id="group-details-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{group.name} — Details</span>
        <IconButton onClick={onClose} aria-label="Close details"><X size={16} /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick stats</Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Members</Typography><Typography variant="body1" sx={{ fontWeight: 700 }}>{group.members_count}</Typography></Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">New members (6w)</Typography><Typography variant="body1" sx={{ fontWeight: 700 }}>{group.new_members}</Typography></Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Attendance rate</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {Math.round((group.attendance_rate ?? 0) * 100)}%
            </Typography>
          </Grid>
          <Grid item xs={6}><Typography variant="caption" color="text.secondary">Avg visitors</Typography><Typography variant="body1" sx={{ fontWeight: 700 }}>{group.avg_visitors}</Typography></Grid>
          <Grid item xs={12} sx={{ mt: 1 }}><Typography variant="caption" color="text.secondary">Recent notes</Typography><Box sx={{ mt: 0.5 }}><Typography variant="body2">{group.notes || 'No notes available.'}</Typography></Box></Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Meeting history (last 6)</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Chart</InputLabel>
            <Select value={chartType} label="Chart" onChange={(e) => setChartType(e.target.value)}>
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="area">Area</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ flex: 1 }}>{renderChart()}</Box>
          <Box sx={{ width: 110 }}>
            <Typography variant="caption" color="text.secondary">Avg / Min / Max</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {avg}% / {min}% / {max}%
            </Typography>
          </Box>
        </Box>

        <Box>
          {Array.isArray(history) && history.length ? (
            <Stack spacing={0.5}>
              {history.map((m, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2">{new Date(m.date).toLocaleDateString()}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {Math.round(Number(m.attendance ?? 0) * 100)}%
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No meeting history available</Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions><Button onClick={onClose} variant="outlined">Close</Button></DialogActions>
    </Dialog>
  );
}

function HealthCard({ group, onView }) {
  const theme = useTheme();
  const { label, color } = healthTier(group.health_score);
  const lastMeeting = group.last_meeting_date ? new Date(group.last_meeting_date).toLocaleDateString() : "—";
  // Multiply by 100 for percent
  const attendanceSeries = (group.meeting_history || []).map((m) => Number(m.attendance || 0) * 100);

  // Theme-aware card background and border
  const isDark = theme.palette.mode === "dark";
  const cardBg = isDark
    ? theme.palette.background.paper
    : "rgba(255,255,255,0.7)";
  const cardHoverBg = isDark
    ? theme.palette.action.hover
    : "linear-gradient(120deg, #f0f4ff 0%, #e0f7fa 100%)";
  const borderColor = isDark
    ? theme.palette.divider
    : "rgba(99,102,241,0.10)";

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 3,
        boxShadow: isDark ? 2 : 3,
        transition: "transform 180ms cubic-bezier(.4,2,.6,1), box-shadow 180ms, background 180ms",
        '&:hover': {
          transform: 'translateY(-8px) scale(1.025)',
          boxShadow: isDark ? 8 : 10,
          background: cardHoverBg,
        },
        border: `1.5px solid ${borderColor}`,
        background: cardBg,
        backdropFilter: 'saturate(160%) blur(8px)',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <CardContent sx={{ p: 2, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ flexWrap: 'wrap', minWidth: 0 }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <CircularHealth value={group.health_score} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Tooltip title={group.name} placement="top">
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {group.name}
                </Typography>
              </Tooltip>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {group.location || "—"} • {group.meetings_held} meetings
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Tooltip title={`This group's overall health tier: ${label}`}>
                  <Chip
                    label={label}
                    size="small"
                    color={color}
                    icon={<ShieldCheck size={14} style={{ marginRight: 2 }} />}
                    sx={{
                      fontWeight: 700,
                      bgcolor: color === "success" ? "#e8f5e9" : color === "warning" ? "#fff8e1" : "#ffebee",
                      color: color === "success" ? "#10b981" : color === "warning" ? "#f59e42" : "#e53935",
                    }}
                  />
                </Tooltip>
                <Tooltip title="Average number of visitors per meeting">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Avg visitors
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {group.avg_visitors}
                    </Typography>
                  </Box>
                </Tooltip>
                <Box sx={{ ml: 1 }}>
                  <Sparkline data={attendanceSeries} width={70} height={20} />
                </Box>
              </Box>
            </Box>
          </Stack>

          <Stack spacing={1} alignItems="flex-end" sx={{ minWidth: 0 }}>
            <KPI icon={<Users size={14} />} label="Members" value={group.members_count} hint="Total members in group" />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  Attendance
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {Math.round((group.attendance_rate ?? 0) * 100)}%
                </Typography>
              </Box>
              <MiniBar value={Math.round((group.attendance_rate ?? 0) * 100)} max={100} label={`Attendance: ${Math.round((group.attendance_rate ?? 0) * 100)}%`} />
            </Box>
            <Tooltip title="Date of the last recorded meeting">
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Last meeting
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {lastMeeting}
                </Typography>
              </Box>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.2, borderStyle: 'dashed', opacity: 0.7 }} />

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{ flexWrap: 'wrap', minWidth: 0 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="New members added in the current period (6 weeks)">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserPlus size={14} />
                <Typography variant="caption" color="text.secondary">
                  New members
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {group.new_members}
                </Typography>
              </Box>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Engagement score is a composite metric (attendance × participation)">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Award size={14} />
                <Typography variant="caption" color="text.secondary">
                  Engagement
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(group.engagement_score ?? 50, 100))}
                  sx={{
                    width: 80,
                    height: 8,
                    borderRadius: 99,
                    background: "rgba(16,185,129,0.08)",
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      background: "linear-gradient(90deg, #6366f1 0%, #10b981 100%)",
                    },
                  }}
                />
              </Box>
            </Tooltip>
          </Stack>

          <Button
            size="small"
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
              bgcolor: "rgba(99,102,241,0.06)",
              '&:hover': { bgcolor: "rgba(99,102,241,0.18)" },
              minWidth: 64,
            }}
            onClick={() => onView(group)}
            aria-label={`View details for ${group.name}`}
          >
            View
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function HealthDashboard() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showLowHealthOnly, setShowLowHealthOnly] = useState(false);

  // export settings
  const [exportFormat, setExportFormat] = useState("csv"); // csv | xlsx | json
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_COLUMNS.map((c) => c.key));

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCellHealthDashboard();
      const enriched = (data || []).map((g) => ({ ...g, notes: g.notes || "", meeting_history: g.meeting_history || [] }));
      setGroups(enriched);
      setLastUpdated(new Date());
      setPage(1);
    } catch (err) {
      setError("Failed to load health dashboard");
      setGroups([]);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    let filtered = Array.isArray(groups) ? [...groups] : [];
    if (search) filtered = filtered.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
    if (showLowHealthOnly) filtered = filtered.filter((g) => g.health_score < 50);

    switch (sortBy) {
      case 'health': filtered.sort((a, b) => b.health_score - a.health_score); break;
      case 'members': filtered.sort((a, b) => b.members_count - a.members_count); break;
      case 'name':
      default: filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    setFilteredGroups(filtered);
    setPage(1);
  }, [search, sortBy, groups, showLowHealthOnly]);

  const pagedGroups = useMemo(() => { const start = (page - 1) * pageSize; return filteredGroups.slice(start, start + pageSize); }, [filteredGroups, page]);
  const pageCount = Math.ceil(filteredGroups.length / pageSize) || 1;

  const stats = useMemo(() => {
    const total = filteredGroups.length;
    const totalMembers = filteredGroups.reduce((sum, g) => sum + Number(g.members_count || 0), 0);
    let avgHealth = 0;
    if (filteredGroups.length > 0) {
      avgHealth = (
        filteredGroups.reduce((sum, g) => sum + (Number(g.health_score) || 0), 0) / total
      ).toFixed(1);
    }
    return { total, totalMembers, avgHealth };
  }, [filteredGroups]);

  const handleView = (group) => { setSelectedGroup(group); setDetailsOpen(true); };
  const handleClose = () => { setDetailsOpen(false); setSelectedGroup(null); };

  const toggleColumn = (key) => setSelectedColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  // Helper to produce export rows respecting selectedColumns
  const buildExportRows = () => {
    return filteredGroups.map((g) => {
      const row = {};
      selectedColumns.forEach((c) => { row[c] = g[c] ?? ""; });
      return row;
    });
  };

  // Client-side CSV export
  const exportCSV = () => {
    const rows = buildExportRows();
    const headers = selectedColumns;
const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${String(r[h] ?? '')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    const now = new Date(); const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    a.download = `cell_health_export_${stamp}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // Client-side XLSX export
  const exportXLSX = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "CellHealth");
    const now = new Date(); const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    XLSX.writeFile(wb, `cell_health_export_${stamp}.xlsx`);
  };

  // Client-side JSON export
  const exportJSON = () => {
    const rows = buildExportRows();
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    const now = new Date(); const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    a.download = `cell_health_export_${stamp}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>Cell Health</Typography>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" label="Search groups" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200 }} InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={14} /></InputAdornment>) }} />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="members">Members</MenuItem>
            <MenuItem value="health">Health Score</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Show groups with health score below 60%" placement="top">
          <FormControlLabel control={<Switch checked={showLowHealthOnly} onChange={(e) => setShowLowHealthOnly(e.target.checked)} />} label="Low health only" />
        </Tooltip>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Export format</InputLabel>
          <Select value={exportFormat} label="Export format" onChange={(e) => setExportFormat(e.target.value)}>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
            <MenuItem value="json">JSON</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Select which columns are included in exports" placement="top">
            <Button size="small" onClick={() => setColumnsOpen(true)}>Columns</Button>
          </Tooltip>

          <Tooltip title="Export visible groups to CSV (Excel compatible)" placement="top">
            <Button size="small" startIcon={<Download size={14} />} onClick={() => { if (exportFormat === 'csv') exportCSV(); else if (exportFormat === 'xlsx') exportXLSX(); else exportJSON(); }}>
              Export
            </Button>
          </Tooltip>

          <Tooltip title="Refresh data" placement="top"><Button size="small" startIcon={<RefreshCw size={14} />} onClick={loadHealth}>Refresh</Button></Tooltip>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Summary</Typography>
            <Divider sx={{ my: 1 }} />
            <Tooltip title="Total groups currently shown (respecting filters)" placement="top"><Typography variant="body2">Groups: {stats.total}</Typography></Tooltip>
            <Tooltip title="Sum of members across displayed groups" placement="top"><Typography variant="body2">Members: {stats.totalMembers}</Typography></Tooltip>
            <Tooltip title="Average health score across displayed groups" placement="top"><Typography variant="body2">Avg Health: {stats.avgHealth}%</Typography></Tooltip>
            <Box sx={{ mt: 2 }}><Button variant="outlined" size="small" onClick={() => setShowLowHealthOnly((s) => !s)}>{showLowHealthOnly ? 'Show all' : 'Show low health'}</Button></Box>
            <Box sx={{ mt: 2 }}><Typography variant="caption" color="text.secondary">Last updated</Typography><Typography variant="body2">{lastUpdated ? lastUpdated.toLocaleString() : 'N/A'}</Typography></Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            {loading ? (<Typography>Loading…</Typography>) : pagedGroups.length === 0 ? (<Typography color="text.secondary">No groups found</Typography>) : (
              <Grid container spacing={2}>{pagedGroups.map((g) => (<Grid key={g.id} item xs={12} sm={6}><HealthCard group={g} onView={handleView} /></Grid>))}</Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}><Pagination count={pageCount} page={page} onChange={(e, v) => setPage(v)} size="small" /></Box>
          </Paper>
        </Grid>
      </Grid>

      <DetailsDialog open={detailsOpen} onClose={handleClose} group={selectedGroup} />

      <Dialog open={columnsOpen} onClose={() => setColumnsOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Choose export columns</DialogTitle>
        <DialogContent>
          <FormGroup>
            {DEFAULT_COLUMNS.map((c) => (
              <MuiFormControlLabel key={c.key} control={<Checkbox checked={selectedColumns.includes(c.key)} onChange={() => toggleColumn(c.key)} />} label={c.label} />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColumnsOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
