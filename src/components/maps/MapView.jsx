import { useEffect, useRef, useState } from 'react';
import {
  Box, Alert, Paper, Typography, useMediaQuery, Dialog, DialogTitle, DialogContent, Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import L from 'leaflet';
import { BENGALURU_CENTER } from '../../constants';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

export function doorNumberIcon(doorNo) {
  const label = String(doorNo ?? '');
  return L.divIcon({
    className: '',
    iconSize: [36, 22],
    iconAnchor: [18, 11],
    html: `<div style="background:#fff;color:#12304A;border:2px solid #12304A;border-radius:4px;font:700 12px/18px sans-serif;text-align:center;min-width:28px;padding:0 4px;box-shadow:0 1px 3px rgba(0,0,0,.35)">${label}</div>`,
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function markerVisual(marker) {
  if (marker.useCircle) {
    const color = marker.color || '#15966A';
    return {
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
      anchorX: 8,
      anchorY: 8,
    };
  }
  const icon = marker.icon || createVehicleIcon(marker.status);
  const size = icon?.options?.iconSize;
  const anchor = icon?.options?.iconAnchor;
  const width = size?.x ?? size?.[0] ?? 14;
  const height = size?.y ?? size?.[1] ?? 14;
  return {
    html: icon?.options?.html
      || `<div style="width:${width}px;height:${height}px;border-radius:50%;background:#12304A;border:2px solid #fff"></div>`,
    anchorX: anchor?.x ?? anchor?.[0] ?? width / 2,
    anchorY: anchor?.y ?? anchor?.[1] ?? height / 2,
  };
}

let mapsPromise = null;

export function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      window.gm_authFailure = () => {
        window.dispatchEvent(new Event('bswml-gmaps-auth'));
      };
      const script = document.createElement('script');
      script.dataset.bswmlGmaps = '1';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      script.async = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => {
        mapsPromise = null;
        reject(new Error('Google Maps failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
}

function HtmlMarkerFactory() {
  if (window.__BswmlHtmlMarker) return window.__BswmlHtmlMarker;
  window.__BswmlHtmlMarker = class HtmlMarker extends window.google.maps.OverlayView {
    constructor(options) {
      super();
      this.position = options.position;
      this.html = options.html;
      this.anchorX = options.anchorX;
      this.anchorY = options.anchorY;
      this.onClick = options.onClick;
      this.div = null;
    }

    setPosition(position) {
      this.position = position;
      this.draw();
    }

    onAdd() {
      this.div = document.createElement('div');
      this.div.style.position = 'absolute';
      this.div.style.cursor = 'pointer';
      this.div.innerHTML = this.html;
      this.div.addEventListener('click', (event) => {
        event.stopPropagation();
        this.onClick?.();
      });
      this.getPanes().overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) return;
      this.div.style.left = `${point.x - this.anchorX}px`;
      this.div.style.top = `${point.y - this.anchorY}px`;
    }

    onRemove() {
      this.div?.remove();
      this.div = null;
    }
  };
  return window.__BswmlHtmlMarker;
}

function paintTypeButton(button, active) {
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.margin = '0';
  button.style.padding = '8px 16px';
  button.style.fontFamily = 'Roboto, Arial, sans-serif';
  button.style.fontSize = '14px';
  button.style.fontWeight = '700';
  button.style.lineHeight = '1.1';
  button.style.background = active ? '#F6B423' : '#FFFFFF';
  button.style.color = active ? '#1A3F8B' : '#3C4043';
}

function addMapSatelliteToggle(map) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.margin = '10px';
  wrap.style.borderRadius = '4px';
  wrap.style.overflow = 'hidden';
  wrap.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';

  const mapButton = document.createElement('button');
  const satelliteButton = document.createElement('button');
  mapButton.type = 'button';
  satelliteButton.type = 'button';
  mapButton.textContent = 'Map';
  satelliteButton.textContent = 'Satellite';
  mapButton.setAttribute('aria-label', 'Map');
  satelliteButton.setAttribute('aria-label', 'Satellite');

  const paint = () => {
    const satellite = map.getMapTypeId() === 'satellite' || map.getMapTypeId() === 'hybrid';
    paintTypeButton(mapButton, !satellite);
    paintTypeButton(satelliteButton, satellite);
  };

  mapButton.addEventListener('click', () => map.setMapTypeId('roadmap'));
  satelliteButton.addEventListener('click', () => map.setMapTypeId('satellite'));
  map.addListener('maptypeid_changed', paint);
  paint();

  wrap.append(mapButton, satelliteButton);
  map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(wrap);
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

const HOUSE_DOT_COLORS = ['#F5C542', '#F97316', '#1FA86A', '#E11D48'];

function HouseDotOverlay(getData) {
  const Overlay = class extends window.google.maps.OverlayView {
    constructor() {
      super();
      this.canvas = null;
    }

    onAdd() {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'absolute';
      this.canvas.style.pointerEvents = 'none';
      this.getPanes().overlayLayer.appendChild(this.canvas);
    }

    draw() {
      if (!this.canvas) return;
      const projection = this.getProjection();
      const bounds = this.getMap()?.getBounds();
      const data = getData();
      if (!projection || !bounds || !data?.points?.length) return;
      const sw = projection.fromLatLngToDivPixel(bounds.getSouthWest());
      const ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
      const left = Math.min(sw.x, ne.x);
      const top = Math.min(sw.y, ne.y);
      const width = Math.max(1, Math.abs(ne.x - sw.x));
      const height = Math.max(1, Math.abs(ne.y - sw.y));
      this.canvas.style.left = `${left}px`;
      this.canvas.style.top = `${top}px`;
      this.canvas.width = width;
      this.canvas.height = height;
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      const { points, status } = data;
      for (let i = 0; i < points.length; i += 1) {
        const pixel = projection.fromLatLngToDivPixel(
          new window.google.maps.LatLng(points[i][0], points[i][1]),
        );
        const x = pixel.x - left;
        const y = pixel.y - top;
        if (x < -4 || y < -4 || x > width + 4 || y > height + 4) continue;
        const state = status?.[i] || 0;
        ctx.fillStyle = HOUSE_DOT_COLORS[state] || HOUSE_DOT_COLORS[0];
        const radius = state === 1 ? 3.5 : 2.2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    onRemove() {
      this.canvas?.remove();
      this.canvas = null;
    }
  };
  return new Overlay();
}

function GoogleMapCanvas({
  mapType,
  zoom,
  focus,
  fitPositions,
  fitKey,
  markers,
  paths,
  onMarkerClick,
  houseDots,
  smoothFollow,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const pathsRef = useRef(new Map());
  const infoRef = useRef(null);
  const clickRef = useRef(onMarkerClick);
  const fitRef = useRef(fitPositions);
  const dotsRef = useRef(houseDots);
  const dotsOverlayRef = useRef(null);
  const smoothRef = useRef(smoothFollow);
  const [ready, setReady] = useState(false);
  smoothRef.current = smoothFollow;
  clickRef.current = onMarkerClick;
  fitRef.current = fitPositions;
  dotsRef.current = houseDots;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(MAPS_KEY).then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new window.google.maps.Map(containerRef.current, {
        center: { lat: BENGALURU_CENTER.lat, lng: BENGALURU_CENTER.lng },
        zoom,
        mapTypeId: mapType === 'satellite' ? 'satellite' : 'roadmap',
        gestureHandling: 'greedy',
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      });
      addMapSatelliteToggle(map);
      mapRef.current = map;
      infoRef.current = new window.google.maps.InfoWindow();
      setReady(true);
    }).catch(() => {
      if (!cancelled) setReady(false);
    });
    return () => {
      cancelled = true;
    };
    // Create the map once. Zoom and map type are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setMapTypeId(mapType === 'satellite' ? 'satellite' : 'roadmap');
  }, [ready, mapType]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const positions = fitRef.current;
    if (positions?.length) {
      if (positions.length === 1) {
        map.setCenter({ lat: positions[0][0], lng: positions[0][1] });
        map.setZoom(zoom);
        return;
      }
      const bounds = new window.google.maps.LatLngBounds();
      positions.forEach((position) => bounds.extend({ lat: position[0], lng: position[1] }));
      map.fitBounds(bounds, 48);
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        if (map.getZoom() > zoom) map.setZoom(zoom);
      });
      return;
    }
    if (focus?.[0] != null && focus?.[1] != null) {
      if (smoothRef.current) {
        if (Math.abs((map.getZoom() ?? zoom) - zoom) > 0.2) map.setZoom(zoom);
        map.setCenter({ lat: focus[0], lng: focus[1] });
        return;
      }
      map.panTo({ lat: focus[0], lng: focus[1] });
      if (Math.abs((map.getZoom() ?? zoom) - zoom) > 0.25) map.setZoom(zoom);
    }
  }, [ready, fitKey, focus, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return undefined;
    const Marker = HtmlMarkerFactory();
    const seenMarkers = new Set();

    markers.forEach((marker) => {
      if (marker.lat == null || marker.lng == null) return;
      seenMarkers.add(marker.id);
      const visual = markerVisual(marker);
      const position = new window.google.maps.LatLng(marker.lat, marker.lng);
      const openPopup = () => {
        clickRef.current?.(marker);
        infoRef.current?.setContent(
          `<strong>${escapeHtml(marker.label)}</strong>${marker.status ? `<div>${escapeHtml(marker.status)}</div>` : ''}`,
        );
        infoRef.current?.setPosition(position);
        infoRef.current?.open(map);
      };
      const existing = markersRef.current.get(marker.id);
      if (existing) {
        existing.setPosition(position);
        existing.html = visual.html;
        existing.anchorX = visual.anchorX;
        existing.anchorY = visual.anchorY;
        existing.onClick = openPopup;
        if (existing.div) existing.div.innerHTML = visual.html;
        return;
      }
      const overlay = new Marker({ position, ...visual, onClick: openPopup });
      overlay.setMap(map);
      markersRef.current.set(marker.id, overlay);
    });

    markersRef.current.forEach((overlay, id) => {
      if (!seenMarkers.has(id)) {
        overlay.setMap(null);
        markersRef.current.delete(id);
      }
    });

    const seenPaths = new Set();
    paths.forEach((path) => {
      if (!path.positions?.length) return;
      seenPaths.add(path.id);
      const route = path.positions.map(([lat, lng]) => ({ lat, lng }));
      const options = {
        path: route,
        strokeColor: path.color || '#12304A',
        strokeWeight: path.weight || 4,
        strokeOpacity: path.opacity ?? 0.85,
        map,
      };
      if (path.dashArray) {
        options.strokeOpacity = 0;
        options.icons = [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: path.color || '#12304A' },
          offset: '0',
          repeat: '16px',
        }];
      }
      const existing = pathsRef.current.get(path.id);
      if (existing) {
        existing.setOptions(options);
        return;
      }
      pathsRef.current.set(path.id, new window.google.maps.Polyline(options));
    });

    pathsRef.current.forEach((line, id) => {
      if (!seenPaths.has(id)) {
        line.setMap(null);
        pathsRef.current.delete(id);
      }
    });

    return undefined;
  }, [ready, markers, paths]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !houseDots?.points?.length) return undefined;
    if (!dotsOverlayRef.current) {
      const overlay = HouseDotOverlay(() => dotsRef.current);
      overlay.setMap(map);
      dotsOverlayRef.current = overlay;
      map.addListener('idle', () => overlay.draw());
      map.addListener('click', (event) => {
        const data = dotsRef.current;
        const projection = overlay.getProjection();
        if (!data?.onPick || !projection) return;
        const click = projection.fromLatLngToDivPixel(event.latLng);
        let best = -1;
        let bestDistance = 12 * 12;
        for (let i = 0; i < data.points.length; i += 1) {
          const pixel = projection.fromLatLngToDivPixel(
            new window.google.maps.LatLng(data.points[i][0], data.points[i][1]),
          );
          const distance = (pixel.x - click.x) ** 2 + (pixel.y - click.y) ** 2;
          if (distance < bestDistance) {
            bestDistance = distance;
            best = i;
          }
        }
        if (best >= 0) data.onPick(best);
      });
    }
    dotsOverlayRef.current.draw();
    return undefined;
  }, [ready, houseDots]);

  return <Box ref={containerRef} sx={{ height: '100%', width: '100%' }} />;
}

