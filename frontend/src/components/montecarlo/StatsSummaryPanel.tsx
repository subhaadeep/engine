import React from 'react';
import { Box, Grid, Typography, alpha } from '@mui/material';
import type { MCResults } from '../../types';

interface Props { results: MCResults; }

const fmt = (v: number | null | undefined, decimals = 2, prefix = '', suffix = '') =>
  v == null ? 'N/A' : `${prefix}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

const Stat: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, backgroundColor: alpha('#111827', 0.7), border: `1px solid ${alpha('#2D3748', 0.5)}` }}>
    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.2rem' }, color: color ?? '#F1F5F9', fontFamily: 'monospace' }}>{value}</Typography>
  </Box>
);

const StatsSummaryPanel: React.FC<Props> = ({ results }) => (
  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
    <Grid item xs={6} sm={4} md={3}><Stat label="Mean Final Balance" value={fmt(results.mean_final_balance, 2, '$')} color="#10B981" /></Grid>
    <Grid item xs={6} sm={4} md={3}><Stat label="Median Final Balance" value={fmt(results.median_final_balance, 2, '$')} /></Grid>
    <Grid item xs={6} sm={4} md={3}><Stat label="Std Deviation" value={fmt(results.std_final_balance, 2, '$')} /></Grid>
    <Grid item xs={6} sm={4} md={3}><Stat label="% Profitable Sims" value={fmt(results.pct_profitable != null ? results.pct_profitable * 100 : null, 1, '', '%')} color={results.pct_profitable != null && results.pct_profitable >= 0.5 ? '#10B981' : '#EF4444'} /></Grid>
    <Grid item xs={6} sm={4} md={3}><Stat label="VaR 95%" value={fmt(results.var_95, 2, '$')} color="#F59E0B" /></Grid>
    <Grid item xs={6} sm={4} md={3}><Stat label="CVaR 95%" value={fmt(results.cvar_95, 2, '$')} color="#EF4444" /></Grid>
    <Grid item xs={6} sm={4} md={3}><Stat label="Simulations" value={results.n_sims.toLocaleString()} /></Grid>
  </Grid>
);

export default StatsSummaryPanel;
