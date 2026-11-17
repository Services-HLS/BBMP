import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogContent, DialogTitle, FormControl,
  InputLabel, MenuItem, Select, Stack, Typography,
} from '@mui/material';
import L from 'leaflet';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import SectionCard from '../components/common/SectionCard';
import DataTable from '../components/common/DataTable';
import StatusChip from '../components/common/StatusChip';
import LoadingState from '../components/common/LoadingState';
import MapView from '../components/maps/MapView';
import { useAppData } from '../context/AppDataContext';

const DEFAULT_WARD = 'ward-112';

function autoIcon(status) {
  const tint = status === 'Offline' ? '#8A94A0' : status === 'Delayed' ? '#D94841' : '#1FA86A';
  return L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<div style="width:40px;height:40px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
      <svg viewBox="0 0 40 40" width="40" height="40">
        <rect x="12" y="6" width="16" height="26" rx="7" fill="${tint}"/>
        <rect x="14" y="8" width="12" height="9" rx="3" fill="#F4D35E"/>
        <rect x="15.5" y="9.5" width="9" height="5" rx="1.5" fill="#D7F3FF"/>
        <rect x="15" y="20" width="10" height="7" rx="1.5" fill="rgba(255,255,255,.25)"/>
        <circle cx="15" cy="30" r="2.2" fill="#14233A"/>
        <circle cx="25" cy="30" r="2.2" fill="#14233A"/>
      </svg>
    </div>`,
  });
}

function houseIcon(collected) {
  const roof = collected ? '#1FA86A' : '#E9A23B';
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 16],
    html: `<svg viewBox="0 0 18 18" width="18" height="18">
      <path d="M9 1 L17 8 H14 V16 H4 V8 H1 Z" fill="${roof}" stroke="#fff" stroke-width="1"/>
    </svg>`,
  });
}

function along(path, t) {
  if (!path?.length) return null;
  if (path.length === 1) return path[0];
  const scaled = (t % 1) * (path.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = path[i];
  const b = path[Math.min(i + 1, path.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export default function WardSimulationPage() {
  const { data, loading } = useAppData();
  const [wardId, setWardId] = useState(DEFAULT_WARD);
  const [tick, setTick] = useState(0);
  const [house, setHouse] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1200);
    return () => clearInterval(id);
  }, []);

  const ward = data?.wards?.find((w) => w.id === wardId) || data?.wards?.[0];
  const areaName = data?.constituencies?.find((c) => c.id === ward?.constituencyId)?.name;

  const houses = useMemo(
    () => (data?.households || []).filter((h) => h.wardId === ward?.id),
    [data, ward?.id],
  );
  const vehicles = useMemo(
    () => (data?.vehicles || []).filter((v) => v.wardId === ward?.id),
    [data, ward?.id],
  );
  const routes = useMemo(
    () => (data?.routes || []).filter((r) => r.wardId === ward?.id),
    [data, ward?.id],
  );

  const markers = useMemo(() => {
    const houseMarks = houses.map((h) => ({
      id: h.id,
      lat: h.lat,
      lng: h.lng,
      label: `Door ${h.doorNo} · ${h.street}`,
      status: h.coverageStatus,
      icon: houseIcon(h.coverageStatus === 'Collected'),
      kind: 'house',
      house: h,
    }));
    const autoMarks = vehicles.map((v, index) => {
      const route = routes.find((r) => r.id === v.routeId);
      const moving = v.status === 'On Route' && route?.path?.length;
      const spot = moving ? along(route.path, (tick * 0.04) + index * 0.15) : null;
      return {
        id: v.id,
        lat: spot ? spot[0] : v.lat,
        lng: spot ? spot[1] : v.lng,
        label: v.displayName,
        status: `${v.autoId} · ${v.status}`,
        icon: autoIcon(v.status),
        kind: 'auto',
      };
    });
    return [...houseMarks, ...autoMarks];
  }, [houses, vehicles, routes, tick]);

  const paths = routes
    .filter((r) => r.path?.length)
    .map((r) => ({ id: r.id, positions: r.path, color: '#1F6F8B' }));

  if (loading || !data || !ward) return <LoadingState label="Loading ward simulation…" />;

  return (
    <PageContainer>
      <PageHeader
        title="Ward simulation"
        subtitle="One ward at a time. Autos move on the sample route. Click a house to open the satellite view of that pin."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Ward simulation' }]}
      />
      <Alert severity="info" icon={false}>
        {ward.name} is in {areaName || 'this constituency'}. House pins are sample doors in that ward. The satellite picture is real imagery at the pin, not a surveyed building plan.
      </Alert>

      <FilterBar>
        <FormControl size="small">
          <InputLabel>Ward</InputLabel>
          <Select label="Ward" value={ward.id} onChange={(e) => { setWardId(e.target.value); setHouse(null); }}>
            {data.wards.map((w) => {
              const area = data.constituencies.find((c) => c.id === w.constituencyId)?.name;
              return (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}{area ? ` · ${area}` : ''}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </FilterBar>

      <MapView
        height={520}
        tiles="streets"
        zoom={15}
        focus={[ward.lat, ward.lng]}
        markers={markers}
        paths={paths}
        caption="Green auto = on route. Green roof = collected. Amber roof = not collected yet. Click a house."
        onMarkerClick={(marker) => {
          if (marker.kind === 'house') setHouse(marker.house);
        }}
      />

      <SectionCard title="Houses in this ward" subtitle="Click a row to open the satellite image">
        <DataTable
          columns={[
            { id: 'door', header: 'Door', accessor: 'doorNo' },
            { id: 'street', header: 'Street', accessor: 'street' },
            {
              id: 'status',
              header: 'Pickup',
              accessor: 'coverageStatus',
              render: (row) => <StatusChip status={row.coverageStatus} />,
            },
            {
              id: 'open',
              header: 'Satellite',
              render: (row) => (
                <Button size="small" variant="outlined" onClick={() => setHouse(row)}>
                  View
                </Button>
              ),
            },
          ]}
          rows={houses}
          onRowClick={(row) => setHouse(row)}
          emptyTitle="No sample houses in this ward"
          emptyDescription="Choose Indiranagar (Ward 112). That ward has sample doors."
        />
      </SectionCard>

      <Dialog open={Boolean(house)} onClose={() => setHouse(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {house ? `Door ${house.doorNo} · ${house.street}` : 'House'}
        </DialogTitle>
        <DialogContent>
          {house && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Satellite view of this sample pin in {ward.name}. Pickup: {house.coverageStatus}.
              </Typography>
              <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <MapView
                  key={house.id}
                  height={380}
                  tiles="satellite"
                  zoom={18}
                  focus={[house.lat, house.lng]}
                  markers={[{
                    id: house.id,
                    lat: house.lat,
                    lng: house.lng,
                    label: `Door ${house.doorNo}`,
                    status: house.street,
                    icon: houseIcon(house.coverageStatus === 'Collected'),
                  }]}
                  caption="Esri World Imagery at this pin."
                />
              </Box>
              <Button onClick={() => setHouse(null)} sx={{ alignSelf: 'flex-start' }}>Close</Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
