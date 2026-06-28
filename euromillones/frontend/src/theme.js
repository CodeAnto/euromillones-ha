import { createTheme } from '@mui/material/styles'

// === DARK LIMPIO PREMIUM ===
// Estilo sobrio y elegante (mismo espíritu limpio que Gastos), identidad propia con
// esmeralda + oro (dinero / premio). Sin neón, sin estridencias.
const EMERALD = '#10b981'
const GOLD = '#fbbf24'

export const buildTheme = (mode = 'dark') => {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: EMERALD, light: '#34d399', dark: '#059669' },
      secondary: { main: GOLD, light: '#fcd34d', dark: '#d97706' },
      success: { main: '#34d399' },
      error: { main: '#f87171' },
      warning: { main: GOLD },
      info: { main: '#60a5fa' },
      text: isDark
        ? { primary: '#f1f5f9', secondary: '#94a3b8' }
        : { primary: '#0f172a', secondary: 'rgba(15,23,42,0.6)' },
      background: isDark
        ? { default: '#060912', paper: 'rgba(20, 27, 43, 0.72)' }
        : { default: '#f8fafc', paper: 'rgba(255,255,255,0.7)' },
      divider: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: '"Inter", system-ui, sans-serif',
      h1: { fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: -1.5 },
      h2: { fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: -1.2 },
      h3: { fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: -1 },
      h4: { fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: -0.5 },
      h5: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
      overline: { letterSpacing: 1.6, fontWeight: 700, fontSize: 11 },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: 'transparent !important' } } },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark
              ? '0 12px 40px rgba(0,0,0,0.45)'
              : '0 8px 32px rgba(30,30,60,0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 20 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#04231a',
            fontWeight: 700,
            boxShadow: '0 6px 20px rgba(16,185,129,0.25)',
            '&:hover': { background: 'linear-gradient(135deg, #34d399, #10b981)' },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 'auto' },
          indicator: { height: 3, borderRadius: 3, background: EMERALD },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, fontSize: 14, minHeight: 40,
            color: isDark ? '#94a3b8' : 'rgba(0,0,0,0.55)',
            '&.Mui-selected': { color: isDark ? '#fff' : '#0f172a' },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(6,9,18,0.78)' : 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            'input[type="date"]::-webkit-calendar-picker-indicator': {
              filter: isDark ? 'invert(0.85) brightness(1.2)' : 'invert(0.3)',
              cursor: 'pointer', opacity: 0.8,
            },
            'input[type="date"]': { colorScheme: isDark ? 'dark' : 'light' },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
    },
  })
}
