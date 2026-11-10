import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isAfter,
  startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import LoadingState from '../../components/common/LoadingState';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { todayISO } from '../../utils/date';

const OUTCOMES = {
  collected: 'collected',
  missed_by_auto: 'missed_by_auto',
  garbage_not_kept: 'garbage_not_kept',
  no_service: 'no_service',
};

const REASON_OPTIONS = {
  missed_by_auto: [
    'Auto did not come to our street',
    'Auto skipped our house',
    'Auto came very late / after we left',
    'Other',
  ],
  garbage_not_kept: [
    'We did not keep garbage out',
    'We were not at home',
    'Bin was empty / no waste that day',
    'Other',
  ],
};

const STATUS_SX = {
  collected: { bgcolor: 'rgba(45,190,106,0.2)', color: '#146C43', border: '1px solid rgba(45,190,106,0.45)' },
  missed_by_auto: { bgcolor: 'rgba(211,47,47,0.12)', color: '#B42318', border: '1px solid rgba(211,47,47,0.35)' },
  garbage_not_kept: { bgcolor: 'rgba(245,158,11,0.16)', color: '#B45309', border: '1px solid rgba(245,158,11,0.4)' },
  no_service: { bgcolor: 'rgba(100,116,139,0.12)', color: '#475569', border: '1px solid rgba(100,116,139,0.3)' },
  none: { bgcolor: 'rgba(148,163,184,0.1)', color: '#64748B', border: '1px solid rgba(148,163,184,0.25)' },
  future: { bgcolor: 'transparent', color: 'text.disabled', border: '1px dashed rgba(148,163,184,0.35)' },
};

function resolveOutcome(fb) {
  if (!fb) return 'none';
  if (fb.outcome) return fb.outcome;
  if (fb.noService) return OUTCOMES.no_service;
  if (fb.collected) return OUTCOMES.collected;
  return OUTCOMES.missed_by_auto;
}

function outcomeLabel(t, outcome) {
  const map = {
    collected: t('outcomeCollected'),
    missed_by_auto: t('outcomeMissedByAuto'),
    garbage_not_kept: t('outcomeGarbageNotKept'),
    no_service: t('outcomeNoService'),
    none: t('noReportShort'),
    future: '—',
  };
  return map[outcome] || outcome;
}

