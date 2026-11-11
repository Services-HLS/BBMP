import { useEffect, useState } from 'react';
import { Box, Alert, Paper, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BENGALURU_CENTER } from '../../constants';

// Fix default marker icons in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

function statusColor(status) {
  const map = {
    'On Route': '#15966A',
    Idle: '#E9A23B',
    Delayed: '#D94841',
    Offline: '#9AA5B1',
    'Centre Visit Pending': '#2A6F97',
  };
  return map[status] || '#12304A';
}

export function createVehicleIcon(status) {
  const color = statusColor(status);
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function FocusOn({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 0.6 });
  }, [position, map]);
  return null;
}

function resolveHeight(height, isMobile) {
  if (typeof height === 'object' && height !== null) {
    return isMobile ? (height.xs ?? height.md ?? 260) : (height.md ?? height.xs ?? 420);
  }
  if (typeof height === 'number') {
    return isMobile ? Math.min(height, 280) : height;
  }
  return isMobile ? 260 : 420;
}

export default function MapView({
  height = 420,
  markers = [],
  paths = [],
  focus,
  onMarkerClick,
  fallbackList,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mapHeight = resolveHeight(height, isMobile);
  const [tilesOk, setTilesOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('https://tile.openstreetmap.org/0/0/0.png', { mode: 'no-cors' })
      .then(() => { if (!cancelled) setTilesOk(true); })
      .catch(() => { if (!cancelled) setTilesOk(false); });
    return () => { cancelled = true; };
  }, []);

  if (!tilesOk) {
    return (
      <Paper variant="outlined" sx={{ p: 2, minHeight: mapHeight }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Map tiles unavailable (offline or blocked). Showing list fallback. Locations are illustrative demo coordinates around Bengaluru.
        </Alert>
        {fallbackList || (
          <Box>
            {markers.map((m) => (
              <Box
                key={m.id}
                onClick={() => onMarkerClick?.(m)}
                sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
              >
                <Typography variant="body2" fontWeight={600}>{m.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.status} · {m.lat?.toFixed?.(4)}, {m.lng?.toFixed?.(4)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ height: mapHeight, width: '100%' }}>
        <MapContainer
          center={[BENGALURU_CENTER.lat, BENGALURU_CENTER.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {focus && <FocusOn position={focus} />}
          {paths.map((p) => (
            <Polyline key={p.id} positions={p.positions} pathOptions={{ color: p.color || '#12304A', weight: 3, opacity: 0.7 }} />
          ))}
          {markers.map((m) => (
            m.useCircle ? (
              <CircleMarker
                key={m.id}
                center={[m.lat, m.lng]}
                radius={8}
                pathOptions={{ color: m.color || '#15966A', fillColor: m.color || '#15966A', fillOpacity: 0.8 }}
                eventHandlers={{ click: () => onMarkerClick?.(m) }}
              >
                <Popup>{m.label}</Popup>
              </CircleMarker>
            ) : (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={m.icon || createVehicleIcon(m.status)}
                eventHandlers={{ click: () => onMarkerClick?.(m) }}
              >
                <Popup>
                  <strong>{m.label}</strong>
                  {m.status && <div>{m.status}</div>}
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', px: 1, py: 0.75, bgcolor: 'background.paper', lineHeight: 1.35 }}
      >
        Illustrative demo locations — not live BSWML vehicle positions.
      </Typography>
    </Box>
  );
}
