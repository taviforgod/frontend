const lightPalette = {
  mode: 'light',
  // Align with HomePage landing theme for consistent brand colors
  primary: {
    main: '#0A3A67',
    light: '#073B5A',
    dark: '#052637',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FFD166',
    light: '#FFF4E5',
    dark: '#B88600',
    contrastText: '#073048',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#0891B2',
    light: '#2DD4BF',
    dark: '#03626B',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#E8F1F8', // Rich blue-tinted background
    paper: '#F5F9FC',   // Light blue for cards
  },
  text: {
    primary: '#0F172A', // Dark text on light background
    secondary: '#475569', // Balanced secondary text
    disabled: '#94A3B8',
  },
  
  grey: {
    50: '#F0F7FD',
    100: '#E1EFF9',
    200: '#C7E0F4',
    300: '#A1C9E8',
    400: '#7AA5D0',
    500: '#5684B8',
    600: '#3D6BA0',
    700: '#2B5285',
    800: '#1D3A6A',
    900: '#0F2447',
  },
  divider: '#C7E0F4',
};


const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#0891B2',
    light: '#2DD4BF',
    dark: '#034F52',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#06B6D4',
    light: '#7EE7F4',
    dark: '#03636A',
    contrastText: '#0F1115',
  },
  background: {
    default: '#04282A', // Dark teal background for dark mode
    paper: '#021617',
  },
  text: {
    primary: '#E6EEF0',
    secondary: '#2DD4BF',
  },
  divider: '#02383A',
};


export { lightPalette, darkPalette };
