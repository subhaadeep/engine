import { createTheme, alpha } from '@mui/material/styles';

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  paper: '#1A2236',
  paper2: '#1E2A40',
  border: '#2D3748',
  accent: '#6366F1',
  accentDark: '#4F46E5',
  accentLight: '#818CF8',
  secondary: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.accent,
      dark: COLORS.accentDark,
      light: COLORS.accentLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: COLORS.secondary,
      contrastText: '#FFFFFF',
    },
    success: {
      main: COLORS.success,
      contrastText: '#FFFFFF',
    },
    error: {
      main: COLORS.error,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: COLORS.warning,
    },
    background: {
      default: COLORS.bg,
      paper: COLORS.paper,
    },
    text: {
      primary: COLORS.text,
      secondary: COLORS.textSecondary,
      disabled: COLORS.textMuted,
    },
    divider: COLORS.border,
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: COLORS.textSecondary },
    subtitle2: { fontWeight: 500, color: COLORS.textSecondary },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400, color: COLORS.textSecondary },
    caption: { fontWeight: 400, color: COLORS.textMuted },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: COLORS.bg,
          minHeight: '100vh',
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.border} ${COLORS.bg}`,
        },
        '*::-webkit-scrollbar': { width: '6px', height: '6px' },
        '*::-webkit-scrollbar-track': { background: COLORS.bg },
        '*::-webkit-scrollbar-thumb': {
          background: COLORS.border,
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb:hover': { background: COLORS.accent },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${alpha(COLORS.paper, 0.9)} 0%, ${alpha(COLORS.paper2, 0.8)} 100%)`,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${alpha(COLORS.border, 0.6)}`,
          boxShadow: `0 4px 24px ${alpha('#000', 0.4)}, inset 0 1px 0 ${alpha('#fff', 0.05)}`,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: alpha(COLORS.accent, 0.3),
            boxShadow: `0 8px 32px ${alpha('#000', 0.5)}, 0 0 0 1px ${alpha(COLORS.accent, 0.1)}`,
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: '20px' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        contained: {
          background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.secondary} 100%)`,
          boxShadow: `0 4px 15px ${alpha(COLORS.accent, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${COLORS.accentDark} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: `0 6px 20px ${alpha(COLORS.accent, 0.5)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&.Mui-disabled': {
            background: alpha(COLORS.border, 0.5),
            color: COLORS.textMuted,
          },
        },
        outlined: {
          borderColor: alpha(COLORS.accent, 0.5),
          color: COLORS.accentLight,
          '&:hover': {
            borderColor: COLORS.accent,
            background: alpha(COLORS.accent, 0.08),
          },
        },
        text: {
          color: COLORS.textSecondary,
          '&:hover': { color: COLORS.text, background: alpha(COLORS.text, 0.05) },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: COLORS.paper,
          border: `1px solid ${alpha(COLORS.border, 0.5)}`,
        },
        elevation0: { border: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        colorDefault: {
          backgroundColor: alpha(COLORS.border, 0.6),
          color: COLORS.textSecondary,
          border: `1px solid ${alpha(COLORS.border, 0.8)}`,
        },
        colorPrimary: {
          backgroundColor: alpha(COLORS.accent, 0.15),
          color: COLORS.accentLight,
          border: `1px solid ${alpha(COLORS.accent, 0.3)}`,
        },
        colorSuccess: {
          backgroundColor: alpha(COLORS.success, 0.15),
          color: COLORS.success,
          border: `1px solid ${alpha(COLORS.success, 0.3)}`,
        },
        colorError: {
          backgroundColor: alpha(COLORS.error, 0.15),
          color: COLORS.error,
          border: `1px solid ${alpha(COLORS.error, 0.3)}`,
        },
        colorWarning: {
          backgroundColor: alpha(COLORS.warning, 0.15),
          color: COLORS.warning,
          border: `1px solid ${alpha(COLORS.warning, 0.3)}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha(COLORS.bg, 0.5),
            borderRadius: 10,
            '& fieldset': { borderColor: alpha(COLORS.border, 0.7) },
            '&:hover fieldset': { borderColor: alpha(COLORS.accent, 0.4) },
            '&.Mui-focused fieldset': { borderColor: COLORS.accent },
          },
          '& .MuiInputLabel-root': { color: COLORS.textSecondary },
          '& .MuiInputLabel-root.Mui-focused': { color: COLORS.accent },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: COLORS.accent,
            '& + .MuiSwitch-track': { backgroundColor: alpha(COLORS.accent, 0.5) },
          },
        },
        track: { backgroundColor: alpha(COLORS.border, 0.8) },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: alpha(COLORS.border, 0.5) },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(COLORS.border, 0.4)}`,
          color: COLORS.text,
        },
        head: {
          backgroundColor: alpha(COLORS.surface, 0.8),
          color: COLORS.textSecondary,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(COLORS.bg, 0.5),
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(COLORS.accent, 0.4),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.accent,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.paper2,
          border: `1px solid ${alpha(COLORS.border, 0.6)}`,
          boxShadow: `0 8px 32px ${alpha('#000', 0.5)}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(COLORS.accent, 0.08) },
          '&.Mui-selected': {
            backgroundColor: alpha(COLORS.accent, 0.15),
            '&:hover': { backgroundColor: alpha(COLORS.accent, 0.2) },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(COLORS.border, 0.4),
          borderRadius: 4,
        },
        bar: {
          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.secondary})`,
          borderRadius: 4,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
        standardError: {
          backgroundColor: alpha(COLORS.error, 0.1),
          border: `1px solid ${alpha(COLORS.error, 0.3)}`,
        },
        standardSuccess: {
          backgroundColor: alpha(COLORS.success, 0.1),
          border: `1px solid ${alpha(COLORS.success, 0.3)}`,
        },
        standardWarning: {
          backgroundColor: alpha(COLORS.warning, 0.1),
          border: `1px solid ${alpha(COLORS.warning, 0.3)}`,
        },
        standardInfo: {
          backgroundColor: alpha(COLORS.accent, 0.1),
          border: `1px solid ${alpha(COLORS.accent, 0.3)}`,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: alpha(COLORS.border, 0.4) },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.paper2,
          border: `1px solid ${alpha(COLORS.border, 0.6)}`,
          fontSize: '0.75rem',
          color: COLORS.text,
        },
        arrow: { color: COLORS.paper2 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${alpha(COLORS.border, 0.5)}` },
        indicator: {
          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.secondary})`,
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: COLORS.textSecondary,
          fontWeight: 600,
          '&.Mui-selected': { color: COLORS.accentLight },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: COLORS.accent },
        rail: { backgroundColor: alpha(COLORS.border, 0.5) },
        thumb: {
          '&:hover': { boxShadow: `0 0 0 8px ${alpha(COLORS.accent, 0.16)}` },
        },
      },
    },
  },
});
