import React, { createContext, useMemo, useState } from 'react';
import getTheme from '../theme/index';

export const ThemeContext = createContext();

export const ThemeProviderCustom = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};