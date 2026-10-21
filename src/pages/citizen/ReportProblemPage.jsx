import { useState } from 'react';
import {
  Alert, Box, Button, FormControl, FormHelperText, InputLabel, MenuItem,
  Select, Stack, TextField,
} from '@mui/material';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { COMPLAINT_CATEGORIES } from '../../constants';

export default function ReportProblemPage() {
  const { data, api } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    wardId: user?.wardId || '',
    blockId: user?.blockId || '',
    photoDataUrl: null,
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField('photoDataUrl', reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next = {};
    if (!form.category) next.category = 'Category is required';
    if (!form.description || form.description.trim().length < 10) next.description = 'Describe the issue (min 10 characters)';
    if (!form.wardId) next.wardId = 'Ward is required';
    if (!form.blockId) next.blockId = 'Block is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const complaint = await api.createComplaint({
        ...form,
        title: form.title || form.category,
        reporterId: user.id,
        reporterName: user.name,
      }, user.name);
      setResult(complaint);
      showToast(t('complaintSubmitted'));
      setForm({
        category: '',
        title: '',
        description: '',
        wardId: user?.wardId || '',
        blockId: user?.blockId || '',
        photoDataUrl: null,
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('reportProblem')}
        subtitle="Submit a civic issue. It will appear immediately in admin complaint management."
      />

      {result ? (
        <Alert severity="success" onClose={() => setResult(null)}>
          {t('complaintSubmitted')}: <strong>{result.id}</strong>
        </Alert>
      ) : (
        <Alert severity="info" icon={false}>{t('demoNotice')}</Alert>
      )}

      <SectionCard title="Complaint details" subtitle="All fields save to local demo storage">
        <Stack spacing={2}>
          <FormControl fullWidth error={Boolean(errors.category)} required>
            <InputLabel>{t('category')}</InputLabel>
            <Select label={t('category')} value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {COMPLAINT_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
            {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
          </FormControl>
          <TextField label="Title (optional)" value={form.title} onChange={(e) => setField('title', e.target.value)} fullWidth />
          <TextField
            label={t('description')}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            multiline
            minRows={4}
            error={Boolean(errors.description)}
            helperText={errors.description}
            fullWidth
          />
          <FormControl fullWidth error={Boolean(errors.wardId)}>
            <InputLabel>{t('ward')}</InputLabel>
            <Select label={t('ward')} value={form.wardId} onChange={(e) => setField('wardId', e.target.value)}>
              {(data?.wards || []).map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </Select>
            {errors.wardId && <FormHelperText>{errors.wardId}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth error={Boolean(errors.blockId)}>
            <InputLabel>{t('block')}</InputLabel>
            <Select label={t('block')} value={form.blockId} onChange={(e) => setField('blockId', e.target.value)}>
              {(data?.blocks || []).filter((b) => !form.wardId || b.wardId === form.wardId).map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name} ({b.code})</MenuItem>
              ))}
            </Select>
            {errors.blockId && <FormHelperText>{errors.blockId}</FormHelperText>}
          </FormControl>
          <Box>
            <Button variant="outlined" component="label" sx={{ minHeight: 44 }}>
              {t('photo')}
              <input hidden type="file" accept="image/*" onChange={onPhoto} />
            </Button>
            {form.photoDataUrl && (
              <Box
                component="img"
                src={form.photoDataUrl}
                alt="Preview"
                sx={{ mt: 1.5, maxHeight: 180, borderRadius: 2, display: 'block', maxWidth: '100%' }}
              />
            )}
          </Box>
          <Button
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 44 }}
            onClick={() => {
              if (validate()) setConfirmOpen(true);
              else showToast('Please fix form errors', 'warning');
            }}
          >
            {t('submitComplaint')}
          </Button>
        </Stack>
      </SectionCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Submit complaint?"
        message="Your report will be saved to demo storage and visible to supervisors/admins."
        confirmLabel={t('submit')}
        cancelLabel={t('cancel')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submit}
        loading={submitting}
      />
    </PageContainer>
  );
}
