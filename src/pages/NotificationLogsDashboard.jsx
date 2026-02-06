import React, { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  TableFooter,
  TablePagination,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ReplayIcon from "@mui/icons-material/Replay";

export default function NotificationLogsDashboard() {
  const { fetchWithAuth } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  // pagination / filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("limit", String(rowsPerPage));
    params.set("offset", String(page * rowsPerPage));
    if (filterStatus) params.set("status", filterStatus);
    if (filterChannel) params.set("channel", filterChannel);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const res = await fetchWithAuth(`/api/notification-logs${qs}`);
      if (!res.ok) {
        const err = await res.text().catch(() => "Failed to load logs");
        throw new Error(err || "Failed to load logs");
      }
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : data.logs || []);
      // if API returns total count, use it for pagination
      if (typeof data.total === "number") setTotal(data.total);
      else setTotal(null);
    } catch (e) {
      console.error("Failed to load logs:", e);
      setSnack({ open: true, message: "Failed to load logs", severity: "error" });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // apply filters -> reset to first page then reload
  const applyFilters = () => {
    setPage(0);
    loadLogs();
  };

  const clearFilters = () => {
    setFilterStatus("");
    setFilterChannel("");
    setFilterFrom("");
    setFilterTo("");
    setPage(0);
    loadLogs();
  };

  const handleOpenDetails = (log) => setSelectedLog(log);
  const handleCloseDetails = () => setSelectedLog(null);

  const handleRetry = async (id) => {
    if (!window.confirm("Retry deliver for this log?")) return;
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/notification-logs/${encodeURIComponent(id)}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Retry failed");
        throw new Error(errText || "Retry failed");
      }
      setSnack({ open: true, message: "Retry queued", severity: "success" });
      await loadLogs();
    } catch (err) {
      console.error("Retry failed:", err);
      setSnack({ open: true, message: "Retry failed", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // extract distinct channels/statuses for filter selects (small set derived from current page)
  const channels = useMemo(() => Array.from(new Set(logs.map((l) => l.channel).filter(Boolean))), [logs]);
  const statuses = useMemo(() => Array.from(new Set(logs.map((l) => l.status).filter(Boolean))), [logs]);

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Notification Logs
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Select
              fullWidth
              value={filterStatus}
              displayEmpty
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="">All statuses</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
              <MenuItem value="failed">failed</MenuItem>
              <MenuItem value="sent">sent</MenuItem>
              <MenuItem value="queued">queued</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Select
              fullWidth
              value={filterChannel}
              displayEmpty
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              <MenuItem value="">All channels</MenuItem>
              {channels.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
              <MenuItem value="email">email</MenuItem>
              <MenuItem value="push">push</MenuItem>
              <MenuItem value="socket">socket</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="From (YYYY-MM-DD)"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="To (YYYY-MM-DD)"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={2} sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={applyFilters} disabled={loading}>
              Apply
            </Button>
            <Button onClick={clearFilters} disabled={loading}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Channel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Sent at</TableCell>
                <TableCell>Error/Response</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.channel}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell>{log.recipient_user_id || log.recipient_member_id || log.recipient}</TableCell>
                    <TableCell>{log.sent_at ? new Date(log.sent_at).toLocaleString() : "-"}</TableCell>
                    <TableCell sx={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.error || (log.response ? JSON.stringify(log.response) : "")}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" title="Details" onClick={() => handleOpenDetails(log)}>
                        <InfoIcon />
                      </IconButton>
                      {(log.status === "failed" || log.status === "error") && (
                        <IconButton size="small" title="Retry" onClick={() => handleRetry(log.id)}>
                          <ReplayIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption">
                      {total !== null ? `Total ${total}` : ""}
                    </Typography>
                    <TablePagination
                      component="div"
                      count={total ?? logs.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count === -1 ? "more" : count}`}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </>
      )}

      <Dialog open={!!selectedLog} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Notification Log Details</DialogTitle>
        <DialogContent dividers>
          <Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {selectedLog ? JSON.stringify(selectedLog, null, 2) : ""}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          {selectedLog && (selectedLog.status === "failed" || selectedLog.status === "error") && (
            <Button variant="contained" onClick={() => { handleRetry(selectedLog.id); handleCloseDetails(); }}>
              Retry
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}