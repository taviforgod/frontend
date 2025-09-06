import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const SnackbarAlert = ({
  open,
  onClose,
  severity = 'success',
  message,
  autoHideDuration = 3000,
  icon // Pass a Lucide icon component here if you want a custom icon
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  >
    <Alert
      onClose={onClose}
      severity={severity}
      sx={{ width: '100%' }}
      icon={icon}
    >
      {message}
    </Alert>
  </Snackbar>
);

export default SnackbarAlert;