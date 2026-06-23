import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Rutas relativas: imprescindible para que funcione bajo el Ingress de HA
  // (la app se sirve en /api/hassio_ingress/<token>/ y también en la raíz por el puerto directo)
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
})
