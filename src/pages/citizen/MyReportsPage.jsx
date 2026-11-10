import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Stack, Button, TextField, Drawer, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDateTime } from '../../utils/date';

export default function MyReportsPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reopening, setReopening] = useState(false);

  const mine = useMemo(
    () => (data?.complaints || [])
      .filter((c) => c.reporterId === user?.id)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [data, user?.id]
  );

  // Keep drawer selection in sync with shared store updates
  const selectedLive = useMemo(
    () => (selected ? mine.find((c) => c.id === selected.id) || selected : null),
    [mine, selected]
  );

  if (loading || !data) return <LoadingState />;

  const reopen = async () => {
    if (!selectedLive) return;
    if (!reopenReason.trim() || reopenReason.trim().length < 8) {
      showToast('Please provide a reason (at least 8 characters)', 'warning');
      return;
    }
    setReopening(true);
    try {
      const updated = await api.reopenComplaint(
        selectedLive.id,
        reopenReason.trim(),
        user.name
      );
      showToast(`${updated.id} reopened`, 'success');
      setSelected(updated);
      setConfirmOpen(false);
      setReopenReason('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReopening(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('myReports')}
        subtitle="Track status timelines for your submitted demo reports."
      />

      <Alert severity="info" icon={false}>
        Tap a report to view its status timeline. Resolved items can be reopened.
      </Alert>

      {mine.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No reports yet"
            description="Submit a problem from Report a Problem."
            actionLabel={t('reportProblem')}
            onAction={() => navigate('/citizen/report')}
          />
        </SectionCard>
      ) : (
        <Stack spacing={1.5}>
          {mine.map((c) => (
            <Card
              key={c.id}
              sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.light' } }}
              onClick={() => setSelected(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelected(c);
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700}>{c.id}</Typography>
                    <Typography variant="body2">{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.category} · {formatDateTime(c.createdAt)}
                    </Typography>
                  </Box>
                  <StatusChip status={c.status} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Drawer
        anchor="right"
        open={Boolean(selectedLive)}
        onClose={() => setSelected(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        {selectedLive && (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6">{selectedLive.id}</Typography>
            <Box sx={{ mt: 1 }}><StatusChip status={selectedLive.status} /></Box>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>{selectedLive.title}</Typography>
            {selectedLive.houseAddress && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>House address:</strong> {selectedLive.houseAddress}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>{selectedLive.description}</Typography>
            {selectedLive.photoDataUrl && (
              <Box
                component="img"
                src={selectedLive.photoDataUrl}
                alt="Report"
                sx={{ mt: 1.5, maxWidth: '100%', borderRadius: 2 }}
              />
            )}
            {selectedLive.resolutionEvidence && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Resolution evidence: {selectedLive.resolutionEvidence}
              </Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Status timeline</Typography>
            <Stack spacing={0}>
              {(selectedLive.history || []).map((h, i) => (
                <Stack key={`${h.at}-${i}`} direction="row" spacing={1.5}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: h.action === 'Resolved' ? 'success.main' : h.action === 'Reopened' ? 'warning.main' : 'primary.main',
                        mt: 0.5,
                      }}
                    />
                    {i < selectedLive.history.length - 1 && (
                      <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: 'divider' }} />
                    )}
                  </Box>
                  <Box sx={{ pb: 1.5 }}>
                    <Typography variant="body2" fontWeight={600}>{h.action}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDateTime(h.at)} · {h.by}
                    </Typography>
                    {h.note && <Typography variant="caption" display="block">{h.note}</Typography>}
                  </Box>
                </Stack>
              ))}
            </Stack>
            {selectedLive.status === 'Resolved' && (
              <Button
                variant="contained"
                color="warning"
                sx={{ mt: 2, minHeight: 44 }}
                onClick={() => setConfirmOpen(true)}
              >
                {t('reopen')}
              </Button>
            )}
          </Box>
        )}
      </Drawer>

      <Dialog open={confirmOpen} onClose={() => !reopening && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('reopen')} {selectedLive?.id}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Only resolved complaints can be reopened. Please describe what still needs attention.
          </Typography>
          <TextField
            fullWidth
            label="Reason"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            multiline
            minRows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={reopening}>{t('cancel')}</Button>
          <Button variant="contained" color="warning" onClick={reopen} disabled={reopening}>
            {t('reopen')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
