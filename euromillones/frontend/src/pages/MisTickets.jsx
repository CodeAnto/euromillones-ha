import React from 'react'
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, TextField, Stack, Box,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import RecyclingIcon from '@mui/icons-material/Recycling'
import { api } from '../api.js'
import ReinvertirDialog from '../components/ReinvertirDialog.jsx'

export default function MisTickets({ notify }) {
  const [tickets, setTickets] = React.useState([])
  const [edit, setEdit] = React.useState({}) // id -> premio
  const [reinv, setReinv] = React.useState(null)

  const load = () => api.tickets().then(setTickets).catch(() => {})
  React.useEffect(() => { load() }, [])

  const guardarPremio = async (id) => {
    try {
      await api.actualizarTicket(id, { premio: Number(edit[id]) })
      notify('Premio actualizado')
      setEdit(prev => { const p = { ...prev }; delete p[id]; return p })
      load()
    } catch (e) { notify(`Error: ${e.message}`, 'error') }
  }

  const borrar = async (id) => {
    if (!confirm('¿Borrar este ticket?')) return
    await api.borrarTicket(id)
    load()
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Mis tickets</Typography>
      <Typography color="text.secondary" gutterBottom>
        Los aciertos se calculan automáticamente al sincronizar el sorteo. El premio en € lo metes tú.
      </Typography>

      {tickets.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          Aún no tienes tickets guardados.
        </Box>
      ) : (
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Sorteo</TableCell>
              <TableCell>Números</TableCell>
              <TableCell>Estrellas</TableCell>
              <TableCell>Estrategia</TableCell>
              <TableCell>Aciertos</TableCell>
              <TableCell>Coste</TableCell>
              <TableCell>Premio €</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map(t => (
              <TableRow key={t.id} hover>
                <TableCell>{t.fecha_sorteo}</TableCell>
                <TableCell>{[t.n1,t.n2,t.n3,t.n4,t.n5].join(' · ')}</TableCell>
                <TableCell>{[t.e1,t.e2].join(' · ')}</TableCell>
                <TableCell><Chip size="small" label={t.estrategia} /></TableCell>
                <TableCell>
                  {t.aciertos_num != null
                    ? `${t.aciertos_num} + ${t.aciertos_estr}★`
                    : <Chip size="small" label="pendiente" variant="outlined" />}
                </TableCell>
                <TableCell>{t.coste.toFixed(2)} €</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="number" size="small" sx={{ width: 100 }}
                      value={edit[t.id] ?? (t.premio ?? '')}
                      onChange={e => setEdit({ ...edit, [t.id]: e.target.value })}
                      inputProps={{ step: 0.5 }}
                    />
                    <IconButton size="small" onClick={() => guardarPremio(t.id)}><SaveIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {(t.premio || 0) - (t.reinvertido || 0) > 0.001 && (
                      <IconButton size="small" color="primary" title="Reinvertir premio"
                        onClick={() => setReinv({
                          tipo: 'ticket', id: t.id,
                          label: `Ticket Euromillones · ${t.fecha_sorteo}`,
                          premio: t.premio, reinvertido: t.reinvertido,
                        })}>
                        <RecyclingIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => borrar(t.id)}><DeleteIcon fontSize="small" /></IconButton>
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
