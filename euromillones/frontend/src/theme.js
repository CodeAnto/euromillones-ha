import { createTheme } from '@mui/material/styles'

export const buildTheme = (mode = 'dark') => {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1' },     // indigo suave
      secondary: { main: '#5eead4', light: '#99f6e4', dark: '#2dd4bf' },   // teal suave (solo acento)
      success: { main: '#34d399' },
      error: { main: '#f87171' },
      warning: { main: '#fbbf24' },
      info: { main: '#7dd3fc' },
      text: isDark
        ? { primary: '#e4e4e7', secondary: 'rgba(228,228,231,0.6)' }
        : { primary: '#18181b', secondary: 'rgba(24,24,27,0.65)' },
      background: isDark
        ? { default: '#0a0a0f', paper: 'rgba(24, 24, 32, 0.5)' }
        : { default: '#fafafa', paper: 'rgba(255, 255, 255, 0.65)' },
      divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: '"Inter", system-ui, sans-serif',
      h1: { fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, letterSpacing: -2 },
      h2: { fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, letterSpacing: -1.5 },
      h3: { fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, letterSpacing: -1.5 },
      h4: { fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, letterSpacing: -1 },
      h5: { fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, letterSpacing: -0.5 },
      h6: { fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, letterSpacing: -0.3 },
      button: { fontWeight: 600, textTransform: 'none' },
      overline: { letterSpacing: 2, fontWeight: 600, fontSize: 11 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.35)'
              : '0 8px 32px rgba(30,30,60,0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 12, paddingInline: 20 },
          containedPrimary: {
            background: '#6366f1',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
            '&:hover': {
              background: '#7c8aff',
              boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: { root: { minHeight: 'auto' }, indicator: { display: 'none' } },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 500, fontSize: 14,
            minHeight: 38, borderRadius: 10, margin: '0 2px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)',
            transition: 'all .2s',
            '&:hover': {
              color: isDark ? '#fff' : '#000',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            },
            '&.Mui-selected': {
              color: isDark ? '#fff' : '#18181b',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              fontWeight: 600,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(10,10,15,0.72)' : 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
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
              cursor: 'pointer', opacity: 0.8, marginLeft: 4,
            },
            'input[type="date"]::-webkit-calendar-picker-indicator:hover': { opacity: 1 },
            'input[type="date"]': { colorScheme: isDark ? 'dark' : 'light' },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 8 } } },
      // Para que el fondo aurora del index.html sea visible (no taparlo con el background.default)
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: 'transparent !important' } } },
    },
  })
}
