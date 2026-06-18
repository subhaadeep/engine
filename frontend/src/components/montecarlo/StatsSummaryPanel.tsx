import React from 'react';
import { Grid, Box, Typography, alpha } from '@mui/material';
import { TrendingUp, TrendingDown, Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { MCResults } from '../../types';

interface StatsSummaryPanelProps {
  results: MCResults;
}

interface StatCardProps {
  label: string;
  value: string;
  subvalue?: string;
  color?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subvalue,
  color = '#F1F5F9',
  icon,
  highlight = false,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    style={{ height: '100%' }}
  >
    <Box
      sx={{
        height: '100%',
        p: 2.5,
        borderRadius: 2,
        background: highlight
          ? `linear-gradient(135deg, ${alpha('#EF4444', 0.12)} 0%, ${alpha('#1A2236', 0.9)} 100%)`
          : `linear-gradient(135deg, ${alpha('#1A2236', 0.95)} 0%, ${alpha('#111827', 0.85)} 100%)`,
        border: `1px solid ${highlight ? alpha('#EF4444', 0.4) : alpha('#2D3748', 0.6)}`,
        backdropFilter: 'blur(10px)',
        boxShadow: highlight
          ? `0 4px 20px ${alpha('#EF4444', 0.15)}`
          : `0 4px 16px ${alpha('#000', 0.3)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: highlight ? alpha('#EF4444', 0.6) : alpha('#6366F1', 0.3),
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </Typography>
        {icon && (
          <Box
            sx={{
              color: highlight ? '#EF4444' : color === '#F1F5F9' ? '#6366F1' : color,
              opacity: 0.8,
              '& svg': { fontSize: 18 },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontFamily: '"Inter", monospace',
        }}
      >
        {value}
      </Typography>
      {subvalue && (
        <Typography
          sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.5, fontWeight: 500 }}
        >
          {subvalue}
        </Typography>
      )}
    </Box>
  </motion.div>
);

function fmtPct(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function fmtDollar(v: number, initial: number): string {
  const delta = (v / 100) * initial;
  const sign = delta >= 0 ? '+$' : '-$';
  return `${sign}${Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const StatsSummaryPanel: React.FC<StatsSummaryPanelProps> = ({ results }) => {
  const {
    mean_return,
    median_return,
    max_return,
    min_return,
    avg_drawdown,
    worst_drawdown,
    risk_of_ruin,
    initial_balance,
    n_simulations,
  } = results;

  const stats: StatCardProps[] = [
    {
      label: 'Mean Return',
      value: fmtPct(mean_return),
      subvalue: fmtDollar(mean_return, initial_balance),
      color: mean_return >= 0 ? '#10B981' : '#EF4444',
      icon: mean_return >= 0 ? <TrendingUp /> : <TrendingDown />,
      delay: 0,
    },
    {
      label: 'Median Return',
      value: fmtPct(median_return),
      subvalue: fmtDollar(median_return, initial_balance),
      color: median_return >= 0 ? '#10B981' : '#EF4444',
      icon: median_return >= 0 ? <TrendingUp /> : <TrendingDown />,
      delay: 0.05,
    },
    {
      label: 'Best Case',
      value: fmtPct(max_return),
      subvalue: fmtDollar(max_return, initial_balance),
      color: '#10B981',
      icon: <TrendingUp />,
      delay: 0.1,
    },
    {
      label: 'Worst Case',
      value: fmtPct(min_return),
      subvalue: fmtDollar(min_return, initial_balance),
      color: '#EF4444',
      icon: <TrendingDown />,
      delay: 0.15,
    },
    {
      label: 'Avg Drawdown',
      value: `${avg_drawdown.toFixed(2)}%`,
      subvalue: `Avg across ${n_simulations.toLocaleString()} sims`,
      color: '#F59E0B',
      icon: <TrendingDown />,
      delay: 0.2,
    },
    {
      label: 'Worst Drawdown',
      value: `${worst_drawdown.toFixed(2)}%`,
      subvalue: 'Maximum observed',
      color: '#EF4444',
      icon: <TrendingDown />,
      delay: 0.25,
    },
    {
      label: 'Risk of Ruin',
      value: `${(risk_of_ruin * 100).toFixed(2)}%`,
      subvalue: risk_of_ruin > 0.05 ? '⚠ Elevated risk' : 'Within tolerance',
      color: risk_of_ruin > 0.05 ? '#EF4444' : '#10B981',
      icon: <Warning />,
      highlight: risk_of_ruin > 0.05,
      delay: 0.3,
    },
    {
      label: 'Total Simulations',
      value: n_simulations.toLocaleString(),
      subvalue: `Initial: $${initial_balance.toLocaleString()}`,
      color: '#818CF8',
      delay: 0.35,
    },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat, i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsSummaryPanel;
