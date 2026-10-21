import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Drawer, FormControl, InputLabel, MenuItem, Select, Typography, Divider,
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { PROPOSAL_SCALE } from '../constants';

export default function RoutesPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [wardId, setWardId] = useState('');
  const [selected, setSelected] = useState(null);
  const [reassignVehicle, setReassignVehicle] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows = useMemo(() => {
    let blocks = data?.blocks || [];
    if (wardId) blocks = blocks.filter((b) => b.wardId === wardId);
    return blocks.map((b) => {
      const route = data.routes.find((r) => r.id === b.routeId);
      const vehicle = data.vehicles.find((v) => v.id === b.vehicleId);
      const ward = data.wards.find((w) => w.id === b.wardId);
      return { ...b, route, vehicle, wardName: ward?.name };
    });
  }, [data, wardId]);

  if (loading || !data) return <LoadingState />;

  const columns = [
    { header: 'Block', accessor: 'code' },
    { header: 'Ward', accessor: 'wardName' },
    { header: 'Route', accessor: (r) => r.route?.name },
    { header: 'Auto', accessor: (r) => r.vehicle?.autoId },
    { header: 'Coverage', accessor: (r) => `${r.route?.householdCoverage ?? 0}%` },
    { header: 'Stops', accessor: (r) => `${r.route?.completedStops ?? 0}/${r.route?.expectedStops ?? 0}` },
  ];

  return (
    <PageContainer>
      <PageHeader title="Routes & Blocks" subtitle="One block ↔ one auto ↔ one route (proposal model). Demo subset loaded." />
      <Alert severity="info" icon={false}>
        Proposal scale: {PROPOSAL_SCALE.autosBlocks.toLocaleString()} autos/blocks · Demo: {data._meta?.demoRecordCounts?.blocks} blocks / {data._meta?.demoRecordCounts?.vehicles} autos.
      </Alert>
      <FilterBar>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {data.wards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
        </FormControl>
      </FilterBar>
      <DataTable columns={columns} rows={rows} onRowClick={setSelected} />

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
        {selected && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">{selected.code} · {selected.route?.name}</Typography>
            <Typography variant="body2">Households: {selected.households}</Typography>
            <Typography variant="body2">Schedule: {selected.route?.scheduleStart} – {selected.route?.scheduleEnd}</Typography>
            <Typography variant="body2">Sweeping points: {selected.route?.sweepingCompleted}/{selected.route?.sweepingPoints}</Typography>
            <Typography variant="body2">DWC: {selected.route?.dwcId}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Checkpoints</Typography>
            {selected.route?.checkpoints?.map((c) => (
              <Typography key={c.id} variant="body2">{c.order}. {c.name} — {c.completed ? 'Done' : 'Pending'}</Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel>Reassign vehicle</InputLabel>
              <Select label="Reassign vehicle" value={reassignVehicle} onChange={(e) => setReassignVehicle(e.target.value)}>
                {data.vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.autoId} · {v.displayName}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={!reassignVehicle} onClick={() => setConfirmOpen(true)}>Reassign route</Button>
          </Box>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        title="Reassign route?"
        message="This updates the block↔vehicle link in demo storage and writes an audit entry."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await api.reassignRoute(selected.id, reassignVehicle, user?.name);
          showToast('Route reassigned');
          setConfirmOpen(false);
          setSelected(null);
        }}
      />
    </PageContainer>
  );
}
