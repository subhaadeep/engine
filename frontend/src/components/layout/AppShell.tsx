import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 64;

const AppShell: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1200,
        }}
      >
        <Sidebar />
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          marginLeft: `${SIDEBAR_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* TopBar */}
        <Box
          sx={{
            height: TOPBAR_HEIGHT,
            flexShrink: 0,
          }}
        >
          <TopBar />
        </Box>

        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: theme.palette.background.default },
            '&::-webkit-scrollbar-thumb': {
              background: '#2D3748',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': { background: '#6366F1' },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;
