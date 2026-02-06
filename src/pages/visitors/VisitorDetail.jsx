// src/pages/VisitorDetail.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Snackbar, Alert } from '@mui/material';
import { getVisitor, convertVisitor } from '../../services/visitorService';
import { getCellGroups } from '../../services/cellGroupService';
import FollowUpModal from '../../components/visitors/FollowUpModal';
import AddVisitorStepper from '../../components/visitors/AddVisitorStepper';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function VisitorDetail() {
  const { id } = useParams();
  const [v, setV] = useState(null);
  const [groups, setGroups] = useState([]);
  const [convertDialog, setConvertDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [fuOpen, setFuOpen] = useState(false);
  const [snack, setSnack] = useState({ open:false, message:'', severity:'info' });
  const navigate = useNavigate();
  const { fetchWithAuth } = useContext(AuthContext); // <-- use fetchWithAuth

  useEffect(() => {
    (async () => {
      if (!id) return;
      setV(await getVisitor(fetchWithAuth, id));
      setGroups(await getCellGroups(fetchWithAuth, { limit: 1000 }));
    })();
  }, [id, fetchWithAuth]);

  const handleConvert = async () => {
    if (v.cell_group_id) {
      const res = await convertVisitor(fetchWithAuth, v.id);
      setSnack({ open:true, message:'Visitor converted', severity:'success' });
      setTimeout(()=> navigate(`/cell-groups/${v.cell_group_id}?newMemberId=${res.member?.id || res.member_id || ''}`), 1200);
    } else {
      setConvertDialog(true);
    }
  };

  const confirmConvert = async () => {
    if (!selectedGroup) { alert('Select a group'); return; }
    const res = await convertVisitor(fetchWithAuth, v.id, selectedGroup.id);
    setSnack({ open:true, message:'Converted and assigned', severity:'success' });
    setConvertDialog(false);
    setTimeout(()=> navigate(`/cell-groups/${selectedGroup.id}?newMemberId=${res.member?.id || res.member_id || ''}`), 1200);
  };

  if (!v) return <Box sx={{ p:2 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ p:2, maxWidth:700, mx:'auto' }}>
      <Card variant="outlined" sx={{ mb:2 }}>
        <CardContent>
          <Typography variant="h5">{v.first_name} {v.surname}</Typography>
          <Typography color="text.secondary">Cell Group: {v.cell_group_name || 'Not assigned'}</Typography>
          <Typography>Phone: {v.contact_primary}</Typography>
          <Typography>Email: {v.email}</Typography>
          <Typography>Home Address: {v.home_address || '—'}</Typography>
          <Typography>Next follow-up: {v.next_follow_up_date || '—'}</Typography>
        </CardContent>
        <CardActions>
          <Button variant="contained" onClick={() => setFuOpen(true)}>Follow-up History</Button>
          <Button variant="outlined" color="success" onClick={handleConvert}>Convert to Member</Button>
        </CardActions>
      </Card>

      <FollowUpModal
        open={fuOpen}
        visitor={v}
        onClose={() => setFuOpen(false)}
        onSaved={async ()=>{ setV(await getVisitor(fetchWithAuth, id)); }}
      />

      <Dialog open={convertDialog} onClose={() => setConvertDialog(false)}>
        <DialogTitle>Assign Cell Group</DialogTitle>
        <DialogContent>
          <Autocomplete options={groups || []} getOptionLabel={g => g.name || ''} value={selectedGroup} onChange={(_, v) => setSelectedGroup(v)} renderInput={(params) => <TextField {...params} label="Select Cell Group" />} sx={{ mt:2, minWidth:300 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmConvert}>Convert</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open:false }))}><Alert severity={snack.severity}>{snack.message}</Alert></Snackbar>
    </Box>
  );
}
