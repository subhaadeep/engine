import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Pagination,
  alpha,
} from '@mui/material';
import { FilterList, GridView } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../store/filterStore';
import ParameterCard from '../components/explorer/ParameterCard';

const PAGE_SIZE = 20;

const ExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const { filteredResults, totalMatching, rankBy, rankOrder } = useFilterStore();
  const [page, setPage] = useState(1);

  const pageCount = Math.ceil(filteredResults.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = filteredResults.slice(start, start + PAGE_SIZE);

  if (filteredResults.length === 0) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 10, textAlign: 'center' }}>
        <GridView sx={{ fontSize: 56, color: '#2D3748', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1 }}>
          No Filter Results Yet
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
          Run the filter to populate the explorer with ranked parameter sets.
        </Typography>
        <Button variant="contained" startIcon={<FilterList />} onClick={() => navigate('/filter')}>
          Go to Filter
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5 }}>
              Results Explorer
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Showing top {filteredResults.length} of {totalMatching.toLocaleString()} matching parameter sets
              </Typography>
              <Chip
                label={`Ranked by ${rankBy} ${rankOrder.toUpperCase()}`}
                size="small"
                color="primary"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterList />}
            onClick={() => navigate('/filter')}
          >
            Adjust Filters
          </Button>
        </Box>
      </motion.div>

      {/* Grid of cards */}
      <Grid container spacing={2.5}>
        {pageRows.map((row, idx) => (
          <Grid item xs={12} md={6} lg={6} key={row.id}>
            <ParameterCard row={row} index={idx} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha('#1A2236', 0.8),
              border: `1px solid ${alpha('#2D3748', 0.5)}`,
            }}
          >
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, p) => { setPage(p); window.scrollTo(0, 0); }}
              color="primary"
              size="medium"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#94A3B8',
                  '&.Mui-selected': {
                    backgroundColor: alpha('#6366F1', 0.2),
                    color: '#818CF8',
                    border: `1px solid ${alpha('#6366F1', 0.4)}`,
                  },
                  '&:hover': { backgroundColor: alpha('#6366F1', 0.1) },
                },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Summary stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            border: `1px solid ${alpha('#2D3748', 0.4)}`,
            backgroundColor: alpha('#111827', 0.5),
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Results
            </Typography>
            <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.1rem' }}>
              {filteredResults.length.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Matching
            </Typography>
            <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.1rem' }}>
              {totalMatching.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Page
            </Typography>
            <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.1rem' }}>
              {page} / {pageCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Rank Column
            </Typography>
            <Typography sx={{ fontWeight: 700, color: '#818CF8', fontSize: '1.1rem', fontFamily: 'monospace' }}>
              {rankBy || '—'}
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default ExplorerPage;
