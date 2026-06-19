import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Alert,
  Skeleton, alpha, Button, Divider, List, ListItemButton,
  ListItemText, ListItemSecondaryAction, Collapse, Tooltip,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  CloudUpload, BarChart, CheckCircle, InsertDriveFile,
  CalendarToday, TableRows, Label, History, Add,
  AccessTime, DeleteOutline,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useImportStore } from '../store/importStore';
import { apiClient } from '../api/client';

interface SessionListItem {
  id: string;
  filename: string;
  row_count: number;
  created_at: string;
  expires_at: string;
}

const ExpiryChip: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const days = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
  const color = days <= 1 ? 'error' : days <= 3 ? 'warning' : 'default';
  return (
    <Tooltip title={`Auto-deletes ${new Date(expiresAt).toLocaleDateString()}`}>
      <Chip
        icon={<AccessTime sx={{ fontSize: '11px !important' }} />}
        label={`${days}d left`}
        size="small"
        color={color}
        sx={{ height: 20, fontSize: '0.65rem' }}
      />
    </Tooltip>
  );
};

const SessionHistory: React.FC<{
  type: 'ga' | 'ohlcv';
  accentColor: string;
  onSelect: (id: string) => void;
}> = ({ type, accentColor, onSelect }) => {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/import/sessions/${type}`)
      .then(r => setSessions(r.data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) return <Skeleton height={40} sx={{ borderRadius: 1 }} />;
  if (!sessions.length) return (
    <Typography variant="caption" sx={{ color: '#475569', display: 'block', textAlign: 'center', py: 1 }}>
      No previous sessions found
    </Typography>
  );

  return (
    <List dense disablePadding>
      {sessions.map(s => (
        <ListItemButton
          key={s.id}
          onClick={() => onSelect(s.id)}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            border: `1px solid ${alpha('#2D3748', 0.6)}`,
            '&:hover': { borderColor: alpha(accentColor, 0.4), backgroundColor: alpha(accentColor, 0.04) },
          }}
        >
          <InsertDriveFile sx={{ fontSize: 16, color: accentColor, mr: 1.5, flexShrink: 0 }} />
          <ListItemText
            primary={
              <Typography sx={{ fontSize: '0.8rem', color: '#F1F5F9', fontWeight: 500 }} noWrap>
                {s.filename}
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {s.row_count.toLocaleString()} rows · {new Date(s.created_at).toLocaleDateString()}
              </Typography>
            }
          />
          <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ExpiryChip expiresAt={s.expires_at} />
          </ListItemSecondaryAction>
        </ListItemButton>
      ))}
    </List>
  );
};

const DropZone: React.FC<{
  label: string; subtitle: string; icon: React.ReactNode;
  accept: Record<string, string[]>; onFile: (file: File) => void;
  isLoading: boolean; error: string | null; onClearError: () => void;
  accentColor: string;
}> = ({ label, subtitle, icon, accept, onFile, isLoading, error, onClearError, accentColor }) => {
  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) onFile(accepted[0]); }, [onFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple: false, disabled: isLoading });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: `2px dashed ${isDragActive ? accentColor : alpha('#2D3748', 0.8)}`,
        borderRadius: 2, p: { xs: 2.5, sm: 4 }, textAlign: 'center',
        cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        backgroundColor: isDragActive ? alpha(accentColor, 0.05) : alpha('#0A0E1A', 0.3),
        minHeight: { xs: 140, sm: 180 },
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5,
        '&:hover': { borderColor: alpha(accentColor, 0.6), backgroundColor: alpha(accentColor, 0.04) },
      }}
    >
      <input {...getInputProps()} />
      <Box sx={{
        width: { xs: 44, sm: 56 }, height: { xs: 44, sm: 56 },
        borderRadius: '14px',
        background: isDragActive ? `linear-gradient(135deg, ${accentColor}33, ${accentColor}55)` : alpha('#2D3748', 0.5),
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        '& svg': { fontSize: { xs: 22, sm: 28 }, color: isDragActive ? accentColor : '#64748B' },
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, color: isDragActive ? accentColor : '#94A3B8', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          {isDragActive ? 'Drop file here!' : label}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
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

const DataCard: React.FC<{
  title: string; subtitle: string; icon: React.ReactNode;
  accentColor: string; gradientFrom: string; gradientTo: string;
  isLoaded: boolean; isLoading: boolean;
  session: any; error: string | null;
  historyType: 'ga' | 'ohlcv';
  onFile: (file: File) => void;
  onClearError: () => void;
  onSelectSession: (id: string) => void;
  accept: Record<string, string[]>;
  dropLabel: string; dropSubtitle: string; dropIcon: React.ReactNode;
}> = (props) => {
  const [showHistory, setShowHistory] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: '16px !important', sm: '24px !important' } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{
            width: { xs: 30, sm: 36 }, height: { xs: 30, sm: 36 }, borderRadius: '9px',
            background: `linear-gradient(135deg, ${props.gradientFrom}, ${props.gradientTo})`,
            border: `1px solid ${props.gradientFrom}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {props.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: { xs: '0.85rem', sm: '0.95rem' } }} noWrap>
              {props.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
              {props.subtitle}
            </Typography>
          </Box>
          {props.isLoaded && (
            <Chip label="Loaded" color="success" size="small" sx={{ height: 22, flexShrink: 0 }} />
          )}
        </Box>

        {/* Loaded session info */}
        {props.isLoading ? (
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 1 }} />
            <Skeleton width="60%" />
          </Box>
        ) : props.session ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{
              p: { xs: 1.5, sm: 2 }, borderRadius: 2,
              backgroundColor: alpha('#10B981', 0.06),
              border: `1px solid ${alpha('#10B981', 0.2)}`,
              mb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle sx={{ fontSize: 14, color: '#10B981', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#F1F5F9', wordBreak: 'break-all' }}>
                  {props.session.filename}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TableRows sx={{ fontSize: 13, color: '#64748B' }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    {props.session.row_count?.toLocaleString()} rows
                  </Typography>
                </Box>
                {props.session.date_from && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 13, color: '#64748B' }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      {new Date(props.session.date_from).toLocaleDateString()} – {new Date(props.session.date_to ?? '').toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </motion.div>
        ) : null}

        {/* History toggle */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Button
            size="small"
            startIcon={<History sx={{ fontSize: '14px !important' }} />}
            onClick={() => setShowHistory(!showHistory)}
            sx={{
              fontSize: '0.75rem', color: '#64748B', textTransform: 'none',
              '&:hover': { color: props.accentColor },
            }}
          >
            {showHistory ? 'Hide history' : 'Select previous session'}
          </Button>
          {props.isLoaded && (
            <Button
              size="small"
              startIcon={<Add sx={{ fontSize: '14px !important' }} />}
              sx={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'none', ml: 'auto' }}
            >
              Upload new
            </Button>
          )}
        </Box>

        {/* Session history list */}
        <Collapse in={showHistory}>
          <Box sx={{ mb: 2, maxHeight: 220, overflowY: 'auto' }}>
            <SessionHistory
              type={props.historyType}
              accentColor={props.accentColor}
              onSelect={(id) => { props.onSelectSession(id); setShowHistory(false); }}
            />
          </Box>
          <Divider sx={{ mb: 2, borderColor: alpha('#2D3748', 0.5) }} />
        </Collapse>

        {/* Drop zone */}
        <DropZone
          label={props.dropLabel}
          subtitle={props.dropSubtitle}
          icon={props.dropIcon}
          accept={props.accept}
          onFile={props.onFile}
          isLoading={props.isLoading}
          error={props.error}
          onClearError={props.onClearError}
          accentColor={props.accentColor}
        />

        {/* Auto-delete notice */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          <DeleteOutline sx={{ fontSize: 12, color: '#475569' }} />
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
            Uploaded data is automatically deleted after 7 days
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const ImportPage: React.FC = () => {
  const {
    gaSession, ohlcvSession, importStatus, isLoadingGA, isLoadingOHLCV,
    errorGA, errorOHLCV, uploadGA, uploadOHLCV, fetchStatus, clearErrorGA, clearErrorOHLCV,
    setGASession, setOHLCVSession,
  } = useImportStore();

  useEffect(() => { fetchStatus(); }, []);

  const handleSelectGA = async (id: string) => {
    try {
      const res = await apiClient.post(`/import/select/ga?session_id=${id}`);
      setGASession(res.data);
    } catch (e) { console.error(e); }
  };

  const handleSelectOHLCV = async (id: string) => {
    try {
      const res = await apiClient.post(`/import/select/ohlcv?session_id=${id}`);
      setOHLCVSession(res.data);
    } catch (e) { console.error(e); }
  };

  const both = gaSession && ohlcvSession;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 0, sm: 1 } }}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>
            Import Data
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Upload or select a previous session to begin parameter exploration.
          </Typography>
        </Box>
      </motion.div>

      <AnimatePresence>
        {both && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              <strong>Ready to Filter!</strong> Both datasets loaded. Navigate to <strong>Filter Parameters</strong>.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <DataCard
              title="GA Results CSV"
              subtitle="Genetic algorithm optimization output"
              icon={<BarChart sx={{ fontSize: { xs: 15, sm: 18 }, color: '#818CF8' }} />}
              accentColor="#6366F1"
              gradientFrom="#6366F133"
              gradientTo="#6366F155"
              isLoaded={!!gaSession}
              isLoading={isLoadingGA}
              session={gaSession}
              error={errorGA}
              historyType="ga"
              onFile={uploadGA}
              onClearError={clearErrorGA}
              onSelectSession={handleSelectGA}
              accept={{ 'text/csv': ['.csv'], 'text/plain': ['.txt'] }}
              dropLabel={gaSession ? 'Re-upload GA Results' : 'Drop GA Results CSV'}
              dropSubtitle="CSV file from MetaTrader 4/5 GA optimizer"
              dropIcon={<CloudUpload />}
            />
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <DataCard
              title="OHLCV Historical Data"
              subtitle="Price & volume historical series"
              icon={<BarChart sx={{ fontSize: { xs: 15, sm: 18 }, color: '#10B981' }} />}
              accentColor="#10B981"
              gradientFrom="#10B98133"
              gradientTo="#10B98155"
              isLoaded={!!ohlcvSession}
              isLoading={isLoadingOHLCV}
              session={ohlcvSession}
              error={errorOHLCV}
              historyType="ohlcv"
              onFile={uploadOHLCV}
              onClearError={clearErrorOHLCV}
              onSelectSession={handleSelectOHLCV}
              accept={{ 'text/csv': ['.csv'], 'text/plain': ['.txt'] }}
              dropLabel={ohlcvSession ? 'Re-upload OHLCV Data' : 'Drop OHLCV CSV'}
              dropSubtitle="OHLCV price data (date, open, high, low, close, volume)"
              dropIcon={<BarChart />}
            />
          </motion.div>
        </Grid>
      </Grid>

      {importStatus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Box sx={{
            mt: 3, p: { xs: 1.5, sm: 2 }, borderRadius: 2,
            border: `1px solid ${alpha('#2D3748', 0.5)}`,
            backgroundColor: alpha('#111827', 0.5),
            display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
          }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>SERVER:</Typography>
            <Chip label={`GA: ${importStatus.ga_filename ?? 'None'}`} size="small" color={importStatus.ga_session_id ? 'success' : 'default'} />
            <Chip label={`OHLCV: ${importStatus.ohlcv_filename ?? 'None'}`} size="small" color={importStatus.ohlcv_session_id ? 'success' : 'default'} />
            <Chip label={importStatus.ready ? '✓ Ready' : 'Not Ready'} size="small" color={importStatus.ready ? 'success' : 'warning'} />
          </Box>
        </motion.div>
      )}
    </Box>
  );
};

export default ImportPage;
