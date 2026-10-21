import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem,
  Select, Stack, Typography, Drawer, Divider,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import SectionCard from '../components/common/SectionCard';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { todayISO } from '../utils/date';
import { monthlyScoreFromDaily } from '../utils/scoring';
import { exportTableCsv } from '../utils/csv';

export default function ScorecardsPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [wardId, setWardId] = useState('');
  const [selected, setSelected] = useState(null);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const todayScores = useMemo(() => {
    const date = todayISO();
    let list = (data?.dailyScores || []).filter((s) => s.date === date);
    if (wardId) list = list.filter((s) => s.wardId === wardId);
    return list.map((s) => ({
      ...s,
      vehicle: data.vehicles.find((v) => v.id === s.vehicleId),
    }));
  }, [data, wardId]);

  const monthlyTrend = useMemo(() => {
    const byDate = {};
    (data?.dailyScores || []).forEach((s) => {
      if (wardId && s.wardId !== wardId) return;
      byDate[s.date] = byDate[s.date] || [];
      byDate[s.date].push(s.total);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5),
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }));
  }, [data, wardId]);

  const wardComparison = useMemo(() => {
    const date = todayISO();
    return (data?.wards || []).map((w) => {
      const scores = (data?.dailyScores || []).filter((s) => s.wardId === w.id && s.date === date);
      const avg = scores.length
        ? Math.round(scores.reduce((sum, s) => sum + s.total, 0) / scores.length)
        : 0;
      return { id: w.id, name: w.name, vehicles: scores.length, average: avg };
    }).sort((a, b) => b.average - a.average);
  }, [data]);

  if (loading || !data) return <LoadingState />;

  const weights = data.scoreConfig?.weights || {};

  const columns = [
    { header: 'Vehicle', accessor: (r) => r.vehicle?.displayName || r.vehicleId },
    { header: 'Score', accessor: 'total' },
    { header: 'Band', accessor: 'band' },
    { header: 'Stops', accessor: (r) => `${r.components?.stopsVsNormal?.earned}/${r.components?.stopsVsNormal?.max}` },
    { header: 'Houses', accessor: (r) => `${r.components?.housesCovered?.earned}/${r.components?.housesCovered?.max}` },
    { header: 'DWC', accessor: (r) => `${r.components?.dryWasteCentreVisit?.earned}/${r.components?.dryWasteCentreVisit?.max}` },
    {
      header: 'Mode',
      render: (r) => (r.shadowRun || data.scoreConfig?.shadowRunMode
        ? <Chip size="small" color="warning" label="Shadow-run" />
        : <Chip size="small" label="Live" />),
    },
  ];

  const wardColumns = [
    { header: 'Ward', accessor: 'name' },
    { header: 'Autos scored', accessor: 'vehicles' },
    { header: 'Avg score', accessor: 'average' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Performance Scorecards"
        subtitle="Proposed 100-point daily scoring model for demonstration — not approved BBMP payment policy."
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {data.scoreConfig?.shadowRunMode && (
              <Chip color="warning" label={`Shadow-run · ${data.scoreConfig?.shadowRunMonths || 2} mo`} />
            )}
            <Button
              variant="outlined"
              onClick={() => exportTableCsv(`scores-${todayISO()}.csv`, todayScores, [
                { header: 'Vehicle', accessor: (r) => r.vehicle?.autoId },
                { header: 'Score', accessor: 'total' },
                { header: 'Band', accessor: 'band' },
              ])}
            >
              Export CSV
            </Button>
          </Stack>
        }
      />
      <Alert severity="info" icon={false}>
        Demo scoring only — not BBMP payment policy. Shadow-run {data.scoreConfig?.shadowRunMode ? 'ON' : 'OFF'} · Bands: 85–100 full · 70–84 reduced · &lt;70 review.
      </Alert>

      <SectionCard title="100-point model weights">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {Object.entries(weights).map(([key, value]) => (
            <Chip key={key} label={`${key}: ${value}`} variant="outlined" />
          ))}
        </Stack>
      </SectionCard>

      <FilterBar>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {data.wards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
        </FormControl>
      </FilterBar>

      <ChartCard title="Monthly trend" subtitle="From daily averages" height={260}>
        <LineChart data={monthlyTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="avg" name="Avg score" stroke="#12304A" strokeWidth={2} />
        </LineChart>
      </ChartCard>

      <SectionCard title="Daily scores">
        <DataTable columns={columns} rows={todayScores} onRowClick={setSelected} searchPlaceholder="Search scores…" />
      </SectionCard>

      <SectionCard title="Ward comparison (today)">
        <DataTable columns={wardColumns} rows={wardComparison} searchable={false} emptyTitle="No ward scores" />
      </SectionCard>

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        {selected && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">{selected.vehicle?.displayName}</Typography>
            <Chip label={`${selected.total}/100`} color="primary" sx={{ mr: 1 }} />
            <Chip label={selected.band} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>Monthly from daily: {monthlyScoreFromDaily((data.dailyScores || []).filter((s) => s.vehicleId === selected.vehicleId))?.average ?? '—'}</Typography>
            <Divider sx={{ my: 2 }} />
            {Object.entries(selected.components || {}).map(([key, c]) => (
              <Box key={key} sx={{ mb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>{key}</Typography>
                  <Typography variant="body2">{c.earned}/{c.max}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">{JSON.stringify(c.input)}</Typography>
              </Box>
            ))}
            <Button sx={{ mt: 2 }} variant="outlined" onClick={() => setCorrectOpen(true)}>Record exception / correction</Button>
          </Box>
        )}
      </Drawer>

      <ConfirmDialog
        open={correctOpen}
        title="Correct score (demo)"
        message={
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">Applies a demo correction boosting device uptime to 100% and logs your reason.</Typography>
            <input
              style={{ padding: 8, width: '100%' }}
              placeholder="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Stack>
        }
        onCancel={() => setCorrectOpen(false)}
        onConfirm={async () => {
          if (!reason.trim()) { showToast('Reason required', 'warning'); return; }
          await api.correctScore(selected.id, reason, { deviceUptimePct: 100 }, user?.name);
          showToast('Score corrected with audit');
          setCorrectOpen(false);
          setReason('');
        }}
      />
    </PageContainer>
  );
}
