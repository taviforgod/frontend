import React, { useState, useContext } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import { AuthContext } from '../../contexts/AuthContext';

const typeColor = {
  member: 'green',
  first_timer: 'orange',
  new_convert: 'purple',
};

export default function MemberListPanel({
  members,
  onSelect,
  onDelete,
  selectedId,
}) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Retrieve permissions from AuthContext
  const { permissions = [] } = useContext(AuthContext) || {};
  const canDelete = permissions.includes('delete_members') || permissions.includes('manage_members');

  const handleDeleteClick = (e, member) => {
    e.stopPropagation();
    setMemberToDelete(member);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setMemberToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      onDelete(memberToDelete);
    }
    setDialogOpen(false);
    setMemberToDelete(null);
  };

  if (!members || members.length === 0) {
    return (
      <List>
        <ListItem>
          <ListItemText primary="No members found." />
        </ListItem>
      </List>
    );
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <List
        disablePadding
        sx={{
          maxHeight: '500px',
          overflowY: 'auto',
        }}
      >
        {members.map((m) => {
          const dotColor = typeColor[m.member_type] || 'grey';
          return (
            <ListItem
              key={m.id}
              button
              component="li"
              selected={m.id === selectedId}
              onClick={() => onSelect(m.id)}
              onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelect(m.id);
                }
              }}
              tabIndex={0}
              sx={{
                py: 1.5,
                px: 2,
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <ListItemAvatar>
                  <Avatar src={m.profile_picture_url} alt={`${m.first_name} ${m.surname}`}>
                    {(m.first_name?.[0] || '') + (m.surname?.[0] || '')}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="subtitle1" noWrap component="div">
                      {`${m.first_name} ${m.surname}`}
                    </Typography>
                  }
                  secondary={
                    <Box component="div" sx={{ mt: 0.5 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        noWrap
                        component="div"
                      >
                        {m.email}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        noWrap
                        component="div"
                        sx={{ mt: 0.5 }}
                      >
                        {m.contact_primary}
                      </Typography>
                    </Box>
                  }
                  sx={{ mr: 2 }}
                />
              </Box>

              <Box
                component="span"
                sx={{
                  width: 10,
                  height: 10,
                  bgcolor: dotColor,
                  borderRadius: '50%',
                  display: 'inline-block',
                  mr: 2,
                }}
              />

              {canDelete && (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => handleDeleteClick(e, m)}
                >
                  <Trash2 size={18} />
                </IconButton>
              )}
            </ListItem>
          );
        })}
      </List>

      <ConfirmDialog
        open={isDialogOpen}
        title="Confirm Delete"
        content={`Are you sure you want to delete ${memberToDelete?.first_name} ${memberToDelete?.surname}?`}
        onClose={handleDialogClose}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}