import React, { useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  CloudUpload,
  BarChart,
  CheckCircle,
  InsertDriveFile,
  CalendarToday,
  TableRows,
  Label,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useImportStore } from '../store/importStore';

const DropZone: React.FC<{
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  accept: Record<string, string[]>;
  onFile: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  accentColor: string;
}> = ({ label, subtitle, icon, accept, onFile, isLoading, error, onClearError, accentColor }) => {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) onFile(accepted[0]); },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: isLoading,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: `2px dashed ${isDragActive ? accentColor : alpha('#2D3748', 0.8)}`,
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        backgroundColor: isDragActive ? alpha(accentColor, 0.05) : alpha('#0A0E1A', 0.3),
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        '&:hover': {
          borderColor: alpha(accentColor, 0.6),
          backgroundColor: alpha(accentColor, 0.04),
        },
      }}
    >
      <input {...getInputProps()} />
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: isDragActive
            ? `linear-gradient(135deg, ${accentColor}33, ${accentColor}55)`
            : alpha('#2D3748', 0.5),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          '& svg': { fontSize: 28, color: isDragActive ? accentColor : '#64748B' },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, color: isDragActive ? accentColor : '#94A3B8', fontSize: '0.9rem' }}>
          {isDragActive ? 'Drop file here!' : label}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569' }}>
          {subtitle}
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" onClose={onClearError} sx={{ width: '100%', mt: 1, fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

const ImportPage: React.FC = () => {
  const {
    gaSession,
    ohlcvSession,
    importStatus,
    isLoadingGA,
    isLoadingOHLCV,
    errorGA,
    errorOHLCV,
    uploadGA,
    uploadOHLCV,
    fetchStatus,
    clearErrorGA,
    clearErrorOHLCV,
  } = useImportStore();

  useEffect(() => { fetchStatus(); }, []);

  const both = gaSession && ohlcvSession;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5 }}>
            Import Data
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Upload your GA optimization results and OHLCV historical price data to begin parameter exploration.
          </Typography>
        </Box>
      </motion.div>

      {/* Ready badge */}
      <AnimatePresence>
        {both && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert
              severity="success"
              icon={<CheckCircle />}
              sx={{ mb: 3, fontSize: '0.875rem' }}
            >
              <strong>Ready to Filter!</strong> Both datasets loaded successfully. Navigate to{' '}
              <strong>Filter Parameters</strong> to begin analysis.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={3}>
        {/* GA Results Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #6366F133, #6366F155)',
                      border: '1px solid #6366F133',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BarChart sx={{ fontSize: 18, color: '#818CF8' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.95rem' }}>
                      GA Results CSV
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Genetic algorithm optimization output
                    </Typography>
                  </Box>
                  {gaSession && (
                    <Chip label="Loaded" color="success" size="small" sx={{ ml: 'auto', height: 22 }} />
                  )}
                </Box>

                {isLoadingGA ? (
                  <Box sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 1 }} />
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                  </Box>
                ) : gaSession ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha('#10B981', 0.06),
                        border: `1px solid ${alpha('#10B981', 0.2)}`,
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <InsertDriveFile sx={{ fontSize: 16, color: '#10B981' }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#F1F5F9', wordBreak: 'break-all' }}>
                          {gaSession.filename}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TableRows sx={{ fontSize: 14, color: '#64748B' }} />
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {gaSession.row_count.toLocaleString()} rows
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Label sx={{ fontSize: 14, color: '#64748B' }} />
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {gaSession.columns.length} columns
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 80, overflow: 'auto' }}>
                        {gaSession.columns.slice(0, 15).map((col) => (
                          <Chip
                            key={col}
                            label={col}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'monospace' }}
                          />
                        ))}
                        {gaSession.columns.length > 15 && (
                          <Chip
                            label={`+${gaSession.columns.length - 15} more`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', color: '#64748B' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                ) : null}

                <DropZone
                  label={gaSession ? 'Re-upload GA Results' : 'Drop GA Results CSV'}
                  subtitle="CSV file from MetaTrader 4/5 GA optimizer"
                  icon={<CloudUpload />}
                  accept={{ 'text/csv': ['.csv'], 'text/plain': ['.txt'] }}
                  onFile={uploadGA}
                  isLoading={isLoadingGA}
                  error={errorGA}
                  onClearError={clearErrorGA}
                  accentColor="#6366F1"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* OHLCV Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: '24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #10B98133, #10B98155)',
                      border: '1px solid #10B98133',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BarChart sx={{ fontSize: 18, color: '#10B981' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '0.95rem' }}>
                      OHLCV Historical Data
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Price & volume historical series
                    </Typography>
                  </Box>
                  {ohlcvSession && (
                    <Chip label="Loaded" color="success" size="small" sx={{ ml: 'auto', height: 22 }} />
                  )}
                </Box>

                {isLoadingOHLCV ? (
                  <Box sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 1 }} />
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                  </Box>
                ) : ohlcvSession ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha('#10B981', 0.06),
                        border: `1px solid ${alpha('#10B981', 0.2)}`,
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <InsertDriveFile sx={{ fontSize: 16, color: '#10B981' }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#F1F5F9', wordBreak: 'break-all' }}>
                          {ohlcvSession.filename}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TableRows sx={{ fontSize: 14, color: '#64748B' }} />
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {ohlcvSession.row_count.toLocaleString()} bars
                          </Typography>
                        </Box>
                        {ohlcvSession.date_from && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 14, color: '#64748B' }} />
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              {new Date(ohlcvSession.date_from).toLocaleDateString()} – {new Date(ohlcvSession.date_to ?? '').toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                ) : null}

                <DropZone
                  label={ohlcvSession ? 'Re-upload OHLCV Data' : 'Drop OHLCV CSV'}
                  subtitle="OHLCV price data (date, open, high, low, close, volume)"
                  icon={<BarChart />}
                  accept={{ 'text/csv': ['.csv'], 'text/plain': ['.txt'] }}
                  onFile={uploadOHLCV}
                  isLoading={isLoadingOHLCV}
                  error={errorOHLCV}
                  onClearError={clearErrorOHLCV}
                  accentColor="#10B981"
                />
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Import Status from server */}
      {importStatus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: `1px solid ${alpha('#2D3748', 0.5)}`,
              backgroundColor: alpha('#111827', 0.5),
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mr: 1 }}>
              SERVER STATUS:
            </Typography>
            <Chip
              label={`GA: ${importStatus.ga_filename ?? 'None'}`}
              size="small"
              color={importStatus.ga_session_id ? 'success' : 'default'}
            />
            <Chip
              label={`OHLCV: ${importStatus.ohlcv_filename ?? 'None'}`}
              size="small"
              color={importStatus.ohlcv_session_id ? 'success' : 'default'}
            />
            <Chip
              label={importStatus.ready ? '✓ Ready' : 'Not Ready'}
              size="small"
              color={importStatus.ready ? 'success' : 'warning'}
            />
          </Box>
        </motion.div>
      )}
    </Box>
  );
};

export default ImportPage;
