// src/theme/index.js
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { lightPalette, darkPalette } from './Palette';
import { elegantLight, elegantDark } from './ElegantPalette';
import typography from './Typography';
import shadows from './Shadows';

const prefersDarkMode =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const getTheme = (mode = 'system') => {
  let palette;
  if (mode === 'dark') {
    palette = darkPalette;
  } else if (mode === 'light') {
    palette = lightPalette;
  } else if (mode === 'elegant') {
    // "elegant" will respect the user's system preference for light/dark
    palette = prefersDarkMode ? elegantDark : elegantLight;
  } else if (mode === 'system') {
    palette = prefersDarkMode ? darkPalette : lightPalette;
  }

  let theme = createTheme({
    palette,
    typography,
    shadows,
    shape: { borderRadius: 10 }, // slightly larger globally for a modern feel

    components: {
      // ---------------------------
      // Date/time default formats
      // ---------------------------
      MuiDatePicker: { defaultProps: { format: 'dd/MM/yyyy' } },
      MuiMobileDatePicker: { defaultProps: { format: 'dd/MM/yyyy' } },
      MuiTimePicker: { defaultProps: { ampm: false, format: 'HH:mm' } },
      MuiMobileTimePicker: { defaultProps: { ampm: false, format: 'HH:mm' } },
      MuiDateTimePicker: { defaultProps: { ampm: false, format: 'dd/MM/yyyy HH:mm' } },
      MuiMobileDateTimePicker: { defaultProps: { ampm: false, format: 'dd/MM/yyyy HH:mm' } },

      // ---------------------------
      // PICKER TOOLBAR (mobile top bar)
      // ---------------------------
      MuiPickersToolbar: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
            borderRadius: '8px 8px 0 0',
            background: palette.mode === 'dark' ? palette.background.paper : palette.primary.light,
            color: palette.mode === 'dark' ? palette.text.primary : palette.primary.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          },
          toolbarTxt: {
            fontSize: '1.1rem',
            fontWeight: 700,
          },
        },
      },

      // ---------------------------
      // CALENDAR HEADER (month + arrows)
      // ---------------------------
      MuiCalendarPicker: {
        styleOverrides: {
          root: {
            // container spacing tweaks
            padding: '8px',
          },
          // The header is an internal structure; this targets the header row.
          // If your MUI version exposes a different classname for header, tweak here.
          // We keep selectors conservative to avoid warnings.
          // Add a custom header background & arrow hover styles via the parent.
          '& .MuiCalendarPicker-root .MuiTypography-root': {
            // month label's base styling (will be overridden further down by Typography if needed)
          },
        },
      },

      // ---------------------------
      // CALENDAR HEADER BUTTONS (prev/next)
      // ---------------------------
      MuiIconButton: {
        styleOverrides: {
          root: {
            // We don't want to globally affect every IconButton; keep this minimal.
            // Calendar-specific edits are scoped below via descendant selectors in Calendar components.
          },
        },
      },

      // ---------------------------
      // WEEKDAY LABELS (Mon, Tue, ...)
      // ---------------------------
      MuiDayPicker: {
        // Note: If your MUI/X version doesn't expose MuiDayPicker, weekday label styling may require different selector.
        // This block is conservative and will apply to the Day Picker skeletons.
        styleOverrides: {
          weekDayLabel: {
            fontWeight: 700,
            fontSize: '0.85rem',
            color: palette.text.secondary,
            padding: '6px 4px',
          },
        },
      },

      // ---------------------------
      // PICKERS DAY (core day cell styling)
      // ---------------------------
      MuiPickersDay: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            minWidth: 40,
            height: 40,
            margin: '2px',
            transition: 'transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
            // default hover
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundColor: `${palette.primary.main}20`,
            },

            // selected day (must use &.Mui-selected)
            '&.Mui-selected': {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
              boxShadow: `0 4px 10px ${palette.primary.main}33`,
              '&:hover': {
                backgroundColor: palette.primary.dark,
                boxShadow: `0 6px 18px ${palette.primary.dark}33`,
              },
            },

            // today (outline)
            '&.MuiPickersDay-today': {
              border: `2px solid ${palette.primary.main}`,
              padding: '6px',
            },

            // disabled
            '&.Mui-disabled': {
              color: palette.text.disabled,
              opacity: 0.65,
              background: 'transparent',
              transform: 'none',
            },

            // outside current month
            '&.MuiPickersDay-outsideCurrentMonth': {
              color: `${palette.text.disabled}88`,
              opacity: 0.9,
            },
          },

          // Range classes (used by DateRangePicker)
          rangeStart: {
            background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.primary.main})`,
            color: palette.primary.contrastText,
            borderRadius: '10px 0 0 10px',
            boxShadow: `0 4px 10px ${palette.primary.main}22`,
          },

          rangeEnd: {
            background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.primary.main})`,
            color: palette.primary.contrastText,
            borderRadius: '0 10px 10px 0',
            boxShadow: `0 4px 10px ${palette.primary.main}22`,
          },

          rangeIntervalDay: {
            // soft tinted interval fill between start and end
            backgroundColor: `${palette.primary.main}1F`,
            borderRadius: 0,
            color: palette.text.primary,
          },
        },
      },

      // ---------------------------
      // Month / Year pickers (YearPicker / MonthPicker)
      // ---------------------------
      MuiPickersYear: {
        // Not all MUI versions expose MuiPickersYear; if you get an unknown key warning,
        // the year/month selectors may need to be targeted via MuiCalendarPicker descendants.
        styleOverrides: {
          root: {
            minWidth: 72,
            minHeight: 56,
            borderRadius: 8,
            margin: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 160ms ease, transform 160ms ease',
            '&:hover': {
              backgroundColor: `${palette.primary.main}12`,
              transform: 'translateY(-2px)',
            },
            '&.Mui-selected': {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
              borderRadius: 10,
            },
          },
        },
      },

      MuiPickersMonth: {
        styleOverrides: {
          root: {
            minWidth: 84,
            minHeight: 52,
            borderRadius: 8,
            margin: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            transition: 'background-color 160ms ease, transform 160ms ease',
            '&:hover': {
              backgroundColor: `${palette.primary.main}12`,
              transform: 'translateY(-2px)',
            },
            '&.Mui-selected': {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
              borderRadius: 10,
            },
          },
        },
      },

      // ---------------------------
      // Calendar container tweaks (header + arrows)
      // ---------------------------
      MuiCalendarHeader: {
        // Some MUI versions expose CalendarHeader; others don't. This is safe in many MUI X versions.
        styleOverrides: {
          root: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            marginBottom: 6,
            borderRadius: 8,
            background: palette.mode === 'dark' ? palette.background.default : `${palette.primary.main}08`,
          },
          label: {
            fontWeight: 800,
            fontSize: '1rem',
          },
          switchViewButton: {
            '&:hover': {
              backgroundColor: `${palette.primary.main}16`,
            },
          },
        },
      },

      // ---------------------------
      // Smooth animations for month transitions
      // ---------------------------
      MuiSlideTransition: {
        styleOverrides: {
          root: {
            // If this component is available in your picker package, apply subtle fade/slide
            transition: 'opacity 240ms ease, transform 240ms ease',
          },
        },
      },

      // ---------------------------
      // Density / sizing helpers
      // ---------------------------
      MuiCalendarOrClockPicker: {
        styleOverrides: {
          root: {
            // Provide more compact and spacious options via CSS custom properties
            '--picker-day-size': '40px',
            padding: 6,
          },
        },
      },

      // ---------------------------
      // BASE STYLING (kept minimal & consistent)
      // ---------------------------
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 20px',
            textTransform: 'none',
            fontWeight: 600,
            fontFamily: `'Outfit', sans-serif`,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: palette.mode === 'dark' ? shadows[4] : shadows[3],
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          },
          contained: {
            boxShadow: palette.mode === 'dark' ? shadows[2] : shadows[1],
            '&:hover': {
              boxShadow: palette.mode === 'dark' ? shadows[4] : shadows[3],
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            boxShadow: palette.mode === 'dark' ? shadows[2] : shadows[1],
            transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          elevation1: {
            boxShadow: palette.mode === 'dark' ? shadows[1] : '0px 2px 4px rgba(0, 0, 0, 0.05)',
          },
          elevation2: {
            boxShadow: palette.mode === 'dark' ? shadows[2] : '0px 4px 8px rgba(0, 0, 0, 0.06)',
          },
          elevation3: {
            boxShadow: palette.mode === 'dark' ? shadows[3] : '0px 8px 16px rgba(0, 0, 0, 0.08)',
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            padding: 0,
            overflow: 'hidden',
            border: palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(10, 58, 103, 0.12)',
            backgroundColor: palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.72)'
              : 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: palette.mode === 'dark'
              ? '0 6px 18px rgba(0, 0, 0, 0.4)'
              : '0 10px 28px rgba(10, 58, 103, 0.12)',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: palette.mode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                : '0 16px 36px rgba(10, 58, 103, 0.18)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '20px',
            '&:last-child': {
              paddingBottom: '20px',
            },
          },
        },
      },

      MuiCardHeader: {
        styleOverrides: {
          root: {
            padding: '20px',
            paddingBottom: '16px',
          },
          title: {
            fontSize: '1.125rem',
            fontWeight: 600,
          },
          subheader: {
            fontSize: '0.875rem',
            marginTop: '4px',
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontFamily: `'Outfit', sans-serif`,
            transition: 'all 200ms ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.mode === 'dark' ? palette.primary.light : palette.primary.main,
            },
          },
          input: { padding: '12px 14px' },
        },
      },

      MuiTypography: {
        defaultProps: {
          fontFamily: `'Outfit', sans-serif`,
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.8125rem',
            height: 28,
            transition: 'all 200ms ease',
          },
          filled: {
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: shadows[2],
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },

      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '1rem',
          },
        },
      },

      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 4,
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 4,
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.08)',
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 8,
          },
          bar: {
            borderRadius: 10,
          },
        },
      },

      MuiCircularProgress: {
        styleOverrides: {
          root: {
            animationDuration: '1.2s',
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          standard: {
            border: '1px solid',
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: palette.mode === 'dark' ? shadows[5] : shadows[4],
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.8125rem',
            padding: '8px 12px',
            backgroundColor: palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(50, 50, 50, 0.92)',
          },
        },
      },
    },
  });

  // Dark-mode specific fine tuning (if using system or explicit dark)
  if (palette.mode === 'dark') {
    theme = createTheme({
      ...theme,
      components: {
        ...theme.components,
        MuiPickersDay: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                boxShadow: `0 6px 18px ${palette.primary.dark}33`,
              },
              '&:hover': {
                backgroundColor: `${palette.primary.light}12`,
              },
            },
          },
        },
        MuiPickersToolbar: {
          styleOverrides: {
            root: {
              background: palette.background.paper,
              color: palette.text.primary,
            },
          },
        },
      },
    });
  }

  // Apply responsive fonts and return
  return responsiveFontSizes(theme);
};

export default getTheme;
