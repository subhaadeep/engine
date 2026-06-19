import React, { Suspense, lazy, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button, CircularProgress } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import AppShell from './components/layout/AppShell';

// ── LAZY LOAD every page — a broken page won't crash the whole app─────────────
const ImportPage    = lazy(() => import('./pages/ImportPage'));
const FilterPage    = lazy(() => import('./pages/FilterPage'));
const ExplorerPage  = lazy(() => import('./pages/ExplorerPage'));
const BacktestPage  = lazy(() => import('./pages/BacktestPage'));
const MonteCarloPage = lazy(() => import('./pages/MonteCarloPage'));

// ── Page-level loading fallback ──────────────────────────────────────
function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress size={32} sx={{ color: '#6366F1' }} />
      <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>Loading...</Typography>
    </Box>
  );
}

// ── Error boundary that SHOWS the real error instead of white screen ────────
interface EBState { error: Error | null; }
class PageErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(e: Error): EBState { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 4, maxWidth: 700, mx: 'auto', mt: 4 }}>
          <Box sx={{ p: 3, borderRadius: 2, border: '1px solid #ef444440', background: '#ef444410' }}>
            <Typography sx={{ color: '#f87171', fontWeight: 700, mb: 1, fontSize: '1rem' }}>
              ⚠️ Page failed to load
            </Typography>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mb: 2 }}>
              {this.state.error.message}
            </Typography>
            <Box component="pre" sx={{ color: '#64748B', fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', mb: 2, maxHeight: 200, overflowY: 'auto' }}>
              {this.state.error.stack}
            </Box>
            <Button variant="outlined" size="small" color="error"
              onClick={() => this.setState({ error: null })}>
              Retry
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

// ── App-level error boundary ────────────────────────────────────────
interface AppEBState { error: Error | null; }
class AppErrorBoundary extends Component<{ children: React.ReactNode }, AppEBState> {
  state: AppEBState = { error: null };
  static getDerivedStateFromError(e: Error): AppEBState { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <Box sx={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0B0F1A', p: 4,
        }}>
          <Box sx={{ maxWidth: 640, width: '100%' }}>
            <Typography sx={{ color: '#f87171', fontWeight: 800, fontSize: '1.4rem', mb: 1 }}>
              GA Engine — Startup Error
            </Typography>
            <Typography sx={{ color: '#94A3B8', mb: 2, fontSize: '0.875rem' }}>
              The app crashed before it could render. See below for the exact error.
            </Typography>
            <Box sx={{
              p: 2.5, borderRadius: 2, border: '1px solid #ef444440',
              background: '#ef444408', fontFamily: 'monospace',
            }}>
              <Typography sx={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>
                {this.state.error.message}
              </Typography>
              <Box component="pre" sx={{ color: '#64748B', fontSize: '0.68rem', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto' }}>
                {this.state.error.stack}
              </Box>
            </Box>
            <Typography sx={{ color: '#475569', fontSize: '0.75rem', mt: 2 }}>
              Fix the error then run: <Box component="code" sx={{ color: '#818CF8' }}>npm run dev</Box> in the frontend folder.
            </Typography>
            <Button sx={{ mt: 2 }} variant="outlined" color="error"
              onClick={() => window.location.reload()}>
              Reload
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/import" replace />} />
              <Route path="import" element={
                <PageErrorBoundary><Suspense fallback={<PageLoader />}><ImportPage /></Suspense></PageErrorBoundary>
              } />
              <Route path="filter" element={
                <PageErrorBoundary><Suspense fallback={<PageLoader />}><FilterPage /></Suspense></PageErrorBoundary>
              } />
              <Route path="explorer" element={
                <PageErrorBoundary><Suspense fallback={<PageLoader />}><ExplorerPage /></Suspense></PageErrorBoundary>
              } />
              <Route path="backtest" element={
                <PageErrorBoundary><Suspense fallback={<PageLoader />}><BacktestPage /></Suspense></PageErrorBoundary>
              } />
              <Route path="montecarlo" element={
                <PageErrorBoundary><Suspense fallback={<PageLoader />}><MonteCarloPage /></Suspense></PageErrorBoundary>
              } />
              <Route path="*" element={<Navigate to="/import" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
