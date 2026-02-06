import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Avatar, Stack, Typography, IconButton, CircularProgress, Box, Card, CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from '../../contexts/AuthContext.js';
import { getRoles } from '../../api/leadershipService.js';
import { motion } from 'framer-motion';

/**
 * Preserves original API: onClose(selectedMember|null)
 * This modernized dialog keeps the same prop signature and behavior.
 */

export default function MemberSelectDialog({ open, onClose, preselectedId = null, rolesAllowed, preferredRole }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadLeaders();
    // eslint-disable-next-line
  }, [open, preferredRole]);

  const loadLeaders = async () => {
    setLoading(true);
    try {
      const data = await getRoles(fetchWithAuth);
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to load leaders', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = members.filter(m => {
    if (!query) return true;
    const q = query.toLowerCase();
    return `${m.first_name || ''} ${m.surname || ''} ${m.contact_primary || ''}`.toLowerCase().includes(q);
  });

  return (
    <Dialog open={!!open} onClose={() => onClose(null)} fullWidth maxWidth="sm">
      <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }}>
        <DialogTitle>
          {preferredRole ? `Select ${preferredRole}` : 'Select leader'}
          <IconButton aria-label="close" sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => onClose(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <TextField
            placeholder="Search by name, phone or member number"
            fullWidth
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>
          ) : (
            <Stack spacing={1}>
              {filtered.length === 0 && <Typography color="text.secondary">No leaders found.</Typography>}
              {filtered.map(m => (
                <Card key={m.member_id ?? m.id} variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Avatar src={m.profile_photo || ''}>{m.first_name?.[0] || m.surname?.[0] || 'M'}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{m.first_name} {m.surname} {m.role ? `• ${m.role}` : ''}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {m.member_no ? `#${m.member_no}` : ''} {m.contact_primary ? ` • ${m.contact_primary}` : ''} {m.email ? ` • ${m.email}` : ''}
                      </Typography>
                    </Box>
                    <Box>
                      <Button variant={preselectedId === (m.member_id ?? m.id) ? 'contained' : 'outlined'} size="small" onClick={() => onClose(m)}>
                        Select
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose(null)}>Cancel</Button>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
}
