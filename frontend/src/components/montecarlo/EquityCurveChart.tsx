import React, { useEffect, useRef } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import Plotly from 'plotly.js-dist-min';
import type { MCResults } from '../../types';

interface Props { results: MCResults; }

const EquityCurveChart: React.FC<Props> = ({ results }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !results?.equity_curves_sample) return;
    const curves = results.equity_curves_sample;

    const traces: Plotly.Data[] = curves.slice(0, 50).map((curve, i) => ({
      y: curve,
      type: 'scatter',
      mode: 'lines',
      line: { color: `rgba(99,102,241,${0.08 + (i / curves.length) * 0.15})`, width: 1 },
      showlegend: false,
      hoverinfo: 'skip',
    }));

    const layout: Partial<Plotly.Layout> = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(10,14,26,0.5)',
      height: 280,
      margin: { t: 10, r: 15, b: 45, l: 60 },
      font: { family: 'Inter, sans-serif' },
      xaxis: { gridcolor: alpha('#2D3748', 0.4), color: '#64748B', tickfont: { color: '#64748B', size: 10 }, title: { text: 'Trade #', font: { color: '#64748B', size: 11 } } },
      yaxis: { gridcolor: alpha('#2D3748', 0.4), color: '#64748B', tickfont: { color: '#64748B', size: 10 }, title: { text: 'Balance ($)', font: { color: '#64748B', size: 11 } }, tickformat: ',.0f' },
    };

    Plotly.newPlot(chartRef.current, traces, layout, { displayModeBar: false, responsive: true });
    return () => { if (chartRef.current) Plotly.purge(chartRef.current); };
  }, [results]);

  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha('#2D3748', 0.5)}`, backgroundColor: alpha('#111827', 0.7), p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 1 }}>
        Equity Curve Simulations ({results.equity_curves_sample?.length ?? 0} paths shown)
      </Typography>
      <Box ref={chartRef} />
    </Box>
  );
};

export default EquityCurveChart;
