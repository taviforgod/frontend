import React, { useEffect, useState, useContext } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  IconButton,
  Autocomplete,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  getCellGroupMembers,
  getUnassignedMembers,
  addCellGroupMember,
  removeCellGroupMember,
} from "../services/cellModuleService";
import { AuthContext } from "../contexts/AuthContext";

export default function MembersModal({ cellGroup, onClose }) {
  const [members, setMembers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [selected, setSelected] = useState(null);
  const { fetchWithAuth } = useContext(AuthContext);

  useEffect(() => {
    async function loadMembers() {
      setMembers(await getCellGroupMembers(fetchWithAuth, cellGroup.id));
      setUnassigned(await getUnassignedMembers(fetchWithAuth));
    }
    if (cellGroup) loadMembers();
  }, [cellGroup, fetchWithAuth]);

  async function handleAdd() {
    if (!selected) return;
    await addCellGroupMember(fetchWithAuth, cellGroup.id, [selected.id]);
    setMembers(await getCellGroupMembers(fetchWithAuth, cellGroup.id));
    setUnassigned(await getUnassignedMembers(fetchWithAuth));
    setSelected(null);
  }
  async function handleRemove(memberId) {
    await removeCellGroupMember(fetchWithAuth, cellGroup.id, memberId);
    setMembers(await getCellGroupMembers(fetchWithAuth, cellGroup.id));
    setUnassigned(await getUnassignedMembers(fetchWithAuth));
  }

  return (
    <Box
      sx={{
        width: 400,
        maxHeight: 500,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {cellGroup?.name} — Members
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
        <List>
          {members.map((m) => (
            <ListItem
              key={m.id}
              secondaryAction={
                <Button
                  color="error"
                  size="small"
                  onClick={() => handleRemove(m.id)}
                >
                  Remove
                </Button>
              }
            >
              <ListItemText
                primary={`${m.first_name} ${m.surname}`}
                secondary={m.email}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Add Member
      </Typography>
      <Autocomplete
        options={unassigned}
        getOptionLabel={(option) => `${option.first_name} ${option.surname}`}
        value={selected}
        onChange={(_, value) => setSelected(value)}
        renderInput={(params) => (
          <TextField {...params} label="Unassigned Member" fullWidth sx={{ mb: 2 }} />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
      <Button
        variant="contained"
        onClick={handleAdd}
        disabled={!selected}
        sx={{ mb: 2 }}
      >
        Add to Cell Group
      </Button>
      <Button variant="outlined" color="secondary" onClick={onClose}>
        Close
      </Button>
    </Box>
  );
}