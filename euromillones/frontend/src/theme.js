import { createTheme } from '@mui/material/styles'

// === SYNTHWAVE / RETRO-FUTURISM ===
// Recomendado por ui-ux-pro-max para lottery/gaming: neón sobre noche, glow, 80s.
// Paleta: magenta neón + cian eléctrico + oro, sobre azul noche profundo.
const NEON_MAGENTA = '#ff4d8d'
const NEON_CYAN = '#22d3ee'
const NEON_GOLD = '#fcd34d'
const NIGHT = '#0a0613'

export const buildTheme = (mode = 'dark') => {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: NEON_MAGENTA, light: '#ff84b3', dark: '#e11d6b' },
      secondary: { main: NEON_CYAN, light: '#67e8f9', dark: '#0891b2' },
      success: { main: '#34d399' },
      error: { main: '#fb7185' },
      warning: { main: NEON_GOLD },
      info: { main: '#818cf8' },
      text: isDark
        ? { primary: '#f4f0ff', secondary: 'rgba(244,240,255,0.6)' }
        : { primary: '#1a1430', secondary: 'rgba(26,20,48,0.65)' },
      background: isDark
        ? { default: NIGHT, paper: 'rgba(22, 14, 40, 0.55)' }
        : { default: '#f6f4ff', paper: 'rgba(255,255,255,0.7)' },
      divider: isDark ? 'rgba(255,77,141,0.14)' : 'rgba(0,0,0,0.08)',
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: '"Chakra Petch", system-ui, sans-serif',
      h1: { fontFamily: '"Russo One", sans-serif', fontWeight: 400, letterSpacing: 0.5 },
      h2: { fontFamily: '"Russo One", sans-serif', fontWeight: 400, letterSpacing: 0.5 },
      h3: { fontFamily: '"Russo One", sans-serif', fontWeight: 400, letterSpacing: 0.5 },
      h4: { fontFamily: '"Russo One", sans-serif', fontWeight: 400 },
      h5: { fontFamily: '"Russo One", sans-serif', fontWeight: 400 },
      h6: { fontFamily: '"Russo One", sans-serif', fontWeight: 400 },
      button: { fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
      overline: { letterSpacing: 3, fontWeight: 700, fontSize: 11 },
    },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { backgroundColor: 'transparent !important' } } },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: `1px solid ${isDark ? 'rgba(255,77,141,0.18)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark
              ? '0 0 0 1px rgba(34,211,238,0.04), 0 10px 40px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(40,30,80,0.08)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 22 },
          containedPrimary: {
            background: `linear-gradient(135deg, ${NEON_MAGENTA}, #c026d3)`,
            color: '#fff',
            boxShadow: '0 0 18px rgba(255,77,141,0.55), 0 0 4px rgba(255,77,141,0.9)',
            '&:hover': {
              background: `linear-gradient(135deg, #ff6fa3, ${NEON_MAGENTA})`,
              boxShadow: '0 0 28px rgba(255,77,141,0.8), 0 0 6px rgba(255,77,141,1)',
            },
          },
          outlinedSecondary: {
            borderColor: NEON_CYAN,
            color: NEON_CYAN,
            boxShadow: '0 0 12px rgba(34,211,238,0.25)',
            '&:hover': { borderColor: NEON_CYAN, boxShadow: '0 0 18px rgba(34,211,238,0.5)' },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 'auto' },
          indicator: { height: 3, borderRadius: 3, background: NEON_CYAN, boxShadow: `0 0 10px ${NEON_CYAN}` },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'uppercase', fontWeight: 600, fontSize: 13, letterSpacing: 1,
            minHeight: 40, color: isDark ? 'rgba(244,240,255,0.5)' : 'rgba(0,0,0,0.55)',
            transition: 'all .2s',
            '&:hover': { color: isDark ? NEON_CYAN : '#000' },
            '&.Mui-selected': { color: isDark ? '#fff' : '#1a1430' },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(10,6,19,0.78)' : 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,77,141,0.16)' : 'rgba(0,0,0,0.06)'}`,
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
