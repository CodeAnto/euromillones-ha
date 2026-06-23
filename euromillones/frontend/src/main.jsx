import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { buildTheme } from './theme.js'
import App from './App.jsx'

function Root() {
  const [mode, setMode] = React.useState(localStorage.getItem('mode') || 'dark')
  const theme = React.useMemo(() => buildTheme(mode), [mode])
  const toggle = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    localStorage.setItem('mode', next)
    setMode(next)
  }
  React.useEffect(() => {
    document.body.classList.toggle('light-mode', mode === 'light')
  }, [mode])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App mode={mode} onToggleMode={toggle} />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
