// src/theme/ElegantPalette.js
// Elegant theme palettes derived from the provided CSS variables (light + dark variants)

export const elegantLight = {
  mode: 'light',
  primary: {
    main: '#030213', // from --primary
    light: '#0a0a12',
    dark: '#02020a',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#e9ebef', // accent
    light: '#f5f6f7',
    dark: '#d7d9dc',
    contrastText: '#030213',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#ffffff',
  },
  error: {
    main: '#d4183d',
    light: '#ef4444',
    dark: '#c41b33',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0891b2',
    light: '#2dd4bf',
    dark: '#03626b',
    contrastText: '#ffffff',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  text: {
    primary: '#030213',
    secondary: '#717182',
    disabled: '#94a3b8',
  },
  divider: 'rgba(0,0,0,0.08)',
};

export const elegantDark = {
  mode: 'dark',
  primary: {
    main: '#E6EEF0', // light-ish primary on dark
    light: '#F5FBFD',
    dark: '#B6CFD2',
    contrastText: '#021617',
  },
  secondary: {
    main: '#06b6d4',
    light: '#7ee7f4',
    dark: '#03636a',
    contrastText: '#0F1115',
  },
  success: {
    main: '#34d399',
    light: '#6df6bf',
    dark: '#059669',
    contrastText: '#021617',
  },
  warning: {
    main: '#fbbf24',
    light: '#fcd29b',
    dark: '#d97706',
    contrastText: '#021617',
  },
  error: {
    main: '#f87171',
    light: '#ff9b9b',
    dark: '#dc2626',
    contrastText: '#021617',
  },
  info: {
    main: '#2dd4bf',
    light: '#6fe9d8',
    dark: '#028b83',
    contrastText: '#021617',
  },
  background: {
    default: '#04282A',
    paper: '#021617',
  },
  text: {
    primary: '#E6EEF0',
    secondary: '#93c5fd',
    disabled: '#6099a0',
  },
  divider: '#02383A',
};

export default { elegantLight, elegantDark };
