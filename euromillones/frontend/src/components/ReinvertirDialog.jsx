import React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Stack, Typography, Box, Alert,
} from '@mui/material'
import RecyclingIcon from '@mui/icons-material/Recycling'
import { api } from '../api.js'

const today = () => new Date().toISOString().slice(0, 10)

export default function ReinvertirDialog({ open, onClose, origen, notify, onDone }) {
  // origen = { tipo: 'ticket'|'gasto', id, label, premio, reinvertido }
  const disponible = origen ? Math.max(0, (origen.premio || 0) - (origen.reinvertido || 0)) : 0
  const [form, setForm] = React.useState({ loteria: '', importe: '', fecha: today(), notas: '' })

  React.useEffect(() => {
    if (open) setForm({ loteria: '', importe: String(disponible), fecha: today(), notas: '' })
  }, [open, disponible])

  if (!origen) return null

  const guardar = async () => {
    const importe = Number(form.importe)
    if (!form.loteria.trim()) return notify('Indica la lotería destino', 'warning')
    if (!importe || importe <= 0) return notify('Importe inválido', 'warning')
    if (importe > disponible + 0.001) return notify(`Máximo disponible: ${disponible.toFixed(2)} €`, 'warning')
    try {
      await api.reinvertir({
        origen_tipo: origen.tipo,
        origen_id: origen.id,
        importe,
        loteria: form.loteria.trim(),
        fecha: form.fecha,
        notas: form.notas || null,
      })
      notify('Reinversión registrada')
      onDone?.()
      onClose()
    } catch (e) { notify(`Error: ${e.message}`, 'error') }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RecyclingIcon sx={{ color: 'primary.main' }} /> Reinvertir premio
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">{origen.label}</Typography>
          <Typography variant="body2">
            Premio: <b>{(origen.premio || 0).toFixed(2)} €</b> ·
            Ya reinvertido: <b>{(origen.reinvertido || 0).toFixed(2)} €</b> ·
            Disponible: <b style={{ color: '#66bb6a' }}>{disponible.toFixed(2)} €</b>
          </Typography>
        </Box>

        {disponible <= 0 && <Alert severity="info" sx={{ mb: 2 }}>Ya has reinvertido todo el premio disponible.</Alert>}

        <Stack spacing={2}>
          <TextField label="Lotería destino" value={form.loteria}
            onChange={e => setForm({ ...form, loteria: e.target.value })}
            placeholder="X20, Primitiva, Bonoloto…" autoFocus disabled={disponible <= 0} />
          <Stack direction="row" spacing={2}>
            <TextField type="number" label="Importe €" value={form.importe} fullWidth
              onChange={e => setForm({ ...form, importe: e.target.value })}
              inputProps={{ step: 0.5, max: disponible, min: 0 }} disabled={disponible <= 0} />
            <TextField type="date" label="Fecha" value={form.fecha} fullWidth
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              InputLabelProps={{ shrink: true }} disabled={disponible <= 0} />
          </Stack>
          <TextField label="Notas (opcional)" value={form.notas} multiline rows={2}
            onChange={e => setForm({ ...form, notas: e.target.value })} disabled={disponible <= 0} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={disponible <= 0}>Reinvertir</Button>
      </DialogActions>
    </Dialog>
  )
}