export default function MapView({
  height = 420,
  markers = [],
  paths = [],
  focus,
  zoom = 12,
  tiles = 'streets',
  fitPositions = null,
  fitKey = '',
  caption = 'Illustrative demo locations — not live BSWML vehicle positions.',
  onMarkerClick,
  fallbackList,
  houseDots = null,
  smoothFollow = false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const mapHeight = resolveHeight(height, isMobile);
  const [failed, setFailed] = useState(!MAPS_KEY);

  useEffect(() => {
    if (!MAPS_KEY) return undefined;
    const onAuth = () => setFailed(true);
    window.addEventListener('bswml-gmaps-auth', onAuth);
    loadGoogleMaps(MAPS_KEY).catch(() => setFailed(true));
    return () => window.removeEventListener('bswml-gmaps-auth', onAuth);
  }, []);

  if (failed) {
    return (
      <Paper variant="outlined" sx={{ p: 2, minHeight: mapHeight }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Google Maps did not load. Check that Maps JavaScript API is enabled for this key, and that this site is allowed on the key.
        </Alert>
        {fallbackList || (
          <Box>
            {markers.map((marker) => (
              <Box
                key={marker.id}
                onClick={() => onMarkerClick?.(marker)}
                sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
              >
                <Typography variant="body2" fontWeight={600}>{marker.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {marker.status} · {marker.lat?.toFixed?.(4)}, {marker.lng?.toFixed?.(4)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(16,24,32,0.06)' }}>
      <Box sx={{ height: mapHeight, width: '100%' }}>
        <GoogleMapCanvas
          mapType={tiles}
          zoom={zoom}
          focus={focus}
          fitPositions={fitPositions}
          fitKey={fitKey}
          markers={markers}
          paths={paths}
          onMarkerClick={onMarkerClick}
          houseDots={houseDots}
          smoothFollow={smoothFollow}
        />
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', px: 1, py: 0.75, bgcolor: 'background.paper', lineHeight: 1.35 }}
      >
        {caption}
      </Typography>
    </Box>
  );
}

export function housesForAuto(data, vehicle) {
  if (!data || !vehicle) return [];
  const onBlock = (data.households || []).filter((h) => h.blockId === vehicle.blockId && h.lat != null);
  if (onBlock.length) return onBlock;
  return (data.households || []).filter((h) => h.wardId === vehicle.wardId && h.lat != null);
}

export function HouseSatelliteDialog({ vehicle, houses, wardName, blockCode, onClose }) {
  const open = Boolean(vehicle);
  const pins = (houses || []).filter((h) => h.lat != null && h.lng != null);
  const positions = pins.map((h) => [h.lat, h.lng]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {vehicle ? `${vehicle.displayName} · ${vehicle.autoId}` : 'Houses'}
      </DialogTitle>
      <DialogContent>
        {vehicle && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Satellite view of the sample house numbers
              {blockCode ? ` on block ${blockCode}` : ''}
              {wardName ? ` in ${wardName}` : ''}.
              {pins.length ? ` ${pins.length} doors.` : ' This block has no sample doors.'}
            </Typography>
            {pins.length > 0 && (
              <MapView
                key={vehicle.id}
                height={420}
                tiles="satellite"
                zoom={18}
                fitPositions={positions}
                fitKey={vehicle.id}
                markers={pins.map((h) => ({
                  id: h.id,
                  lat: h.lat,
                  lng: h.lng,
                  label: `Door ${h.doorNo}`,
                  status: `${h.street} · ${h.coverageStatus || 'Pending'}`,
                  icon: doorNumberIcon(h.doorNo),
                }))}
                caption="Each label is a sample door number on the Google satellite image."
              />
            )}
            <Button onClick={onClose} sx={{ alignSelf: 'flex-start' }}>Back to autos</Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
