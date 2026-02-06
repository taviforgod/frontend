import React from 'react';
import { Card, CardContent, CardHeader, Box, Typography, IconButton, Divider, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

const MotionCard = motion(Card);

/**
 * Professional Dashboard Card component
 * Features: Title, subtitle, icon, actions, children content
 */
export default function DashboardCard({ 
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  loading,
  color = 'primary',
  headerBg,
  sx = {},
  ...props
}) {
  const theme = useTheme();
  const themeColor = theme.palette[color]?.main || theme.palette.primary.main;
  
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
      {...props}
    >
      {(title || subtitle || Icon) && (
        <CardHeader
          avatar={
            Icon && (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: headerBg || `linear-gradient(135deg, ${alpha(themeColor, 0.1)} 0%, ${alpha(themeColor, 0.05)} 100%)`,
                  color: themeColor,
                }}
              >
                <Icon size={20} strokeWidth={2} />
              </Box>
            )
          }
          title={
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          }
          subheader={
            subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )
          }
          action={action}
          sx={{
            pb: 1.5,
          }}
        />
      )}
      
      {(title || subtitle || Icon) && <Divider />}
      
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>
        {children}
      </CardContent>
    </MotionCard>
  );
}
