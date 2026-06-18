import React, { useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  alpha,
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  CheckCircle,
  ErrorOutline,
  RadioButtonUnchecked,
  RadioButtonChecked,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useBacktestStore } from '../../store/backtestStore';
import type { Strategy } from '../../types';

interface BacktestPanelProps {
  gaSessionId: number;
  ohlcvSessionId: number;
}

const STEPS = ['Initializing', 'Injecting Parameters', 'Executing Strategy', 'Processing Results'];

const BacktestPanel: React.FC<BacktestPanelProps> = ({ gaSessionId, ohlcvSessionId }) => {
  const {
    strategies,
    selectedStrategy,
    selectedParameterRow,
    currentBacktest,
    isRunning,
    error,
    setSelectedStrategy,
    uploadStrategy,
    runBacktest,
    clearError,
  } = useBacktestStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        uploadStrategy(acceptedFiles[0]);
      }
    },
    [uploadStrategy]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.py', '.cs', '.mq5', '.mql5', '.txt'] },
    multiple: false,
  });

  const currentStep = isRunning ? Math.floor(Date.now() / 1500) % STEPS.length : -1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Strategy Upload */}
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 2, color: '#F1F5F9', fontWeight: 700 }}>
            Strategy File
          </Typography>
          <Box
            {...getRootProps()}
            sx={{
              border: `2px dashed ${isDragActive ? '#6366F1' : alpha('#2D3748', 0.8)}`,
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isDragActive ? alpha('#6366F1', 0.05) : 'transparent',
              '&:hover': {
                borderColor: alpha('#6366F1', 0.5),
                backgroundColor: alpha('#6366F1', 0.03),
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 28, color: isDragActive ? '#6366F1' : '#2D3748', mb: 0.5 }} />
            <Typography variant="body2" sx={{ color: isDragActive ? '#818CF8' : '#64748B', fontSize: '0.8rem' }}>
              {isDragActive ? 'Drop strategy file here' : 'Drag & drop or click to upload'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.7rem' }}>
              .py · .cs · .mq5 · .mql5 · .txt
            </Typography>
          </Box>

          {/* Strategy List */}
          {strategies.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mb: 1, display: 'block' }}>
                Uploaded Strategies
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {strategies.map((s: Strategy) => (
                  <Box
                    key={s.id}
                    onClick={() => setSelectedStrategy(s)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      border: `1px solid ${selectedStrategy?.id === s.id ? alpha('#6366F1', 0.4) : alpha('#2D3748', 0.5)}`,
                      backgroundColor: selectedStrategy?.id === s.id ? alpha('#6366F1', 0.08) : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': { backgroundColor: alpha('#6366F1', 0.05) },
                    }}
                  >
                    {selectedStrategy?.id === s.id ? (
                      <RadioButtonChecked sx={{ fontSize: 18, color: '#6366F1' }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ fontSize: 18, color: '#475569' }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        color: selectedStrategy?.id === s.id ? '#F1F5F9' : '#94A3B8',
                        fontFamily: 'monospace',
                        fontWeight: 500,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.filename}
                    </Typography>
                    <Chip label={`#${s.id}`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Selected Parameter Set */}
      {selectedParameterRow && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#F1F5F9', fontWeight: 700 }}>
              Parameter Set — Rank #{selectedParameterRow.rank}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 120, overflow: 'auto' }}>
              {Object.entries(selectedParameterRow.data).slice(0, 12).map(([k, v]) => (
                <Chip
                  key={k}
                  label={`${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.68rem', fontFamily: 'monospace' }}
                />
              ))}
              {Object.keys(selectedParameterRow.data).length > 12 && (
                <Chip
                  label={`+${Object.keys(selectedParameterRow.data).length - 12} more`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.68rem', color: '#64748B' }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert
              severity="error"
              icon={<ErrorOutline />}
              onClose={clearError}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Steps */}
      <AnimatePresence>
        {isRunning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#F1F5F9' }}>
                  Executing Backtest...
                </Typography>
                <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {STEPS.map((step, i) => (
                    <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {i < (currentStep % STEPS.length) ? (
                        <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                      ) : i === (currentStep % STEPS.length) ? (
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            border: '2px solid #6366F1',
                            borderTopColor: 'transparent',
                            animation: 'spin 0.8s linear infinite',
                            '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                          }}
                        />
                      ) : (
                        <RadioButtonUnchecked sx={{ fontSize: 16, color: '#2D3748' }} />
                      )}
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          color: i <= (currentStep % STEPS.length) ? '#F1F5F9' : '#475569',
                          fontWeight: i === (currentStep % STEPS.length) ? 600 : 400,
                        }}
                      >
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      {currentBacktest && !isRunning && (
        <Alert severity="success">
          Backtest complete! ID: {currentBacktest.backtest_id} · Status: {currentBacktest.status}
        </Alert>
      )}

      {/* Execute Button */}
      <Button
        variant="contained"
        size="large"
        startIcon={
          isRunning ? (
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite',
                '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
              }}
            />
          ) : (
            <PlayArrow />
          )
        }
        disabled={isRunning || !selectedStrategy || !selectedParameterRow}
        onClick={() => runBacktest(gaSessionId, ohlcvSessionId)}
        sx={{ py: 1.5, fontSize: '0.95rem' }}
      >
        {isRunning ? 'Running Backtest...' : 'Execute Backtest'}
      </Button>
    </Box>
  );
};

export default BacktestPanel;
