import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  LinearProgress,
  Skeleton,
  alpha,
} from '@mui/material';
import { FilterList, East, ErrorOutline, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../store/filterStore';
import { useImportStore } from '../store/importStore';
import FilterTable from '../components/filter/FilterTable';
import TopNSelector from '../components/filter/TopNSelector';

const FilterPage: React.FC = () => {
  const navigate = useNavigate();
  const { gaSession } = useImportStore();
  const {
    columnRanges,
    filteredResults,
    totalMatching,
    isLoadingRanges,
    isLoadingFilter,
    errorRanges,
    errorFilter,
    fetchColumnRanges,
    applyFilters,
    clearResults,
  } = useFilterStore();

  useEffect(() => {
    if (gaSession?.id && columnRanges.length === 0) {
      fetchColumnRanges(gaSession.id);
    }
  }, [gaSession?.id]);

  const handleApply = async () => {
    if (!gaSession?.id) return;
    await applyFilters(gaSession.id);
  };

  const hasResults = filteredResults.length > 0;

  if (!gaSession) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 48, color: '#2D3748', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#94A3B8', mb: 1 }}>
          No GA Data Loaded
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
          Please import GA optimization results first.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/import')}>
          Go to Import
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9' }}>
                Filter Parameters
              </Typography>
              <Chip
                label={`${gaSession.row_count.toLocaleString()} rows`}
                size="small"
                color="primary"
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Session: <Box component="span" sx={{ color: '#818CF8', fontFamily: 'monospace' }}>{gaSession.filename}</Box>
              {' · '}{gaSession.columns.length} parameters available
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {hasResults && (
              <Chip
                label={`${filteredResults.length} results · ${totalMatching.toLocaleString()} matching`}
                color="success"
                icon={<FilterList />}
                sx={{ height: 28 }}
              />
            )}
            {isLoadingRanges && (
              <Button size="small" variant="outlined" disabled startIcon={<Refresh />}>
                Loading...
              </Button>
            )}
            {!isLoadingRanges && gaSession?.id && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => fetchColumnRanges(gaSession.id)}
              >
                Reload Ranges
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Errors */}
      {(errorRanges || errorFilter) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorRanges || errorFilter}
        </Alert>
      )}

      {/* Loading skeleton */}
      {isLoadingRanges ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {/* Filter Table */}
          <FilterTable />

          {/* TopN + Ranking Config */}
          <Box sx={{ mt: 2 }}>
            <TopNSelector />
          </Box>

          {/* Apply + Navigate */}
          <Box
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha('#1A2236', 0.9)} 0%, ${alpha('#111827', 0.8)} 100%)`,
              border: `1px solid ${alpha('#2D3748', 0.5)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={
                isLoadingFilter ? (
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
                  <FilterList />
                )
              }
              disabled={isLoadingFilter}
              onClick={handleApply}
              sx={{ px: 3 }}
            >
              {isLoadingFilter ? 'Applying Filters...' : 'Apply Filters'}
            </Button>

            {isLoadingFilter && (
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <LinearProgress sx={{ borderRadius: 1 }} />
              </Box>
            )}

            {hasResults && !isLoadingFilter && (
              <>
                <Box
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: '8px',
                    backgroundColor: alpha('#10B981', 0.1),
                    border: `1px solid ${alpha('#10B981', 0.25)}`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                    ✓ {filteredResults.length} results found · {totalMatching.toLocaleString()} rows matched filters
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="large"
                  endIcon={<East />}
                  onClick={() => navigate('/explorer')}
                >
                  View in Explorer
                </Button>
              </>
            )}

            {!hasResults && !isLoadingFilter && columnRanges.length > 0 && (
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Configure filters above and click Apply to see results
              </Typography>
            )}
          </Box>
        </motion.div>
      )}
    </Box>
  );
};

export default FilterPage;
