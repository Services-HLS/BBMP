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

export default function TodaysPickupPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const [collected, setCollected] = useState('yes');
  const [rating, setRating] = useState(4);
  const [segregation, setSegregation] = useState('Good');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const vehicle = useMemo(
    () => data?.vehicles?.find((v) => v.blockId === user?.blockId) || null,
    [data, user?.blockId]
  );

  const todayFeedback = useMemo(
    () => data?.feedback?.find((f) => f.citizenId === user?.id && f.date === todayISO()) || null,
    [data, user?.id]
  );

  const submit = async () => {
    if (!rating) {
      showToast('Please provide a rating', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const fb = await api.submitFeedback({
        citizenId: user.id,
        wardId: user.wardId,
        blockId: user.blockId,
        collected: collected === 'yes',
        rating,
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
        Thank you — feedback {done.id} saved ({done.collected ? t('collected') : t('notCollected')}, {done.rating}/5).
      </Alert>
    )
    : todayFeedback
      ? (
        <Alert severity="info" icon={false}>
          Feedback already recorded today ({formatDateTime(todayFeedback.createdAt)}). Submitting again adds another demo record.
        </Alert>
      )
      : (
        <Alert severity="info" icon={false}>
          Feedback is stored in local demo storage and linked to your session identity.
        </Alert>
      );

  return (
    <PageContainer>
      <PageHeader
        title={t('todaysPickup')}
        subtitle="Share whether today's collection happened and rate service quality."
      />

      {statusAlert}

      {vehicle && (
        <SectionCard title={vehicle.displayName} subtitle={`${vehicle.autoId} · ${vehicle.driverName || 'Driver'}`}>
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
            <FormLabel>Was waste collected today?</FormLabel>
            <RadioGroup
              row
              value={collected}
              onChange={(e) => setCollected(e.target.value)}
              sx={{ gap: { xs: 0, sm: 1 } }}
            >
              <FormControlLabel value="yes" control={<Radio />} label={t('collected')} sx={{ minHeight: 44 }} />
              <FormControlLabel value="no" control={<Radio />} label={t('notCollected')} sx={{ minHeight: 44 }} />
            </RadioGroup>
          </FormControl>
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
          <TextField
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            minRows={2}
            fullWidth
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
