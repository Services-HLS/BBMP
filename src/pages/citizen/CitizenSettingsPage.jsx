import { useState } from 'react';
import {
  Box, FormControl, InputLabel, MenuItem, Select, Stack,
  Typography, Switch, FormControlLabel, Divider, Button, Alert, Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import LoadingState from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { ROLE_LABELS } from '../../constants';
import { loadPrefs, savePrefs } from '../../utils/storage';

function readNotifPrefs() {
  const prefs = loadPrefs();
  return {
    notifications: prefs.notifications !== false,
    pickupReminders: prefs.pickupReminders !== false,
    complaintUpdates: prefs.complaintUpdates !== false,
  };
}

export default function CitizenSettingsPage() {
  const { user, logout } = useAuth();
  const { data, loading } = useAppData();
  const { mode, toggleTheme } = useThemeMode();
  const { showToast } = useNotifications();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [notifPrefs, setNotifPrefs] = useState(readNotifPrefs);

  const ward = data?.wards?.find((w) => w.id === user?.wardId);
  const block = data?.blocks?.find((b) => b.id === user?.blockId);

  const updateNotif = (key, value) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs({ ...loadPrefs(), ...next });
      return next;
    });
    showToast('Notification preference saved', 'info');
  };

  if (loading && !data) return <LoadingState />;

  return (
    <PageContainer>
      <PageHeader title={t('settings')} subtitle="Citizen preferences for this demo session." />

      <Alert severity="info" icon={false}>
        Profile fields are demo identity data — not a real BBMP citizen account.
      </Alert>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Profile">
            <Stack spacing={1}>
              <Typography variant="body2"><strong>Name:</strong> {user?.name}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {user?.email}</Typography>
              <Typography variant="body2"><strong>Phone:</strong> {user?.phone || '—'}</Typography>
              <Typography variant="body2"><strong>Role:</strong> {ROLE_LABELS[user?.role]}</Typography>
              <Typography variant="body2"><strong>{t('ward')}:</strong> {ward?.name || user?.wardId}</Typography>
              <Typography variant="body2">
                <strong>{t('block')}:</strong> {block ? `${block.name} (${block.code})` : user?.blockId}
              </Typography>
            </Stack>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Preferences">
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>{t('language')}</InputLabel>
                <Select
                  label={t('language')}
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    showToast(e.target.value === 'kn' ? 'ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ' : 'Language set to English', 'success');
                  }}
                >
                  <MenuItem value="en">{t('english')}</MenuItem>
                  <MenuItem value="kn">{t('kannada')}</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                  label={`${t('theme')}: ${mode === 'dark' ? t('dark') : t('light')}`}
                  sx={{ ml: 0, minHeight: 44 }}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Theme preference is stored locally with your other demo settings.
                </Typography>
              </Box>

              <Divider />
              <Typography variant="subtitle2" fontWeight={700}>{t('notifications')}</Typography>
              <FormControlLabel
                control={(
                  <Switch
                    checked={notifPrefs.notifications}
                    onChange={(e) => updateNotif('notifications', e.target.checked)}
                  />
                )}
                label="Enable in-app notifications"
                sx={{ ml: 0, minHeight: 44 }}
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={notifPrefs.pickupReminders}
                    onChange={(e) => updateNotif('pickupReminders', e.target.checked)}
                    disabled={!notifPrefs.notifications}
                  />
                )}
                label="Pickup reminders"
                sx={{ ml: 0, minHeight: 44 }}
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={notifPrefs.complaintUpdates}
                    onChange={(e) => updateNotif('complaintUpdates', e.target.checked)}
                    disabled={!notifPrefs.notifications}
                  />
                )}
                label="Complaint status updates"
                sx={{ ml: 0, minHeight: 44 }}
              />

              <Divider />
              <Button
                color="error"
                variant="outlined"
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 44 }}
                onClick={() => { logout(); navigate('/login'); }}
              >
                {t('logout')}
              </Button>
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
