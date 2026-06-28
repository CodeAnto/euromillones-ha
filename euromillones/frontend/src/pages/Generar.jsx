import React from 'react'
import {
  Paper, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Button,
  Box, TextField, Divider, Alert,
} from '@mui/material'
import CasinoIcon from '@mui/icons-material/Casino'
import SaveIcon from '@mui/icons-material/Save'
import StarRateIcon from '@mui/icons-material/StarRate'
import { motion } from 'framer-motion'
import { api } from '../api.js'

const STRATEGY_INFO = [
  { key: 'random', titulo: 'Aleatorio puro',
    desc: 'Sin lógica: 5 números y 2 estrellas al azar. Útil como baseline para comparar.' },
  { key: 'balanced', titulo: 'Balanceado',
    desc: 'Aplica filtros estadísticos: mezcla pares/impares, bajos (1–25) y altos (26–50), suma dentro del rango histórico típico (95–175) y evita más de 2 números consecutivos.' },
  { key: 'hot', titulo: 'Hot — más frecuentes',
    desc: 'Pondera los números que más han salido en los últimos 200 sorteos. Asume que las rachas continúan.' },
  { key: 'cold', titulo: 'Cold — atrasados',
    desc: 'Lo contrario de Hot: prioriza los que llevan tiempo sin salir. Asume regresión a la media ("ya toca").' },
  { key: 'smart_mix', titulo: 'Smart Mix', recomendada: true,
    desc: 'Combina filtros de Balanceado + sesgo Hot en números y estrellas. Tickets coherentes estadísticamente sin caer en superstición.' },
]

const Ball = ({ n, star, delay = 0 }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180, opacity: 0 }}
    animate={{ scale: 1, rotate: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 14, delay }}
    whileHover={{ scale: 1.1, y: -4 }}
    style={{ display: 'inline-block' }}
  >
    <Box sx={{
      width: 68, height: 68, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 700, fontSize: 22,
      position: 'relative',
      background: star
        ? 'radial-gradient(circle at 32% 26%, #cffafe 0%, #22d3ee 45%, #0e7490 100%)'
        : 'radial-gradient(circle at 32% 26%, #ffd6e7 0%, #ff4d8d 46%, #be185d 100%)',
      color: '#fff',
      // Glow neón: doble halo + borde luminoso + relieve interno
      border: `2px solid ${star ? 'rgba(103,232,249,0.9)' : 'rgba(255,132,179,0.9)'}`,
      boxShadow: star
        ? '0 0 22px rgba(34,211,238,0.75), 0 0 6px rgba(34,211,238,1), inset 0 -4px 12px rgba(0,30,40,0.45), inset 0 2px 5px rgba(255,255,255,0.4)'
        : '0 0 22px rgba(255,77,141,0.75), 0 0 6px rgba(255,77,141,1), inset 0 -4px 12px rgba(40,0,20,0.45), inset 0 2px 5px rgba(255,255,255,0.4)',
      textShadow: '0 1px 3px rgba(0,0,0,0.45)',
      '&::after': {
        content: '""', position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 44%)',
        pointerEvents: 'none',
      },
    }}>
      {n}
    </Box>
  </motion.div>
)

const todayPlusDays = (d) => {
  const x = new Date(); x.setDate(x.getDate() + d)
  return x.toISOString().slice(0, 10)
}
const nextEuroDate = () => {
  const d = new Date()
  for (let i = 0; i < 7; i++) {
    const day = d.getDay()
    if (day === 2 || day === 5) return d.toISOString().slice(0, 10)
    d.setDate(d.getDate() + 1)
  }
  return todayPlusDays(0)
}