export default function CollectionCalendarPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [outcome, setOutcome] = useState(OUTCOMES.collected);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const byDate = useMemo(() => {
    const map = new Map();
    if (!data?.feedback || !user) return map;
    data.feedback
      .filter((f) => f.citizenId === user.id)
      .forEach((f) => {
        if (!map.has(f.date)) map.set(f.date, f);
      });
    return map;
  }, [data, user]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const monthStats = useMemo(() => {
    const stats = { collected: 0, missed_by_auto: 0, garbage_not_kept: 0, no_service: 0 };
    monthDays.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      if (isAfter(startOfDay(d), startOfDay(new Date()))) return;
      const o = resolveOutcome(byDate.get(key));
      if (stats[o] != null) stats[o] += 1;
    });
    return stats;
  }, [monthDays, byDate]);

  const openDay = (day) => {
    if (isAfter(startOfDay(day), startOfDay(new Date()))) return;
    const key = format(day, 'yyyy-MM-dd');
    const fb = byDate.get(key);
    const o = resolveOutcome(fb);
    setSelectedDate(key);
    setOutcome(o === 'none' ? OUTCOMES.collected : o);
    setReason(fb?.reason || '');
    setComment(fb?.comment || '');
  };

  const needsReason = outcome === OUTCOMES.missed_by_auto || outcome === OUTCOMES.garbage_not_kept;

  const saveDay = async () => {
    if (needsReason && !reason.trim() && !comment.trim()) {
      showToast(t('reasonRequired'), 'warning');
      return;
    }
    setSaving(true);
    try {
      const reasonValue = needsReason
        ? (reason === 'Other' || !REASON_OPTIONS[outcome]?.includes(reason)
          ? comment.trim()
          : reason.trim())
        : undefined;
      await api.submitFeedback({
        citizenId: user.id,
        wardId: user.wardId,
        blockId: user.blockId,
        date: selectedDate,
        collected: outcome === OUTCOMES.collected,
        outcome,
        noService: outcome === OUTCOMES.no_service,
        reason: reasonValue || undefined,
        comment: comment.trim() || undefined,
        rating: outcome === OUTCOMES.collected ? 4 : 2,
        segregationFeedback: outcome === OUTCOMES.collected ? 'Good' : 'Partial',
      }, user.name);
      showToast(t('dayUpdated'), 'success');
      setSelectedDate(null);
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data || !user) return <LoadingState />;

  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startPad = startOfMonth(monthCursor).getDay();
  const today = todayISO();
  const selectedFb = selectedDate ? byDate.get(selectedDate) : null;

  return (
    <PageContainer>
      <PageHeader
        title={t('collectionCalendar')}
        subtitle={t('collectionCalendarPageHint')}
      />

      <Alert severity="info" icon={false}>
        {t('collectionCalendarHint')}
      </Alert>

      <SectionCard
        title={format(monthCursor, 'MMMM yyyy')}
        action={
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" onClick={() => setMonthCursor((m) => subMonths(m, 1))} aria-label="Previous month">
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => setMonthCursor((m) => addMonths(m, 1))} aria-label="Next month">
              <ChevronRight size={18} />
            </IconButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ px: 1, py: 0.35, borderRadius: 1, ...STATUS_SX.collected }}>
              {t('outcomeCollected')}: {monthStats.collected}
            </Typography>
            <Typography variant="caption" sx={{ px: 1, py: 0.35, borderRadius: 1, ...STATUS_SX.missed_by_auto }}>
              {t('outcomeMissedByAuto')}: {monthStats.missed_by_auto}
            </Typography>
            <Typography variant="caption" sx={{ px: 1, py: 0.35, borderRadius: 1, ...STATUS_SX.garbage_not_kept }}>
              {t('outcomeGarbageNotKept')}: {monthStats.garbage_not_kept}
            </Typography>
            <Typography variant="caption" sx={{ px: 1, py: 0.35, borderRadius: 1, ...STATUS_SX.no_service }}>
              {t('outcomeNoService')}: {monthStats.no_service}
            </Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {weekLabels.map((d) => (
              <Typography key={d} variant="caption" fontWeight={700} color="text.secondary" textAlign="center" sx={{ py: 0.5 }}>
                {d}
              </Typography>
            ))}
            {Array.from({ length: startPad }).map((_, i) => (
              <Box key={`pad-${i}`} />
            ))}
            {monthDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const future = isAfter(startOfDay(day), startOfDay(new Date()));
              const status = future ? 'future' : resolveOutcome(byDate.get(key));
              const isToday = key === today;
              return (
                <Box
                  key={key}
                  component="button"
                  type="button"
                  disabled={future}
                  onClick={() => openDay(day)}
                  sx={{
                    minHeight: { xs: 52, sm: 60 },
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 0.25,
                    cursor: future ? 'default' : 'pointer',
                    ...STATUS_SX[status],
                    outline: isToday ? '2px solid' : 'none',
                    outlineColor: 'primary.main',
                    outlineOffset: 1,
                    font: 'inherit',
                  }}
                >
                  <Typography variant="caption" fontWeight={isToday ? 800 : 600}>
                    {format(day, 'd')}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1.1 }}>
                    {status === 'collected' && '✓'}
                    {status === 'missed_by_auto' && '✗'}
                    {status === 'garbage_not_kept' && '!'}
                    {status === 'no_service' && '—'}
                    {status === 'none' && '·'}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {!isSameMonth(monthCursor, new Date()) && (
            <Button size="small" onClick={() => setMonthCursor(startOfMonth(new Date()))}>
              {t('thisMonth')}
            </Button>
          )}
        </Stack>
      </SectionCard>

      <SectionCard title={t('recentDayNotes')}>
        <Stack spacing={1.25}>
          {[...byDate.values()]
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 8)
            .map((fb) => {
              const o = resolveOutcome(fb);
              return (
                <Box
                  key={fb.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={700}>
                      {format(new Date(`${fb.date}T12:00:00`), 'dd MMM yyyy')}
                    </Typography>
                    <Typography variant="caption" sx={{ px: 1, py: 0.25, borderRadius: 1, ...STATUS_SX[o] }}>
                      {outcomeLabel(t, o)}
                    </Typography>
                  </Stack>
                  {(fb.reason || fb.comment) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {fb.reason || fb.comment}
                    </Typography>
                  )}
                </Box>
              );
            })}
        </Stack>
      </SectionCard>

      <Dialog open={Boolean(selectedDate)} onClose={() => setSelectedDate(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {selectedDate ? format(new Date(`${selectedDate}T12:00:00`), 'dd MMM yyyy') : ''}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {selectedFb && (
              <Alert severity="info" icon={false}>
                {t('existingRecordHint')}
              </Alert>
            )}
            <FormControl>
              <FormLabel>{t('whatHappenedThatDay')}</FormLabel>
              <RadioGroup value={outcome} onChange={(e) => { setOutcome(e.target.value); setReason(''); }}>
                <FormControlLabel value={OUTCOMES.collected} control={<Radio />} label={t('outcomeCollected')} />
                <FormControlLabel value={OUTCOMES.missed_by_auto} control={<Radio />} label={t('outcomeMissedByAuto')} />
                <FormControlLabel value={OUTCOMES.garbage_not_kept} control={<Radio />} label={t('outcomeGarbageNotKept')} />
                <FormControlLabel value={OUTCOMES.no_service} control={<Radio />} label={t('outcomeNoService')} />
              </RadioGroup>
            </FormControl>

            {needsReason && (
              <FormControl fullWidth required>
                <InputLabel>{t('reason')}</InputLabel>
                <Select
                  label={t('reason')}
                  value={REASON_OPTIONS[outcome]?.includes(reason) ? reason : (reason ? 'Other' : '')}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {(REASON_OPTIONS[outcome] || []).map((r) => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label={needsReason ? t('reasonComment') : t('commentOptional')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              required={needsReason && (reason === 'Other' || !reason)}
              helperText={needsReason ? t('reasonRequiredHint') : undefined}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDate(null)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={saveDay} disabled={saving}>
            {saving ? '…' : t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
