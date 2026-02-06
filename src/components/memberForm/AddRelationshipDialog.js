import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import { searchMembers, createRelationship } from '../../services/memberService';

const RELATIONSHIP_TYPES = [
  'spouse', 'parent', 'child', 'sibling', 'guardian', 'partner', 'other'
];

export default function AddRelationshipDialog({ open, onClose, memberId, onSuccess, onOptimisticAdd, onOptimisticCommit, onOptimisticRollback }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [relationshipType, setRelationshipType] = useState('');
  const [note, setNote] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setOptions([]);
    setSelectedMember(null);
    setRelationshipType('');
    setNote('');
    setIsPrimary(false);
  }, [open]);

  const handleSearch = async () => {
    if (!query || !fetchWithAuth) return;
    setLoading(true);
    try {
      const results = await searchMembers(fetchWithAuth, query);
      setOptions(results || []);
    } catch (err) {
      console.error('Search failed', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember || !relationshipType) return;

    // Create an optimistic placeholder so the UI feels snappy
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      related_member_id: selectedMember.id,
      related_first_name: selectedMember.first_name,
      related_surname: selectedMember.surname,
      relationship_type: relationshipType,
      is_primary: isPrimary,
      metadata: { note },
      _optimistic: true,
    };

    if (typeof onOptimisticAdd === 'function') {
      try {
        onOptimisticAdd(optimistic);
      } catch (e) {
        // ignore parent handler errors
      }
    }

    try {
      const created = await createRelationship(fetchWithAuth, memberId, {
        related_member_id: selectedMember.id,
        relationship_type: relationshipType,
        is_primary: isPrimary,
        metadata: { note }
      });

      if (typeof onOptimisticCommit === 'function') {
        onOptimisticCommit(tempId, created);
      } else if (typeof onSuccess === 'function') {
        // backward compatible fallback
        onSuccess(created);
      }

      onClose();
    } catch (err) {
      console.error('Create relationship failed', err);
      if (typeof onOptimisticRollback === 'function') {
        onOptimisticRollback(tempId, err);
      }
      alert(err.message || 'Failed to create relationship');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Relationship</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Search member by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          helperText="Type a name and press Enter or click Search"
          sx={{ mb: 2 }}
        />
        <Button onClick={handleSearch} disabled={!query || loading} variant="outlined" size="small">
          {loading ? <CircularProgress size={18} /> : 'Search'}
        </Button>

        {options.length > 0 && (
          <TextField
            select
            fullWidth
            label="Select member"
            value={selectedMember?.id || ''}
            onChange={(e) => setSelectedMember(options.find(o => o.id === Number(e.target.value)))}
            sx={{ mt: 2 }}
          >
            {options.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>{opt.first_name} {opt.surname} ({opt.contact_primary || ''})</MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          select
          fullWidth
          label="Relationship type"
          value={relationshipType}
          onChange={(e) => setRelationshipType(e.target.value)}
          sx={{ mt: 2 }}
        >
          {RELATIONSHIP_TYPES.map(t => (
            <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
        />

        <FormControlLabel
          control={<Checkbox checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
          label="Primary relationship"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!selectedMember || !relationshipType}>Add</Button>
      </DialogActions>
    </Dialog>
  );
}