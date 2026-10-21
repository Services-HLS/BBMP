import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Typography, List, ListItem, ListItemText, Chip, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Truck, Route, Home, AlertTriangle, Recycle, MessageSquareWarning,
  Camera, Brush, Clock, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import KpiCard from '../components/common/KpiCard';
import StatusChip from '../components/common/StatusChip';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import SectionCard from '../components/common/SectionCard';
import ChartCard from '../components/common/ChartCard';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDateTime } from '../utils/date';
import { DATE_FILTERS, APP_ENV_LABEL } from '../constants';

const PIE_COLORS = ['#15966A', '#E9A23B', '#D94841', '#9AA5B1', '#2A6F97', '#12304A'];

export default function DashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, api, loading: storeLoading } = useAppData();
  const { user, isSupervisor } = useAuth();
  const { showToast } = useNotifications();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('daily');
  const [wardId, setWardId] = useState('');
  const [corporationId, setCorporationId] = useState('');

  const wards = useMemo(() => {
    let list = data?.wards || [];
    if (isSupervisor && user?.wardIds?.length) {
      const allowed = new Set(user.wardIds);
      list = list.filter((w) => allowed.has(w.id));
    }
    if (corporationId) list = list.filter((w) => w.corporationId === corporationId);
    return list;
  }, [data?.wards, corporationId, isSupervisor, user?.wardIds]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getDashboardStats({
        dateFilter,
        wardId: wardId || undefined,
        corporationId: corporationId || undefined,
      });
      setStats(result);
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storeLoading && data) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLoading, data, dateFilter, wardId, corporationId]);

  const wardColumns = useMemo(() => [
    { id: 'name', header: 'Ward', accessor: 'name' },
    {
      id: 'coverage',
      header: 'Coverage %',
      accessor: 'coverage',
      render: (r) => (
        <Typography variant="body2" fontWeight={700} color={r.coverage < 70 ? 'error.main' : 'text.primary'}>
          {r.coverage}%
        </Typography>
      ),
    },
    { id: 'vehicles', header: 'Autos', accessor: 'vehicles', align: 'right' },
    { id: 'openComplaints', header: 'Open', accessor: 'openComplaints', align: 'right' },
  ], []);

  if (storeLoading || (loading && !stats)) return <LoadingState label="Loading ward dashboard…" />;
  if (!stats) return null;

  const { kpis, charts, alerts, wardPerformance, recentActivity, meta } = stats;

  const kpiItems = [
    { title: 'Total Autos', value: kpis.totalAutos, subtitle: 'Sample fleet', icon: Truck, color: 'primary' },
    { title: 'On Route', value: kpis.autosOnRoute, subtitle: 'Simulated', icon: Route, color: 'success' },
    { title: 'Stops Done', value: kpis.stopsCompleted, subtitle: 'Demo stops', icon: Home, color: 'info' },
    { title: 'Coverage', value: `${kpis.householdCoverage}%`, subtitle: 'Sample %', icon: Home, color: 'secondary' },
    { title: 'Avg Route', value: `${kpis.avgRouteDuration}m`, subtitle: 'Illustrative', icon: Clock, color: 'warning' },
    { title: 'Speed Alerts', value: kpis.activeSpeedAlerts, subtitle: 'AI demo', icon: AlertTriangle, color: 'error' },
    { title: 'Sweeping', value: kpis.sweepingPointsCompleted, subtitle: 'Sample', icon: Brush, color: 'success' },
    { title: 'DWC Visits', value: kpis.dryWasteCentreVisits, subtitle: `${kpis.dwcPending} pending`, icon: Recycle, color: 'info' },
    { title: 'Complaints', value: kpis.openComplaints, subtitle: 'Open tickets', icon: MessageSquareWarning, color: 'warning' },
    { title: 'AI Events', value: kpis.unresolvedAiEvents, subtitle: 'Unresolved', icon: Camera, color: 'error' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Ward and fleet overview from sample data. Not connected to live BBMP vehicles or systems."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]}
        actions={(
          <Button
            startIcon={<RefreshCw size={15} />}
            variant="outlined"
            onClick={() => { load(); showToast('Dashboard refreshed', 'info'); }}
          >
            Refresh
          </Button>
        )}
      />

      <Alert severity="info" icon={false}>
        {APP_ENV_LABEL} · {meta?.demoRecordCounts?.vehicles || 0} demo autos loaded
        (proposal scale is larger — see Routes for headline figures).
      </Alert>

      <FilterBar>
        <FormControl>
          <InputLabel>Period</InputLabel>
          <Select label="Period" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            {DATE_FILTERS.map((f) => (
              <MenuItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Corporation</InputLabel>
          <Select
            label="Corporation"
            value={corporationId}
            onChange={(e) => { setCorporationId(e.target.value); setWardId(''); }}
          >
            <MenuItem value="">All</MenuItem>
            {(data?.corporations || []).map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {wards.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <Grid container spacing={1.5}>
        {kpiItems.map((k) => (
          <Grid key={k.title} size={{ xs: 6, sm: 4, md: 2.4 }}>
            <KpiCard {...k} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Coverage trend" subtitle={`Simulated ${dateFilter} series`}>
            <LineChart data={charts.coverageTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="coverage" name="Coverage %" stroke="#15966A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completion" name="Completion %" stroke="#12304A" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Complaints by category" subtitle="From demo complaint records">
            {charts.complaintsByCategory?.length ? (
              <BarChart data={charts.complaintsByCategory} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={isMobile ? 72 : 110}
                  tick={{ fontSize: isMobile ? 9 : 10 }}
                  tickFormatter={(v) => (isMobile && String(v).length > 12 ? `${String(v).slice(0, 11)}…` : v)}
                />
                <Tooltip />
                <Bar dataKey="value" name="Complaints" fill="#2A6F97" radius={[0, 4, 4, 0]} />
              </BarChart>
            ) : (
              <EmptyState title="No category data" />
            )}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="Vehicle status" subtitle="Simulated fleet distribution" height={240}>
            <PieChart>
              <Pie data={charts.vehicleStatus} dataKey="value" nameKey="name" outerRadius={78} innerRadius={36}>
                {(charts.vehicleStatus || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title="Route performance" subtitle="Coverage by demo route" height={240}>
            <BarChart data={charts.routePerformance} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 11 }} width={32} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="coverage" fill="#15966A" name="Coverage %" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Operational alerts" subtitle="Sample / simulated">
            <List dense disablePadding sx={{ maxHeight: 320, overflow: 'auto', mx: -0.5 }}>
              {(alerts || []).slice(0, 10).map((a) => (
                <ListItem key={a.id} divider alignItems="flex-start" sx={{ px: 0.5, py: 1 }}>
                  <ListItemText
                    primary={(
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <StatusChip status={a.severity} />
                        <Typography variant="body2" fontWeight={700}>{a.type}</Typography>
                      </Stack>
                    )}
                    secondary={a.message}
                    secondaryTypographyProps={{ sx: { mt: 0.35 } }}
                  />
                </ListItem>
              ))}
              {!alerts?.length && <EmptyState title="No alerts" description="No simulated alerts for current filters." />}
            </List>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Recent activity" subtitle="Audit trail from demo actions">
            <List dense disablePadding sx={{ maxHeight: 320, overflow: 'auto', mx: -0.5 }}>
              {(recentActivity || []).map((a) => (
                <ListItem key={a.id} divider sx={{ px: 0.5, py: 1 }} alignItems="flex-start">
                  <ListItemText
                    primary={(
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={a.action} variant="outlined" />
                        <Typography variant="caption" color="text.secondary">{formatDateTime(a.at)}</Typography>
                      </Stack>
                    )}
                    secondary={`${a.actor}${a.detail ? ` — ${a.detail}` : ''}`}
                    secondaryTypographyProps={{ sx: { mt: 0.35 } }}
                  />
                </ListItem>
              ))}
              {!recentActivity?.length && <EmptyState title="No activity yet" />}
            </List>
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        title="Ward performance"
        subtitle="Coverage and open complaints from demo vehicle / complaint sets"
        noPadding
      >
        <Box sx={{ px: 0, pb: 0 }}>
          <DataTable
            columns={wardColumns}
            rows={wardPerformance || []}
            rowKey="wardId"
            searchable
            searchPlaceholder="Search wards…"
            emptyTitle="No ward performance rows"
          />
        </Box>
      </SectionCard>
    </PageContainer>
  );
}
