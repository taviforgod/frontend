import React from 'react';
import { Box, Typography, Button, alpha, useTheme } from '@mui/material';

/**
 * Professional Section Header component for dashboard sections
 */
export default function SectionHeader({ 
  icon: Icon,
  title, 
  subtitle,
  action,
  actionLabel = 'View All',
  onActionClick,
  color = 'primary',
  sx = {}
}) {
  const theme = useTheme();
  const themeColor = theme.palette[color]?.main || theme.palette.primary.main;
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2,
        ...sx 
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {Icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(themeColor, 0.1)} 0%, ${alpha(themeColor, 0.05)} 100%)`,
              color: themeColor,
            }}
          >
            <Icon size={18} strokeWidth={2.5} />
          </Box>
        )}
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      
      {(action || onActionClick) && (
        action || (
          <Button 
            size="small" 
            onClick={onActionClick}
            sx={{ fontWeight: 600 }}
          >
            {actionLabel}
          </Button>
        )
      )}
    </Box>
  );
}
