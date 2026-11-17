import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Divider, Drawer, FormControl, Grid, IconButton,
  InputLabel, List, ListItem, ListItemText, MenuItem, Select, Slider, Stack,
  TextField, Typography, Paper, LinearProgress,
} from '@mui/material';
import { Play, Square, X, Eye } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import SectionCard from '../components/common/SectionCard';
import StatusChip from '../components/common/StatusChip';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import KpiCard from '../components/common/KpiCard';
import EmptyState from '../components/common/EmptyState';
import { useAppData } from '../context/AppDataContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import useOpsScope from '../hooks/useOpsScope';
import { AI_EVENT_TYPES, AI_EVENT_STATUSES } from '../constants';
import { formatDateTime } from '../utils/date';

const LIVE_MIN_MS = 2 * 60 * 1000;
const LIVE_MAX_MS = 5 * 60 * 1000;

export default function DashcamPage() {
  const { data, api, loading } = useAppData();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  const { filterByWard, scopeWards, isScoped, scopeLabel } = useOpsScope();
  const actor = user?.name || 'Demo User';

  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [wardId, setWardId] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [team, setTeam] = useState('');
  const [busy, setBusy] = useState(false);

  const [liveActive, setLiveActive] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveLabel, setLiveLabel] = useState('');
  const liveTimers = useRef([]);
  const liveInterval = useRef(null);

  const clearLiveTimers = () => {
    liveTimers.current.forEach((id) => clearTimeout(id));
    liveTimers.current = [];
    if (liveInterval.current) {
      clearInterval(liveInterval.current);
      liveInterval.current = null;
    }
  };

  useEffect(() => () => clearLiveTimers(), []);

  const wards = useMemo(() => scopeWards(data?.wards || []), [data?.wards, scopeWards]);
  const vehicles = useMemo(() => filterByWard(data?.vehicles || []), [data?.vehicles, filterByWard]);
  const events = useMemo(() => filterByWard(data?.aiEvents || []), [data?.aiEvents, filterByWard]);
  const supervisors = data?.supervisors || [];

  const wardName = (id) => wards.find((w) => w.id === id)?.name || id || '—';
  const vehicleName = (id) => vehicles.find((v) => v.id === id)?.displayName || id || '—';

  const filtered = useMemo(() => {
    let list = [...events];
    if (type) list = list.filter((e) => e.type === type);
    if (status) list = list.filter((e) => e.status === status);
    if (wardId) list = list.filter((e) => e.wardId === wardId);
    if (minConfidence > 0) list = list.filter((e) => e.confidence >= minConfidence);
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [events, type, status, wardId, minConfidence]);

  const selected = events.find((e) => e.id === selectedId) || null;

  const snapshots = useMemo(
    () => filtered.map((e) => ({
      id: e.id,
      type: e.type,
      label: e.evidencePlaceholder || e.id,
      status: e.status,
      confidence: e.confidence,
      vehicle: vehicles.find((v) => v.id === e.vehicleId)?.displayName || e.vehicleId,
    })),
    [filtered, vehicles]
  );

  const columns = [
    { id: 'id', header: 'Event', accessor: 'id', hideOnMobile: true },
    { id: 'type', header: 'Type', accessor: 'type' },
    { id: 'vehicle', header: 'Vehicle', accessor: (r) => vehicleName(r.vehicleId), render: (r) => vehicleName(r.vehicleId) },
    { id: 'ward', header: 'Ward', accessor: (r) => wardName(r.wardId), render: (r) => wardName(r.wardId), hideOnMobile: true },
    { id: 'sev', header: 'Severity', accessor: 'severity', hideOnMobile: true },
    { id: 'conf', header: 'Confidence', accessor: (r) => `${r.confidence}%`, render: (r) => `${r.confidence}%`, hideOnMobile: true },
    { id: 'status', header: 'Status', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
    { id: 'ts', header: 'Detected', accessor: (r) => formatDateTime(r.timestamp), render: (r) => formatDateTime(r.timestamp), hideOnMobile: true },
  ];

  const review = async (action) => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.reviewAiEvent(selected.id, action, note || undefined, actor, team || null);
      showToast(`Event ${selected.id} → ${action}`);
      setNote('');
    } catch (err) {
      showToast(err.message || 'Review failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const startLiveView = () => {
    clearLiveTimers();
    const duration = LIVE_MIN_MS + Math.floor(Math.random() * (LIVE_MAX_MS - LIVE_MIN_MS + 1));
    const startedAt = Date.now();
    setLiveActive(true);
    setLiveProgress(0);
    setLiveLabel(`DEMO live view · ${Math.round(duration / 60000)} min session`);
    showToast('DEMO live-view started — simulated feed only');

    liveInterval.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setLiveProgress(pct);
      if (pct >= 100) {
        clearLiveTimers();
        setLiveActive(false);
        setLiveLabel('DEMO session ended');
        showToast('DEMO live-view ended', 'info');
      }
    }, 1000);

    const endId = setTimeout(() => {
      clearLiveTimers();
      setLiveActive(false);
      setLiveProgress(100);
      setLiveLabel('DEMO session ended');
      showToast('DEMO live-view ended', 'info');
    }, duration);
    liveTimers.current.push(endId);
  };

  const stopLiveView = () => {
    clearLiveTimers();
    setLiveActive(false);
    setLiveProgress(0);
    setLiveLabel('Stopped by user');
    showToast('DEMO live-view stopped', 'info');
  };

  if (loading || !data) return <LoadingState />;

  const openCount = filtered.filter((e) => !['Resolved', 'False Positive'].includes(e.status)).length;
  const highConf = filtered.filter((e) => e.confidence >= 85).length;

  return (
    <PageContainer>
      <PageHeader
        title="Dashcam & AI Events"
        subtitle="Review simulated dashcam detections, confirm or dismiss alerts, and run a DEMO live-view session."
        breadcrumbs={[{ label: 'Civic Issues', to: '/complaints' }, { label: 'Dashcam & AI Events' }]}
      />

      <Alert severity="info" icon={false}>
        Dashcam events are rows in the grievance register. Open them with the Dashcam filter on{' '}
        <RouterLink to="/complaints?source=ai">Complaints</RouterLink>.
        {' '}Synthetic placeholders only — no live camera.
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
      </Alert>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Filtered events" value={filtered.length} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Open / active" value={openCount} color="warning" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Confidence ≥ 85%" value={highConf} color="secondary" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard title="Live view" value={liveActive ? 'Running' : 'Idle'} color="info" subtitle={liveLabel || '2–5 min DEMO'} />
        </Grid>
      </Grid>

      <SectionCard
        title="DEMO live-view"
        subtitle="Simulated 2–5 min session"
        action={
          !liveActive ? (
            <Button variant="contained" size="small" startIcon={<Play size={16} />} onClick={startLiveView}>
              Start
            </Button>
          ) : (
            <Button variant="outlined" size="small" color="error" startIcon={<Square size={16} />} onClick={stopLiveView}>
              Stop
            </Button>
          )
        }
      >
        <Box sx={{ minWidth: 160 }}>
          <LinearProgress variant="determinate" value={liveProgress} sx={{ height: 8, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {liveActive ? `${liveProgress}% of simulated session` : (liveLabel || 'Idle')}
          </Typography>
        </Box>
        {liveActive && (
          <Box
            sx={{
              mt: 2,
              height: 160,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px dashed',
              borderColor: 'divider',
              display: 'grid',
              placeItems: 'center',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)',
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <Eye size={28} />
              <Typography variant="body2" fontWeight={600}>Simulated stream · blurred privacy mask</Typography>
              <Typography variant="caption" color="text.secondary">No real video is playing</Typography>
            </Stack>
          </Box>
        )}
      </SectionCard>

      <FilterBar
        endActions={
          (type || status || wardId || minConfidence) ? (
            <Button onClick={() => { setType(''); setStatus(''); setWardId(''); setMinConfidence(0); }}>
              Clear filters
            </Button>
          ) : null
        }
      >
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <MenuItem value="">All types</MenuItem>
            {AI_EVENT_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All statuses</MenuItem>
            {AI_EVENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All wards</MenuItem>
            {wards.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ minWidth: { xs: '100%', sm: 180 }, maxWidth: { sm: 220 }, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Min confidence: {minConfidence}%</Typography>
          <Slider
            size="small"
            value={minConfidence}
            onChange={(_, v) => setMinConfidence(v)}
            step={5}
            min={0}
            max={95}
            valueLabelDisplay="auto"
          />
        </Box>
      </FilterBar>

      <SectionCard title="Snapshot wall" subtitle="Detection placeholders">
        {snapshots.length === 0 ? (
          <EmptyState title="No snapshots" description="Adjust filters to see detection placeholders." />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(auto-fill, minmax(140px, 1fr))',
              },
              gap: 1.25,
            }}
          >
            {snapshots.map((s) => (
              <Paper
                key={s.id}
                variant="outlined"
                onClick={() => setSelectedId(s.id)}
                sx={{
                  minWidth: 0,
                  p: 1,
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box
                  sx={{
                    height: 72,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    display: 'grid',
                    placeItems: 'center',
                    backgroundImage: 'linear-gradient(135deg, rgba(18,48,74,0.08), rgba(21,150,106,0.08))',
                  }}
                >
                  <Typography variant="caption" textAlign="center" px={0.5} sx={{ wordBreak: 'break-word' }}>{s.label}</Typography>
                </Box>
                <Typography variant="caption" fontWeight={600} display="block" noWrap title={s.type}>{s.type}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" noWrap title={s.vehicle}>{s.vehicle}</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.75 }} alignItems="flex-start">
                  <Chip size="small" label={`${s.confidence}%`} sx={{ height: 20, fontSize: 10 }} />
                  <StatusChip status={s.status} />
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </SectionCard>

      <SectionCard title="Events">
        <DataTable
          columns={columns}
          rows={filtered}
          onRowClick={(r) => setSelectedId(r.id)}
          searchPlaceholder="Search events…"
          emptyTitle="No AI events match filters"
        />
      </SectionCard>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}
      >
        {selected && (
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">{selected.type}</Typography>
                <Typography variant="body2" color="text.secondary">{selected.id}</Typography>
              </Box>
              <IconButton onClick={() => setSelectedId(null)} aria-label="Close">
                <X size={18} />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
              <StatusChip status={selected.status} />
              <Chip size="small" label={selected.severity} />
              <Chip size="small" label={`${selected.confidence}% conf`} variant="outlined" />
            </Stack>

            <Box
              sx={{
                height: 120,
                mb: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px dashed',
                borderColor: 'divider',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Typography variant="caption" textAlign="center" px={2}>
                Placeholder snapshot · {selected.evidencePlaceholder}
                <br />
                Faces / plates blurred (demo privacy mask)
              </Typography>
            </Box>

            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="body2">Vehicle: {vehicleName(selected.vehicleId)}</Typography>
              <Typography variant="body2">Ward: {wardName(selected.wardId)}</Typography>
              <Typography variant="body2">Detected: {formatDateTime(selected.timestamp)}</Typography>
              <Typography variant="body2">
                Position: {selected.lat?.toFixed?.(5) ?? '—'}, {selected.lng?.toFixed?.(5) ?? '—'}
              </Typography>
              <Typography variant="body2">Assigned: {selected.assignedTeam || '—'}</Typography>
            </Stack>

            <TextField
              fullWidth
              size="small"
              label="Review notes"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              minRows={2}
              sx={{ mb: 1 }}
            />
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Assign team / supervisor</InputLabel>
              <Select
                label="Assign team / supervisor"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {supervisors.map((s) => (
                  <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>Review actions</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Button size="small" variant="contained" disabled={busy} onClick={() => review('confirm')}>Confirm</Button>
              <Button size="small" variant="outlined" disabled={busy} onClick={() => review('falsePositive')}>False positive</Button>
              <Button size="small" variant="outlined" disabled={busy} onClick={() => review('assign')}>Assign</Button>
              <Button size="small" variant="outlined" color="warning" disabled={busy} onClick={() => review('escalate')}>Escalate</Button>
              <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => review('resolve')}>Resolve</Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />
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
    </PageContainer>
  );
}
