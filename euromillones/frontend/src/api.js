const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8337'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

export const api = {
  strategies: () => req('/strategies'),
  generate: (estrategia) => req('/generate', { method: 'POST', body: JSON.stringify({ estrategia }) }),

  tickets: () => req('/tickets'),
  crearTicket: (data) => req('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  actualizarTicket: (id, data) => req(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  borrarTicket: (id) => req(`/tickets/${id}`, { method: 'DELETE' }),

  gastos: () => req('/gastos'),
  crearGasto: (data) => req('/gastos', { method: 'POST', body: JSON.stringify(data) }),
  borrarGasto: (id) => req(`/gastos/${id}`, { method: 'DELETE' }),

  sorteos: (limit = 50) => req(`/sorteos?limit=${limit}`),
  syncSorteos: (desde, hasta) => req(`/sorteos/sync?desde=${desde}&hasta=${hasta}`, { method: 'POST' }),

  reinvertir: (data) => req('/reinvertir', { method: 'POST', body: JSON.stringify(data) }),

  balance: () => req('/stats/balance'),
  porMes: () => req('/stats/por-mes'),
  frecuencias: () => req('/stats/frecuencias'),
  resumen: () => req('/stats/resumen'),

  exportar: () => req('/backup/export'),
  importar: (payload, modo = 'merge') =>
    req(`/backup/import?modo=${modo}`, { method: 'POST', body: JSON.stringify(payload) }),
}
