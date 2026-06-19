import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, error: '' };

  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, error: e.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          minHeight: '100vh', background: '#0A0E1A',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2, p: 4,
        }}>
          <Typography sx={{ color: '#EF4444', fontWeight: 700, fontSize: '1.2rem' }}>Something went wrong</Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.85rem', maxWidth: 480, textAlign: 'center' }}>
            {this.state.error}
          </Typography>
          <Button
            variant="outlined"
            sx={{ borderColor: '#6366F1', color: '#818CF8' }}
            onClick={() => window.location.reload()}
          >
            Reload App
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
