import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Alert,
  Chip,
  alpha,
} from '@mui/material';
import { Analytics, ErrorOutline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useImportStore } from '../store/importStore';
import { useBacktestStore } from '../store/backtestStore';
import BacktestPanel from '../components/backtest/BacktestPanel';
import TradeHistoryTable from '../components/backtest/TradeHistoryTable';

const BacktestPage: React.FC = () => {
  const navigate = useNavigate();
  const { gaSession, ohlcvSession } = useImportStore();
  const {
    currentBacktest,
    trades,
    totalTrades,
    selectedParameterRow,
    fetchStrategies,
  } = useBacktestStore();

  useEffect(() => { fetchStrategies(); }, []);

  if (!gaSession || !ohlcvSession) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 48, color: '#2D3748', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1 }}>
          Data Not Loaded
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
          Please import both GA results and OHLCV data before running backtests.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/import')}>
          Go to Import
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5 }}>
              Backtest Engine
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`GA: ${gaSession.filename}`} size="small" color="primary" sx={{ maxWidth: 220, fontSize: '0.7rem' }} />
              <Chip label={`OHLCV: ${ohlcvSession.filename}`} size="small" color="success" sx={{ maxWidth: 220, fontSize: '0.7rem' }} />
              {selectedParameterRow && (
                <Chip label={`Rank #${selectedParameterRow.rank} selected`} size="small" color="warning" sx={{ fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Left: BacktestPanel */}
        <Grid item xs={12} lg={4}>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <BacktestPanel gaSessionId={gaSession.id} ohlcvSessionId={ohlcvSession.id} />
          </motion.div>
        </Grid>

        {/* Right: Trade History */}
        <Grid item xs={12} lg={8}>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {currentBacktest ? (
              <Box>
                <TradeHistoryTable trades={trades} totalTrades={totalTrades} />

                {/* Monte Carlo Button */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#8B5CF6', 0.1)} 0%, ${alpha('#1A2236', 0.9)} 100%)`,
                    border: `1px solid ${alpha('#8B5CF6', 0.25)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#F1F5F9', mb: 0.25 }}>
                      Ready for Monte Carlo?
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Backtest ID: {currentBacktest.backtest_id} · {totalTrades} trades · Run stochastic simulation to assess robustness
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Analytics />}
                    onClick={() => navigate('/montecarlo')}
                    sx={{
                      background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                      boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
                    }}
                  >
                    Run Monte Carlo
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  minHeight: 400,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  border: `1px dashed ${alpha('#2D3748', 0.7)}`,
                  backgroundColor: alpha('#111827', 0.5),
                  gap: 1.5,
                }}
              >
                <Analytics sx={{ fontSize: 48, color: '#2D3748' }} />
                <Typography variant="h6" sx={{ color: '#64748B' }}>
                  No Backtest Run Yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', textAlign: 'center', maxWidth: 300 }}>
                  Configure a strategy and select a parameter set, then click <strong>Execute Backtest</strong>.
                </Typography>
                {!selectedParameterRow && (
                  <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem', maxWidth: 360 }}>
                    No parameter set selected. Go to{' '}
                    <Box
                      component="span"
                      sx={{ color: '#818CF8', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate('/explorer')}
                    >
                      Results Explorer
                    </Box>{' '}
                    to select one.
                  </Alert>
                )}
              </Box>
            )}
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BacktestPage;
