import React, { useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  Alert, TextField, alpha, Grid,
} from '@mui/material';
import { PlayArrow, ShowChart } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMonteCarloStore } from '../store/montecarloStore';
import StatsSummaryPanel from '../components/montecarlo/StatsSummaryPanel';
import EquityCurveChart from '../components/montecarlo/EquityCurveChart';
import DistributionHistogram from '../components/montecarlo/DistributionHistogram';

const MonteCarloPage: React.FC = () => {
  const {
    results, isRunning, error, nSims, setNSims, runSimulation, reset,
  } = useMonteCarloStore();

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 0, sm: 1 } }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
            Monte Carlo Simulation
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Bootstrap simulation on backtest trade sequence to assess strategy robustness.
          </Typography>
        </Box>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: '16px !important', sm: '24px !important' } }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <TextField
              label="Number of Simulations"
              type="number"
              size="small"
              value={nSims}
              onChange={(e) => setNSims(Number(e.target.value))}
              inputProps={{ min: 100, max: 50000, step: 100 }}
              sx={{ width: { xs: '100%', sm: 220 } }}
            />
            <Button
              variant="contained"
              startIcon={isRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
              onClick={runSimulation}
              disabled={isRunning}
              sx={{
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                fontWeight: 700, textTransform: 'none',
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {isRunning ? 'Simulating...' : 'Run Simulation'}
            </Button>
            {results && (
              <Button variant="outlined" onClick={reset} size="small" sx={{ color: '#64748B', borderColor: '#2D3748', width: { xs: '100%', sm: 'auto' } }}>
                Reset
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {results && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StatsSummaryPanel results={results} />
            <EquityCurveChart results={results} />
            <DistributionHistogram results={results} />
          </Box>
        </motion.div>
      )}

      {!results && !isRunning && (
        <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 10 }, color: '#475569' }}>
          <ShowChart sx={{ fontSize: { xs: 40, sm: 56 }, mb: 2, opacity: 0.3 }} />
          <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Run a backtest first, then simulate here.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default MonteCarloPage;
