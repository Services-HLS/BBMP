import { useEffect, useState } from 'react';
import {
  Alert, Button, Divider, FormControl, FormControlLabel,
  InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography, Tab, Tabs,
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import SectionCard from '../components/common/SectionCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DataTable from '../components/common/DataTable';
import LoadingState from '../components/common/LoadingState';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from '../hooks/useTranslation';
import { ROLE_LABELS, APP_NAME, APP_TAGLINE, DEFAULT_SCORE_WEIGHTS } from '../constants';
import { validateWeights } from '../utils/scoring';

export default function SettingsPage() {
  const { data, api, loading, resetDemoData } = useAppData();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { language, setLanguage } = useTranslation();
  const { showToast } = useNotifications();
  const [tab, setTab] = useState(0);
  const [weights, setWeights] = useState(DEFAULT_SCORE_WEIGHTS);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    if (data?.scoreConfig?.weights) setWeights({ ...data.scoreConfig.weights });
  }, [data]);

  if (loading || !data) return <LoadingState />;

  const weightCheck = validateWeights(weights);

  const saveWeights = async () => {
    try {
      await api.updateScoreConfig({ weights }, user?.name);
      showToast('Score weights saved');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Profile, theme, scorecard rules, and demo data management." />
      <Alert severity="info" icon={false}>
        Configuration changes apply to local sample data only.
      </Alert>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Profile" />
        <Tab label="Preferences" />
        <Tab label="Scorecard rules" />
        <Tab label="Master data" />
        <Tab label="Demo data" />
        <Tab label="About" />
      </Tabs>

      {tab === 0 && (
        <SectionCard title="Profile">
          <Typography variant="h6">{user?.name}</Typography>
          <Typography variant="body2">{user?.email}</Typography>
          <Typography variant="body2">{ROLE_LABELS[user?.role]} · {user?.phone}</Typography>
          <Button sx={{ mt: 2 }} color="error" variant="outlined" onClick={logout}>Logout</Button>
        </SectionCard>
      )}

      {tab === 1 && (
        <SectionCard title="Preferences">
          <Stack spacing={2}>
            <FormControlLabel control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />} label={`Theme: ${mode}`} />
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="kn">ಕನ್ನಡ</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </SectionCard>
      )}

      {tab === 2 && (
        <SectionCard title="Scorecard rules" subtitle="Proposed demonstration rules — weights must total 100">
          <Stack spacing={2}>
            {Object.keys(weights).map((key) => (
              <TextField
                key={key}
                type="number"
                label={key}
                value={weights[key]}
                onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                fullWidth
              />
            ))}
            <Typography color={weightCheck.valid ? 'success.main' : 'error.main'}>{weightCheck.message}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
              <Button variant="contained" disabled={!weightCheck.valid} onClick={saveWeights} sx={{ width: { xs: '100%', sm: 'auto' } }}>Save weights</Button>
              <Button
                variant="outlined"
                onClick={async () => {
                  await api.resetScoreConfig(user?.name);
                  showToast('Score config reset to defaults');
                }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Reset defaults
              </Button>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(data.scoreConfig?.shadowRunMode)}
                  onChange={async (e) => {
                    await api.updateScoreConfig({ shadowRunMode: e.target.checked, weights: data.scoreConfig.weights }, user?.name);
                    showToast(`Shadow-run ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                />
              }
              label="Shadow-run mode (scores without payment recommendations)"
            />
          </Stack>
        </SectionCard>
      )}

      {tab === 3 && (
        <Stack spacing={2}>
          <SectionCard title="Vehicles (deactivate)">
            <DataTable
              columns={[
                { header: 'Auto', accessor: 'autoId' },
                { header: 'Driver', accessor: 'driverName' },
                { header: 'Active', accessor: (r) => (r.active === false ? 'No' : 'Yes') },
                {
                  header: 'Action',
                  render: (r) => (
                    <Button
                      size="small"
                      disabled={r.active === false}
                      onClick={async () => {
                        await api.deactivateMasterRecord('vehicles', r.id, user?.name);
                        showToast('Vehicle deactivated');
                      }}
                    >
                      Deactivate
                    </Button>
                  ),
                },
              ]}
              rows={data.vehicles}
              initialRowsPerPage={5}
            />
          </SectionCard>
          <SectionCard title="Wards (deactivate)">
            <DataTable
              columns={[
                { header: 'Ward', accessor: 'name' },
                { header: 'Corporation', accessor: (r) => data.corporations.find((c) => c.id === r.corporationId)?.name || r.corporationId },
                { header: 'Active', accessor: (r) => (r.active === false ? 'No' : 'Yes') },
                {
                  header: 'Action',
                  render: (r) => (
                    <Button
                      size="small"
                      disabled={r.active === false}
                      onClick={async () => {
                        await api.deactivateMasterRecord('wards', r.id, user?.name);
                        showToast('Ward deactivated');
                      }}
                    >
                      Deactivate
                    </Button>
                  ),
                },
              ]}
              rows={data.wards}
              initialRowsPerPage={5}
            />
          </SectionCard>
        </Stack>
      )}

      {tab === 4 && (
        <SectionCard title="Demo data">
          <Typography variant="body2" sx={{ mb: 2 }}>
            Reset clears localStorage and reloads the deterministic seed. Restore does the same from the original seed.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
            <Button color="error" variant="contained" onClick={() => setConfirmReset(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Reset demo data</Button>
            <Button variant="outlined" onClick={() => setConfirmRestore(true)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Restore sample data</Button>
          </Stack>
        </SectionCard>
      )}

      {tab === 5 && (
        <SectionCard title="About">
          <Typography variant="h6">{APP_NAME}</Typography>
          <Typography variant="body2">{APP_TAGLINE}</Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2">Frontend prototype · React + Vite + MUI</Typography>
          <Typography variant="body2">Future backend: Node.js + Express REST APIs</Typography>
          <Typography variant="body2">Mobile packaging: Capacitor (Android / iOS)</Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Seeded at: {data._meta?.seededAt}
          </Typography>
        </SectionCard>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        message="All local changes will be wiped and the seed dataset reloaded."
        confirmColor="error"
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetDemoData();
          showToast('Demo data reset');
          setConfirmReset(false);
        }}
      />
      <ConfirmDialog
        open={confirmRestore}
        title="Restore sample data?"
        message="Reload the original deterministic sample dataset."
        confirmLabel="Restore"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={async () => {
          await api.restoreSampleData();
          showToast('Sample data restored');
          setConfirmRestore(false);
        }}
      />
    </PageContainer>
  );
}
