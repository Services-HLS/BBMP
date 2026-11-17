import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, FormControl, FormControlLabel, FormLabel,
  Radio, RadioGroup, Rating, Stack, TextField, Typography, MenuItem, Select, InputLabel,
} from '@mui/material';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import StatusChip from '../../components/common/StatusChip';
import LoadingState from '../../components/common/LoadingState';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { todayISO, formatDateTime } from '../../utils/date';
import { formatHouseAddress, getCitizenHouseAddress, hasHouseAddress } from '../../utils/citizenAddress';

const OUTCOMES = {
  collected: 'collected',
  missed_by_auto: 'missed_by_auto',
  garbage_not_kept: 'garbage_not_kept',
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

export default function TodaysPickupPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState(OUTCOMES.collected);
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(4);
  const [segregation, setSegregation] = useState('Good');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const vehicle = useMemo(
    () => data?.vehicles?.find((v) => v.blockId === user?.blockId) || null,
    [data, user?.blockId]
  );

  const houseAddress = useMemo(() => getCitizenHouseAddress(user), [user]);

  const todayFeedback = useMemo(
    () => data?.feedback?.find((f) => f.citizenId === user?.id && f.date === todayISO()) || null,
    [data, user?.id]
  );

  const needsReason = outcome === OUTCOMES.missed_by_auto || outcome === OUTCOMES.garbage_not_kept;

  const submit = async () => {
    if (needsReason && !reason.trim() && !comment.trim()) {
      showToast(t('reasonRequired'), 'warning');
      return;
    }
    if (outcome === OUTCOMES.collected && !rating) {
      showToast('Please provide a rating', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const fb = await api.submitFeedback({
        citizenId: user.id,
        wardId: user.wardId,
        blockId: user.blockId,
        date: todayISO(),
        collected: outcome === OUTCOMES.collected,
        outcome,
        reason: needsReason ? (reason === 'Other' ? comment.trim() : reason.trim()) : undefined,
        rating: outcome === OUTCOMES.collected ? rating : 2,
        segregationFeedback: segregation,
        comment: comment.trim() || undefined,
      }, user.name);
      setDone(fb);
      showToast('Pickup feedback submitted', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) return <LoadingState />;

  const statusAlert = done
    ? (
      <Alert severity="success">
        Thank you — feedback {done.id} saved ({done.outcome || (done.collected ? 'collected' : 'not collected')}).
      </Alert>
    )
    : todayFeedback
      ? (
        <Alert severity="info" icon={false}>
          Feedback already recorded today ({formatDateTime(todayFeedback.createdAt)}). Saving again updates today&apos;s record.
        </Alert>
      )
      : (
        <Alert severity="info" icon={false}>
          Tell us if waste was collected, auto missed it, or you did not keep garbage out — with a reason.
        </Alert>
      );

  return (
    <PageContainer>
      <PageHeader
        title={t('todaysPickup')}
        subtitle="Mark today’s doorstep collection status and reason if not collected."
      />

      {statusAlert}

      <SectionCard title={t('myHouseAddress')}>
        {hasHouseAddress(houseAddress) ? (
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'pre-line' }}>
            {formatHouseAddress(houseAddress)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">{t('noAddressYet')}</Typography>
        )}
      </SectionCard>

      {vehicle && (
        <SectionCard title={vehicle.displayName} subtitle={vehicle.autoId}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
          >
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, flex: '1 1 140px' }}>
              Coverage {vehicle.coveragePct}% · {vehicle.completedStops}/{vehicle.expectedStops} stops
            </Typography>
            <StatusChip status={vehicle.status} />
          </Stack>
        </SectionCard>
      )}

      <SectionCard title="Pickup feedback">
        <Stack spacing={2.5}>
          <FormControl>
            <FormLabel>{t('whatHappenedThatDay')}</FormLabel>
            <RadioGroup
              value={outcome}
              onChange={(e) => { setOutcome(e.target.value); setReason(''); }}
            >
              <FormControlLabel value={OUTCOMES.collected} control={<Radio />} label={t('outcomeCollected')} sx={{ minHeight: 44 }} />
              <FormControlLabel value={OUTCOMES.missed_by_auto} control={<Radio />} label={t('outcomeMissedByAuto')} sx={{ minHeight: 44 }} />
              <FormControlLabel value={OUTCOMES.garbage_not_kept} control={<Radio />} label={t('outcomeGarbageNotKept')} sx={{ minHeight: 44 }} />
            </RadioGroup>
          </FormControl>

          {needsReason && (
            <FormControl fullWidth required>
              <InputLabel>{t('reason')}</InputLabel>
              <Select
                label={t('reason')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {(REASON_OPTIONS[outcome] || []).map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {outcome === OUTCOMES.collected && (
            <>
              <Box>
                <Typography gutterBottom>{t('rating')}</Typography>
                <Rating
                  value={rating}
                  onChange={(_, v) => setRating(v || 0)}
                  size="large"
                  sx={{ '& .MuiRating-icon': { fontSize: '1.75rem' } }}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>{t('segregation')}</InputLabel>
                <Select label={t('segregation')} value={segregation} onChange={(e) => setSegregation(e.target.value)}>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Partial">Partial</MenuItem>
                  <MenuItem value="Needs Improvement">Needs Improvement</MenuItem>
                </Select>
              </FormControl>
            </>
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
          <Button
            variant="contained"
            size="large"
            onClick={submit}
            disabled={submitting}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 44 }}
          >
            {submitting ? 'Submitting…' : t('submit')}
          </Button>
        </Stack>
      </SectionCard>
    </PageContainer>
  );
}