export default function Generar({ notify }) {
  const [strategies, setStrategies] = React.useState({})
  const [estrategia, setEstrategia] = React.useState('smart_mix')
  const [ticket, setTicket] = React.useState(null)
  const [fecha, setFecha] = React.useState(nextEuroDate())
  const [coste, setCoste] = React.useState(2.5)
  const [notas, setNotas] = React.useState('')
  const [historicoVacio, setHistoricoVacio] = React.useState(false)

  React.useEffect(() => {
    api.strategies().then(setStrategies).catch(() => {})
    api.sorteos(1).then(rows => setHistoricoVacio(rows.length === 0)).catch(() => {})
  }, [])

  const necesitaHistorico = ['hot', 'cold', 'smart_mix'].includes(estrategia)
  const enFallback = historicoVacio && necesitaHistorico

  const generar = async () => {
    try {
      const t = await api.generate(estrategia)
      setTicket(t)
    } catch (e) { notify(`Error: ${e.message}`, 'error') }
  }

  const guardar = async () => {
    try {
      await api.crearTicket({
        fecha_sorteo: fecha, estrategia: ticket.estrategia,
        numeros: ticket.numeros, estrellas: ticket.estrellas,
        coste: Number(coste), notas: notas || null,
      })
      notify('Ticket guardado')
      setTicket(null); setNotas('')
    } catch (e) { notify(`Error: ${e.message}`, 'error') }
  }

  return (
    <Stack spacing={3}>
      {/* HERO */}
      <Paper sx={{ p: { xs: 3, sm: 5 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{
          position: 'absolute', top: -120, right: -120, width: 320, height: 320,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 65%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Typography variant="overline" sx={{ color: 'primary.light' }}>GENERADOR</Typography>
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 1, mt: 0.5, fontSize: { xs: 36, sm: 56 } }}>
          Tu próximo<br />
          <Box component="span" sx={{ color: 'primary.light' }}>ticket.</Box>
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          5 estrategias · histórico real sincronizado · sin supersticiones.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Estrategia</InputLabel>
            <Select value={estrategia} label="Estrategia" onChange={e => setEstrategia(e.target.value)}>
              {Object.entries(strategies).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" size="large" startIcon={<CasinoIcon />} onClick={generar} sx={{ minWidth: 180, height: 56, fontSize: 16 }}>
            Generar
          </Button>
        </Stack>

        {enFallback && (
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 3 }}>
            <b>Aún no has sincronizado el histórico.</b> <code>hot</code>, <code>cold</code> y <code>smart_mix</code> caerán a fallback. Pulsa ↻ Sync arriba.
          </Alert>
        )}
      </Paper>

      {/* TICKET RESULT */}
      {ticket && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Paper sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ color: 'primary.main' }}>TU TICKET</Typography>
              <Typography variant="caption" sx={{
                px: 1.5, py: 0.6, borderRadius: 2,
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: 'primary.light',
                fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
              }}>
                {ticket.estrategia}
              </Typography>
            </Stack>

            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 1.5 }}>NÚMEROS</Typography>
            <Stack direction="row" sx={{ mt: 1.5, mb: 3, gap: 1.5, flexWrap: 'wrap' }}>
              {ticket.numeros.map((n, i) => <Ball key={n} n={n} delay={i * 0.08} />)}
            </Stack>

            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 1.5 }}>ESTRELLAS</Typography>
            <Stack direction="row" sx={{ mt: 1.5, mb: 4, gap: 1.5 }}>
              {ticket.estrellas.map((n, i) => <Ball key={`s-${n}`} n={n} star delay={0.4 + i * 0.08} />)}
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="date" label="Fecha sorteo" value={fecha}
                onChange={e => setFecha(e.target.value)} InputLabelProps={{ shrink: true }}
                fullWidth sx={{ minWidth: 180 }} />
              <TextField type="number" label="Coste (€)" value={coste}
                onChange={e => setCoste(e.target.value)} inputProps={{ step: 0.5, min: 0 }} fullWidth />
            </Stack>
            <TextField label="Notas (opcional)" value={notas} onChange={e => setNotas(e.target.value)}
              fullWidth multiline rows={2} sx={{ mt: 2 }} />
            <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 3 }} onClick={guardar}>
              Guardar ticket
            </Button>
          </Paper>
        </motion.div>
      )}

      {/* STRATEGY INFO */}
      {!ticket && (
        <Paper sx={{ p: 3.5 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>¿QUÉ HACE CADA ESTRATEGIA?</Typography>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {STRATEGY_INFO.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Box sx={{
                  p: 2, borderRadius: 3,
                  border: 1,
                  borderColor: s.recomendada ? 'primary.main' : 'divider',
                  background: s.recomendada
                    ? 'linear-gradient(135deg, rgba(255,179,0,0.08), rgba(255,179,0,0.02))'
                    : 'transparent',
                }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{s.titulo}</Typography>
                    {s.recomendada && (
                      <Stack direction="row" spacing={0.5} alignItems="center"
                        sx={{ color: 'primary.main', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                        <StarRateIcon sx={{ fontSize: 14 }} />
                        <Box component="span">RECOMENDADA</Box>
                      </Stack>
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{s.desc}</Typography>
                </Box>
              </motion.div>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5, fontStyle: 'italic', opacity: 0.7 }}>
            Realidad: ninguna estrategia mejora la probabilidad de ganar. Pero seguir una lógica consistente te permite medir resultados y elegir sin sesgos personales.
          </Typography>
        </Paper>
      )}
    </Stack>
  )
}
