import React from 'react'
import {
  AppBar, Toolbar, Typography, Container, Tabs, Tab, Box, IconButton, Tooltip,
  Snackbar, Alert, Stack,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SyncIcon from '@mui/icons-material/Sync'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { AnimatePresence, motion } from 'framer-motion'

import Generar from './pages/Generar.jsx'
import MisTickets from './pages/MisTickets.jsx'
import Gastos from './pages/Gastos.jsx'
import Stats from './pages/Stats.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { api } from './api.js'

const TABS = ['Generar', 'Mis tickets', 'Gastos', 'Stats']

export default function App({ mode, onToggleMode }) {
  const [tab, setTab] = React.useState(0)
  const [toast, setToast] = React.useState(null)
  const [syncing, setSyncing] = React.useState(false)

  const notify = (msg, sev = 'success') => setToast({ msg, sev })

  const handleSync = async () => {
    setSyncing(true)
    try {
      const year = new Date().getFullYear()
      const r = await api.syncSorteos(2004, year)
      notify(`Sincronizados ${r.nuevos} sorteos nuevos (${r.sorteos_vistos} vistos)`)
    } catch (e) {
      notify(`Error al sincronizar: ${e.message}`, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleExport = async () => {
    try {
      const data = await api.exportar()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `euromillones-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      notify(`Backup: ${data.tickets.length} tickets · ${data.gastos.length} gastos · ${data.sorteos.length} sorteos`)
    } catch (e) {
      notify(`Error al exportar: ${e.message}`, 'error')
    }
  }

  const fileInputRef = React.useRef(null)
  const handleImportClick = () => fileInputRef.current?.click()
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const modo = window.confirm(
      'IMPORTAR BACKUP\n\n' +
      '· Aceptar = REEMPLAZAR (borra todo lo actual y restaura el backup)\n' +
      '· Cancelar = MERGE (añade lo que no exista, sin tocar lo actual)'
    ) ? 'replace' : 'merge'
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      const r = await api.importar(payload, modo)
      notify(`Importado [${r.modo}]: +${r.añadidos.tickets} tickets, +${r.añadidos.gastos} gastos, +${r.añadidos.sorteos} sorteos`)
    } catch (err) {
      notify(`Error al importar: ${err.message}`, 'error')
    }
  }

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ py: 1.5, gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flexGrow: 1 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #ff4d8d, #8b5cf6)',
              boxShadow: '0 0 18px rgba(255,77,141,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}>
              <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 700, lineHeight: 1, letterSpacing: -0.5,
                color: mode === 'dark' ? '#fff' : '#18181b',
              }}>
                Euromillones
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5, letterSpacing: 2, fontSize: 10, textTransform: 'uppercase' }}>
                Stack · Anto
              </Typography>
            </Box>
          </Stack>

          <Tooltip title="Sincronizar histórico">
            <span>
              <IconButton onClick={handleSync} disabled={syncing}
                sx={{ background: 'rgba(255,255,255,0.04)', '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
                <SyncIcon sx={{
                  animation: syncing ? 'spin 1s linear infinite' : 'none',
                  color: syncing ? '#a5b4fc' : 'inherit',
                }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Exportar backup (JSON)">
            <IconButton onClick={handleExport}
              sx={{ background: 'rgba(255,255,255,0.04)', '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Importar backup (JSON)">
            <IconButton onClick={handleImportClick}
              sx={{ background: 'rgba(255,255,255,0.04)', '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
              <FileUploadIcon />
            </IconButton>
          </Tooltip>
          <input type="file" accept="application/json" hidden ref={fileInputRef} onChange={handleImportFile} />
          <Tooltip title="Cambiar tema">
            <IconButton onClick={onToggleMode}
              sx={{ background: 'rgba(255,255,255,0.04)', '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>

        <Container maxWidth="md" sx={{ pb: 1.5 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
            {TABS.map(label => <Tab key={label} label={label} />)}
          </Tabs>
        </Container>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 5 }}>
        <ErrorBoundary resetKey={tab}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {tab === 0 && <Generar notify={notify} />}
              {tab === 1 && <MisTickets notify={notify} />}
              {tab === 2 && <Gastos notify={notify} />}
              {tab === 3 && <Stats />}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && <Alert severity={toast.sev} onClose={() => setToast(null)} variant="filled" sx={{ borderRadius: 3 }}>{toast.msg}</Alert>}
      </Snackbar>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
