import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import {
  getZones,
  getStatusTypes,
  getUnassignedMembers,
  createCellGroup,
  updateCellGroup,
  addCellGroupMember,
} from "../services/cellModuleService";

const API_URL = process.env.REACT_APP_API_URL;

export default function CellGroupModal({ cellGroup, onSave, onCancel }) {
  const [fields, setFields] = useState({
    name: "",
    zone_id: "",
    leader_id: "",
    location: "",
    status_id: "",
    health_score: 100,
  });
  const [zones, setZones] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch lookups only once
  useEffect(() => {
    async function fetchLookups() {
      try {
        setZones(await getZones());
        setStatuses(await getStatusTypes());
        let unassigned = await getUnassignedMembers();
        // If editing, ensure current leader is in the list
        if (cellGroup && cellGroup.leader_id) {
          const already = unassigned.find(
            (m) => String(m.id) === String(cellGroup.leader_id)
          );
          if (!already) {
            const res = await fetch(
              `${API_URL}/api/members/${cellGroup.leader_id}`,
              { credentials: "include" }
            );
            if (res.ok) {
              const leader = await res.json();
              console.log("Fetched leader:", leader, "Leader ID:", cellGroup.leader_id);
              if (leader && leader.id) {
                unassigned = [leader, ...unassigned];
              }
            } else {
              console.error("Leader fetch failed", res.status);
            }
          }
        }
        setMembers(unassigned);
      } catch (err) {
        setError("Failed to load lookups");
      }
    }
    fetchLookups();
  }, [cellGroup]);

  // Reset fields when cellGroup changes
  useEffect(() => {
    if (cellGroup) {
      setFields({
        name: cellGroup.name || "",
        zone_id: cellGroup.zone_id || "",
        leader_id: cellGroup.leader_id || "",
        location: cellGroup.location || "",
        status_id: cellGroup.status_id || "",
        health_score: cellGroup.health_score || 100,
      });
    } else {
      setFields({
        name: "",
        zone_id: "",
        leader_id: "",
        location: "",
        status_id: "",
        health_score: 100,
      });
    }
    setError("");
  }, [cellGroup]);

  function handleChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let savedGroup;
      if (cellGroup) {
        savedGroup = await updateCellGroup(cellGroup.id, fields);
      } else {
        savedGroup = await createCellGroup(fields);
      }
      // Automatically assign leader as member if not already
      if (fields.leader_id) {
        await addCellGroupMember(savedGroup.id, [fields.leader_id], "leader");
      }
      onSave();
    } catch (err) {
      setError(err.message || "Failed to save cell group");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {cellGroup ? "Edit Cell Group" : "Add Cell Group"}
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <TextField
        fullWidth
        label="Name"
        name="name"
        value={fields.name}
        onChange={handleChange}
        sx={{ mb: 2 }}
        required
        disabled={loading}
      />
      <TextField
        select
        fullWidth
        label="Zone"
        name="zone_id"
        value={fields.zone_id}
        onChange={handleChange}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        {zones.map((zone) => (
          <MenuItem key={zone.id} value={zone.id}>
            {zone.name}
          </MenuItem>
        ))}
      </TextField>
      <Autocomplete
        options={members}
        getOptionLabel={(option) =>
          option.first_name && option.surname
            ? `${option.first_name} ${option.surname}`
            : option.first_name || ""
        }
        value={
          members.find((m) => String(m.id) === String(fields.leader_id)) || null
        }
        onChange={(_, value) =>
          setFields({ ...fields, leader_id: value ? value.id : "" })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Leader"
            sx={{ mb: 2 }}
            disabled={loading}
            required
          />
        )}
        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
      />
      <TextField
        fullWidth
        label="Location"
        name="location"
        value={fields.location}
        onChange={handleChange}
        sx={{ mb: 2 }}
        disabled={loading}
      />
      <TextField
        select
        fullWidth
        label="Status"
        name="status_id"
        value={fields.status_id}
        onChange={handleChange}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        {statuses.map((status) => (
          <MenuItem key={status.id} value={status.id}>
            {status.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        fullWidth
        label="Health Score"
        name="health_score"
        value={fields.health_score}
        onChange={handleChange}
        type="number"
        sx={{ mb: 2 }}
        disabled={loading}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" type="submit" disabled={loading}>
          Save
        </Button>
      </Box>
    </form>
  );
}