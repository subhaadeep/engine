import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, alpha } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../api/client';

const pageLabels: Record<string, { title: string; subtitle: string }> = {
  '/import': { title: 'Import Data', subtitle: 'Upload GA optimization results and OHLCV historical data' },
  '/filter': { title: 'Filter Parameters', subtitle: 'Apply constraints and rank parameter sets' },
  '/explorer': { title: 'Results Explorer', subtitle: 'Browse and select top-performing parameter combinations' },
  '/backtest': { title: 'Backtest Engine', subtitle: 'Execute strategy backtests on historical data' },
  '/montecarlo': { title: 'Monte Carlo Simulation', subtitle: 'Analyze strategy robustness with stochastic simulation' },
};

const TopBar: React.FC = () => {
  const location = useLocation();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const pageInfo = pageLabels[location.pathname] || { title: 'GA Parameter Explorer', subtitle: '' };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.get('/health', { timeout: 3000 });
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        borderBottom: '1px solid rgba(45,55,72,0.5)',
        background: `linear-gradient(90deg, rgba(17,24,39,0.95) 0%, rgba(10,14,26,0.95) 100%)`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Page Title */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            color: '#F1F5F9',
            lineHeight: 1.2,
          }}
        >
          {pageInfo.title}
        </Typography>
        {pageInfo.subtitle && (
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontSize: '0.75rem' }}
          >
            {pageInfo.subtitle}
          </Typography>
        )}
      </Box>

      {/* Right side: Status + Version */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Backend Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                isConnected === null
                  ? '#F59E0B'
                  : isConnected
                  ? '#10B981'
                  : '#EF4444',
              boxShadow:
                isConnected === null
                  ? '0 0 6px #F59E0B'
                  : isConnected
                  ? '0 0 6px #10B981'
                  : '0 0 6px #EF4444',
              animation: isConnected === null ? 'pulse 1.5s infinite' : undefined,
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.4 },
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color:
                isConnected === null
                  ? '#F59E0B'
                  : isConnected
                  ? '#10B981'
                  : '#EF4444',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {isConnected === null ? 'Connecting...' : isConnected ? 'API Online' : 'API Offline'}
          </Typography>
        </Box>

        <Box
          sx={{
            width: '1px',
            height: 20,
            backgroundColor: 'rgba(45,55,72,0.7)',
          }}
        />

        {/* Version */}
        <Chip
          label="v0.1.0"
          size="small"
          sx={{
            height: 22,
            fontSize: '0.65rem',
            fontWeight: 600,
            backgroundColor: alpha('#6366F1', 0.1),
            color: '#818CF8',
            border: `1px solid ${alpha('#6366F1', 0.2)}`,
            letterSpacing: '0.05em',
          }}
        />
      </Box>
    </Box>
  );
};

export default TopBar;
