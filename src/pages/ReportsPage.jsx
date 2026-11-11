import { useMemo, useState } from 'react';
import {
  Alert, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Printer, Download } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import ChartCard from '../components/common/ChartCard';
import KpiCard from '../components/common/KpiCard';
import SectionCard from '../components/common/SectionCard';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import { useAppData } from '../context/AppDataContext';
import useOpsScope from '../hooks/useOpsScope';
import { exportTableCsv } from '../utils/csv';
import { todayISO } from '../utils/date';

const PIE_COLORS = ['#15966A', '#E9A23B', '#D94841', '#2A6F97', '#12304A', '#9AA5B1'];

export default function ReportsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, loading } = useAppData();
  const { filterByWard, scopeWards, scopeBlocks, isScoped, scopeLabel } = useOpsScope();
  const [corporationId, setCorporationId] = useState('');
  const [wardId, setWardId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [householdId, setHouseholdId] = useState('');

  const wards = useMemo(() => scopeWards(data?.wards || []), [data?.wards, scopeWards]);
  const blocks = useMemo(() => scopeBlocks(data?.blocks || []), [data?.blocks, scopeBlocks]);
  const households = useMemo(() => filterByWard(data?.households || []), [data?.households, filterByWard]);

  const wardName = (id) => wards.find((w) => w.id === id)?.name || id || '—';
  const blockLabel = (id) => {
    const b = blocks.find((x) => x.id === id);
    return b ? (b.code || b.name) : (id || '—');
  };
  const houseLabel = (hh) => (hh ? `Door ${hh.doorNo} · ${hh.street}` : '—');

  const filterWards = useMemo(() => {
    if (!corporationId) return wards;
    return wards.filter((w) => w.corporationId === corporationId);
  }, [wards, corporationId]);

  const filterBlocks = useMemo(() => {
    let list = blocks;
    if (wardId) list = list.filter((b) => b.wardId === wardId);
    else if (corporationId) {
      const wardSet = new Set(filterWards.map((w) => w.id));
      list = list.filter((b) => wardSet.has(b.wardId));
    }
    return list;
  }, [blocks, wardId, corporationId, filterWards]);

  const filterHouses = useMemo(() => {
    let list = households;
    if (blockId) list = list.filter((h) => h.blockId === blockId);
    else if (wardId) list = list.filter((h) => h.wardId === wardId);
    else if (corporationId) {
      const wardSet = new Set(filterWards.map((w) => w.id));
      list = list.filter((h) => wardSet.has(h.wardId));
    }
    return list;
  }, [households, blockId, wardId, corporationId, filterWards]);

  const activeBlockId = useMemo(() => {
    if (blockId) return blockId;
    if (householdId) return households.find((h) => h.id === householdId)?.blockId || '';
    return '';
  }, [blockId, householdId, households]);

  const report = useMemo(() => {
    if (!data) return null;

    let vehicles = filterByWard(data.vehicles || []);
    let complaints = filterByWard(data.complaints || []);
    let sweeping = filterByWard(data.sweepingStretches || []);
    let events = filterByWard(data.aiEvents || []);
    let centres = filterByWard(data.dryWasteCentres || []);
    let spots = filterByWard(data.blackSpots || []);
    let scores = filterByWard(data.dailyScores || []).filter((s) => s.date === todayISO());
    let houses = [...households];

    if (corporationId) {
      const wardSet = new Set(wards.filter((w) => w.corporationId === corporationId).map((w) => w.id));
      vehicles = vehicles.filter((v) => v.corporationId === corporationId);
      complaints = complaints.filter((c) => wardSet.has(c.wardId));
      sweeping = sweeping.filter((s) => wardSet.has(s.wardId));
      events = events.filter((e) => wardSet.has(e.wardId));
      centres = centres.filter((d) => wardSet.has(d.wardId));
      spots = spots.filter((b) => wardSet.has(b.wardId));
      scores = scores.filter((s) => wardSet.has(s.wardId));
      houses = houses.filter((h) => wardSet.has(h.wardId));
    }

    if (wardId) {
      vehicles = vehicles.filter((v) => v.wardId === wardId);
      complaints = complaints.filter((c) => c.wardId === wardId);
      sweeping = sweeping.filter((s) => s.wardId === wardId);
      events = events.filter((e) => e.wardId === wardId);
      centres = centres.filter((d) => d.wardId === wardId);
      spots = spots.filter((b) => b.wardId === wardId);
      scores = scores.filter((s) => s.wardId === wardId);
      houses = houses.filter((h) => h.wardId === wardId);
    }

    if (activeBlockId) {
      vehicles = vehicles.filter((v) => v.blockId === activeBlockId);
      complaints = complaints.filter((c) => c.blockId === activeBlockId);
      sweeping = sweeping.filter((s) => s.blockId === activeBlockId);
      spots = spots.filter((b) => b.blockId === activeBlockId);
      scores = scores.filter((s) => s.blockId === activeBlockId);
      houses = houses.filter((h) => h.blockId === activeBlockId);
      // AI events / DWC are ward-level — keep ward-filtered set when block selected
    }

    if (householdId) {
      spots = spots.filter((b) => !b.householdId || b.householdId === householdId);
      houses = houses.filter((h) => h.id === householdId);
    }

    const coverage = vehicles.length
      ? Math.round(vehicles.reduce((s, v) => s + v.coveragePct, 0) / vehicles.length)
      : 0;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const openComplaints = complaints.filter((c) => c.status !== 'Resolved').length;
    const dwcDone = centres.filter((d) => d.visitStatus === 'Completed').length;
    const sweepingDone = sweeping.filter((s) => s.status === 'Completed').length;
    const aiUnresolved = events.filter((e) => !['Resolved', 'False Positive'].includes(e.status)).length;
    const openSpots = spots.filter((b) => b.status !== 'Cleared').length;
    const housesCollected = houses.filter((h) => h.coverageStatus === 'Collected').length;
    const avgScore = scores.length
      ? Math.round(scores.reduce((s, x) => s + x.total, 0) / scores.length)
      : 0;

    const chart = [
      { name: 'Coverage %', value: coverage },
      { name: 'Complaints open', value: openComplaints },
      { name: 'Complaints resolved', value: resolved },
      { name: 'Sweeping done', value: sweepingDone },
      { name: 'AI unresolved', value: aiUnresolved },
      { name: 'DWC visits', value: dwcDone },
      { name: 'Open black spots', value: openSpots },
      { name: 'Houses collected', value: housesCollected },
    ];

    const complaintByStatus = ['Submitted', 'Verification Pending', 'Assigned', 'Resolved', 'Reopened']
      .map((status) => ({
        name: status,
        value: complaints.filter((c) => c.status === status).length,
      }))
      .filter((d) => d.value > 0);

    const houseCoverageChart = [
      {
        name: 'Houses',
        Collected: housesCollected,
        Pending: Math.max(houses.length - housesCollected, 0),
      },
    ];

    const blockSummary = filterBlocks
      .filter((b) => {
        if (activeBlockId) return b.id === activeBlockId;
        if (wardId) return b.wardId === wardId;
        if (corporationId) {
          const wardSet = new Set(filterWards.map((w) => w.id));
          return wardSet.has(b.wardId);
        }
        return true;
      })
      .map((b) => {
        const blockVehicles = vehicles.filter((v) => v.blockId === b.id);
        const blockHouses = houses.filter((h) => h.blockId === b.id);
        const blockScores = scores.filter((s) => s.blockId === b.id);
        const avgCov = blockVehicles.length
          ? Math.round(blockVehicles.reduce((s, v) => s + v.coveragePct, 0) / blockVehicles.length)
          : 0;
        const avgSc = blockScores.length
          ? Math.round(blockScores.reduce((s, x) => s + x.total, 0) / blockScores.length)
          : 0;
        return {
          id: b.id,
          code: b.code || b.name,
          ward: wardName(b.wardId),
          autos: blockVehicles.length,
          houses: blockHouses.length,
          collected: blockHouses.filter((h) => h.coverageStatus === 'Collected').length,
          coverage: avgCov,
          score: avgSc,
        };
      })
      .sort((a, b) => b.coverage - a.coverage);

    const houseRows = (householdId ? houses : houses.slice(0, 48)).map((h) => ({
      id: h.id,
      doorNo: h.doorNo,
      street: h.street,
      block: blockLabel(h.blockId),
      ward: wardName(h.wardId),
      coverageStatus: h.coverageStatus,
      lastCollection: h.lastCollection,
    }));

    return {
      vehicles,
      complaints,
      sweeping,
      events,
      centres,
      spots,
      scores,
      houses,
      coverage,
      resolved,
      openComplaints,
      dwcDone,
      sweepingDone,
      aiUnresolved,
      openSpots,
      housesCollected,
      avgScore,
      chart,
      complaintByStatus,
      houseCoverageChart,
      blockSummary,
      houseRows,
    };
  }, [data, corporationId, wardId, activeBlockId, householdId, households, filterBlocks, filterWards, wards, blocks, filterByWard]);

  if (loading || !data || !report) return <LoadingState />;

  const blockColumns = [
    { id: 'code', header: 'Block', accessor: 'code' },
    { id: 'ward', header: 'Ward', accessor: 'ward', hideOnMobile: true },
    { id: 'autos', header: 'Autos', accessor: 'autos' },
    { id: 'houses', header: 'Houses', accessor: 'houses', hideOnMobile: true },
    { id: 'collected', header: 'Collected', accessor: 'collected' },
    { id: 'coverage', header: 'Coverage %', accessor: 'coverage' },
    { id: 'score', header: 'Avg score', accessor: 'score', hideOnMobile: true },
  ];

  const houseColumns = [
    { id: 'door', header: 'Door', accessor: 'doorNo' },
    { id: 'street', header: 'Street', accessor: 'street' },
    { id: 'block', header: 'Block', accessor: 'block', hideOnMobile: true },
    { id: 'ward', header: 'Ward', accessor: 'ward', hideOnMobile: true },
    { id: 'status', header: 'Coverage', accessor: 'coverageStatus' },
    { id: 'last', header: 'Last collection', accessor: 'lastCollection', hideOnMobile: true },
  ];

  return (
    <PageContainer className="print-friendly">
      <PageHeader
        title="Monthly / Operational Reports"
        subtitle="Client-side reports from the same sample dataset as dashboards — filter by corporation, ward, block, and house."
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} className="no-print" useFlexGap flexWrap="wrap">
            <Button
              startIcon={<Download size={16} />}
              variant="outlined"
              onClick={() => exportTableCsv(`bswml-report-${todayISO()}.csv`, report.chart, [
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
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
      </Alert>

      <FilterBar className="no-print">
        <FormControl size="small">
          <InputLabel>Corporation</InputLabel>
          <Select
            label="Corporation"
            value={corporationId}
            onChange={(e) => {
              setCorporationId(e.target.value);
              setWardId('');
              setBlockId('');
              setHouseholdId('');
            }}
          >
            <MenuItem value="">All</MenuItem>
            {data.corporations.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select
            label="Ward"
            value={wardId}
            onChange={(e) => {
              setWardId(e.target.value);
              setBlockId('');
              setHouseholdId('');
            }}
          >
            <MenuItem value="">All wards</MenuItem>
            {filterWards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
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
                  const ward = wards.find((w) => w.id === hh.wardId);
                  if (ward && !corporationId) setCorporationId(ward.corporationId || '');
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
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <KpiCard title="Avg coverage" value={`${report.coverage}%`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <KpiCard title="Vehicles" value={report.vehicles.length} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <KpiCard title="Resolved" value={report.resolved} subtitle={`${report.openComplaints} open`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <KpiCard title="DWC visits" value={report.dwcDone} color="secondary" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <KpiCard title="Open black spots" value={report.openSpots} color="warning" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <KpiCard
            title="Houses collected"
            value={`${report.housesCollected}/${report.houses.length}`}
            color="success"
          />
        </Grid>
      </Grid>

      {(wardId || blockId || householdId) && (
        <Alert severity="success" icon={false}>
          Showing filtered ops data
          {wardId ? ` · ${wardName(wardId)}` : ''}
          {activeBlockId ? ` · Block ${blockLabel(activeBlockId)}` : ''}
          {householdId ? ` · ${houseLabel(households.find((h) => h.id === householdId))}` : ''}
          {report.avgScore ? ` · Avg score today ${report.avgScore}` : ''}.
        </Alert>
      )}

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title="Operational summary" height={300}>
            <BarChart data={report.chart} margin={{ bottom: isMobile ? 56 : 28, left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: isMobile ? 9 : 10 }}
                interval={0}
                angle={isMobile ? -35 : -20}
                textAnchor="end"
                height={isMobile ? 64 : 48}
              />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="#12304A" name="Value" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="Complaints by status" subtitle="Filtered set" height={300}>
            {report.complaintByStatus.length ? (
              <PieChart>
                <Pie
                  data={report.complaintByStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={78}
                  innerRadius={36}
                >
                  {report.complaintByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No complaints in this filter.
              </Typography>
            )}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="House coverage" subtitle="Collected vs pending in filter" height={260}>
            <BarChart data={report.houseCoverageChart}>
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
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Block coverage" subtitle="Top blocks in filter" height={260}>
            <BarChart data={report.blockSummary.slice(0, 10)} margin={{ bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="code" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip />
              <Bar dataKey="coverage" name="Coverage %" fill="#2A6F97" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Grid>
      </Grid>

      <SectionCard title="Block summary" subtitle="Autos, houses, coverage and score for filtered blocks">
        <DataTable
          columns={blockColumns}
          rows={report.blockSummary}
          searchable
          searchPlaceholder="Search blocks…"
          emptyTitle="No blocks in filter"
        />
      </SectionCard>

      <SectionCard title="Houses in filter" subtitle="Door-level coverage sample for the selected scope">
        <DataTable
          columns={houseColumns}
          rows={report.houseRows}
          searchable
          searchPlaceholder="Search door / street…"
          emptyTitle="No houses in filter"
        />
      </SectionCard>
    </PageContainer>
  );
}
