import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, FormControl, FormHelperText, InputLabel, MenuItem,
  Select, Stack, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { COMPLAINT_CATEGORIES } from '../../constants';
import { formatHouseAddress, getCitizenHouseAddress, hasHouseAddress } from '../../utils/citizenAddress';

export default function ReportProblemPage() {
  const { api } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const houseAddress = useMemo(() => getCitizenHouseAddress(user), [user]);

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
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
    if (!hasHouseAddress(houseAddress)) next.address = t('addAddressFirst');
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
        wardId: user.wardId,
        blockId: user.blockId,
        houseAddress: formatHouseAddress(houseAddress, { singleLine: true }),
      }, user.name);
      setResult(complaint);
      showToast(t('complaintSubmitted'));
      setForm({
        category: '',
        title: '',
        description: '',
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
        subtitle="Submit a doorstep collection issue for your house address."
      />

      {result ? (
        <Alert severity="success" onClose={() => setResult(null)}>
          {t('complaintSubmitted')}: <strong>{result.id}</strong>
        </Alert>
      ) : (
        <Alert severity="info" icon={false}>{t('demoNotice')}</Alert>
      )}

      <SectionCard
        title={t('myHouseAddress')}
        action={
          <Button size="small" variant="outlined" onClick={() => navigate('/citizen')}>
            {hasHouseAddress(houseAddress) ? t('editAddress') : t('addAddress')}
          </Button>
        }
      >
        {hasHouseAddress(houseAddress) ? (
          <Typography variant="body1" fontWeight={600} sx={{ whiteSpace: 'pre-line' }}>
            {formatHouseAddress(houseAddress)}
          </Typography>
        ) : (
          <Typography variant="body2" color="error">{t('addAddressFirst')}</Typography>
        )}
        {errors.address && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
            {errors.address}
          </Typography>
        )}
      </SectionCard>

      <SectionCard title="Complaint details" subtitle="Linked to your house address">
        <Stack spacing={2}>
          <FormControl fullWidth error={Boolean(errors.category)} required>
            <InputLabel>{t('category')}</InputLabel>
            <Select label={t('category')} value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {COMPLAINT_CATEGORIES.filter((c) => c !== 'Pothole').map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
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
        message="Your report will be saved against your house address and visible to supervisors/admins."
        confirmLabel={t('submit')}
        cancelLabel={t('cancel')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={submit}
        loading={submitting}
      />
    </PageContainer>
  );
}
