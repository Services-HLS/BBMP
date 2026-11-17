import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Divider, Drawer, FormControl, InputLabel, MenuItem,
  Select, Stack, Tab, Tabs, TextField, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import {
  UserPlus, RefreshCw, StickyNote, AlertTriangle, CheckCircle2, Flag, ArrowUpCircle,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import StatusChip from '../components/common/StatusChip';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import useOpsScope from '../hooks/useOpsScope';
import {
  COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUSES, APP_ENV_LABEL,
} from '../constants';
import { formatDateTime } from '../utils/date';
import { exportTableCsv } from '../utils/csv';
import {
  ISSUE_SOURCES, categoryRule, isOverdue, matchesIssueTab, timeLeftLabel,
} from '../utils/issues';

const GPS_CATEGORIES = [
  'Skipped Household Pickup',
  'Late Auto',
  'Missed Dry Waste Collection',
  'Sweeping waste not lifted',
];

const TAB_DEFS = [
  { id: 'all', label: 'All' },
  { id: 'submitted', label: 'New / Submitted' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'onsite', label: 'On site' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'closed', label: 'Closed' },
  { id: 'reopened', label: 'Reopened' },
];

const EMPTY_CONFIRM = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  confirmColor: 'primary',
  onConfirm: null,
};

export default function ComplaintsPage() {
  const { data, api, loading: storeLoading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { scopeWards, isScoped, allowedWardIdList, scopeLabel } = useOpsScope();

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState(searchParams.get('source') || '');

  useEffect(() => {
    setSource(searchParams.get('source') || '');
  }, [searchParams]);
  const [category, setCategory] = useState('');
  const [wardId, setWardId] = useState('');
  const [priority, setPriority] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirm, setConfirm] = useState(EMPTY_CONFIRM);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [nextPriority, setNextPriority] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [proofKind, setProofKind] = useState('photo');
  const [proofDistance, setProofDistance] = useState('8');
  const [proofFileName, setProofFileName] = useState('');

  const wards = useMemo(() => scopeWards(data?.wards || []), [data?.wards, scopeWards]);
  const supervisors = data?.supervisors || [];
  const actor = user?.name || 'Demo User';

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getIssueRegister({
        source: source || undefined,
        wardId: wardId || undefined,
        wardIds: !wardId && isScoped ? allowedWardIdList : undefined,
      });
      setRows(list);
    } catch (err) {
      showToast(err.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, source, wardId, showToast, isScoped, allowedWardIdList]);

  useEffect(() => {
    if (!storeLoading && data) loadComplaints();
  }, [storeLoading, data, loadComplaints]);

  const filtered = useMemo(() => {
    let list = rows.filter((c) => matchesIssueTab(c, tab));
    if (category) list = list.filter((c) => c.category === category);
    if (priority) list = list.filter((c) => c.priority === priority);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, tab, priority, category, search]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TAB_DEFS.forEach((t) => {
      counts[t.id] = rows.filter((c) => matchesIssueTab(c, t.id)).length;
    });
    return counts;
  }, [rows]);

  const wardName = (id) => wards.find((w) => w.id === id)?.name || id || '—';
  const blockLabel = (id) => data?.blocks?.find((b) => b.id === id)?.code || id || '—';
  const packageLabel = (id) => data?.packages?.find((p) => p.id === id)?.name || '—';
  const contractorLabel = (id) => data?.contractors?.find((c) => c.id === id)?.name || '—';
  const sourceLabel = (id) => ISSUE_SOURCES.find((s) => s.id === id)?.label || id || 'Citizen complaint';
  const supervisorName = (id) => supervisors.find((s) => s.id === id)?.name || id || 'Unassigned';

  const openDetail = (row) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  const closeDrawerRequest = () => {
    setConfirm({
      open: true,
      title: 'Close complaint detail?',
      message: 'Any unfinished action forms will be discarded. Confirm to close the detail panel.',
      confirmLabel: 'Close panel',
      confirmColor: 'primary',
      onConfirm: () => {
        setDrawerOpen(false);
        setSelected(null);
        setConfirm(EMPTY_CONFIRM);
      },
    });
  };

  const refreshSelected = async (id) => {
    const fresh = await api.getComplaint(id);
    setSelected(fresh);
    await loadComplaints();
    return fresh;
  };

  const runConfirmed = async (fn, successMsg) => {
    setActionBusy(true);
    try {
      await fn();
      if (selected?.id) await refreshSelected(selected.id);
      else await loadComplaints();
      showToast(successMsg, 'success');
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionBusy(false);
      setConfirm(EMPTY_CONFIRM);
    }
  };

  const requestAssign = () => {
    setAssignTo(selected?.assignedTo || '');
    setAssignOpen(true);
  };

  const submitAssign = () => {
    if (!assignTo) {
      showToast('Select a supervisor', 'warning');
      return;
    }
    const name = supervisorName(assignTo);
    setAssignOpen(false);
    setConfirm({
      open: true,
      title: 'Confirm assignment',
      message: `Assign ${selected.id} to ${name}? This updates the demo complaint record.`,
      confirmLabel: 'Assign',
      confirmColor: 'primary',
      onConfirm: () => runConfirmed(
        () => api.assignComplaint(selected.id, assignTo, actor),
        `Assigned ${selected.id} to ${name}`
      ),
    });
  };

  const requestStatusChange = () => {
    setNextStatus(selected?.status || 'Submitted');
    setStatusNote('');
    setStatusOpen(true);
  };

  const submitStatusChange = () => {
    if (!nextStatus) return;
    setStatusOpen(false);
    setConfirm({
      open: true,
      title: 'Confirm status change',
      message: `Change ${selected.id} status to "${nextStatus}"?`,
      confirmLabel: 'Update status',
      confirmColor: 'primary',
      onConfirm: () => runConfirmed(
        () => api.updateComplaintStatus(selected.id, nextStatus, statusNote || `Status → ${nextStatus}`, actor),
        `Status updated to ${nextStatus}`
      ),
    });
  };

  const requestPriorityChange = () => {
    setNextPriority(selected?.priority || 'Medium');
    setPriorityOpen(true);
  };

  const submitPriorityChange = () => {
    setPriorityOpen(false);
    setConfirm({
      open: true,
      title: 'Confirm priority change',
      message: `Set priority of ${selected.id} to ${nextPriority}?`,
      confirmLabel: 'Update priority',
      confirmColor: 'warning',
      onConfirm: () => runConfirmed(
        () => api.updateComplaintPriority(selected.id, nextPriority, actor),
        `Priority set to ${nextPriority}`
      ),
    });
  };

  const requestNote = () => {
    setNoteText('');
    setNoteOpen(true);
  };

  const submitNote = () => {
    if (!noteText.trim()) {
      showToast('Enter a note', 'warning');
      return;
    }
    setNoteOpen(false);
    setConfirm({
      open: true,
      title: 'Add note?',
      message: 'Append this note to the complaint history (demo record).',
      confirmLabel: 'Add note',
      onConfirm: () => runConfirmed(
        () => api.addComplaintNote(selected.id, noteText.trim(), actor),
        'Note added'
      ),
    });
  };

  const requestEscalate = () => {
    setEscalateReason('');
    setEscalateOpen(true);
  };

  const submitEscalate = () => {
    if (!escalateReason.trim()) {
      showToast('Provide an escalation reason', 'warning');
      return;
    }
    setEscalateOpen(false);
    setConfirm({
      open: true,
      title: 'Escalate complaint?',
      message: `Escalate ${selected.id} to Critical priority and record the reason. This cannot be undone silently.`,
      confirmLabel: 'Escalate',
      confirmColor: 'error',
      onConfirm: () => runConfirmed(async () => {
        await api.updateComplaintPriority(selected.id, 'Critical', actor);
        await api.addComplaintNote(selected.id, `Escalated: ${escalateReason.trim()}`, actor);
      }, `${selected.id} escalated`),
    });
  };

  const requestResolve = () => {
    setResolveNote('');
    setProofKind('photo');
    setProofDistance('8');
    setProofFileName('');
    setResolveOpen(true);
  };

  const submitResolve = () => {
    const rule = categoryRule(selected?.category);
    const needsProof = rule && rule.evidence !== 'none';
    if (needsProof && proofKind === 'photo' && !proofFileName) {
      showToast('Take the after-photo with the camera. Gallery photos are not accepted.', 'warning');
      return;
    }
    const proof = needsProof ? {
      id: `photo-${selected.id}-${Date.now()}`,
      kind: proofKind,
      source: proofKind === 'photo' ? 'camera' : 'gps',
      distanceM: Number(proofDistance),
      capturedAt: new Date().toISOString(),
    } : null;
    setResolveOpen(false);
    setConfirm({
      open: true,
      title: 'Submit closure proof?',
      message: `Send ${selected.id} to the JHI as closure submitted. The citizen confirms after the proof is approved.`,
      confirmLabel: 'Submit proof',
      confirmColor: 'success',
      onConfirm: () => runConfirmed(
        () => api.updateComplaintStatus(
          selected.id,
          'Closure submitted',
          resolveNote || 'Closure submitted with proof',
          actor,
          proof
        ),
        `${selected.id} closure submitted`
      ),
    });
  };

  const decideProof = (approved) => {
    setConfirm({
      open: true,
      title: approved ? 'Approve proof?' : 'Reject proof?',
      message: approved
        ? `${selected.id} goes to the citizen to confirm or reopen within 48 hours.`
        : `${selected.id} goes back to Assigned.`,
      confirmLabel: approved ? 'Approve' : 'Reject',
      confirmColor: approved ? 'success' : 'error',
      onConfirm: () => runConfirmed(
        () => api.updateComplaintStatus(
          selected.id,
          approved ? 'Pending citizen' : 'Assigned',
          approved ? 'JHI approved the proof' : 'JHI rejected the proof',
          actor
        ),
        approved ? `${selected.id} waiting for the citizen` : `${selected.id} returned to Assigned`
      ),
    });
  };

  const confirmClosed = () => {
    setConfirm({
      open: true,
      title: 'Confirm this issue is closed?',
      message: `${selected.id} will be marked Closed.`,
      confirmLabel: 'Confirm closed',
      confirmColor: 'success',
      onConfirm: () => runConfirmed(
        () => api.updateComplaintStatus(selected.id, 'Closed', 'Citizen confirmed the fix', actor),
        `${selected.id} closed`
      ),
    });
  };

  const columns = useMemo(() => [
    { id: 'id', header: 'ID', accessor: 'id', hideOnMobile: true },
    { id: 'title', header: 'Title', accessor: 'title' },
    {
      id: 'source',
      header: 'Source',
      accessor: (r) => sourceLabel(r.source),
      render: (r) => sourceLabel(r.source),
      hideOnMobile: true,
    },
    { id: 'category', header: 'Category', accessor: 'category', hideOnMobile: true },
    {
      id: 'block',
      header: 'Block',
      accessor: (r) => blockLabel(r.blockId),
      render: (r) => blockLabel(r.blockId),
      hideOnMobile: true,
    },
    {
      id: 'package',
      header: 'Package',
      accessor: (r) => packageLabel(r.packageId),
      render: (r) => packageLabel(r.packageId),
      hideOnMobile: true,
    },
    {
      id: 'ward',
      header: 'Ward',
      accessor: (r) => wardName(r.wardId),
      render: (r) => wardName(r.wardId),
      hideOnMobile: true,
    },
    {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      render: (r) => <StatusChip status={r.priority} />,
      hideOnMobile: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      render: (r) => (
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
          <StatusChip status={r.status} />
          {isOverdue(r) && <Chip size="small" color="error" label="Overdue" />}
        </Stack>
      ),
    },
    {
      id: 'sla',
      header: 'SLA due',
      accessor: (r) => (r.slaDeadline ? formatDateTime(r.slaDeadline) : 'No SLA'),
      render: (r) => (r.slaDeadline ? formatDateTime(r.slaDeadline) : 'No SLA'),
      hideOnMobile: true,
    },
    {
      id: 'timeLeft',
      header: 'Time left',
      accessor: (r) => timeLeftLabel(r.slaDeadline, Date.now(), r.status),
      render: (r) => timeLeftLabel(r.slaDeadline, Date.now(), r.status),
      hideOnMobile: true,
    },
    {
      id: 'created',
      header: 'Created',
      accessor: (r) => formatDateTime(r.createdAt),
      render: (r) => formatDateTime(r.createdAt),
      hideOnMobile: true,
    },
  ], [wards, data?.blocks, data?.packages]);

  const handleExport = () => {
    exportTableCsv(
      'bswml-complaints-sample.csv',
      filtered,
      [
        { header: 'ID', accessor: 'id' },
        { header: 'Title', accessor: 'title' },
        { header: 'Category', accessor: 'category' },
        { header: 'Ward', accessor: (r) => wardName(r.wardId) },
        { header: 'Priority', accessor: 'priority' },
        { header: 'Status', accessor: 'status' },
        { header: 'Created', accessor: (r) => formatDateTime(r.createdAt) },
      ]
    );
    showToast('Exported sample complaints CSV', 'info');
  };

  if (storeLoading && !data) {
    return <LoadingState label="Loading complaints…" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Complaints"
        subtitle="One grievance register. Complaints, black spots, and dashcam events are rows in this list. Closure needs a camera photo or a GPS stop."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Complaints' }]}
        actions={(
          <>
            <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadComplaints}>
              Refresh
            </Button>
            <Button variant="contained" onClick={handleExport}>
              Export CSV
            </Button>
          </>
        )}
      />

      <Alert severity="info" icon={false}>
        {APP_ENV_LABEL}. Overdue is a flag, not a status. Potholes and suggestions have no SLA. Black spots and dashcam rows open on their own screens.
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
      </Alert>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider', maxWidth: '100%' }}
      >
        {TAB_DEFS.map((t) => (
          <Tab
            key={t.id}
            value={t.id}
            label={`${t.label} (${tabCounts[t.id] ?? 0})`}
          />
        ))}
      </Tabs>

      <FilterBar>
        <TextField
          size="small"
          label="Search"
          placeholder="ID, title, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small">
          <InputLabel>Source</InputLabel>
          <Select label="Source" value={source} onChange={(e) => setSource(e.target.value)}>
            <MenuItem value="">All sources</MenuItem>
            {ISSUE_SOURCES.map((item) => (
              <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <MenuItem value="">All categories</MenuItem>
            {COMPLAINT_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
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
        <FormControl size="small">
          <InputLabel>Priority</InputLabel>
          <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {COMPLAINT_PRIORITIES.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>

      {loading ? (
        <LoadingState label="Filtering complaints…" />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          searchable={false}
          onRowClick={openDetail}
          emptyTitle="No complaints in this view"
          emptyDescription="Try another tab or clear filters. Sample data only."
        />
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawerRequest}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}
      >
        {selected ? (
          <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography variant="h6">{selected.id}</Typography>
                <Typography variant="body2" color="text.secondary">{selected.title}</Typography>
              </Box>
              <Button size="small" onClick={closeDrawerRequest}>Close</Button>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 2 }} flexWrap="wrap" useFlexGap>
              <StatusChip status={selected.status} />
              <StatusChip status={selected.priority} />
              {isOverdue(selected) && <Chip size="small" color="error" label="Overdue" />}
            </Stack>

            <Typography variant="body2" sx={{ mb: 1 }}>{selected.description}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Source: {sourceLabel(selected.source)} · Category: {selected.category}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Ward: {wardName(selected.wardId)} · Block: {blockLabel(selected.blockId)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Package: {packageLabel(selected.packageId)} · Contractor: {contractorLabel(selected.contractorId)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Reporter: {selected.reporterName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Assigned: {supervisorName(selected.assignedTo)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Created: {formatDateTime(selected.createdAt)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              SLA: {selected.slaDeadline ? `${formatDateTime(selected.slaDeadline)} · ${timeLeftLabel(selected.slaDeadline)}` : 'No SLA'}
            </Typography>

            {selected.readOnly && (
              <Alert severity="info" icon={false} sx={{ mb: 2 }}>
                This {sourceLabel(selected.source).toLowerCase()} row is part of the register. Update it on {selected.link === '/dashcam' ? 'Dashcam' : 'Sweeping'}.
              </Alert>
            )}

            {!selected.readOnly && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Button size="small" variant="outlined" startIcon={<UserPlus size={14} />} onClick={requestAssign}>
                Assign
              </Button>
              <Button size="small" variant="outlined" startIcon={<RefreshCw size={14} />} onClick={requestStatusChange}>
                Status
              </Button>
              <Button size="small" variant="outlined" startIcon={<Flag size={14} />} onClick={requestPriorityChange}>
                Priority
              </Button>
              <Button size="small" variant="outlined" startIcon={<StickyNote size={14} />} onClick={requestNote}>
                Note
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<ArrowUpCircle size={14} />} onClick={requestEscalate}>
                Escalate
              </Button>
              {!['Resolved', 'Closed', 'Pending citizen', 'Closure submitted', 'Invalid'].includes(selected.status) && (
                <Button size="small" variant="contained" color="success" startIcon={<CheckCircle2 size={14} />} onClick={requestResolve}>
                  Submit proof
                </Button>
              )}
              {selected.status === 'Closure submitted' && (
                <>
                  <Button size="small" variant="contained" color="success" onClick={() => decideProof(true)}>
                    Approve proof
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => decideProof(false)}>
                    Reject proof
                  </Button>
                </>
              )}
              {selected.status === 'Pending citizen' && (
                <Button size="small" variant="contained" onClick={confirmClosed}>
                  Citizen confirmed
                </Button>
              )}
            </Stack>
            )}

            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2" gutterBottom>History</Typography>
            {(selected.history || []).length === 0 ? (
              <EmptyState title="No history" />
            ) : (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {[...(selected.history || [])].reverse().map((h, i) => (
                  <Box key={`${h.at}-${i}`} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={h.action} variant="outlined" />
                      <Typography variant="caption" color="text.secondary">{formatDateTime(h.at)}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{h.note}</Typography>
                    <Typography variant="caption" color="text.secondary">by {h.by}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : null}
      </Drawer>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign supervisor</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Supervisor</InputLabel>
            <Select label="Supervisor" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              {supervisors.filter((s) => s.active !== false).map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name} ({s.role})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitAssign}>Continue</Button>
        </DialogActions>
      </Dialog>

      {/* Status dialog */}
      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              {COMPLAINT_STATUSES.filter((s) => s !== 'Resolved').map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Note"
            multiline
            minRows={2}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitStatusChange}>Continue</Button>
        </DialogActions>
      </Dialog>

      {/* Priority dialog */}
      <Dialog open={priorityOpen} onClose={() => setPriorityOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change priority</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={nextPriority} onChange={(e) => setNextPriority(e.target.value)}>
              {COMPLAINT_PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPriorityOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={submitPriorityChange}>Continue</Button>
        </DialogActions>
      </Dialog>

      {/* Note dialog */}
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Note"
            multiline
            minRows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitNote}>Continue</Button>
        </DialogActions>
      </Dialog>

      {/* Escalate dialog */}
      <Dialog open={escalateOpen} onClose={() => setEscalateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <AlertTriangle size={18} />
            <span>Escalate</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Escalation reason"
            multiline
            minRows={3}
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEscalateOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitEscalate}>Continue</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Closure proof</DialogTitle>
        <DialogContent>
          <Alert severity="info" icon={false} sx={{ mt: 1, mb: 2 }}>
            Use the camera in this app. The photo must be within 10 m of the pin and no more than 30 minutes old. Pickup categories can use a GPS stop within 25 m instead.
          </Alert>
          <TextField
            fullWidth
            size="small"
            label="Note"
            multiline
            minRows={2}
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl>
            <RadioGroup value={proofKind} onChange={(e) => setProofKind(e.target.value)}>
              <FormControlLabel value="photo" control={<Radio />} label="After-photo from the camera" />
              {GPS_CATEGORIES.includes(selected?.category) && (
                <FormControlLabel value="gps" control={<Radio />} label="GPS stop at the building" />
              )}
            </RadioGroup>
          </FormControl>
          {proofKind === 'photo' && (
            <Button variant="outlined" component="label" sx={{ mt: 1 }}>
              {proofFileName ? `Camera: ${proofFileName}` : 'Open camera'}
              <input
                hidden
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setProofFileName(e.target.files?.[0]?.name || '')}
              />
            </Button>
          )}
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Distance to pin (metres)"
            value={proofDistance}
            onChange={(e) => setProofDistance(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Must be 10 m or less for a photo, 25 m or less for a GPS stop."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResolveOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={submitResolve}>Continue</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        confirmColor={confirm.confirmColor}
        loading={actionBusy}
        onCancel={() => !actionBusy && setConfirm(EMPTY_CONFIRM)}
        onConfirm={() => confirm.onConfirm?.()}
      />
    </PageContainer>
  );
}
