import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function HeroHeader({ title, subtitle, icon, rightSlot }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        mb: 3,
        borderRadius: 4,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, #FFD166 160%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 18px 40px rgba(10,58,103,0.25)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -80,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,209,102,0.25), transparent 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: -0.2 }}>
            {icon ? (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mr: 1 }}>
                {icon}
              </Box>
            ) : null}
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {rightSlot ? <Box>{rightSlot}</Box> : null}
      </Box>
    </Paper>
  );
}
