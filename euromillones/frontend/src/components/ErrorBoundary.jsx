import React from 'react'
import { Paper, Typography, Box, Button } from '@mui/material'

export default class ErrorBoundary extends React.Component {
  state = { error: null, info: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
    this.setState({ info })
  }
  reset = () => this.setState({ error: null, info: null })
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey) this.reset()
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ color: 'error.main', mb: 1 }}>
          Algo ha fallado al renderizar esta pestaña
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {String(this.state.error?.message || this.state.error)}
        </Typography>
        <Box component="pre" sx={{
          p: 2, fontSize: 12, lineHeight: 1.4,
          bgcolor: 'rgba(255,255,255,0.04)',
          border: 1, borderColor: 'divider', borderRadius: 2,
          maxHeight: 400, overflow: 'auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {this.state.info?.componentStack || this.state.error?.stack || 'sin stack'}
        </Box>
        <Button variant="contained" onClick={this.reset} sx={{ mt: 2 }}>Reintentar</Button>
      </Paper>
    )
  }
}
