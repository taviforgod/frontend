import { createTheme } from '@mui/material/styles';
import { shadows } from './Shadows'; 
import typography from './Typography'; 

const lightPalette = {
  primary: { main: '#3B82F6' },
  secondary: { main: '#14B8A6' },
  background: {
    default: '#f9fafb',
    paper: '#ffffff',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
  },
  action: {
    active: '#3B82F6',
    hover: '#e0edff',
  },
};

const darkPalette = {
  primary: { main: '#60A5FA' },
  secondary: { main: '#2DD4BF' },
  background: {
    default: '#0f172a',
    paper: '#1e293b',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
  },
  action: {
    active: '#60A5FA',
    hover: '#1e40af',
  },
};

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? lightPalette : darkPalette),
    },
    shape: {
      borderRadius: 5,
    },
    typography,
    shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'light' ? '#f9fafb' : '#0f172a',
            transition: 'background-color 0.3s ease',
          },
          a: {
            textDecoration: 'none',
          },
          '.simplebar-scrollbar:before': {
            background: '#DFE5EF !important',
          },
          '.rounded-bars .apexcharts-bar-series.apexcharts-plot-series .apexcharts-series path': {
            clipPath: 'inset(0 0 5% 0 round 20px)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              mode === 'light'
                ? '0 8px 20px rgba(0,0,0,0.05)'
                : '0 8px 24px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            transition: 'box-shadow 0.3s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            boxShadow: '0px 7px 30px 0px rgba(90, 114, 123, 0.11)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            borderRadius: 8,
            padding: '10px 24px',
            transition: 'all 0.3s ease',
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow:
                mode === 'light'
                  ? '0 4px 10px rgba(59, 130, 246, 0.15)'
                  : '0 4px 10px rgba(96, 165, 250, 0.3)',
            },
            '&:active': {
              transform: 'scale(0.98)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            },
            '&:disabled': {
              backgroundColor: '#E5E7EB',
              color: '#9CA3AF',
              cursor: 'not-allowed',
            },
          },
          containedPrimary: {
            backgroundColor: mode === 'light' ? '#3B82F6' : '#60A5FA',
            color: '#fff',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#2563eb' : '#3b82f6',
            },
          },
          containedSecondary: {
            backgroundColor: mode === 'light' ? '#14B8A6' : '#2DD4BF',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#0d9488',
            },
          },
          outlined: {
            borderRadius: 8,
            borderWidth: 2,
            fontWeight: 500,
            '&:hover': {
              backgroundColor: mode === 'light' ? '#eff6ff' : '#1e40af20',
            },
          },
          text: {
            borderRadius: 8,
            '&:hover': {
              backgroundColor: mode === 'light' ? '#f3f4f6' : '#1f293740',
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: '7px',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '7px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e5eaef !important',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1e4db7 !important',
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: mode === 'dark'
              ? darkPalette.text.primary
              : lightPalette.text.primary,
          },
        },
      },
    },
  });

export default getTheme;