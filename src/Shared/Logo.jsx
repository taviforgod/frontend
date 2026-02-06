import React from 'react';
import { Box, Typography } from '@mui/material';

const Logo = ({ size = 32, showName = true }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box component="img" src="/cmms.png" alt="CMMS Logo" height={size} />
    {showName && (
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
        CMMS
      </Typography>
    )}
  </Box>
);

export default Logo;
