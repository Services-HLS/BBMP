import { useMemo, useState } from 'react';
import {
  Alert, FormControl, Grid, InputLabel, MenuItem, Select,
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import ChartCard from '../components/common/ChartCard';
import KpiCard from '../components/common/KpiCard';
import LoadingState from '../components/common/LoadingState';
import { useAppData } from '../context/AppDataContext';

export default function ImpactPage() {
  const { data, loading } = useAppData();
  const [range, setRange] = useState(14);

  const series = useMemo(() => {
    const daily = data?.impactMetrics?.daily || [];
    return daily.slice(-range);
  }, [data, range]);

  const totals = useMemo(() => {
    if (!series.length) return null;
    const sum = (key) => series.reduce((s, d) => s + (d[key] || 0), 0);
    return {
      wet: sum('wetTonnes'),
      dry: sum('dryTonnes'),
      recycled: sum('recycledTonnes'),
      compost: sum('compostTonnes'),
      co2e: Number(sum('co2eAvoided').toFixed(1)),
      satisfaction: Math.round(series.reduce((s, d) => s + d.satisfactionPct, 0) / series.length),
      blackSpotDays: Math.round(series.reduce((s, d) => s + d.avgBlackSpotDays, 0) / series.length),
      cost: series[series.length - 1]?.costPerTonne,
    };
  }, [series]);

  if (loading || !data || !totals) return <LoadingState />;
  const assumptions = data.impactMetrics.assumptions;

  return (
    <PageContainer>
      <PageHeader title="Impact Dashboard" subtitle="Sustainability and service-outcome estimates from illustrative sample records." />
      <Alert severity="info" icon={false}>
        Illustrative estimate — diversion {assumptions.diversionRate * 100}%, CO₂e {assumptions.co2ePerTonneAvoided} t/t, compost {assumptions.compostYieldPerTonneWet}. Not official BBMP results.
      </Alert>

      <FilterBar>
        <FormControl size="small">
          <InputLabel>Range</InputLabel>
          <Select label="Range" value={range} onChange={(e) => setRange(e.target.value)}>
            <MenuItem value={7}>7 days</MenuItem>
            <MenuItem value={14}>14 days</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Wet waste (t)" value={totals.wet} subtitle="Illustrative" color="success" /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Dry waste (t)" value={totals.dry} subtitle="Illustrative" color="info" /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Recycled (t)" value={totals.recycled} subtitle="Illustrative" color="secondary" /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="CO₂e avoided (t)" value={totals.co2e} subtitle="Illustrative estimate" color="warning" /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Compost (t)" value={totals.compost} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Cost / tonne" value={`₹${totals.cost}`} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Satisfaction" value={`${totals.satisfaction}%`} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Avg black-spot days" value={totals.blackSpotDays} /></Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title="Waste processed" subtitle="Illustrative tonnes" tall>
            <AreaChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="wetTonnes" stackId="1" stroke="#15966A" fill="#E5F5ED" name="Wet" />
              <Area type="monotone" dataKey="dryTonnes" stackId="1" stroke="#12304A" fill="#D6E4F0" name="Dry" />
            </AreaChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="Citizen satisfaction" tall>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Bar dataKey="satisfactionPct" fill="#E9A23B" name="Satisfaction %" />
            </BarChart>
          </ChartCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
