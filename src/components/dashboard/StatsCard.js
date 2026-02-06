import React from 'react';
import { Card, CardContent, Box, Typography, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

/**
 * Professional Stats Card component for dashboards
 * Features: Icon, label, value, optional trend indicator
 */
export default function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'primary',
  trend,
  subtitle,
  onClick,
  sx = {} 
}) {
  const theme = useTheme();
  
  // Get color from theme
  const themeColor = theme.palette[color]?.main || theme.palette.primary.main;
  const lightColor = theme.palette[color]?.light || theme.palette.primary.light;
  
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: theme.shadows[4] }}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        ...sx,
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              fontWeight={600}
              sx={{ mb: 1 }}
            >
              {label}
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={700}
              sx={{ 
                mb: subtitle ? 0.5 : 0,
                background: `linear-gradient(135deg, ${themeColor} 0%, ${lightColor} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  mt: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: trend.positive 
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                  color: trend.positive 
                    ? theme.palette.success.main 
                    : theme.palette.error.main,
                }}
              >
                <Typography variant="caption" fontWeight={600}>
                  {trend.value}
                </Typography>
              </Box>
            )}
          </Box>
          
          {Icon && (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(themeColor, 0.1)} 0%, ${alpha(lightColor, 0.15)} 100%)`,
                color: themeColor,
                flexShrink: 0,
              }}
            >
              <Icon size={28} strokeWidth={2} />
            </Box>
          )}
        </Box>
      </CardContent>
      
      {/* Decorative gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60%',
          height: '100%',
          background: `radial-gradient(circle at top right, ${alpha(themeColor, 0.05)} 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />
    </MotionCard>
  );
}
