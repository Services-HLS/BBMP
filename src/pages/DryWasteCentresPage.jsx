import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Divider, Drawer, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, TextField, Typography,
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import SectionCard from '../components/common/SectionCard';
import DataTable from '../components/common/DataTable';
import StatusChip from '../components/common/StatusChip';
import LoadingState from '../components/common/LoadingState';
import MapView from '../components/maps/MapView';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { PROPOSAL_SCALE } from '../constants';

export default function DryWasteCentresPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');

  const centres = useMemo(() => {
    let list = data?.dryWasteCentres || [];
    if (status) list = list.filter((d) => d.visitStatus === status);
    return list;
  }, [data, status]);

  const pending = (data?.dryWasteCentres || []).filter((d) => d.visitStatus === 'Pending');

  if (loading || !data) return <LoadingState />;

  const columns = [
    { header: 'Centre ID', accessor: 'centreId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Visit', render: (r) => <StatusChip status={r.visitStatus} /> },
    { header: 'Scheduled', accessor: 'scheduledArrival' },
    { header: 'Actual', accessor: 'actualArrival' },
    { header: 'Handover', accessor: 'handoverStatus' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dry Waste Centres" subtitle="Waste-chain monitoring after collection (illustrative quantities)." />
      <Alert severity="info" icon={false}>
        Proposal: {PROPOSAL_SCALE.dryWasteCentres} DWCs · Demo: {centres.length} centres. Quantities are illustrative.
      </Alert>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Pending visits" subtitle={`${pending.length} awaiting arrival`}>
            <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.75}>
              {pending.slice(0, 8).map((p) => (
                <Chip key={p.id} label={p.centreId} size="small" onClick={() => setSelected(p)} />
              ))}
              {pending.length === 0 && (
                <Typography variant="body2" color="text.secondary">No pending visits</Typography>
              )}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <MapView
            height={220}
            markers={centres.map((d) => ({ id: d.id, lat: d.lat, lng: d.lng, label: d.name, status: d.visitStatus, useCircle: true, color: '#15966A' }))}
            onMarkerClick={(m) => setSelected(centres.find((c) => c.id === m.id))}
          />
        </Grid>
      </Grid>

      <FilterBar>
        <FormControl size="small">
          <InputLabel>Visit status</InputLabel>
          <Select label="Visit status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Exception">Exception</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>

      <DataTable columns={columns} rows={centres} onRowClick={setSelected} />

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        {selected && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">{selected.name}</Typography>
            <StatusChip status={selected.visitStatus} />
            <Typography variant="body2" sx={{ mt: 1 }}>Handover: {selected.handoverStatus} · Dwell: {selected.dwellMinutes} min</Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Illustrative quantities (kg)</Typography>
            {Object.entries(selected.quantities || {}).map(([k, v]) => (
              <Typography key={k} variant="body2">{k}: {v}</Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Button variant="outlined" onClick={async () => { await api.recordDwcArrival(selected.id, user?.name); showToast('Arrival recorded'); }}>Record arrival</Button>
              <Button variant="contained" onClick={async () => { await api.recordWasteHandover(selected.id, null, user?.name); showToast('Handover recorded'); }}>Record handover</Button>
              <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
              <Button onClick={async () => { if (!note) return; await api.addDwcNote(selected.id, note, user?.name); setNote(''); showToast('Note added'); }}>Add note</Button>
              <TextField label="Exception reason" value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} fullWidth />
              <Button color="warning" onClick={async () => { await api.markDwcException(selected.id, exceptionReason || 'Exception', user?.name); showToast('Exception marked'); }}>Mark exception</Button>
            </Stack>
          </Box>
        )}
      </Drawer>
    </PageContainer>
  );
}
