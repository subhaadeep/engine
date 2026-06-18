import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Chip,
  alpha,
  InputAdornment,
} from '@mui/material';
import { Analytics, PlayArrow, ErrorOutline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMonteCarloStore } from '../store/montecarloStore';
import { useBacktestStore } from '../store/backtestStore';
import EquityCurveChart from '../components/montecarlo/EquityCurveChart';
import DistributionHistogram from '../components/montecarlo/DistributionHistogram';
import StatsSummaryPanel from '../components/montecarlo/StatsSummaryPanel';

const N_SIM_OPTIONS = [100, 500, 1000, 2500, 5000, 10000];

const MonteCarloPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentBacktest } = useBacktestStore();
  const {
    results,
    isRunning,
    nSimulations,
    initialBalance,
    error,
    setNSimulations,
    setInitialBalance,
    runMonteCarlo,
    clearError,
    reset,
  } = useMonteCarloStore();

  const [customBalance, setCustomBalance] = useState(String(initialBalance));

  const handleBalanceChange = (val: string) => {
    setCustomBalance(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) setInitialBalance(n);
  };

  const handleRun = () => {
    if (currentBacktest?.backtest_id) {
      runMonteCarlo(currentBacktest.backtest_id);
    }
  };

  if (!currentBacktest) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 10, textAlign: 'center' }}>
        <Analytics sx={{ fontSize: 56, color: '#2D3748', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1 }}>
          No Backtest Available
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
          Run a backtest first to enable Monte Carlo simulation.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/backtest')}>
          Go to Backtest
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5 }}>
            Monte Carlo Simulation
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Stochastic simulation to assess strategy robustness via random trade resampling
          </Typography>
        </Box>
      </motion.div>

      {/* Config panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha('#1A2236', 0.95)} 0%, ${alpha('#111827', 0.85)} 100%)`,
            border: `1px solid ${alpha('#2D3748', 0.5)}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'flex-end',
          }}
        >
          {/* Backtest Reference */}
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem' }}>
              Backtest Source
            </Typography>
            <Chip
              label={`Backtest #${currentBacktest.backtest_id}`}
              color="primary"
              icon={<Analytics sx={{ fontSize: 14 }} />}
              sx={{ height: 30, fontSize: '0.8rem' }}
            />
          </Box>

          {/* N Simulations */}
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem' }}>
              Simulations
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Count</InputLabel>
              <Select
                value={N_SIM_OPTIONS.includes(nSimulations) ? nSimulations : 1000}
                label="Count"
                onChange={(e) => setNSimulations(Number(e.target.value))}
              >
                {N_SIM_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {n.toLocaleString()}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Initial Balance */}
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem' }}>
              Initial Balance
            </Typography>
            <TextField
              size="small"
              type="number"
              value={customBalance}
              onChange={(e) => handleBalanceChange(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>$</Typography></InputAdornment>,
              }}
              inputProps={{ min: 100, step: 1000, style: { fontFamily: 'monospace' } }}
              sx={{ width: 160 }}
            />
          </Box>

          {/* Run button */}
          <Button
            variant="contained"
            size="large"
            startIcon={
              isRunning ? (
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                  }}
                />
              ) : (
                <PlayArrow />
              )
            }
            disabled={isRunning}
            onClick={handleRun}
            sx={{
              px: 3,
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              boxShadow: '0 4px 15px rgba(139,92,246,0.35)',
            }}
          >
            {isRunning ? `Running ${nSimulations.toLocaleString()} sims...` : 'Run Simulation'}
          </Button>

          {results && (
            <Button
              variant="outlined"
              size="small"
              onClick={reset}
              sx={{ borderColor: alpha('#EF4444', 0.4), color: '#EF4444', '&:hover': { borderColor: '#EF4444', backgroundColor: alpha('#EF4444', 0.05) } }}
            >
              Reset
            </Button>
          )}
        </Box>
      </motion.div>

      {/* Loading bar */}
      {isRunning && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
          <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
            Running {nSimulations.toLocaleString()} Monte Carlo simulations...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          icon={<ErrorOutline />}
          onClose={clearError}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Results */}
      {results && !isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stats Summary */}
            <StatsSummaryPanel results={results} />

            {/* Equity Curve Chart */}
            <EquityCurveChart results={results} />

            {/* Distribution Histograms */}
            <DistributionHistogram results={results} />
          </Box>
        </motion.div>
      )}

      {/* Empty state */}
      {!results && !isRunning && (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            borderRadius: 2,
            border: `1px dashed ${alpha('#2D3748', 0.6)}`,
            backgroundColor: alpha('#111827', 0.4),
          }}
        >
          <Analytics sx={{ fontSize: 56, color: '#2D3748', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748B', mb: 1 }}>
            Configure & Run Simulation
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Set number of simulations and initial balance, then click <strong>Run Simulation</strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MonteCarloPage;
