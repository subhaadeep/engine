import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from './theme/darkTheme';
import AppShell from './components/layout/AppShell';
import ImportPage from './pages/ImportPage';
import FilterPage from './pages/FilterPage';
import ExplorerPage from './pages/ExplorerPage';
import BacktestPage from './pages/BacktestPage';
import MonteCarloPage from './pages/MonteCarloPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/import" replace />} />
              <Route path="import"      element={<ImportPage />} />
              <Route path="filter"      element={<FilterPage />} />
              <Route path="explorer"    element={<ExplorerPage />} />
              <Route path="backtest"    element={<BacktestPage />} />
              <Route path="montecarlo"  element={<MonteCarloPage />} />
              {/* Catch-all: redirect unknown paths to import */}
              <Route path="*" element={<Navigate to="/import" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
