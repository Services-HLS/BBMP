import { useMemo, useState } from 'react';
import {
  Alert, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Printer, Download } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import ChartCard from '../components/common/ChartCard';
import KpiCard from '../components/common/KpiCard';
import LoadingState from '../components/common/LoadingState';
import { useAppData } from '../context/AppDataContext';
import { exportTableCsv } from '../utils/csv';
import { todayISO } from '../utils/date';

export default function ReportsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, loading } = useAppData();
  const [corporationId, setCorporationId] = useState('');
  const [wardId, setWardId] = useState('');

  const report = useMemo(() => {
    if (!data) return null;
    let vehicles = data.vehicles;
    let complaints = data.complaints;
    let sweeping = data.sweepingStretches;
    let events = data.aiEvents;
    if (corporationId) {
      vehicles = vehicles.filter((v) => v.corporationId === corporationId);
      const wards = new Set(data.wards.filter((w) => w.corporationId === corporationId).map((w) => w.id));
      complaints = complaints.filter((c) => wards.has(c.wardId));
      sweeping = sweeping.filter((s) => wards.has(s.wardId));
      events = events.filter((e) => wards.has(e.wardId));
    }
    if (wardId) {
      vehicles = vehicles.filter((v) => v.wardId === wardId);
      complaints = complaints.filter((c) => c.wardId === wardId);
      sweeping = sweeping.filter((s) => s.wardId === wardId);
      events = events.filter((e) => e.wardId === wardId);
    }
    const coverage = vehicles.length
      ? Math.round(vehicles.reduce((s, v) => s + v.coveragePct, 0) / vehicles.length)
      : 0;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const dwcDone = data.dryWasteCentres.filter((d) => d.visitStatus === 'Completed').length;
    const chart = [
      { name: 'Coverage %', value: coverage },
      { name: 'Complaints open', value: complaints.filter((c) => c.status !== 'Resolved').length },
      { name: 'Complaints resolved', value: resolved },
      { name: 'Sweeping done', value: sweeping.filter((s) => s.status === 'Completed').length },
      { name: 'AI unresolved', value: events.filter((e) => !['Resolved', 'False Positive'].includes(e.status)).length },
      { name: 'DWC visits', value: dwcDone },
    ];
    return { vehicles, complaints, sweeping, events, coverage, resolved, dwcDone, chart };
  }, [data, corporationId, wardId]);

  if (loading || !data || !report) return <LoadingState />;

  return (
    <PageContainer className="print-friendly">
      <PageHeader
        title="Monthly / Operational Reports"
        subtitle="Client-side reports from the same sample dataset as dashboards."
        actions={
          <Stack direction="row" spacing={1} className="no-print">
            <Button
              startIcon={<Download size={16} />}
              variant="outlined"
              onClick={() => exportTableCsv(`bbmp-report-${todayISO()}.csv`, report.chart, [
                { header: 'Metric', accessor: 'name' },
                { header: 'Value', accessor: 'value' },
              ])}
            >
              Export CSV
            </Button>
            <Button startIcon={<Printer size={16} />} variant="contained" onClick={() => window.print()}>
              Print
            </Button>
          </Stack>
        }
      />
      <Alert severity="info" icon={false} className="no-print">
        Filters apply to demo records only. Use Print → Save as PDF for a PDF export.
      </Alert>

      <FilterBar className="no-print">
        <FormControl size="small">
          <InputLabel>Corporation</InputLabel>
          <Select label="Corporation" value={corporationId} onChange={(e) => setCorporationId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {data.corporations.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {data.wards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
        </FormControl>
      </FilterBar>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Avg coverage" value={`${report.coverage}%`} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Vehicles" value={report.vehicles.length} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Resolved complaints" value={report.resolved} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="DWC visits" value={report.dwcDone} /></Grid>
      </Grid>

      <ChartCard title="Operational summary" height={300}>
        <BarChart data={report.chart} margin={{ bottom: isMobile ? 48 : 8, left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: isMobile ? 9 : 11 }}
            interval={0}
            angle={isMobile ? -30 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 56 : 30}
          />
          <YAxis tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="value" fill="#12304A" name="Value" />
        </BarChart>
      </ChartCard>
    </PageContainer>
  );
}
