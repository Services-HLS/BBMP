import { useMemo, useState } from 'react';
import {
  Box, Button, Drawer, FormControl, InputLabel, MenuItem, Select, Stack, Typography,
  ToggleButton, ToggleButtonGroup, Divider, Alert, Grid,
} from '@mui/material';
import { RefreshCw, Map as MapIcon, List } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import DataTable from '../components/common/DataTable';
import StatusChip from '../components/common/StatusChip';
import LoadingState from '../components/common/LoadingState';
import MapView from '../components/maps/MapView';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import useOpsScope from '../hooks/useOpsScope';
import { VEHICLE_STATUSES } from '../constants';
import { formatDateTime, formatTime } from '../utils/date';

export default function VehiclesPage() {
  const { data, api, loading } = useAppData();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { filterByWard, scopeWards, isScoped, scopeLabel } = useOpsScope();
  const [wardId, setWardId] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('map');
  const [selected, setSelected] = useState(null);
  const [focus, setFocus] = useState(null);

  const scopedWards = useMemo(() => scopeWards(data?.wards || []), [data?.wards, scopeWards]);

  const vehicles = useMemo(() => {
    let list = filterByWard(data?.vehicles || []);
    if (wardId) list = list.filter((v) => v.wardId === wardId);
    if (status) list = list.filter((v) => v.status === status);
    return list;
  }, [data, wardId, status, filterByWard]);

  if (loading || !data) return <LoadingState />;

  const markers = vehicles.filter((v) => v.lat && v.lng).map((v) => ({
    id: v.id, lat: v.lat, lng: v.lng, label: v.displayName, status: v.status,
  }));

  const columns = [
    { id: 'auto', header: 'Auto ID', accessor: 'autoId' },
    { id: 'driver', header: 'Driver', accessor: 'driverName' },
    { id: 'status', header: 'Status', accessor: 'status', render: (r) => <StatusChip status={r.status} /> },
    { id: 'coverage', header: 'Coverage', accessor: (r) => `${r.coveragePct}%`, hideOnMobile: true },
    { id: 'stops', header: 'Stops', accessor: (r) => `${r.completedStops}/${r.expectedStops}`, hideOnMobile: true },
    { id: 'speed', header: 'Speed', accessor: (r) => `${r.speed} km/h`, hideOnMobile: true },
    { id: 'updated', header: 'Updated', accessor: (r) => formatDateTime(r.lastUpdate), hideOnMobile: true },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Live Vehicle Tracking"
        subtitle="Simulated auto locations for demonstration. Not real-time BSWML fleet telemetry."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Vehicles' }]}
      />
      <Alert severity="info" icon={false}>
        Markers use illustrative Bengaluru coordinates — not operational positions.
        {isScoped ? ` · ${scopeLabel}` : ' · Admin: all wards'}
      </Alert>

      <FilterBar
        endActions={(
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="map"><MapIcon size={16} />&nbsp;Map</ToggleButton>
            <ToggleButton value="list"><List size={16} />&nbsp;List</ToggleButton>
          </ToggleButtonGroup>
        )}
      >
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={wardId} onChange={(e) => setWardId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {scopedWards.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {VEHICLE_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </FilterBar>

      {view === 'map' ? (
        <MapView
          height={440}
          markers={markers}
          focus={focus}
          onMarkerClick={(m) => setSelected(vehicles.find((v) => v.id === m.id))}
        />
      ) : (
        <DataTable columns={columns} rows={vehicles} onRowClick={setSelected} searchPlaceholder="Search auto / driver…" />
      )}

      <Drawer anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100vw' } }}>
        {selected && (
          <Box sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 'calc(24px + env(safe-area-inset-bottom))', sm: 3 } }}>
            <Typography variant="h6">{selected.displayName}</Typography>
            <Typography variant="body2" color="text.secondary">{selected.autoId} · {selected.driverName}</Typography>
            <StatusChip status={selected.status} />
            <Grid container spacing={1.5} sx={{ mt: 2 }}>
              <Grid size={6}><Typography variant="caption">Coverage</Typography><Typography fontWeight={700}>{selected.coveragePct}%</Typography></Grid>
              <Grid size={6}><Typography variant="caption">Stops</Typography><Typography fontWeight={700}>{selected.completedStops}/{selected.expectedStops}</Typography></Grid>
              <Grid size={6}><Typography variant="caption">Speed</Typography><Typography fontWeight={700}>{selected.speed} km/h</Typography></Grid>
              <Grid size={6}><Typography variant="caption">DWC</Typography><Typography fontWeight={700}>{selected.dwcStatus}</Typography></Grid>
              <Grid size={6}><Typography variant="caption">Start</Typography><Typography fontWeight={700}>{formatTime(selected.routeStartTime)}</Typography></Grid>
              <Grid size={6}><Typography variant="caption">ETA</Typography><Typography fontWeight={700}>{formatTime(selected.estimatedCompletion)}</Typography></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Location history (demo)</Typography>
            {(selected.locationHistory || []).slice(-5).map((h, i) => (
              <Typography key={i} variant="caption" display="block">{formatDateTime(h.timestamp)} · {h.lat}, {h.lng} · {h.speed} km/h</Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Simulated dashcam snapshots</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[1, 2, 3].map((n) => (
                <Box
                  key={n}
                  sx={{
                    flex: '1 1 84px',
                    minWidth: 84,
                    maxWidth: { xs: '100%', sm: 110 },
                    height: 60,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Typography variant="caption">Demo {n}</Typography>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => { setFocus([selected.lat, selected.lng]); setView('map'); showToast('Map focused on vehicle'); }}>
                Focus map
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshCw size={16} />}
                onClick={async () => {
                  const updated = await api.refreshVehicleLocation(selected.id, user?.name);
                  setSelected(updated);
                  showToast('Simulated location refresh');
                }}
              >
                Simulate refresh
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>
    </PageContainer>
  );
}
