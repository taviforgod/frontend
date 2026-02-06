// src/components/VisitorCard.jsx
import React, { useContext } from 'react';
import { Box, Typography, IconButton, Tooltip, Badge, Chip, Divider } from '@mui/material';
import { UserCheck, Trash2, Pencil, ClipboardList, Clock, AlertTriangle } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function VisitorCard({ visitor, onEdit, onFollowUp, onConvert, onDelete }) {
  const { mode, theme } = useContext(ThemeContext);
  const { fetchWithAuth } = useContext(AuthContext) || {};

  const {
    id, first_name, surname, contact_primary, phone, cell_group_name, home_address,
    notes, status, followup_count = 0, last_followup_date, follow_up_status_calculated,
  } = visitor;

  const lastDate = last_followup_date ? new Date(last_followup_date) : null;
  const daysSince = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const needsAttention = !lastDate || daysSince >= 14;

  const followStatusColor =
    follow_up_status_calculated === 'done' ? 'success' :
    follow_up_status_calculated === 'in_progress' ? 'warning' : 'default';

  const lastFollowUpText = lastDate ? lastDate.toLocaleDateString() : 'No follow-ups yet';

  return (
    <Box sx={{
      p: 2,
      borderRadius: 2,
      backgroundColor: 'transparent',
      boxShadow: 'none',
      border: 'none',
      position: 'relative'
    }}>
      {/* Name, cell, and icons inline */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {first_name} {surname}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {cell_group_name || 'No cell assigned'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(id)}><Pencil size={16} /></IconButton></Tooltip>
          <Tooltip title="Follow-ups"><IconButton size="small" onClick={() => onFollowUp(visitor)}><Badge badgeContent={followup_count} color={followup_count >= 3 ? 'success' : followup_count > 0 ? 'warning' : 'error'}><ClipboardList size={16} /></Badge></IconButton></Tooltip>
          <Tooltip title="Convert"><IconButton size="small" onClick={() => onConvert(visitor)}><UserCheck size={16} /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(id)}><Trash2 size={16} /></IconButton></Tooltip>
        </Box>
      </Box>
      <Divider sx={{ my: 1 }} />

      <Typography variant="body2" color="text.secondary">
        {contact_primary || phone || 'No phone'}
        {home_address && <> • {home_address}</>}
      </Typography>

      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label={`Follow-up: ${follow_up_status_calculated?.replace('_', ' ') || 'N/A'}`} color={followStatusColor} size="small" />
        <Chip label={`Count: ${followup_count}`} size="small" color={followup_count >= 3 ? 'success' : 'secondary'} variant={followup_count >= 3 ? 'filled' : 'outlined'} />
        {needsAttention && <Chip icon={<AlertTriangle size={14} />} label="Needs Attention" color="error" size="small" />}
        {status && <Chip label={`Status: ${status}`} size="small" variant="outlined" color={status === 'converted' ? 'success' : 'default'} />}
      </Box>

      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Clock size={14} />
        <Typography variant="caption" color="text.secondary">Last follow-up: {lastFollowUpText}</Typography>
        {daysSince !== null && <Chip label={`${daysSince} day${daysSince === 1 ? '' : 's'} ago`} size="small" color={daysSince >= 14 ? 'error' : daysSince >= 7 ? 'warning' : 'default'} sx={{ ml: 1 }} />}
      </Box>

      {notes && <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>“{notes}”</Typography>}
    </Box>
  );
}
