import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Drawer, FormControl, Grid, IconButton, InputLabel, List, ListItem, ListItemText,
  MenuItem, Select, Stack, TextField, Typography, Chip,
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
import useOpsScope from '../hooks/useOpsScope';
import { BLACK_SPOT_CATEGORIES, PROPOSAL_SCALE } from '../constants';
import { formatDate, formatDateTime } from '../utils/date';

const CIVIC_CATEGORIES = ['Pothole', 'Debris'];

const emptyForm = {
  category: 'Illegal Dumping',
  severity: 'Medium',
  wardId: '',
  blockId: '',
  householdId: '',
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
  const { filterByWard, scopeWards, scopeBlocks, isScoped, scopeLabel } = useOpsScope();
  const actor = user?.name || 'Demo User';

  const [view, setView] = useState('blackspots');
  const [wardId, setWardId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [spotStatus, setSpotStatus] = useState('');
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [note, setNote] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [busy, setBusy] = useState(false);

  const wards = useMemo(() => scopeWards(data?.wards || []), [data?.wards, scopeWards]);
  const blocks = useMemo(() => scopeBlocks(data?.blocks || []), [data?.blocks, scopeBlocks]);
  const households = useMemo(() => filterByWard(data?.households || []), [data?.households, filterByWard]);
  const stretches = useMemo(() => filterByWard(data?.sweepingStretches || []), [data?.sweepingStretches, filterByWard]);
  const blackSpots = useMemo(() => filterByWard(data?.blackSpots || []), [data?.blackSpots, filterByWard]);
  const complaints = useMemo(() => filterByWard(data?.complaints || []), [data?.complaints, filterByWard]);
  const supervisors = data?.supervisors || [];

  const wardName = (id) => wards.find((w) => w.id === id)?.name || id || '—';
  const blockName = (id) => {
    const b = blocks.find((x) => x.id === id);
    return b ? `${b.code || b.name}` : (id || '—');
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

  const formBlocks = useMemo(() => {
    if (!form.wardId) return [];
    return blocks.filter((b) => b.wardId === form.wardId);
  }, [blocks, form.wardId]);

  const formHouses = useMemo(() => {
    if (!form.blockId) return [];
    return households.filter((h) => h.blockId === form.blockId);
  }, [households, form.blockId]);

  const filteredStretches = useMemo(() => {
    let list = [...stretches];
    if (wardId) list = list.filter((s) => s.wardId === wardId);
    if (blockId) list = list.filter((s) => s.blockId === blockId);
    if (householdId) {
      const hh = households.find((h) => h.id === householdId);
      if (hh?.blockId) list = list.filter((s) => s.blockId === hh.blockId);
    }
    return list;
  }, [stretches, wardId, blockId, householdId, households]);

  const filteredSpots = useMemo(() => {
    let list = [...blackSpots];
    if (wardId) list = list.filter((b) => b.wardId === wardId);
    if (blockId) list = list.filter((b) => b.blockId === blockId);
    if (householdId) list = list.filter((b) => b.householdId === householdId);
    if (spotStatus) list = list.filter((b) => b.status === spotStatus);
    return list;
  }, [blackSpots, wardId, blockId, householdId, spotStatus]);

  const civicEvents = useMemo(() => {
    let list = complaints.filter((c) => CIVIC_CATEGORIES.includes(c.category));
    if (wardId) list = list.filter((c) => c.wardId === wardId);
    if (blockId) list = list.filter((c) => c.blockId === blockId);
    if (householdId) {
      const hh = households.find((h) => h.id === householdId);
      if (hh?.blockId) list = list.filter((c) => c.blockId === hh.blockId);
    }
    return list;
  }, [complaints, wardId, blockId, householdId, households]);

  const selected = blackSpots.find((b) => b.id === selectedSpotId) || null;

  const stretchColumns = [
    { id: 'road', header: 'Road / stretch', accessor: 'roadName' },
    { id: 'ward', header: 'Ward', accessor: (r) => wardName(r.wardId), render: (r) => wardName(r.wardId), hideOnMobile: true },
    { id: 'block', header: 'Block', accessor: (r) => blockName(r.blockId), render: (r) => blockName(r.blockId) },
    { id: 'team', header: 'Team', accessor: 'team', hideOnMobile: true },
    { id: 'km', header: 'Km', accessor: (r) => `${r.completedKm} / ${r.plannedKm}`, render: (r) => `${r.completedKm} / ${r.plannedKm}`, hideOnMobile: true },
    { id: 'pct', header: 'Completion', accessor: (r) => `${r.completionPct}%`, render: (r) => `${r.completionPct}%` },
    { id: 'status', header: 'Status', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
    { id: 'verified', header: 'Last verification', accessor: (r) => formatDate(r.lastVerification), render: (r) => formatDate(r.lastVerification), hideOnMobile: true },
  ];

  const spotColumns = [
    { id: 'loc', header: 'Location', accessor: 'location' },
    { id: 'block', header: 'Block', accessor: (r) => blockName(r.blockId), render: (r) => blockName(r.blockId) },
    {
      id: 'house',
      header: 'House',
      accessor: (r) => r.doorNo || households.find((h) => h.id === r.householdId)?.doorNo || '—',
      render: (r) => {
        const hh = households.find((h) => h.id === r.householdId);
        return hh ? `Door ${hh.doorNo}` : (r.doorNo ? `Door ${r.doorNo}` : '—');
      },
    },
    { id: 'cat', header: 'Category', accessor: 'category', hideOnMobile: true },
    { id: 'sev', header: 'Severity', accessor: 'severity', hideOnMobile: true },
    { id: 'ward', header: 'Ward', accessor: (r) => wardName(r.wardId), render: (r) => wardName(r.wardId), hideOnMobile: true },
    { id: 'days', header: 'Days open', accessor: 'daysUnresolved', hideOnMobile: true },
    { id: 'team', header: 'Team', accessor: (r) => r.assignedTeam || '—', hideOnMobile: true },
    { id: 'status', header: 'Status', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
  ];

  const civicColumns = [
    { id: 'id', header: 'ID', accessor: 'id', hideOnMobile: true },
    { id: 'cat', header: 'Category', accessor: 'category', hideOnMobile: true },
    { id: 'title', header: 'Title', accessor: 'title' },
    { id: 'ward', header: 'Ward', accessor: (r) => wardName(r.wardId), render: (r) => wardName(r.wardId), hideOnMobile: true },
    { id: 'block', header: 'Block', accessor: (r) => blockName(r.blockId), render: (r) => blockName(r.blockId) },
    { id: 'priority', header: 'Priority', accessor: 'priority', hideOnMobile: true },
    { id: 'status', header: 'Status', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
    { id: 'created', header: 'Created', accessor: (r) => formatDateTime(r.createdAt), render: (r) => formatDateTime(r.createdAt), hideOnMobile: true },
  ];

  const handleCreate = async () => {
    if (!form.location || !form.wardId) {
      showToast('Location and ward are required', 'warning');
      return;
    }
    setBusy(true);
    try {
      const ward = wards.find((w) => w.id === form.wardId);
      const hh = households.find((h) => h.id === form.householdId);
      const spot = await api.createBlackSpot({
        category: form.category,
        severity: form.severity,
        wardId: form.wardId,
        blockId: form.blockId || hh?.blockId || null,
        householdId: form.householdId || null,
        doorNo: hh?.doorNo || null,
        location: form.location,
        lat: Number(form.lat) || hh?.lat || ward?.lat || null,
        lng: Number(form.lng) || hh?.lng || ward?.lng || null,
        assignedTeam: form.assignedTeam || null,
        note: form.note,
        evidencePlaceholders: [],
      }, actor);
      showToast(`Black spot ${spot.id} created`);
      setCreateOpen(false);
      setForm({ ...emptyForm, wardId: form.wardId, blockId: form.blockId });
      setSelectedSpotId(spot.id);
      setView('blackspots');
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
        subtitle={`Road sweeping stretches, top black spots, and civic pothole/debris events. Proposal reference ${PROPOSAL_SCALE.sweepingKm.toLocaleString()} km.`}
        breadcrumbs={[{ label: 'Civic Issues', to: '/complaints' }, { label: 'Sweeping & Black Spots' }]}
        actions={(
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Register black spot
          </Button>
        )}
      />

      <Alert severity="info" icon={false}>
        Demo register — {stretches.length} stretches in view; clearance and evidence are simulated.
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
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
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 240 } }}>
          <InputLabel>View</InputLabel>
          <Select
            label="View"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <MenuItem value="blackspots">Top black spots</MenuItem>
            <MenuItem value="stretches">Sweeping stretches</MenuItem>
            <MenuItem value="civic">Civic events (pothole / debris)</MenuItem>
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
            {wards.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
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
            onChange={(e) => {
              const next = e.target.value;
              setHouseholdId(next);
              if (next) {
                const hh = households.find((h) => h.id === next);
                if (hh) {
                  if (!wardId) setWardId(hh.wardId);
                  if (!blockId) setBlockId(hh.blockId);
                }
              }
            }}
            disabled={filterHouses.length === 0}
          >
            <MenuItem value="">All houses</MenuItem>
            {filterHouses.map((h) => (
              <MenuItem key={h.id} value={h.id}>{houseLabel(h)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {view === 'blackspots' && (
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

      {view === 'blackspots' && (
        <DataTable
          columns={spotColumns}
          rows={filteredSpots}
          onRowClick={(r) => setSelectedSpotId(r.id)}
          searchPlaceholder="Search black spots…"
          emptyTitle="No black spots match filters"
        />
      )}

      {view === 'stretches' && (
        <DataTable
          columns={stretchColumns}
          rows={filteredStretches}
          searchPlaceholder="Search stretches…"
          emptyTitle="No sweeping stretches"
        />
      )}

      {view === 'civic' && (
        civicEvents.length === 0 ? (
          <EmptyState
            title="No pothole or debris complaints"
            description="Sourced from Pothole/Debris complaints — manage workflow on Complaint Management."
          />
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
              <Typography variant="body2">Block: {blockName(selected.blockId)}</Typography>
              <Typography variant="body2">
                House: {(() => {
                  const hh = households.find((h) => h.id === selected.householdId);
                  if (hh) return houseLabel(hh);
                  if (selected.doorNo) return `Door ${selected.doorNo}`;
                  return '—';
                })()}
              </Typography>
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
                onChange={(e) => setForm((f) => ({ ...f, wardId: e.target.value, blockId: '', householdId: '' }))}
              >
                {wards.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" disabled={!form.wardId}>
              <InputLabel>Block</InputLabel>
              <Select
                label="Block"
                value={form.blockId}
                onChange={(e) => setForm((f) => ({ ...f, blockId: e.target.value, householdId: '' }))}
              >
                <MenuItem value="">Select block</MenuItem>
                {formBlocks.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.code}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" disabled={!form.blockId || formHouses.length === 0}>
              <InputLabel>House</InputLabel>
              <Select
                label="House"
                value={form.householdId}
                onChange={(e) => {
                  const next = e.target.value;
                  const hh = households.find((h) => h.id === next);
                  setForm((f) => ({
                    ...f,
                    householdId: next,
                    lat: hh ? String(hh.lat) : f.lat,
                    lng: hh ? String(hh.lng) : f.lng,
                    location: f.location || (hh ? `${hh.street}, Door ${hh.doorNo}` : f.location),
                  }));
                }}
              >
                <MenuItem value="">Optional house</MenuItem>
                {formHouses.map((h) => (
                  <MenuItem key={h.id} value={h.id}>{houseLabel(h)}</MenuItem>
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
