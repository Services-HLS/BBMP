import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, FormControlLabel, Switch, Stack, Typography, Button, Divider, Grid, Paper,
} from '@mui/material';
import L from 'leaflet';
import { RefreshCw } from 'lucide-react';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import SectionCard from '../../components/common/SectionCard';
import StatusChip from '../../components/common/StatusChip';
import LoadingState from '../../components/common/LoadingState';
import MapView, { HouseSatelliteDialog, housesForAuto, loadGoogleMaps } from '../../components/maps/MapView';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslation } from '../../hooks/useTranslation';
import { loadPrefs, savePrefs } from '../../utils/storage';
import { formatDateTime, formatTime } from '../../utils/date';
import { formatHouseAddress, getCitizenHouseAddress, hasHouseAddress } from '../../utils/citizenAddress';
import {
  etaMinutes, formatDistance, fractionAtIndex, insertOnPath, kmBetweenFractions,
  nearestPathIndex, pathDistanceKm, pointAt, shiftStartClear, sliceFrom, sliceTo,
} from '../../utils/routeTrack';
import { fetchRoadRoute, wardDrivePoints } from '../../utils/googleRoute';

function tripPin(label, color, anchorX = 36) {
  return L.divIcon({
    className: '',
    iconSize: [72, 44],
    iconAnchor: [anchorX, 42],
    html: `<div style="display:flex;flex-direction:column;align-items:center;width:72px">
      <div style="background:${color};color:#fff;font:700 11px/16px 'Plus Jakarta Sans',sans-serif;padding:2px 8px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.28)">${label}</div>
      <div style="width:12px;height:12px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;margin-top:2px"></div>
    </div>`,
  });
}

function housePin() {
  return L.divIcon({
    className: '',
    iconSize: [64, 62],
    iconAnchor: [32, 60],
    html: `<div style="display:flex;flex-direction:column;align-items:center;width:64px">
      <div style="background:#E53935;color:#fff;font:700 11px/16px 'Plus Jakarta Sans',sans-serif;padding:2px 8px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.28)">House</div>
      <svg width="28" height="40" viewBox="0 0 28 40" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
        <path d="M14 0C6.3 0 0 6.2 0 14c0 9.4 14 26 14 26s14-16.6 14-26C28 6.2 21.7 0 14 0z" fill="#E53935"/>
        <circle cx="14" cy="14" r="5" fill="#fff"/>
      </svg>
    </div>`,
  });
}

function movingAutoIcon() {
  return L.divIcon({
    className: '',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    html: `<div style="width:46px;height:46px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">
      <svg viewBox="0 0 46 46" width="46" height="46">
        <circle cx="23" cy="23" r="22" fill="#fff"/>
        <rect x="14" y="8" width="18" height="28" rx="8" fill="#1FA86A"/>
        <rect x="16.5" y="11" width="13" height="9" rx="3" fill="#F4D35E"/>
        <rect x="18" y="12.5" width="10" height="5" rx="1.5" fill="#D7F3FF"/>
        <circle cx="18" cy="33" r="2.2" fill="#14233A"/>
        <circle cx="28" cy="33" r="2.2" fill="#14233A"/>
      </svg>
    </div>`,
  });
}

