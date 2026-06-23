import React from 'react'
import {
  Paper, Typography, Grid, Box, Stack, Divider, LinearProgress, Alert, Chip,
  Tooltip as MuiTooltip,
} from '@mui/material'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import RecyclingIcon from '@mui/icons-material/Recycling'
import { api } from '../api.js'

const Card = ({ title, value, color, sub }) => (
  <Paper sx={{ p: 2.5, height: '100%' }}>
    <Typography variant="overline" color="text.secondary">{title}</Typography>
    <Typography variant="h5" sx={{ color, fontWeight: 700 }}>{value}</Typography>
    {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
  </Paper>
)

const fmt = (n) => `${(n ?? 0).toFixed(2)} €`
const COLORS = ['#ffb300','#42a5f5','#66bb6a','#ef5350','#ab47bc','#26c6da','#ff7043','#8d6e63']

const NIVEL_COLOR = {
  sano: 'success',
  ok: 'info',
  atencion: 'warning',
  alerta: 'error',
  sin_datos: 'info',
}

export default function Stats() {
  const [balance, setBalance] = React.useState(null)
  const [porMes, setPorMes] = React.useState([])
  const [frec, setFrec] = React.useState(null)
  const [gastos, setGastos] = React.useState([])
  const [resumen, setResumen] = React.useState(null)

  React.useEffect(() => {
    api.balance().then(setBalance).catch(() => {})
    api.porMes().then(setPorMes).catch(() => {})
    api.frecuencias().then(setFrec).catch(() => {})
    api.gastos().then(setGastos).catch(() => {})
    api.resumen().then(setResumen).catch(() => {})
  }, [])

  const porLoteria = React.useMemo(() => {
    if (!balance) return []
    const map = {}
    map['Euromillones'] = {
      loteria: 'Euromillones',
      gasto: balance.euromillones.gasto_bruto,
      premio: balance.euromillones.premio_bruto,
    }
    for (const g of gastos) {
      const k = g.loteria
      if (!map[k]) map[k] = { loteria: k, gasto: 0, premio: 0 }
      map[k].gasto = +(map[k].gasto + g.importe).toFixed(2)
      map[k].premio = +(map[k].premio + g.premio).toFixed(2)
    }
    return Object.values(map)
      .map(r => ({ ...r, balance: +(r.premio - r.gasto).toFixed(2) }))
      .sort((a, b) => b.gasto - a.gasto)
  }, [balance, gastos])

  if (!balance) return <Typography>Cargando…</Typography>

  const balColor = (n) => (n >= 0 ? 'success.main' : 'error.main')
  const t = balance.total

  return (
    <Stack spacing={3}>
      {/* --- VEREDICTO --- */}
      {resumen && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="overline" color="text.secondary">Resumen</Typography>
            <Chip size="small"
              label={resumen.nivel.replace('_', ' ')}
              color={NIVEL_COLOR[resumen.nivel] || 'default'}
              sx={{ textTransform: 'capitalize' }} />
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{resumen.titulo}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{resumen.mensaje}</Typography>

          {resumen.metricas && Object.keys(resumen.metricas).length > 0 && (
            <Grid container spacing={2} sx={{ mb: resumen.avisos?.length ? 2 : 0 }}>
              {resumen.metricas.gasto_mes_bolsillo != null && (
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Gasto/mes (bolsillo)</Typography>
                    <Typography variant="h6">{fmt(resumen.metricas.gasto_mes_bolsillo)}</Typography>
                  </Box>
                </Grid>
              )}
              {resumen.metricas.gasto_acumulado_bolsillo != null && (
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Gasto acumulado</Typography>
                    <Typography variant="h6">{fmt(resumen.metricas.gasto_acumulado_bolsillo)}</Typography>
                  </Box>
                </Grid>
              )}
              {resumen.metricas.dias_activo != null && (
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Días activo</Typography>
                    <Typography variant="h6">{resumen.metricas.dias_activo}</Typography>
                  </Box>
                </Grid>
              )}
              {resumen.metricas.tasa_recuperacion != null && (
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Recuperación</Typography>
                    <Typography variant="h6">{resumen.metricas.tasa_recuperacion}%</Typography>
                  </Box>
                </Grid>
              )}
              {resumen.metricas.ratio_reinversion != null && (
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Reinversión</Typography>
                    <Typography variant="h6">{resumen.metricas.ratio_reinversion}%</Typography>
                  </Box>
                </Grid>
              )}
              {resumen.metricas.tendencia_90d != null && (
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tendencia 90 días</Typography>
                    <Typography variant="h6" sx={{ color: resumen.metricas.tendencia_90d > 0 ? 'error.main' : 'success.main' }}>
                      {resumen.metricas.tendencia_90d > 0 ? '+' : ''}{resumen.metricas.tendencia_90d}%
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {resumen.avisos?.map((a, i) => (
            <Alert key={i} severity="warning" sx={{ mt: 1 }}>{a}</Alert>
          ))}
        </Paper>
      )}

      {/* --- BALANCE --- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Balance</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Distinguimos entre dinero <b>de tu bolsillo</b> y dinero que ha dado vueltas vía reinversión.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card title="Gasto de bolsillo" value={fmt(t.gasto_bolsillo)} color="text.primary"
              sub={`Bruto: ${fmt(t.gasto_bruto)}`} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card title="Premio retirado" value={fmt(t.premio_retirado)} color="success.main"
              sub={`Bruto: ${fmt(t.premio_bruto)}`} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card title="Reinvertido" value={fmt(t.reinvertido)} color="primary.main"
              sub="Dinero que dio vueltas" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card title="Balance real" value={fmt(t.balance)} color={balColor(t.balance)} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="overline">Euromillones</Typography>
              <Typography>Tickets: {balance.euromillones.tickets}</Typography>
              <Typography>Gasto: {fmt(balance.euromillones.gasto_bruto)}</Typography>
              <Typography>Premio: {fmt(balance.euromillones.premio_bruto)}</Typography>
              <Typography sx={{ color: balColor(balance.euromillones.balance) }}>
                Balance: {fmt(balance.euromillones.balance)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="overline">Otras loterías</Typography>
              <Typography>Registros: {balance.otras.registros}</Typography>
              <Typography>Gasto: {fmt(balance.otras.gasto_bruto)}</Typography>
              <Typography>Premio: {fmt(balance.otras.premio_bruto)}</Typography>
              <Typography sx={{ color: balColor(balance.otras.balance) }}>
                Balance: {fmt(balance.otras.balance)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        {balance.reinversiones?.count > 0 && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <RecyclingIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                {balance.reinversiones.count} reinversion(es) ·
                {' '}{fmt(balance.reinversiones.gasto_bruto)} gastados con premios anteriores
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* --- POR LOTERIA --- */}
      {porLoteria.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Gasto por tipo de lotería</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Agrupado por lotería — incluye reinversiones marcadas como gasto en su propia lotería.
          </Typography>
          <Stack spacing={2}>
            {(() => {
              const totalGasto = porLoteria.reduce((s, r) => s + r.gasto, 0)
              return porLoteria.map((r, i) => {
                const pct = totalGasto > 0 ? (r.gasto / totalGasto) * 100 : 0
                const color = COLORS[i % COLORS.length]
                return (
                  <Box key={r.loteria}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{r.loteria}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <MuiTooltip title="Gasto"><Typography variant="body2" color="text.secondary">{fmt(r.gasto)}</Typography></MuiTooltip>
                        <MuiTooltip title="Premio"><Typography variant="body2" color="success.main">{fmt(r.premio)}</Typography></MuiTooltip>
                        <MuiTooltip title="Balance">
                          <Typography variant="body2" sx={{ color: r.balance >= 0 ? 'success.main' : 'error.main', fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                            {r.balance >= 0 ? '+' : ''}{fmt(r.balance)}
                          </Typography>
                        </MuiTooltip>
                      </Stack>
                    </Stack>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
                    <Typography variant="caption" color="text.disabled">{pct.toFixed(1)}% del gasto total</Typography>
                  </Box>
                )
              })
            })()}
          </Stack>
        </Paper>
      )}

      {/* --- POR MES --- */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Gasto vs premio por mes</Typography>
        <Box sx={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={porMes}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="gasto_bolsillo" name="Gasto bolsillo" fill="#ef5350" />
              <Bar dataKey="premio_retirado" name="Premio retirado" fill="#66bb6a" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {frec && frec.total_sorteos > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Frecuencia histórica (números) · {frec.total_sorteos} sorteos
          </Typography>
          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={frec.numeros}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="n" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="veces" fill="#42a5f5" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Frecuencia (estrellas)</Typography>
          <Box sx={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={frec.estrellas}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="n" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="veces" fill="#ffb300" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </Stack>
  )
}
