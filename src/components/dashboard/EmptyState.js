import React from 'react';
import { Box, Typography, Button, alpha, useTheme } from '@mui/material';
import { Inbox } from 'lucide-react';

/**
 * Professional Empty State component
 */
export default function EmptyState({ 
  icon: Icon = Inbox,
  title = 'No data available',
  message,
  action,
  actionLabel = 'Get Started',
  onActionClick,
  sx = {}
}) {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.1)} 0%, ${alpha(theme.palette.grey[400], 0.05)} 100%)`,
          color: theme.palette.text.disabled,
          mb: 2,
        }}
      >
        <Icon size={32} strokeWidth={1.5} />
      </Box>
      
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
          {message}
        </Typography>
      )}
      
      {(action || onActionClick) && (
        action || (
          <Button variant="contained" onClick={onActionClick}>
            {actionLabel}
          </Button>
        )
      )}
    </Box>
  );
}
