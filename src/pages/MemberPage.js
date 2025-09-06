import React, { useState, useEffect } from 'react';
import { Grid, Paper, Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import FiltersPanel from '../components/memberForm/FiltersPanel';
import MemberListPanel from '../components/memberForm/MemberListPanel';
import MemberDetailPanel from '../components/memberForm/MemberDetailPanel';
import MemberStepper from '../components/memberForm/MemberStepper';
import { getMembers, getMemberById } from '../services/memberService';

export default function MemberPage() {
  const [members, setMembers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showStepper, setShowStepper] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [stepperInitial, setStepperInitial] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  // Load members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getMembers();
      setMembers(data);
      if (data.length === 0) {
        setSnackbar({ open: true, message: 'No members found.', severity: 'info' });
      }
    } catch {
      setMembers([]);
      setSnackbar({ open: true, message: 'Failed to load members.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Select member and load details
  useEffect(() => {
    if (selectedId) {
      getMemberById(selectedId).then(setSelectedMember);
      setSnackbar({ open: false, message: '', severity: 'success' });
    } else {
      setSelectedMember(null);
    }
  }, [selectedId]);

  // Filter handler
  const handleFilter = (filtered) => {
    setMembers(filtered);
    setSelectedId(null);
    setSelectedMember(null);
    if (filtered.length === 0) {
      setSnackbar({ open: true, message: 'No members match your filter.', severity: 'info' });
    }
  };

  // Add member handler
  const handleAddMember = () => {
    setEditMode(false);
    setStepperInitial({});
    setShowStepper(true);
  };

  // Edit member handler
  const handleEditMember = (member) => {
    setEditMode(true);
    setStepperInitial(member);
    setShowStepper(true);
  };

  // After create/update
  const handleStepperSuccess = () => {
    setShowStepper(false);
    fetchMembers();
    if (selectedId) {
      getMemberById(selectedId).then(setSelectedMember);
    }
    setSnackbar({ open: true, message: 'Member updated successfully!', severity: 'success' });
  };

  // After delete
  const handleDeleteMember = () => {
    setSelectedId(null);
    setSelectedMember(null);
    fetchMembers();
    setSnackbar({ open: true, message: 'Member deleted successfully!', severity: 'success' });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 2 }}>
      <FiltersPanel onFilter={handleFilter} onAddMember={handleAddMember} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress />
              </Box>
            ) : (
              <MemberListPanel
                members={members}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            {showStepper ? (
              <MemberStepper
                initialValues={stepperInitial}
                isEditMode={editMode}
                onSuccess={handleStepperSuccess}
              />
            ) : (
              <MemberDetailPanel
                member={selectedMember}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}