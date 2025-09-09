import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const ConfirmDialog = ({
  open,
  title = 'Confirm',
  message,
  onClose,
  onConfirm,
  confirmText = 'Yes',
  cancelText = 'Cancel'
}) => (
  <Dialog open={open} onClose={onClose}>
    {title && <DialogTitle>{title}</DialogTitle>}
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>{cancelText}</Button>
      <Button onClick={onConfirm} variant="contained" color="error">
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;