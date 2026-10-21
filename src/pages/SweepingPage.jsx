import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Drawer, FormControl, Grid, IconButton, InputLabel, List, ListItem, ListItemText,
  MenuItem, Select, Stack, Tab, Tabs, TextField, Typography, Chip,
} from '@mui/material';
import { Plus, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import StatusChip from '../components/common/StatusChip';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import KpiCard from '../components/common/KpiCard';
import EmptyState from '../components/common/EmptyState';
import { useAppData } from '../context/AppDataContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { BLACK_SPOT_CATEGORIES, PROPOSAL_SCALE } from '../constants';
import { formatDate, formatDateTime } from '../utils/date';

const CIVIC_CATEGORIES = ['Pothole', 'Debris'];

const emptyForm = {
  category: 'Illegal Dumping',
  severity: 'Medium',
  wardId: '',
  location: '',
  lat: '12.9716',
  lng: '77.5946',
  assignedTeam: '',
  note: '',
};

export default function SweepingPage() {
  const { data, api, loading } = useAppData();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  const actor = user?.name || 'Demo User';

  const [tab, setTab] = useState(0);
  const [wardId, setWardId] = useState('');
  const [spotStatus, setSpotStatus] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [note, setNote] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [busy, setBusy] = useState(false);

  const wards = data?.wards || [];
  const stretches = data?.sweepingStretches || [];
  const blackSpots = data?.blackSpots || [];
  const complaints = data?.complaints || [];
  const supervisors = data?.supervisors || [];

  const wardName = (id) => wards.find((w) => w.id === id)?.name || id || '—';

  const filteredStretches = useMemo(() => {
    if (!wardId) return stretches;
    return stretches.filter((s) => s.wardId === wardId);
  }, [stretches, wardId]);

  const filteredSpots = useMemo(() => {
    let list = [...blackSpots];
    if (wardId) list = list.filter((b) => b.wardId === wardId);
    if (spotStatus) list = list.filter((b) => b.status === spotStatus);
    return list;
  }, [blackSpots, wardId, spotStatus]);

  const civicEvents = useMemo(() => {
    let list = complaints.filter((c) => CIVIC_CATEGORIES.includes(c.category));
    if (wardId) list = list.filter((c) => c.wardId === wardId);
    return list;
  }, [complaints, wardId]);

  const selected = blackSpots.find((b) => b.id === selectedSpotId) || null;

  const stretchColumns = [
    { id: 'road', header: 'Road / stretch', accessor: 'roadName' },
    { id: 'ward', header: 'Ward', render: (r) => wardName(r.wardId) },
    { id: 'team', header: 'Team', accessor: 'team' },
    { id: 'km', header: 'Km', render: (r) => `${r.completedKm} / ${r.plannedKm}` },
    { id: 'pct', header: 'Completion', render: (r) => `${r.completionPct}%` },
    { id: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { id: 'verified', header: 'Last verification', render: (r) => formatDate(r.lastVerification) },
  ];

  const spotColumns = [
    { id: 'loc', header: 'Location', accessor: 'location' },
    { id: 'cat', header: 'Category', accessor: 'category' },
    { id: 'sev', header: 'Severity', accessor: 'severity' },
    { id: 'ward', header: 'Ward', render: (r) => wardName(r.wardId) },
    { id: 'days', header: 'Days open', accessor: 'daysUnresolved' },
    { id: 'team', header: 'Team', accessor: (r) => r.assignedTeam || '—' },
    { id: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];

  const civicColumns = [
    { id: 'id', header: 'ID', accessor: 'id' },
    { id: 'cat', header: 'Category', accessor: 'category' },
    { id: 'title', header: 'Title', accessor: 'title' },
    { id: 'ward', header: 'Ward', render: (r) => wardName(r.wardId) },
    { id: 'priority', header: 'Priority', accessor: 'priority' },
    { id: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { id: 'created', header: 'Created', render: (r) => formatDateTime(r.createdAt) },
  ];

  const handleCreate = async () => {
    if (!form.location || !form.wardId) {
      showToast('Location and ward are required', 'warning');
      return;
    }
    setBusy(true);
    try {
      const ward = wards.find((w) => w.id === form.wardId);
      const spot = await api.createBlackSpot({
        category: form.category,
        severity: form.severity,
        wardId: form.wardId,
        location: form.location,
        lat: Number(form.lat) || ward?.lat || null,
        lng: Number(form.lng) || ward?.lng || null,
        assignedTeam: form.assignedTeam || null,
        note: form.note,
        evidencePlaceholders: [],
      }, actor);
      showToast(`Black spot ${spot.id} created`);
      setCreateOpen(false);
      setForm({ ...emptyForm, wardId: form.wardId });
      setSelectedSpotId(spot.id);
      setTab(1);
    } catch (err) {
      showToast(err.message || 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const patchSpot = async (patch, actionNote) => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.updateBlackSpot(selected.id, patch, actionNote || note || patch.status, actor);
      showToast(`Black spot updated → ${patch.status || 'saved'}`);
      setNote('');
      setEvidenceNote('');
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data) return <LoadingState />;

  const openSpots = filteredSpots.filter((b) => b.status !== 'Cleared').length;
  const completedStretches = filteredStretches.filter((s) => s.status === 'Completed').length;
  const avgKm = filteredStretches.length
    ? (filteredStretches.reduce((s, x) => s + x.completedKm, 0) / filteredStretches.length).toFixed(1)
    : '0';

  return (
    <PageContainer>
      <PageHeader
        title="Sweeping & Black Spots"
        subtitle={`Road sweeping stretches, black-spot register, and civic pothole/debris events. Proposal reference ${PROPOSAL_SCALE.sweepingKm.toLocaleString()} km.`}
        breadcrumbs={[{ label: 'Civic Issues', to: '/complaints' }, { label: 'Sweeping & Black Spots' }]}
        actions={(
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Register black spot
          </Button>
        )}
      />

      <Alert severity="info" icon={false}>
        Demo register — {data.sweepingStretches.length} stretches loaded; clearance and evidence are simulated.
      </Alert>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Stretches" value={filteredStretches.length} subtitle={`${completedStretches} completed`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Avg completed km" value={avgKm} color="secondary" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Open black spots" value={openSpots} color="warning" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Pothole / debris reports" value={civicEvents.length} color="error" />
        </Grid>
      </Grid>

      <FilterBar>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All wards</MenuItem>
            {wards.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {tab === 1 && (
          <FormControl size="small">
            <InputLabel>Black spot status</InputLabel>
            <Select label="Black spot status" value={spotStatus} onChange={(e) => setSpotStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress Cleanup">In Progress Cleanup</MenuItem>
              <MenuItem value="Cleared">Cleared</MenuItem>
            </Select>
          </FormControl>
        )}
      </FilterBar>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Sweeping stretches" />
        <Tab label="Black spot register" />
        <Tab label="Civic events (pothole / debris)" />
      </Tabs>

      {tab === 0 && (
        <DataTable
          columns={stretchColumns}
          rows={filteredStretches}
          searchPlaceholder="Search stretches…"
          emptyTitle="No sweeping stretches"
        />
      )}

      {tab === 1 && (
        <DataTable
          columns={spotColumns}
          rows={filteredSpots}
          onRowClick={(r) => setSelectedSpotId(r.id)}
          searchPlaceholder="Search black spots…"
          emptyTitle="No black spots match filters"
        />
      )}

      {tab === 2 && (
        civicEvents.length === 0 ? (
          <EmptyState title="No pothole or debris complaints" description="Sourced from Pothole/Debris complaints — manage workflow on Complaint Management." />
        ) : (
          <DataTable columns={civicColumns} rows={civicEvents} searchPlaceholder="Search civic events…" />
        )
      )}

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelectedSpotId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}
      >
        {selected && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">{selected.location}</Typography>
                <Typography variant="body2" color="text.secondary">{selected.id}</Typography>
              </Box>
              <IconButton onClick={() => setSelectedSpotId(null)} aria-label="Close">
                <X size={18} />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <StatusChip status={selected.status} />
              <Chip size="small" label={selected.severity} />
              <Chip size="small" label={selected.category} variant="outlined" />
            </Stack>

            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="body2">Ward: {wardName(selected.wardId)}</Typography>
              <Typography variant="body2">Team: {selected.assignedTeam || 'Unassigned'}</Typography>
              <Typography variant="body2">First reported: {formatDate(selected.firstReported)}</Typography>
              <Typography variant="body2">Days unresolved: {selected.daysUnresolved}</Typography>
              <Typography variant="body2">Previous reports: {selected.previousReports}</Typography>
            </Stack>

            <Typography variant="subtitle2" gutterBottom>Workflow</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={busy || selected.status === 'Cleared'}
                onClick={() => {
                  const team = selected.assignedTeam || supervisors[0]?.name || 'PK Team';
                  patchSpot({ status: 'Open', assignedTeam: team }, `Assigned to ${team}`);
                }}
              >
                Assign
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={busy}
                onClick={() => patchSpot({ status: 'In Progress Cleanup' }, note || 'Cleanup in progress')}
              >
                Progress
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={busy}
                onClick={() => {
                  const placeholder = evidenceNote || `evidence-${Date.now()}`;
                  patchSpot(
                    { evidencePlaceholders: [...(selected.evidencePlaceholders || []), placeholder] },
                    `Evidence added: ${placeholder}`
                  );
                }}
              >
                Add evidence
              </Button>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={busy}
                onClick={() => patchSpot({ status: 'Cleared', daysUnresolved: 0 }, note || 'Verified clear')}
              >
                Verify clear
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={busy || selected.status !== 'Cleared'}
                onClick={() => patchSpot({ status: 'Open', daysUnresolved: 1 }, note || 'Reopened after verification')}
              >
                Reopen
              </Button>
            </Stack>

            <TextField
              fullWidth
              size="small"
              label="Action note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Evidence placeholder ID"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Demo only — stores a placeholder string, not a real photo upload."
            />

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Evidence placeholders</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {(selected.evidencePlaceholders || []).length === 0 && (
                <Typography variant="caption" color="text.secondary">None yet</Typography>
              )}
              {(selected.evidencePlaceholders || []).map((e) => (
                <Chip key={e} size="small" label={e} />
              ))}
            </Stack>

            <Typography variant="subtitle2" gutterBottom>History</Typography>
            <List dense>
              {(selected.history || []).slice().reverse().map((h, i) => (
                <ListItem key={`${h.at}-${i}`} disableGutters>
                  <ListItemText
                    primary={`${h.action} · ${h.by}`}
                    secondary={`${formatDateTime(h.at)} — ${h.note || ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Drawer>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register black spot</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {BLACK_SPOT_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                label="Severity"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {['Low', 'Medium', 'High', 'Critical'].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Ward</InputLabel>
              <Select
                label="Ward"
                value={form.wardId}
                onChange={(e) => setForm((f) => ({ ...f, wardId: e.target.value }))}
              >
                {wards.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Location description"
              fullWidth
              size="small"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField label="Lat" size="small" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} fullWidth />
              <TextField label="Lng" size="small" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} fullWidth />
            </Stack>
            <TextField
              label="Assigned team"
              fullWidth
              size="small"
              value={form.assignedTeam}
              onChange={(e) => setForm((f) => ({ ...f, assignedTeam: e.target.value }))}
            />
            <TextField
              label="Note"
              fullWidth
              size="small"
              multiline
              minRows={2}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={busy}>Create</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
