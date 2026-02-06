import React, { useState } from 'react';
import { List, ListItem, ListItemText, Chip, IconButton, Select, MenuItem, Box, Stack, Typography, TextField, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

export default function CellMembersSection({
  members = [],
  roles = [],
  onRemove,
  onChangeRole,
  sectionTitle = "Cell Members"
}) {
  const [filter, setFilter] = useState({ role: '', status: 'active', q: '' });

  const filtered = members.filter(m =>
    (!filter.role || m.role_id === filter.role) &&
    (!filter.status || (filter.status === 'active' ? m.is_active : !m.is_active)) &&
    (!filter.q || (`${m.first_name} ${m.surname}`.toLowerCase().includes(filter.q.toLowerCase())))
  );

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
        <Typography variant="h6">{sectionTitle}</Typography>
        <Select
          value={filter.role || ''}
          size="small"
          onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All roles</MenuItem>
          {roles.map(r => <MenuItem value={r.id} key={r.id}>{r.description || r.name}</MenuItem>)}
        </Select>
        <Select
          value={filter.status || 'active'}
          size="small"
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          sx={{ minWidth: 100 }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Past</MenuItem>
        </Select>
        <TextField
          placeholder="Search"
          size="small"
          value={filter.q || ''}
          onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
          sx={{ flex: 1, minWidth: 120 }}
        />
      </Stack>
      <List dense>
        {filtered.length === 0 && <ListItem><ListItemText primary="No members" /></ListItem>}
        {filtered.map(m =>
          <ListItem
            key={m.member_id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                {m.is_active && (
                  <>
                    <Tooltip title="Change Role">
                      <IconButton onClick={() => onChangeRole(m)} size="small"><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from Cell">
                      <IconButton onClick={() => onRemove(m)} color="error" size="small"><DeleteIcon /></IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            }
          >
            <ListItemText
              primary={`${m.first_name} ${m.surname}`}
              secondary={
                <>
                  <span>{m.role_name.replace(/_/g, ' ').replace('cell ', 'Cell ')}</span>
                  {!m.is_active && <span style={{color:"red", marginLeft:8}}>(Inactive)</span>}
                </>
              }
            />
            <Chip label={m.role_name.replace(/_/g, ' ').replace('cell ', 'Cell ')} size="small" />
          </ListItem>
        )}
      </List>
    </Box>
  );
}