import { useMemo } from 'react';
import { Alert, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import KpiCard from '../components/common/KpiCard';
import { useAppData } from '../context/AppDataContext';
import useOpsScope from '../hooks/useOpsScope';
import { formatDateTime } from '../utils/date';

export default function FeedbackPage() {
  const { data, loading } = useAppData();
  const { filterByWard, isScoped, scopeLabel } = useOpsScope();

  const feedback = useMemo(() => filterByWard(data?.feedback || []), [data?.feedback, filterByWard]);
  const avg = feedback.length
    ? Math.round((feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length) * 10) / 10
    : 0;
  const collectedPct = feedback.length
    ? Math.round((feedback.filter((f) => f.collected).length / feedback.length) * 100)
    : 0;

  const ratingDist = useMemo(() => {
    const buckets = [1, 2, 3, 4, 5].map((n) => ({ rating: String(n), count: 0 }));
    feedback.forEach((f) => {
      const idx = (f.rating || 0) - 1;
      if (idx >= 0 && idx < 5) buckets[idx].count += 1;
    });
    return buckets;
  }, [feedback]);

  if (loading || !data) return <LoadingState />;

  return (
    <PageContainer>
      <PageHeader title="Citizen Feedback" subtitle="Service quality and segregation feedback from the citizen portal." />
      <Alert severity="info" icon={false}>
        Feedback is stored in local demo storage and linked to fictional citizen IDs.
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
      </Alert>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Responses" value={feedback.length} /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Avg rating" value={avg} color="warning" /></Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}><KpiCard title="Collected %" value={`${collectedPct}%`} color="success" /></Grid>
      </Grid>

      <ChartCard title="Rating distribution" height={240}>
        <BarChart data={ratingDist}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Bar dataKey="count" fill="#E9A23B" />
        </BarChart>
      </ChartCard>

      <DataTable
        columns={[
          { id: 'date', header: 'Date', accessor: 'date' },
          { id: 'citizen', header: 'Citizen', accessor: 'citizenId', hideOnMobile: true },
          { id: 'collected', header: 'Collected', accessor: (r) => (r.collected ? 'Yes' : 'No') },
          { id: 'rating', header: 'Rating', accessor: 'rating' },
          { id: 'seg', header: 'Segregation', accessor: 'segregationFeedback', hideOnMobile: true },
          {
            id: 'comment',
            header: 'Comment',
            accessor: 'comment',
            hideOnMobile: true,
            render: (r) => (
              <span className="bbmp-truncate" title={r.comment || ''} style={{ display: 'inline-block', maxWidth: 220 }}>
                {r.comment || '—'}
              </span>
            ),
          },
          { id: 'submitted', header: 'Submitted', accessor: (r) => formatDateTime(r.createdAt), hideOnMobile: true },
        ]}
        rows={feedback}
      />
    </PageContainer>
  );
}
