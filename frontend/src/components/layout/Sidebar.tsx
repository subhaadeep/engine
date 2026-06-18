import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  alpha,
} from '@mui/material';
import {
  CloudUpload,
  FilterList,
  GridView,
  PlayArrow,
  Analytics,
  ShowChart,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useImportStore } from '../../store/importStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  { label: 'Import Data', path: '/import', icon: <CloudUpload />, description: 'Load CSV files' },
  { label: 'Filter Parameters', path: '/filter', icon: <FilterList />, description: 'Set GA filters' },
  { label: 'Results Explorer', path: '/explorer', icon: <GridView />, description: 'Browse top runs' },
  { label: 'Backtest Engine', path: '/backtest', icon: <PlayArrow />, description: 'Run backtests' },
  { label: 'Monte Carlo', path: '/montecarlo', icon: <Analytics />, description: 'Risk simulation' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gaSession, ohlcvSession } = useImportStore();

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, #0D1321 0%, #111827 100%)`,
        borderRight: '1px solid rgba(45,55,72,0.7)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: `radial-gradient(ellipse at top left, ${alpha('#6366F1', 0.12)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Logo/Branding */}
      <Box
        sx={{
          px: 3,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
            flexShrink: 0,
          }}
        >
          <ShowChart sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: '1rem',
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            GA Explorer
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
            PARAMETER OPTIMIZER
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(45,55,72,0.5)', mx: 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1.5, py: 2, overflow: 'auto' }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: 'block',
            color: '#64748B',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
          }}
        >
          Navigation
        </Typography>

        <List disablePadding>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  component={motion.div as unknown as React.ElementType}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    borderRadius: '10px',
                    px: 1.5,
                    py: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: isActive ? alpha('#6366F1', 0.15) : 'transparent',
                    border: isActive ? `1px solid ${alpha('#6366F1', 0.3)}` : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isActive ? alpha('#6366F1', 0.2) : alpha('#fff', 0.04),
                    },
                  }}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: 3,
                          borderRadius: '0 3px 3px 0',
                          background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? '#818CF8' : '#64748B',
                      transition: 'color 0.2s',
                      '& svg': { fontSize: 20 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#F1F5F9' : '#94A3B8',
                      lineHeight: 1.3,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem',
                      color: isActive ? alpha('#818CF8', 0.7) : '#475569',
                      lineHeight: 1.2,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Status Section */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: '1px solid rgba(45,55,72,0.5)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#64748B',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            display: 'block',
            mb: 1,
          }}
        >
          Data Status
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
              GA Results
            </Typography>
            <Chip
              label={gaSession ? 'Loaded' : 'None'}
              size="small"
              color={gaSession ? 'success' : 'default'}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
              OHLCV Data
            </Typography>
            <Chip
              label={ohlcvSession ? 'Loaded' : 'None'}
              size="small"
              color={ohlcvSession ? 'success' : 'default'}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          </Box>
        </Box>

        {gaSession && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: '8px',
              background: alpha('#6366F1', 0.08),
              border: `1px solid ${alpha('#6366F1', 0.15)}`,
            }}
          >
            <Typography variant="caption" sx={{ color: '#818CF8', fontWeight: 600, fontSize: '0.7rem' }}>
              {gaSession.filename}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem' }}>
              {gaSession.row_count.toLocaleString()} rows · {gaSession.columns.length} cols
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
