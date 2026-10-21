import { useMemo, useState } from 'react';
import {
  Alert, Button, FormControl, InputLabel, MenuItem, Select, Stack,
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import DataTable from '../components/common/DataTable';
import StatusChip from '../components/common/StatusChip';
import LoadingState from '../components/common/LoadingState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils/date';

export default function CoveragePage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [wardId, setWardId] = useState('');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    let list = data?.households || [];
    if (wardId) list = list.filter((h) => h.wardId === wardId);
    if (status) list = list.filter((h) => h.coverageStatus === status);
    return list;
  }, [data, wardId, status]);

  if (loading || !data) return <LoadingState />;

  const columns = [
    { header: 'Door', accessor: 'doorNo' },
    { header: 'Street', accessor: 'street' },
    { header: 'Block', accessor: 'blockId' },
    { header: 'Status', render: (r) => <StatusChip status={r.coverageStatus} /> },
    { header: 'Last collection', accessor: (r) => formatDate(r.lastCollection) },
    { header: 'Verification', accessor: 'verificationMethod' },
    {
      header: 'Actions',
      render: (r) => (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ minWidth: { xs: 96, sm: 'auto' } }}>
          <Button size="small" onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'complete', row: r }); }}>Mark done</Button>
          <Button size="small" color="warning" onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'missed', row: r }); }}>Flag missed</Button>
        </Stack>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader title="Household Coverage" subtitle="Street/house sample records with simulated verification." />
      <Alert severity="info" icon={false}>
        Coverage actions are simulated and audited in demo storage — not real field verification.
      </Alert>
      <FilterBar>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {data.wards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Collected">Collected</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Missed">Missed</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>
      <DataTable columns={columns} rows={rows} searchable />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'complete' ? 'Mark stop completed?' : 'Flag missed pickup?'}
        message="This updates coverage counts and writes an audit entry."
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm.type === 'complete') {
            await api.markStopCompleted(confirm.row.id, user?.name);
            showToast('Stop marked completed');
          } else {
            await api.flagMissedPickup(confirm.row.id, user?.name);
            showToast('Missed pickup flagged');
          }
          setConfirm(null);
        }}
      />
    </PageContainer>
  );
}
