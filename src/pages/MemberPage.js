import React, { useState, useEffect, useContext } from 'react';
import { Grid, Paper, Box, CircularProgress, Snackbar, Alert } from '@mui/material';
import FiltersPanel from '../components/memberForm/FiltersPanel';
import MemberListPanel from '../components/memberForm/MemberListPanel';
import MemberDetailPanel from '../components/memberForm/MemberDetailPanel';
import MemberStepper from '../components/memberForm/MemberStepper';
import { getMembers, getMemberById } from '../services/memberService';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { DateTime } from 'luxon';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

export default function MemberPage() {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const notifications = useNotifications();
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
    if (!fetchWithAuth) return;
    fetchMembers();
  }, [fetchWithAuth]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
      const data = await getMembers(fetchWithAuth);
      setMembers(data);
      if (data.length === 0) {
        notifications.info('No members found');
      }
    } catch {
      setMembers([]);
      notifications.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  // Select member and load details
  useEffect(() => {
    if (selectedId) {
      if (fetchWithAuth) {
        getMemberById(fetchWithAuth, selectedId).then(setSelectedMember).catch(() => setSelectedMember(null));
      } else {
        setSelectedMember(null);
      }
    } else {
      setSelectedMember(null);
    }
  }, [selectedId, fetchWithAuth]);

  // Filter handler
  const handleFilter = (filtered) => {
    setMembers(filtered);
    setSelectedId(null);
    setSelectedMember(null);
    if (filtered.length === 0) {
      notifications.info('No members match your filter');
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
    if (selectedId && fetchWithAuth) {
      getMemberById(fetchWithAuth, selectedId).then(setSelectedMember);
    }
    notifications.modules.member.updated();
  };

  // Cancel stepper (add/edit)
  const handleStepperCancel = () => {
    setShowStepper(false);
    setEditMode(false);
    setStepperInitial({});
  };

  // After delete
  const handleDeleteMember = () => {
    setSelectedId(null);
    setSelectedMember(null);
    fetchMembers();
    notifications.crud.delete('member');
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
                onSelect={id => {
                  setSelectedId(id);
                  setShowStepper(false); // Ensure stepper is closed when selecting a member
                }}
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
                onCancel={handleStepperCancel}
                fetchWithAuth={fetchWithAuth} // <-- Pass fetchWithAuth to MemberStepper
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