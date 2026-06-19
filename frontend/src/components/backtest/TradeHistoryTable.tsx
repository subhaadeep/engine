import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Chip, Typography, alpha,
} from '@mui/material';
import type { Trade } from '../../types';

interface Props {
  trades: Trade[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

const TradeHistoryTable: React.FC<Props> = ({ trades, total, page, onPageChange }) => {
  const cellSx = { fontSize: { xs: '0.7rem', sm: '0.8rem' }, py: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 2 }, color: '#94A3B8', borderColor: alpha('#2D3748', 0.4) };
  const headSx = { ...cellSx, color: '#64748B', fontWeight: 600, backgroundColor: alpha('#111827', 0.8) };

  return (
    <Box>
      <TableContainer sx={{ maxHeight: { xs: 320, sm: 440 } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {['#', 'Entry Date', 'Exit Date', 'Direction', 'Entry $', 'Exit $', 'Profit', 'Balance'].map(h => (
                <TableCell key={h} sx={headSx}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((t) => (
              <TableRow key={t.id} hover sx={{ '&:hover': { backgroundColor: alpha('#6366F1', 0.04) } }}>
                <TableCell sx={cellSx}>{t.trade_no}</TableCell>
                <TableCell sx={cellSx}>{new Date(t.entry_date).toLocaleDateString()}</TableCell>
                <TableCell sx={cellSx}>{new Date(t.exit_date).toLocaleDateString()}</TableCell>
                <TableCell sx={cellSx}>
                  <Chip
                    label={t.direction}
                    size="small"
                    color={t.direction === 'long' ? 'success' : 'error'}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell sx={cellSx}>{t.entry_price.toFixed(4)}</TableCell>
                <TableCell sx={cellSx}>{t.exit_price.toFixed(4)}</TableCell>
                <TableCell sx={{ ...cellSx, color: t.profit >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                  {t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}
                </TableCell>
                <TableCell sx={{ ...cellSx, fontFamily: 'monospace' }}>{t.balance.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={50}
        rowsPerPageOptions={[50]}
        onPageChange={(_, p) => onPageChange(p)}
        sx={{ '& .MuiTablePagination-displayedRows': { fontSize: '0.75rem', color: '#64748B' } }}
      />
    </Box>
  );
};

export default TradeHistoryTable;
