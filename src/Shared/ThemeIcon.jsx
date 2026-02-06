import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function ThemeIcon({ Icon, size = 20, color, ...props }) {
  const { theme } = useContext(ThemeContext);
  return <Icon size={size} color={color || theme.palette.text.primary} {...props} />;
}