function streetHouse(data, user) {
  const houses = (data?.households || []).filter((h) => h.blockId === user?.blockId && h.lat != null);
  const street = user?.defaultAddress?.street;
  return houses.find((h) => street && h.street === street) || houses[0] || null;
}

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
  const [satelliteVehicle, setSatelliteVehicle] = useState(null);
  const [progress, setProgress] = useState(0.08);
  const [arrived, setArrived] = useState(false);
  const [road, setRoad] = useState(null);
  const [roadState, setRoadState] = useState('loading');

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

  const ward = useMemo(
    () => data?.wards?.find((w) => w.id === user?.wardId) || null,
    [data, user?.wardId]
  );

  const wardAutos = useMemo(
    () => (data?.vehicles || []).filter((v) => v.wardId === user?.wardId && v.lat != null),
    [data, user?.wardId]
  );

  const housePoint = useMemo(() => streetHouse(data, user), [data, user]);
  const drivePlan = useMemo(
    () => wardDrivePoints(data?.routes, user?.wardId, housePoint),
    [data?.routes, user?.wardId, housePoint],
  );

  useEffect(() => {
    if (!drivePlan) return undefined;
    let cancelled = false;
    setRoadState('loading');
    loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
      .then(() => fetchRoadRoute(drivePlan.origin, drivePlan.destination, drivePlan.via))
      .then((result) => {
        if (!cancelled) {
          setRoad(result);
          setRoadState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoad(null);
          setRoadState('error');
        }
      });
    return () => { cancelled = true; };
  }, [drivePlan]);

  const trip = useMemo(() => {
    const house = housePoint;
    if (road?.path?.length > 1) {
      const houseIndex = nearestPathIndex(road.path, road.houseAt || house);
      const safeIndex = Math.min(Math.max(houseIndex, 1), road.path.length - 2);
      return {
        path: road.path,
        houseIndex: safeIndex,
        houseFraction: fractionAtIndex(road.path, safeIndex),
        house,
        lengthKm: road.distanceKm,
        durationMin: road.durationMin,
        onRoad: true,
      };
    }
    if (!route?.path?.length) return null;
    const built = house
      ? insertOnPath(route.path, [house.lat, house.lng])
      : { path: route.path, index: route.path.length - 1 };
    const spaced = shiftStartClear(built.path, built.index);
    const houseFraction = fractionAtIndex(spaced.path, spaced.houseIndex);
    return {
      path: spaced.path,
      houseIndex: spaced.houseIndex,
      houseFraction,
      house,
      lengthKm: pathDistanceKm(spaced.path),
      durationMin: null,
      onRoad: false,
    };
  }, [housePoint, road, route]);

  const moving = vehicle?.status === 'On Route' || vehicle?.status === 'Delayed';
  const houseStop = trip?.houseFraction ?? 1;
  const startAt = trip?.onRoad
    ? Math.min(0.12, Math.max(0.02, houseStop * 0.2))
    : Math.max(0.06, houseStop * 0.35);

  useEffect(() => {
    setArrived(false);
    setProgress(startAt);
  }, [vehicle?.id, route?.id, startAt]);

  useEffect(() => {
    if (!moving || arrived) return undefined;
    const id = setInterval(() => {
      setProgress((current) => Math.min(houseStop, current + 0.02));
    }, 1100);
    return () => clearInterval(id);
  }, [moving, arrived, houseStop]);

  useEffect(() => {
    if (progress >= houseStop - 0.001) setArrived(true);
  }, [progress, houseStop]);

  const spot = trip ? pointAt(trip.path, arrived ? trip.houseFraction : progress) : null;
  const remainingShare = trip && !arrived
    ? Math.max(0, (trip.houseFraction - progress) / trip.houseFraction)
    : 0;
  const kmLeft = trip?.onRoad
    ? trip.lengthKm * remainingShare
    : (trip && !arrived ? kmBetweenFractions(trip.path, progress, trip.houseFraction) : 0);
  const minutesLeft = trip?.onRoad
    ? (arrived || remainingShare < 0.02 ? 0 : Math.max(1, Math.round(trip.durationMin * remainingShare)))
    : etaMinutes(kmLeft, vehicle?.speed);
  const distanceLabel = !vehicle
    ? '—'
    : vehicle.status === 'Offline'
      ? `${formatDistance(kmLeft)} · offline`
      : arrived
        ? 'At your house'
        : formatDistance(kmLeft);

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
        subtitle="Your auto’s trip: where it started, where it is now, and how far it is from your house."
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

      <Alert severity="info" icon={false}>
        {ward ? `${ward.name}. ` : ''}
        Start and End are the two ends of your ward. The red pin is your house. The auto drives the blue road from Start, past your house, to End.
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
              <SectionCard title={vehicle.displayName} subtitle={`${vehicle.autoId} · ${distanceLabel}`}>
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

          <SectionCard title="Your auto’s trip" subtitle={ward ? ward.name : 'Your route'} noPadding contentSx={{ p: 0 }}>
            <Box sx={{ position: 'relative' }}>
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  zIndex: 2,
                  top: 12,
                  left: 12,
                  maxWidth: 280,
                  p: 1.5,
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 8px 24px rgba(16,24,32,0.12)',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {arrived ? 'Arrived' : 'On the road to your house'}
                </Typography>
                <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#1A73E8' }}>
                  {arrived ? 'At your house' : `${minutesLeft} min`}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>
                  {arrived ? 'The auto has reached the red pin.' : `${formatDistance(kmLeft)} left`}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  {trip?.onRoad
                    ? `Your house is ${trip.lengthKm.toFixed(1)} km from the ward start. The road continues to the ward end.`
                    : roadState === 'error'
                      ? 'The street route did not load. A sample line is shown.'
                      : 'Finding the ward road…'}
                </Typography>
              </Paper>
              <MapView
                height={520}
                zoom={15}
                fitPositions={trip?.path || (ward ? [[ward.lat, ward.lng]] : [])}
                fitKey={trip?.onRoad ? `road-${route?.id}` : (route?.id || vehicle.id)}
                markers={[
                  ...(trip ? [{
                    id: 'trip-start',
                    lat: trip.path[0][0],
                    lng: trip.path[0][1],
                    label: 'Ward start',
                    status: ward ? `Start of ${ward.name}` : 'Ward start',
                    icon: tripPin('Start', '#1A73E8', 70),
                  }, {
                    id: 'trip-end',
                    lat: trip.path[trip.path.length - 1][0],
                    lng: trip.path[trip.path.length - 1][1],
                    label: 'Ward end',
                    status: ward ? `End of ${ward.name}` : 'Ward end',
                    icon: tripPin('End', '#143A4F', 4),
                  }, {
                    id: 'trip-house',
                    lat: trip.path[trip.houseIndex][0],
                    lng: trip.path[trip.houseIndex][1],
                    label: 'Your house',
                    status: formatHouseAddress(houseAddress, { singleLine: true }) || 'Your stop',
                    icon: housePin(),
                  }] : []),
                  ...(spot ? [{
                    id: vehicle.id,
                    lat: spot.point[0],
                    lng: spot.point[1],
                    label: `${vehicle.displayName} · your auto`,
                    status: `${vehicle.autoId} · ${vehicle.status}`,
                    icon: movingAutoIcon(),
                  }] : []),
                  ...(trip?.onRoad ? [] : wardAutos.filter((v) => v.id !== vehicle.id).map((v) => ({
                    id: v.id,
                    lat: v.lat,
                    lng: v.lng,
                    label: v.displayName,
                    status: `${v.autoId} · ${v.status}`,
                  }))),
                ]}
                paths={trip && spot ? [
                  {
                    id: `${route?.id || 'trip'}-done`,
                    positions: sliceTo(trip.path, spot.seg, spot.frac),
                    color: '#D2D6DC',
                    weight: 8,
                  },
                  {
                    id: `${route?.id || 'trip'}-left`,
                    positions: sliceFrom(trip.path, spot.seg, spot.frac),
                    color: '#1A73E8',
                    weight: 7,
                  },
                ] : []}
                caption="Start and End are your ward. The red pin is your house. The auto follows the blue road."
                onMarkerClick={(marker) => {
                  const picked = wardAutos.find((v) => v.id === marker.id);
                  if (picked) setSatelliteVehicle(picked);
                }}
              />
            </Box>
          </SectionCard>
          <HouseSatelliteDialog
            vehicle={satelliteVehicle}
            houses={housesForAuto(data, satelliteVehicle)}
            wardName={ward?.name}
            blockCode={data.blocks?.find((b) => b.id === satelliteVehicle?.blockId)?.code}
            onClose={() => setSatelliteVehicle(null)}
          />
        </>
      ) : (
        <Alert severity="info">No assigned demo auto for your house collection route.</Alert>
      )}
    </PageContainer>
  );
}
