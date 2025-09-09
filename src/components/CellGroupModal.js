import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Autocomplete,
  Grid,
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

  const [fieldErrors, setFieldErrors] = useState({});

  // Load dropdown data and ensure leader is in options
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [zonesList, statusList, unassigned] = await Promise.all([
          getZones(),
          getStatusTypes(),
          getUnassignedMembers(),
        ]);

        setZones(zonesList);
        setStatuses(statusList);

        // Ensure leader is included in member list if editing
        if (cellGroup?.leader_id) {
          const exists = unassigned.find(
            (m) => String(m.id) === String(cellGroup.leader_id)
          );

          if (!exists) {
            const res = await fetch(`${API_URL}/api/members/${cellGroup.leader_id}`, {
              credentials: "include",
            });
            if (res.ok) {
              const leader = await res.json();
              unassigned.unshift(leader);
            }
          }
        }

        setMembers(unassigned);
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Please try again.");
      }
    };

    fetchLookups();
  }, [cellGroup]);

  // Set initial values on open
  useEffect(() => {
    if (cellGroup) {
      const {
        name = "",
        zone_id = "",
        leader_id = "",
        location = "",
        status_id = "",
        health_score = 100,
      } = cellGroup;
      setFields({ name, zone_id, leader_id, location, status_id, health_score });
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
    setFieldErrors({});
    setError("");
  }, [cellGroup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeaderChange = (_, value) => {
    setFields((prev) => ({ ...prev, leader_id: value ? value.id : "" }));
  };

  const validate = () => {
    const errors = {};
    if (!fields.name) errors.name = "Name is required";
    if (!fields.zone_id) errors.zone_id = "Zone is required";
    if (!fields.leader_id) errors.leader_id = "Leader is required";
    if (!fields.status_id) errors.status_id = "Status is required";

    if (
      fields.health_score === "" ||
      isNaN(fields.health_score) ||
      fields.health_score < 0 ||
      fields.health_score > 100
    ) {
      errors.health_score = "Health score must be between 0 and 100";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      let savedGroup;
      if (cellGroup) {
        savedGroup = await updateCellGroup(cellGroup.id, fields);
      } else {
        savedGroup = await createCellGroup(fields);
      }

      if (fields.leader_id) {
        await addCellGroupMember(savedGroup.id, [fields.leader_id], "leader");
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save cell group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {cellGroup ? "Edit Cell Group" : "Add Cell Group"}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={fields.name}
              onChange={handleChange}
              required
              disabled={loading}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Zone"
              name="zone_id"
              value={fields.zone_id}
              onChange={handleChange}
              disabled={loading}
              required
              error={!!fieldErrors.zone_id}
              helperText={fieldErrors.zone_id}
            >
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={members}
              getOptionLabel={(option) =>
                `${option.first_name || ""} ${option.surname || ""}`.trim()
              }
              value={
                members.find((m) => String(m.id) === String(fields.leader_id)) || null
              }
              onChange={handleLeaderChange}
              isOptionEqualToValue={(option, value) =>
                String(option.id) === String(value.id)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Leader"
                  required
                  disabled={loading}
                  error={!!fieldErrors.leader_id}
                  helperText={fieldErrors.leader_id}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={fields.location}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Status"
              name="status_id"
              value={fields.status_id}
              onChange={handleChange}
              disabled={loading}
              required
              error={!!fieldErrors.status_id}
              helperText={fieldErrors.status_id}
            >
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Health Score"
              name="health_score"
              type="number"
              value={fields.health_score}
              onChange={handleChange}
              inputProps={{ min: 0, max: 100 }}
              disabled={loading}
              error={!!fieldErrors.health_score}
              helperText={fieldErrors.health_score}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={loading}>
            Save
          </Button>
        </Box>
      </form>
    </Box>
  );
}
