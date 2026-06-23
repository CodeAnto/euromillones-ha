import React from 'react'
import {
  Paper, Typography, TextField, Button, Stack, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Box, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RecyclingIcon from '@mui/icons-material/Recycling'
import { api } from '../api.js'
import ReinvertirDialog from '../components/ReinvertirDialog.jsx'

const today = () => new Date().toISOString().slice(0, 10)

export default function Gastos({ notify }) {
  const [items, setItems] = React.useState([])
  const [reinv, setReinv] = React.useState(null)
  const [form, setForm] = React.useState({
    fecha: today(), loteria: '', importe: '', premio: '', notas: '',
  })

  const load = () => api.gastos().then(setItems).catch(() => {})
  React.useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.loteria || !form.importe) {
      notify('Lotería e importe son obligatorios', 'warning')
      return
    }
    try {
      await api.crearGasto({
        fecha: form.fecha,
        loteria: form.loteria,
        importe: Number(form.importe),
        premio: Number(form.premio || 0),
        notas: form.notas || null,
      })
      setForm({ fecha: today(), loteria: '', importe: '', premio: '', notas: '' })
      notify('Gasto añadido')
      load()
    } catch (e) { notify(`Error: ${e.message}`, 'error') }
  }

  const borrar = async (id) => {
    if (!confirm('¿Borrar este gasto?')) return
    await api.borrarGasto(id)
    load()
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Otras loterías</Typography>
      <Typography color="text.secondary" gutterBottom>
        Registra manualmente gasto y premios de cualquier otra lotería que juegues.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }}>
        <TextField type="date" label="Fecha" value={form.fecha}
          onChange={e => setForm({ ...form, fecha: e.target.value })}
          InputLabelProps={{ shrink: true }} sx={{ minWidth: 170 }} />
        <TextField label="Lotería" value={form.loteria}
          onChange={e => setForm({ ...form, loteria: e.target.value })} placeholder="Primitiva, Bonoloto…" fullWidth />
        <TextField type="number" label="Importe €" value={form.importe}
          onChange={e => setForm({ ...form, importe: e.target.value })} inputProps={{ step: 0.5 }} sx={{ minWidth: 130 }} />
        <TextField type="number" label="Premio €" value={form.premio}
          onChange={e => setForm({ ...form, premio: e.target.value })} inputProps={{ step: 0.5 }} sx={{ minWidth: 130 }} />
      </Stack>
      <TextField label="Notas" value={form.notas}
        onChange={e => setForm({ ...form, notas: e.target.value })} fullWidth sx={{ mb: 2 }} />
      <Button variant="contained" startIcon={<AddIcon />} onClick={add}>Añadir</Button>

      {items.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          Sin gastos registrados.
        </Box>
      ) : (
        <Table size="small" sx={{ mt: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Lotería</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell align="right">Premio</TableCell>
              <TableCell>Notas</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(g => (
              <TableRow key={g.id} hover>
                <TableCell>{g.fecha}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{g.loteria}</span>
                    {g.origen_tipo && (
                      <Chip size="small" label="reinversión" color="primary" variant="outlined"
                        icon={<RecyclingIcon sx={{ fontSize: 14 }} />} />
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">{g.importe.toFixed(2)} €</TableCell>
                <TableCell align="right" sx={{ color: g.premio > 0 ? 'success.main' : 'text.secondary' }}>
                  {g.premio.toFixed(2)} €
                </TableCell>
                <TableCell>{g.notas}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {(g.premio || 0) - (g.reinvertido || 0) > 0.001 && (
                      <IconButton size="small" color="primary" title="Reinvertir premio"
                        onClick={() => setReinv({
                          tipo: 'gasto', id: g.id,
                          label: `${g.loteria} · ${g.fecha}`,
                          premio: g.premio, reinvertido: g.reinvertido,
                        })}>
                        <RecyclingIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => borrar(g.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ReinvertirDialog
        open={!!reinv}
        origen={reinv}
        notify={notify}
        onClose={() => setReinv(null)}
        onDone={load}
      />
    </Paper>
  )
}
