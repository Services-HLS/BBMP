import { useMemo, useState } from 'react';
import {
  Alert, Box, FormControlLabel, Switch, Stack, Typography, Button, Divider, Grid,
} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import StatusChip from '../../components/common/StatusChip';
import LoadingState from '../../components/common/LoadingState';
import MapView from '../../components/maps/MapView';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { loadPrefs, savePrefs } from '../../utils/storage';
import { formatDateTime, formatTime } from '../../utils/date';
import { formatHouseAddress, getCitizenHouseAddress, hasHouseAddress } from '../../utils/citizenAddress';

function readAlertPrefs() {
  const prefs = loadPrefs();
  return {
    arrivalAlert5: Boolean(prefs.arrivalAlert5),
    arrivalAlert10: prefs.arrivalAlert10 !== false,
  };
}

export default function TrackAutoPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useTranslation();
  const [alertPrefs, setAlertPrefs] = useState(readAlertPrefs);
  const [refreshing, setRefreshing] = useState(false);

  const vehicle = useMemo(() => {
    if (!data || !user) return null;
    return data.vehicles.find((v) => v.blockId === user.blockId)
      || data.vehicles.find((v) => v.wardId === user.wardId)
      || null;
  }, [data, user]);

  const houseAddress = useMemo(() => getCitizenHouseAddress(user), [user]);

  const route = useMemo(
    () => (data && vehicle ? data.routes.find((r) => r.id === vehicle.routeId) : null),
    [data, vehicle]
  );

  const stopsAway = useMemo(() => {
    if (!vehicle || vehicle.status === 'Offline') return '—';
    return String(Math.max(0, (vehicle.expectedStops || 0) - (vehicle.completedStops || 0)));
  }, [vehicle]);

  const persistAlert = (key, value) => {
    setAlertPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs({ ...loadPrefs(), ...next });
      return next;
    });
    showToast(value ? 'Arrival alert enabled (demo)' : 'Arrival alert disabled', 'info');
  };

  const handleRefresh = async () => {
    if (!vehicle) return;
    setRefreshing(true);
    try {
      await api.refreshVehicleLocation(vehicle.id, user?.name || 'Citizen');
      showToast('Simulated location refreshed', 'success');
    } catch (err) {
      showToast(err.message || 'Could not refresh location', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !data) return <LoadingState />;

  return (
    <PageContainer>
      <PageHeader
        title={t('trackMyAuto')}
        subtitle="Simulated route view using illustrative demo coordinates."
        actions={vehicle && (
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh location
          </Button>
        )}
      />

      <Alert severity="warning" icon={false}>
        Locations are fictional demo positions around Bengaluru — not live GPS tracking.
      </Alert>

      <SectionCard title={t('myHouseAddress')}>
        {hasHouseAddress(houseAddress) ? (
          <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'pre-line' }}>
            {formatHouseAddress(houseAddress)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">{t('noAddressYet')}</Typography>
        )}
      </SectionCard>

      {vehicle ? (
        <>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 7 }}>
              <SectionCard title={vehicle.displayName} subtitle={`${vehicle.autoId} · ${vehicle.driverName}`}>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <StatusChip status={vehicle.status} />
                    <Typography variant="body2">
                      {t('estimatedArrival')}: {formatTime(vehicle.estimatedCompletion) || route?.scheduleEnd || '—'}
                    </Typography>
                    <Typography variant="body2">
                      {t('stopsAway')}: {stopsAway}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Speed: {vehicle.speed ? `${vehicle.speed} km/h` : '—'} · Coverage {vehicle.coveragePct}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t('latestUpdate')}: {formatDateTime(vehicle.lastUpdate)}
                  </Typography>
                </Stack>
              </SectionCard>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <SectionCard title={t('arrivalAlerts')}>
                <Stack spacing={0.5}>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={alertPrefs.arrivalAlert5}
                        onChange={(e) => persistAlert('arrivalAlert5', e.target.checked)}
                      />
                    )}
                    label={t('alert5min')}
                    sx={{ ml: 0, minHeight: 44 }}
                  />
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={alertPrefs.arrivalAlert10}
                        onChange={(e) => persistAlert('arrivalAlert10', e.target.checked)}
                      />
                    )}
                    label={t('alert10min')}
                    sx={{ ml: 0, minHeight: 44 }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Saved in local browser preferences (demo only).
                  </Typography>
                </Stack>
              </SectionCard>
            </Grid>
          </Grid>

          <SectionCard title="Live map" subtitle="Demo coordinates" noPadding contentSx={{ p: 0 }}>
            <Box sx={{ overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
              <MapView
                height={360}
                markers={[{
                  id: vehicle.id,
                  lat: vehicle.lat,
                  lng: vehicle.lng,
                  label: vehicle.displayName,
                  status: vehicle.status,
                }]}
                paths={[
                  ...(route?.path ? [{ id: route.id, positions: route.path, color: '#12304A' }] : []),
                  ...(vehicle.locationHistory?.length
                    ? [{
                      id: `${vehicle.id}-hist`,
                      positions: vehicle.locationHistory.map((h) => [h.lat, h.lng]),
                      color: '#15966A',
                    }]
                    : []),
                ]}
                focus={[vehicle.lat, vehicle.lng]}
              />
            </Box>
          </SectionCard>
        </>
      ) : (
        <Alert severity="info">No assigned demo auto for your house collection route.</Alert>
      )}
    </PageContainer>
  );
}
