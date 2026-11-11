import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Typography, Drawer, Divider,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import SectionCard from '../components/common/SectionCard';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MapView from '../components/maps/MapView';
import KpiCard from '../components/common/KpiCard';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import useOpsScope from '../hooks/useOpsScope';
import { todayISO } from '../utils/date';
import { monthlyScoreFromDaily } from '../utils/scoring';
import { exportTableCsv } from '../utils/csv';

const BAND_COLORS = {
  full: '#15966A',
  reduced: '#E9A23B',
  review: '#D94841',
  other: '#9AA5B1',
};

const PIE_COLORS = ['#15966A', '#E9A23B', '#D94841', '#2A6F97', '#12304A'];

function bandKey(band = '') {
  const b = String(band).toLowerCase();
  if (b.includes('full') || b.includes('85')) return 'full';
  if (b.includes('reduced') || b.includes('70')) return 'reduced';
  if (b.includes('review') || b.includes('<70') || b.includes('below')) return 'review';
  return 'other';
}

function scoreColor(total) {
  if (total >= 85) return BAND_COLORS.full;
  if (total >= 70) return BAND_COLORS.reduced;
  return BAND_COLORS.review;
}

export default function ScorecardsPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { filterByWard, scopeWards, scopeBlocks, isScoped, scopeLabel } = useOpsScope();
  const [wardId, setWardId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [selected, setSelected] = useState(null);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [mapFocus, setMapFocus] = useState(null);

  const wards = useMemo(() => scopeWards(data?.wards || []), [data?.wards, scopeWards]);
  const blocks = useMemo(() => scopeBlocks(data?.blocks || []), [data?.blocks, scopeBlocks]);
  const households = useMemo(() => filterByWard(data?.households || []), [data?.households, filterByWard]);
  const vehicles = useMemo(() => filterByWard(data?.vehicles || []), [data?.vehicles, filterByWard]);
  const scopedScores = useMemo(() => filterByWard(data?.dailyScores || []), [data?.dailyScores, filterByWard]);

  const wardName = (id) => wards.find((w) => w.id === id)?.name || id || '—';
  const blockLabel = (id) => {
    const b = blocks.find((x) => x.id === id);
    return b ? (b.code || b.name) : (id || '—');
  };
  const houseLabel = (hh) => (hh ? `Door ${hh.doorNo} · ${hh.street}` : '—');

  const filterBlocks = useMemo(() => {
    if (!wardId) return blocks;
    return blocks.filter((b) => b.wardId === wardId);
  }, [blocks, wardId]);

  const filterHouses = useMemo(() => {
    let list = households;
    if (blockId) list = list.filter((h) => h.blockId === blockId);
    else if (wardId) list = list.filter((h) => h.wardId === wardId);
    return list;
  }, [households, wardId, blockId]);

  const activeBlockId = useMemo(() => {
    if (blockId) return blockId;
    if (householdId) return households.find((h) => h.id === householdId)?.blockId || '';
    return '';
  }, [blockId, householdId, households]);

  const todayScores = useMemo(() => {
    const date = todayISO();
    let list = scopedScores.filter((s) => s.date === date);
    if (wardId) list = list.filter((s) => s.wardId === wardId);
    if (activeBlockId) list = list.filter((s) => s.blockId === activeBlockId);
    return list.map((s) => ({
      ...s,
      vehicle: vehicles.find((v) => v.id === s.vehicleId),
      block: blocks.find((b) => b.id === s.blockId),
    }));
  }, [scopedScores, wardId, activeBlockId, vehicles, blocks]);

  const monthlyTrend = useMemo(() => {
    const byDate = {};
    scopedScores.forEach((s) => {
      if (wardId && s.wardId !== wardId) return;
      if (activeBlockId && s.blockId !== activeBlockId) return;
      byDate[s.date] = byDate[s.date] || [];
      byDate[s.date].push(s.total);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5),
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }));
  }, [scopedScores, wardId, activeBlockId]);

  const bandDistribution = useMemo(() => {
    const counts = { full: 0, reduced: 0, review: 0, other: 0 };
    todayScores.forEach((s) => {
      counts[bandKey(s.band)] += 1;
    });
    return [
      { name: 'Full (85–100)', value: counts.full, key: 'full' },
      { name: 'Reduced (70–84)', value: counts.reduced, key: 'reduced' },
      { name: 'Review (<70)', value: counts.review, key: 'review' },
    ].filter((d) => d.value > 0);
  }, [todayScores]);

  const componentAverages = useMemo(() => {
    if (!todayScores.length) return [];
    const keys = Object.keys(todayScores[0]?.components || {});
    return keys.map((key) => {
      const vals = todayScores
        .map((s) => s.components?.[key])
        .filter(Boolean);
      const earned = vals.reduce((a, c) => a + (c.earned || 0), 0) / vals.length;
      const max = vals[0]?.max || 0;
      return {
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).slice(0, 18),
        key,
        earned: Math.round(earned * 10) / 10,
        max,
        pct: max ? Math.round((earned / max) * 100) : 0,
      };
    });
  }, [todayScores]);

  const wardComparison = useMemo(() => {
    const date = todayISO();
    let list = wards;
    if (wardId) list = list.filter((w) => w.id === wardId);
    return list.map((w) => {
      let scores = scopedScores.filter((s) => s.wardId === w.id && s.date === date);
      if (activeBlockId) scores = scores.filter((s) => s.blockId === activeBlockId);
      const avg = scores.length
        ? Math.round(scores.reduce((sum, s) => sum + s.total, 0) / scores.length)
        : 0;
      return {
        id: w.id,
        name: w.name.replace('Ward ', 'W'),
        fullName: w.name,
        vehicles: scores.length,
        average: avg,
        lat: w.lat,
        lng: w.lng,
      };
    }).sort((a, b) => b.average - a.average);
  }, [scopedScores, wards, wardId, activeBlockId]);

  const blockComparison = useMemo(() => {
    const date = todayISO();
    return filterBlocks.map((b) => {
      const scores = scopedScores.filter((s) => s.blockId === b.id && s.date === date);
      const avg = scores.length
        ? Math.round(scores.reduce((sum, s) => sum + s.total, 0) / scores.length)
        : 0;
      const vehicle = vehicles.find((v) => v.blockId === b.id);
      const ward = wards.find((w) => w.id === b.wardId);
      return {
        id: b.id,
        name: b.code || b.name,
        wardId: b.wardId,
        vehicles: scores.length,
        average: avg,
        houses: b.households,
        lat: vehicle?.lat ?? ward?.lat,
        lng: vehicle?.lng ?? ward?.lng,
      };
    }).sort((a, b) => b.average - a.average);
  }, [scopedScores, filterBlocks, vehicles, wards]);

  const houseCoverageRows = useMemo(() => {
    let list = filterHouses;
    if (householdId) list = list.filter((h) => h.id === householdId);
    return list.slice(0, 40).map((h) => {
      const score = todayScores.find((s) => s.blockId === h.blockId);
      const coveredPct = score?.inputs
        ? Math.round((score.inputs.housesCovered / Math.max(score.inputs.housesExpected, 1)) * 100)
        : (h.coverageStatus === 'Collected' ? 100 : 0);
      return {
        id: h.id,
        doorNo: h.doorNo,
        street: h.street,
        blockId: h.blockId,
        wardId: h.wardId,
        coverageStatus: h.coverageStatus,
        coveredPct,
        lat: h.lat,
        lng: h.lng,
        score: score?.total ?? null,
      };
    });
  }, [filterHouses, householdId, todayScores]);

  const mapMarkers = useMemo(() => {
    const markers = [];

    wardComparison.forEach((w) => {
      if (w.lat == null || w.lng == null) return;
      markers.push({
        id: `ward-${w.id}`,
        lat: w.lat,
        lng: w.lng,
        label: `${w.fullName || w.name} · avg ${w.average || '—'}`,
        status: w.average ? `Score ${w.average}` : 'No score',
        useCircle: true,
        color: w.average ? scoreColor(w.average) : BAND_COLORS.other,
        kind: 'ward',
      });
    });

    blockComparison.forEach((b) => {
      if (b.lat == null || b.lng == null) return;
      if (activeBlockId && b.id !== activeBlockId) return;
      markers.push({
        id: `block-${b.id}`,
        lat: b.lat,
        lng: b.lng,
        label: `Block ${b.name} · avg ${b.average || '—'}`,
        status: `Houses ${b.houses || '—'}`,
        useCircle: true,
        color: b.average ? scoreColor(b.average) : '#2A6F97',
        kind: 'block',
      });
    });

    houseCoverageRows.forEach((h) => {
      if (h.lat == null || h.lng == null) return;
      markers.push({
        id: `hh-${h.id}`,
        lat: h.lat,
        lng: h.lng,
        label: `Door ${h.doorNo} · ${h.street}`,
        status: `${h.coverageStatus} · block ${blockLabel(h.blockId)}`,
        useCircle: true,
        color: h.coverageStatus === 'Collected' ? BAND_COLORS.full : BAND_COLORS.reduced,
        kind: 'house',
      });
    });

    return markers;
  }, [wardComparison, blockComparison, houseCoverageRows, activeBlockId, blockLabel]);

  const avgToday = todayScores.length
    ? Math.round(todayScores.reduce((a, s) => a + s.total, 0) / todayScores.length)
    : 0;
  const fullBandCount = todayScores.filter((s) => bandKey(s.band) === 'full').length;
  const housesCollected = houseCoverageRows.filter((h) => h.coverageStatus === 'Collected').length;

  if (loading || !data) return <LoadingState />;

  const weights = data.scoreConfig?.weights || {};

  const columns = [
    { id: 'vehicle', header: 'Vehicle', accessor: (r) => r.vehicle?.displayName || r.vehicleId },
    { id: 'block', header: 'Block', accessor: (r) => blockLabel(r.blockId), render: (r) => blockLabel(r.blockId) },
    { id: 'score', header: 'Score', accessor: 'total' },
    { id: 'band', header: 'Band', accessor: 'band' },
    { id: 'stops', header: 'Stops', accessor: (r) => `${r.components?.stopsVsNormal?.earned}/${r.components?.stopsVsNormal?.max}`, hideOnMobile: true },
    { id: 'houses', header: 'Houses', accessor: (r) => `${r.components?.housesCovered?.earned}/${r.components?.housesCovered?.max}`, hideOnMobile: true },
    { id: 'dwc', header: 'DWC', accessor: (r) => `${r.components?.dryWasteCentreVisit?.earned}/${r.components?.dryWasteCentreVisit?.max}`, hideOnMobile: true },
    {
      id: 'mode',
      header: 'Mode',
      accessor: (r) => (r.shadowRun || data.scoreConfig?.shadowRunMode ? 'Shadow-run' : 'Live'),
      hideOnMobile: true,
      render: (r) => (r.shadowRun || data.scoreConfig?.shadowRunMode
        ? <Chip size="small" color="warning" label="Shadow-run" />
        : <Chip size="small" label="Live" />),
    },
  ];

  const wardColumns = [
    { id: 'ward', header: 'Ward', accessor: 'fullName' },
    { id: 'autos', header: 'Autos scored', accessor: 'vehicles', hideOnMobile: true },
    { id: 'avg', header: 'Avg score', accessor: 'average' },
  ];

  const blockColumns = [
    { id: 'block', header: 'Block', accessor: 'name' },
    { id: 'ward', header: 'Ward', accessor: (r) => wardName(r.wardId), hideOnMobile: true },
    { id: 'houses', header: 'Houses', accessor: 'houses', hideOnMobile: true },
    { id: 'autos', header: 'Autos', accessor: 'vehicles' },
    { id: 'avg', header: 'Avg score', accessor: 'average' },
  ];

  const houseColumns = [
    { id: 'door', header: 'Door', accessor: 'doorNo' },
    { id: 'street', header: 'Street', accessor: 'street' },
    { id: 'block', header: 'Block', accessor: (r) => blockLabel(r.blockId), hideOnMobile: true },
    { id: 'status', header: 'Coverage', accessor: 'coverageStatus' },
    { id: 'pct', header: 'Block cover %', accessor: 'coveredPct', hideOnMobile: true },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Performance Scorecards"
        subtitle="Proposed 100-point daily scoring model for demonstration — not approved BSWML payment policy."
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} useFlexGap flexWrap="wrap">
            {data.scoreConfig?.shadowRunMode && (
              <Chip color="warning" label={`Shadow-run · ${data.scoreConfig?.shadowRunMonths || 2} mo`} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }} />
            )}
            <Button
              variant="outlined"
              onClick={() => exportTableCsv(`scores-${todayISO()}.csv`, todayScores, [
                { header: 'Vehicle', accessor: (r) => r.vehicle?.autoId },
                { header: 'Block', accessor: (r) => blockLabel(r.blockId) },
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
        Demo scoring only — not BSWML payment policy. Shadow-run {data.scoreConfig?.shadowRunMode ? 'ON' : 'OFF'} · Bands: 85–100 full · 70–84 reduced · &lt;70 review.
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
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
          <Select
            label="Ward"
            value={wardId}
            onChange={(e) => {
              setWardId(e.target.value);
              setBlockId('');
              setHouseholdId('');
              setMapFocus(null);
            }}
          >
            <MenuItem value="">All wards</MenuItem>
            {wards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Block</InputLabel>
          <Select
            label="Block"
            value={blockId}
            onChange={(e) => {
              setBlockId(e.target.value);
              setHouseholdId('');
              const b = blocks.find((x) => x.id === e.target.value);
              const v = vehicles.find((x) => x.blockId === e.target.value);
              const ward = wards.find((w) => w.id === b?.wardId);
              if (v?.lat) setMapFocus([v.lat, v.lng]);
              else if (ward?.lat) setMapFocus([ward.lat, ward.lng]);
            }}
          >
            <MenuItem value="">All blocks</MenuItem>
            {filterBlocks.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.code} · {wardName(b.wardId)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>House</InputLabel>
          <Select
            label="House"
            value={householdId}
            disabled={filterHouses.length === 0}
            onChange={(e) => {
              const next = e.target.value;
              setHouseholdId(next);
              if (next) {
                const hh = households.find((h) => h.id === next);
                if (hh) {
                  if (!wardId) setWardId(hh.wardId);
                  if (!blockId) setBlockId(hh.blockId);
                  if (hh.lat != null) setMapFocus([hh.lat, hh.lng]);
                }
              }
            }}
          >
            <MenuItem value="">All houses</MenuItem>
            {filterHouses.map((h) => (
              <MenuItem key={h.id} value={h.id}>{houseLabel(h)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard title="Autos scored" value={todayScores.length} subtitle="Today (filtered)" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard title="Avg score" value={avgToday || '—'} subtitle="Today" color="secondary" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard title="Full band" value={fullBandCount} subtitle="85–100" color="success" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiCard title="Houses collected" value={`${housesCollected}/${houseCoverageRows.length || 0}`} subtitle="In filter" color="warning" />
        </Grid>
      </Grid>

      <SectionCard
        title="Score map"
        subtitle="Wards (large), blocks, and houses — colors reflect score / collection status"
      >
        <MapView
          height={{ xs: 280, md: 420 }}
          markers={mapMarkers}
          focus={mapFocus}
          onMarkerClick={(m) => {
            if (m.lat != null) setMapFocus([m.lat, m.lng]);
          }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <Chip size="small" label="Ward avg" sx={{ bgcolor: BAND_COLORS.full, color: '#fff' }} />
          <Chip size="small" label="Block avg" sx={{ bgcolor: '#2A6F97', color: '#fff' }} />
          <Chip size="small" label="House collected" sx={{ bgcolor: BAND_COLORS.full, color: '#fff' }} />
          <Chip size="small" label="House pending" sx={{ bgcolor: BAND_COLORS.reduced, color: '#fff' }} />
        </Stack>
      </SectionCard>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title="Monthly trend" subtitle="From daily averages (filtered)" height={260}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="avg" name="Avg score" stroke="#12304A" strokeWidth={2} />
            </LineChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="Band distribution" subtitle="Today’s autos" height={260}>
            {bandDistribution.length ? (
              <PieChart>
                <Pie data={bandDistribution} dataKey="value" nameKey="name" outerRadius={78} innerRadius={36}>
                  {bandDistribution.map((d) => (
                    <Cell key={d.key} fill={BAND_COLORS[d.key] || PIE_COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No scores for this filter.</Typography>
            )}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Ward comparison" subtitle="Average score today" height={280}>
            <BarChart data={wardComparison} margin={{ left: 0, right: 8, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={56} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip />
              <Bar dataKey="average" name="Avg score" fill="#15966A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Component averages" subtitle="% of max points earned today" height={280}>
            <BarChart data={componentAverages} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="pct" name="% of max" fill="#2A6F97" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Block scores" subtitle="Filtered blocks · today" height={260}>
            <BarChart data={blockComparison.slice(0, 12)} margin={{ bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip />
              <Bar dataKey="average" name="Avg score" fill="#12304A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="House coverage sample" subtitle="Collected vs pending in filter" height={260}>
            <BarChart
              data={[
                {
                  name: 'Houses',
                  Collected: houseCoverageRows.filter((h) => h.coverageStatus === 'Collected').length,
                  Pending: houseCoverageRows.filter((h) => h.coverageStatus !== 'Collected').length,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Collected" stackId="a" fill="#15966A" />
              <Bar dataKey="Pending" stackId="a" fill="#E9A23B" />
            </BarChart>
          </ChartCard>
        </Grid>
      </Grid>

      <SectionCard title="Daily scores">
        <DataTable columns={columns} rows={todayScores} onRowClick={setSelected} searchPlaceholder="Search scores…" />
      </SectionCard>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Ward comparison (today)">
            <DataTable columns={wardColumns} rows={wardComparison} searchable={false} emptyTitle="No ward scores" />
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Block comparison (today)">
            <DataTable columns={blockColumns} rows={blockComparison} searchable={false} emptyTitle="No block scores" />
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SectionCard title="Houses in filter" subtitle="Coverage status linked to block scores">
            <DataTable
              columns={houseColumns}
              rows={houseCoverageRows}
              searchable
              searchPlaceholder="Search door / street…"
              emptyTitle="No houses in filter"
              onRowClick={(row) => {
                if (row.lat != null) setMapFocus([row.lat, row.lng]);
              }}
            />
          </SectionCard>
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100vw' } }}
      >
        {selected && (
          <Box sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 'calc(24px + env(safe-area-inset-bottom))', sm: 3 } }}>
            <Typography variant="h6">{selected.vehicle?.displayName}</Typography>
            <Chip label={`${selected.total}/100`} color="primary" sx={{ mr: 1 }} />
            <Chip label={selected.band} />
            <Typography variant="body2" sx={{ mt: 1 }}>Ward: {wardName(selected.wardId)}</Typography>
            <Typography variant="body2">Block: {blockLabel(selected.blockId)}</Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Monthly from daily: {monthlyScoreFromDaily((data.dailyScores || []).filter((s) => s.vehicleId === selected.vehicleId))?.average ?? '—'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {Object.entries(selected.components || {}).map(([key, c]) => (
              <Box key={key} sx={{ mb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word', pr: 1 }}>{key}</Typography>
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
              style={{ padding: 8, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
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
