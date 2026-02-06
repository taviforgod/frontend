import React from 'react';
import { Box } from '@mui/material';

/**
 * DashboardLayout - dashboard content wrapper.
 * Note: app-wide navigation is handled by `Shared/Header`, so this layout no longer renders its own AppBar.
 */
export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
          overflow: 'auto'
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
