import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, IconButton, useMediaQuery, useTheme,
  BottomNavigation, BottomNavigationAction, Paper, AppBar, Toolbar,
  alpha,
} from '@mui/material';
import {
  Upload, FilterAlt, TableChart, PlayArrow, ShowChart,
  Menu as MenuIcon,
} from '@mui/icons-material';

const NAV_ITEMS = [
  { label: 'Import',      path: '/import',      icon: <Upload /> },
  { label: 'Filter',      path: '/filter',      icon: <FilterAlt /> },
  { label: 'Explorer',    path: '/explorer',    icon: <TableChart /> },
  { label: 'Backtest',    path: '/backtest',    icon: <PlayArrow /> },
  { label: 'Monte Carlo', path: '/montecarlo',  icon: <ShowChart /> },
];

const DRAWER_WIDTH = 220;

const SidebarContent: React.FC<{ currentPath: string; onNavigate: (p: string) => void }> = ({ currentPath, onNavigate }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
    <Box sx={{ p: 2.5, pb: 2, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366F1, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShowChart sx={{ fontSize: 18, color: '#fff' }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#F1F5F9', lineHeight: 1.1 }}>GA Engine</Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>Parameter Explorer</Typography>
        </Box>
      </Box>
    </Box>
    <Divider sx={{ borderColor: alpha('#2D3748', 0.6) }} />
    <List sx={{ flex: 1, p: 1.5, pt: 1 }}>
      {NAV_ITEMS.map((item) => {
        const active = currentPath.startsWith(item.path);
        return (
          <ListItemButton
            key={item.path}
            onClick={() => onNavigate(item.path)}
            sx={{
              borderRadius: 1.5, mb: 0.5, py: 1, px: 1.5,
              backgroundColor: active ? alpha('#6366F1', 0.12) : 'transparent',
              border: `1px solid ${active ? alpha('#6366F1', 0.3) : 'transparent'}`,
              '&:hover': { backgroundColor: alpha('#6366F1', 0.07) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, '& svg': { fontSize: 18, color: active ? '#818CF8' : '#475569' } }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.85rem', fontWeight: active ? 600 : 400,
                color: active ? '#F1F5F9' : '#64748B',
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
    <Divider sx={{ borderColor: alpha('#2D3748', 0.4) }} />
    <Box sx={{ p: 2, flexShrink: 0 }}>
      <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.65rem' }}>
        Runs fully on your local machine
      </Typography>
    </Box>
  </Box>
);

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentNavIndex = Math.max(0, NAV_ITEMS.findIndex(i => location.pathname.startsWith(i.path)));

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0A0E1A',
      overflow: 'hidden',    // only the shell clips, not the body
    }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${alpha('#2D3748', 0.5)}`,
            backgroundColor: alpha('#111827', 0.8),
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SidebarContent currentPath={location.pathname} onNavigate={navigate} />
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              backgroundColor: '#111827',
              borderRight: `1px solid ${alpha('#2D3748', 0.5)}`,
            },
          }}
        >
          <SidebarContent
            currentPath={location.pathname}
            onNavigate={(p) => { navigate(p); setDrawerOpen(false); }}
          />
        </Drawer>
      )}

      {/* Main column */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        {/* Mobile Top Bar */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backgroundColor: alpha('#111827', 0.95),
              borderBottom: `1px solid ${alpha('#2D3748', 0.5)}`,
              backdropFilter: 'blur(8px)',
              flexShrink: 0,
            }}
          >
            <Toolbar sx={{ minHeight: '52px !important', px: 2 }}>
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1, color: '#94A3B8' }}>
                <MenuIcon />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '6px',
                  background: 'linear-gradient(135deg, #6366F1, #10B981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShowChart sx={{ fontSize: 13, color: '#fff' }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#F1F5F9' }}>GA Engine</Typography>
              </Box>
              <Typography sx={{ ml: 'auto', fontSize: '0.75rem', color: '#475569' }}>
                {NAV_ITEMS[currentNavIndex]?.label}
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Scrollable page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',   // scroll here, not on body
            overflowX: 'hidden',
            p: { xs: 2, sm: 3 },
            pb: { xs: 10, sm: 3 }, // space for mobile bottom nav
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1300,
            borderTop: `1px solid ${alpha('#2D3748', 0.6)}`,
            backgroundColor: alpha('#111827', 0.97),
            backdropFilter: 'blur(12px)',
          }}
          elevation={0}
        >
          <BottomNavigation
            value={currentNavIndex}
            onChange={(_, v) => navigate(NAV_ITEMS[v].path)}
            sx={{ backgroundColor: 'transparent', height: 60 }}
          >
            {NAV_ITEMS.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
                sx={{
                  color: '#475569', minWidth: 0,
                  '&.Mui-selected': { color: '#818CF8' },
                  '& .MuiBottomNavigationAction-label': { fontSize: '0.6rem' },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default AppShell;
