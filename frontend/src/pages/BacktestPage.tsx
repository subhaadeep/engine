import React, { useEffect } from 'react';
import {
  Box, Typography, Grid, Button, Alert, Chip, alpha,
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
      <Box sx={{
        maxWidth: 600, mx: 'auto', mt: { xs: 4, sm: 8 }, textAlign: 'center', px: 2,
      }}>
        <ErrorOutline sx={{ fontSize: { xs: 36, sm: 48 }, color: '#2D3748', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Data Not Loaded
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Please import both GA results and OHLCV data before running backtests.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/import')}>
          Go to Import
        </Button>
      </Box>
    );
  }

  // Use session_id (the real field) — fall back to id for compatibility
  const gaId = gaSession.session_id ?? (gaSession as any).id;
  const ohlcvId = ohlcvSession.session_id ?? (ohlcvSession as any).id;

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{
          mb: { xs: 2, sm: 3 },
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 800, color: '#F1F5F9', mb: 0.5,
              fontSize: { xs: '1.4rem', sm: '2rem' },
            }}>
              Backtest Engine
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`GA: ${gaSession.filename}`} size="small" color="primary"
                sx={{ maxWidth: 220, fontSize: '0.7rem' }}
              />
              <Chip
                label={`OHLCV: ${ohlcvSession.filename}`} size="small" color="success"
                sx={{ maxWidth: 220, fontSize: '0.7rem' }}
              />
              {selectedParameterRow && (
                <Chip label={`Rank #${selectedParameterRow.rank} selected`} size="small" color="warning" sx={{ fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={4}>
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <BacktestPanel gaSessionId={gaId} ohlcvSessionId={ohlcvId} />
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={8}>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {currentBacktest ? (
              <Box>
                <TradeHistoryTable trades={trades} totalTrades={totalTrades} />
                <Box sx={{
                  mt: 3, p: { xs: 2, sm: 2.5 }, borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha('#8B5CF6', 0.1)} 0%, ${alpha('#1A2236', 0.9)} 100%)`,
                  border: `1px solid ${alpha('#8B5CF6', 0.25)}`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#F1F5F9', mb: 0.25, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      Ready for Monte Carlo?
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Backtest ID: {currentBacktest.backtest_id} · {totalTrades} trades
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Analytics />}
                    onClick={() => navigate('/montecarlo')}
                    sx={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', boxShadow: '0 4px 15px rgba(139,92,246,0.4)' }}
                  >
                    Run Monte Carlo
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{
                height: '100%', minHeight: { xs: 260, sm: 400 },
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 2, border: `1px dashed ${alpha('#2D3748', 0.7)}`,
                backgroundColor: alpha('#111827', 0.5), gap: 1.5, px: 2,
              }}>
                <Analytics sx={{ fontSize: { xs: 36, sm: 48 }, color: '#2D3748' }} />
                <Typography variant="h6" sx={{ color: '#64748B', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  No Backtest Run Yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', textAlign: 'center', maxWidth: 300, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Configure a strategy and select a parameter set, then click <strong>Execute Backtest</strong>.
                </Typography>
                {!selectedParameterRow && (
                  <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem', maxWidth: 360 }}>
                    No parameter set selected. Go to{' '}
                    <Box component="span" sx={{ color: '#818CF8', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate('/explorer')}>
                      Results Explorer
                    </Box>{' '}to select one.
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
