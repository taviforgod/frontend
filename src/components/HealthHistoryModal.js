import React, { useEffect, useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  getCellHealthHistory,
  addCellHealthHistory,
} from "../services/cellModuleService";

export default function HealthHistoryModal({ cellGroup, onClose }) {
  const [history, setHistory] = useState([]);
  const [fields, setFields] = useState({
    report_date: "",
    health_score: "",
    attendance: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        const data = await getCellHealthHistory(cellGroup.id);
        setHistory(data);
      } catch (err) {
        setError("Failed to load health history");
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    if (cellGroup) loadHistory();
  }, [cellGroup]);

  function handleChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await addCellHealthHistory({
        ...fields,
        cell_group_id: cellGroup.id,
      });
      setFields({
        report_date: "",
        health_score: "",
        attendance: "",
        notes: "",
      });
      const data = await getCellHealthHistory(cellGroup.id);
      setHistory(data);
    } catch (err) {
      setError("Failed to add health record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Health History - {cellGroup.name}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ mb: 2 }}>
          {history.map((h) => (
            <ListItem key={h.id}>
              <ListItemText
                primary={`Date: ${h.report_date} - Score: ${h.health_score} Attendance: ${h.attendance}`}
                secondary={h.notes}
              />
            </ListItem>
          ))}
        </List>
      )}
      <form onSubmit={handleSubmit}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add Health Record
        </Typography>
        <TextField
          fullWidth
          label="Date"
          type="date"
          name="report_date"
          value={fields.report_date}
          onChange={handleChange}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
          required
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Health Score"
          name="health_score"
          value={fields.health_score}
          onChange={handleChange}
          type="number"
          sx={{ mb: 2 }}
          required
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Attendance"
          name="attendance"
          value={fields.attendance}
          onChange={handleChange}
          type="number"
          sx={{ mb: 2 }}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Notes"
          name="notes"
          value={fields.notes}
          onChange={handleChange}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        <Button variant="contained" type="submit" sx={{ mb: 2 }} disabled={loading}>
          Add Record
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose} disabled={loading}>
          Close
        </Button>
      </form>
    </Box>
  );
}