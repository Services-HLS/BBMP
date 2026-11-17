import { useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import PageContainer from '../components/common/PageContainer';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';
import Ward57ClientMap, { demoNumbers } from '../components/maps/Ward57ClientMap';
import placesFile from '../data/ward39Places.json';

const CREW = [
  { role: 'Driver', name: 'Ravi Kumar', color: '#1A73E8' },
  { role: 'Cleaner', name: 'Anita S', color: '#1FA86A' },
  { role: 'Cleaner', name: 'Mohammed Irfan', color: '#F97316' },
];

function portrait(person) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 72,
        height: 84,
        borderRadius: '16px',
        overflow: 'hidden',
        bgcolor: '#E8EEF4',
        boxShadow: '0 8px 18px rgba(16,24,32,0.12)',
      }}
    >
      <svg viewBox="0 0 72 84" width="72" height="84">
        <rect width="72" height="84" fill="#E8EEF4" />
        <circle cx="36" cy="30" r="14" fill={person.color} />
        <path d="M14 84c2-18 12-26 22-26s20 8 22 26" fill={person.color} />
      </svg>
    </Box>
  );
}

const TYPE_LABEL = { house: 'House', shop: 'Shop', apartment: 'Apartment' };
const placeByNumber = new Map();
placesFile.places.forEach((place, index) => {
  const demo = demoNumbers[index];
  if (demo && !placeByNumber.has(demo)) placeByNumber.set(demo, place);
});

function phoneText(place) {
  if (!place?.phone) return '+91*****';
  return `+91${place.phone.replace(/\D/g, '').replace(/^91/, '').slice(0, 2)}*****`;
}
const FILTERS = [
  ['all', 'All'],
  ['house', 'House'],
  ['shop', 'Shop'],
  ['apartment', 'Apartment'],
];

function PlaceList() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(30);
  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return placesFile.places
      .map((place, index) => ({ ...place, demo: demoNumbers[index] || 0 }))
      .filter((place) => filter === 'all' || place.kind === filter)
      .filter((place) => !text || `${place.demo || ''} ${place.name || ''} ${place.phone || ''}`.toLowerCase().includes(text))
      .sort((a, b) => (a.demo || 999999) - (b.demo || 999999));
  }, [filter, query]);
  const visible = rows.slice(0, shown);

  return (
    <SectionCard title="Place list" subtitle="Demo house numbers run 1, 2, 3. The auto collects them in that order.">
      <Stack spacing={1.25}>
        <Box
          component="select"
          aria-label="Type"
          value={filter}
          onChange={(event) => { setFilter(event.target.value); setShown(30); }}
          sx={{
            width: { xs: '100%', sm: 280 },
            border: '1px solid #E6E9EE',
            borderRadius: '12px',
            px: 1.5,
            py: 1,
            font: 'inherit',
            fontWeight: 700,
            color: '#143A4F',
            bgcolor: '#fff',
            outline: 'none',
          }}
        >
          {FILTERS.map(([id, label]) => {
            const count = id === 'all' ? placesFile.count : placesFile.counts[id];
            return (
              <option key={id} value={id}>
                {label} ({count.toLocaleString('en-IN')})
              </option>
            );
          })}
        </Box>
        <Box
          component="input"
          value={query}
          placeholder="Search house number or name"
          onChange={(event) => { setQuery(event.target.value); setShown(30); }}
          sx={{
            width: '100%',
            border: '1px solid #E6E9EE',
            borderRadius: '12px',
            px: 1.5,
            py: 1,
            font: 'inherit',
            outline: 'none',
          }}
        />
        <Box sx={{ overflow: 'auto', maxHeight: 420, border: '1px solid #E6E9EE', borderRadius: '12px' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <Box component="thead">
              <Box component="tr" sx={{ bgcolor: '#F3F5F8' }}>
                {['House number', 'Type', 'Name', 'Phone number'].map((heading) => (
                  <Box component="th" key={heading} sx={{ textAlign: 'left', px: 1.5, py: 1, fontSize: 12, letterSpacing: '0.04em' }}>
                    {heading}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {visible.map((place) => (
                <Box component="tr" key={`${place.lat}-${place.lng}`} sx={{ borderTop: '1px solid #EEF1F4' }}>
                  <Box component="td" sx={{ px: 1.5, py: 1, fontWeight: 700 }}>{place.demo || '—'}</Box>
                  <Box component="td" sx={{ px: 1.5, py: 1, fontWeight: 700 }}>{TYPE_LABEL[place.kind]}</Box>
                  <Box component="td" sx={{ px: 1.5, py: 1 }}>{place.name || 'Not listed'}</Box>
                  <Box component="td" sx={{ px: 1.5, py: 1 }}>{phoneText(place)}</Box>
                </Box>
              ))}
              {!visible.length && (
                <Box component="tr">
                  <Box component="td" colSpan={4} sx={{ px: 1.5, py: 2, color: 'text.secondary' }}>
                    No place matches this search.
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Showing {visible.length.toLocaleString('en-IN')} of {rows.length.toLocaleString('en-IN')}. Phone numbers are shown as +91*****.
          </Typography>
          {shown < rows.length && (
            <Box
              component="button"
              type="button"
              onClick={() => setShown((count) => count + 50)}
              sx={{ border: 0, cursor: 'pointer', bgcolor: 'transparent', color: '#1A3F8B', fontWeight: 700 }}
            >
              Show more
            </Box>
          )}
        </Stack>
      </Stack>
    </SectionCard>
  );
}
export default function WardHouseCollectionPage() {
  const [showCollected, setShowCollected] = useState(false);
  const [collectedNos, setCollectedNos] = useState([]);
  const [run, setRun] = useState({
    collected: 0,
    missed: 0,
    done: false,
    phase: 'driving',
    label: 'House 1',
    waitMin: 1,
    houseNo: 1,
  });
  const onProgress = (next) => {
    setRun(next);
    setCollectedNos((prev) => {
      if (!next.collected) return prev.length ? [] : prev;
      if (next.phase !== 'collected' || prev[prev.length - 1] === next.houseNo) return prev;
      return [...prev, next.houseNo];
    });
  };
  const collectedRows = useMemo(
    () => collectedNos.map((number) => ({ number, place: placeByNumber.get(number) })),
    [collectedNos],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Ward 39 houses"
        subtitle="Mahalakshmi Layout, Package P11. Demo house numbers run 1, 2, 3, and the auto collects them in that order."
      />
      <Ward57ClientMap onProgress={onProgress} />
      <Box sx={{ mt: 2 }}>
        <SectionCard
          title={run.done ? 'Final report' : 'Collection report'}
          action={(
            <Box
              component="button"
              type="button"
              aria-label="Collected list"
              aria-pressed={showCollected}
              onClick={() => setShowCollected((on) => !on)}
              sx={{
                border: '1px solid #E6E9EE',
                borderRadius: '999px',
                px: 1.75,
                py: 0.7,
                font: 'inherit',
                fontWeight: 800,
                cursor: 'pointer',
                bgcolor: showCollected ? '#F6B423' : '#fff',
                color: showCollected ? '#1A3F8B' : '#143A4F',
              }}
            >
              {showCollected ? 'Collected list On' : 'Collected list Off'}
            </Box>
          )}
        >
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">Ward number</Typography>
              <Typography fontWeight={700}>39 — Mahalakshmi Layout</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Package</Typography>
              <Typography fontWeight={700}>P11</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Block number</Typography>
              <Typography fontWeight={700}>39-A</Typography>
            </Box>
            <Stack direction="row" spacing={1.25}>
              {CREW.map((person) => (
                <Stack key={person.name} spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                  {portrait(person)}
                  <Typography variant="caption" color="text.secondary">{person.role}</Typography>
                  <Typography variant="caption" fontWeight={700} textAlign="center">{person.name}</Typography>
                </Stack>
              ))}
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box sx={{ p: 1.25, borderRadius: '14px', bgcolor: 'rgba(31,168,106,0.12)' }}>
                <Typography variant="caption">Collected</Typography>
                <Typography fontWeight={700} fontSize="1.35rem">{run.collected.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ p: 1.25, borderRadius: '14px', bgcolor: 'rgba(225,29,72,0.1)' }}>
                <Typography variant="caption">Missed</Typography>
                <Typography fontWeight={700} fontSize="1.35rem">{run.missed.toLocaleString('en-IN')}</Typography>
              </Box>
            </Box>
            {showCollected && (
              <Stack spacing={1}>
                <Typography fontWeight={700}>
                  Collected {collectedRows.length.toLocaleString('en-IN')}
                </Typography>
                <Box sx={{ overflow: 'auto', maxHeight: 320, border: '1px solid #E6E9EE', borderRadius: '12px' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ bgcolor: '#F3F5F8' }}>
                        {['House number', 'Type', 'Name', 'Phone number'].map((heading) => (
                          <Box component="th" key={heading} sx={{ textAlign: 'left', px: 1.5, py: 1, fontSize: 12, letterSpacing: '0.04em' }}>
                            {heading}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {collectedRows.map(({ number, place }) => (
                        <Box component="tr" key={number} sx={{ borderTop: '1px solid #EEF1F4' }}>
                          <Box component="td" sx={{ px: 1.5, py: 1, fontWeight: 700 }}>{number}</Box>
                          <Box component="td" sx={{ px: 1.5, py: 1, fontWeight: 700 }}>{TYPE_LABEL[place?.kind] || 'House'}</Box>
                          <Box component="td" sx={{ px: 1.5, py: 1 }}>{place?.name || 'Not listed'}</Box>
                          <Box component="td" sx={{ px: 1.5, py: 1 }}>{phoneText(place)}</Box>
                        </Box>
                      ))}
                      {!collectedRows.length && (
                        <Box component="tr">
                          <Box component="td" colSpan={4} sx={{ px: 1.5, py: 2, color: 'text.secondary' }}>
                            No house is collected yet.
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary">
              {run.phase === 'driving'
                ? `The auto is coming to ${run.label}.`
                : run.phase === 'waiting'
                  ? `The auto is waiting ${run.waitMin} min at ${run.label}.`
                  : `The auto finished ${run.label}.`}
              {' '}
              The public map lists {placesFile.counts.house.toLocaleString('en-IN')} houses, {placesFile.counts.shop.toLocaleString('en-IN')} shops, and {placesFile.counts.apartment.toLocaleString('en-IN')} apartments in this ward. Demo numbers 1, 2, 3 are the collection order.
              Demo photos are name cards for this sample run, not live camera pictures.
            </Typography>
          </Stack>
        </SectionCard>
      </Box>
      <Box sx={{ mt: 2 }}>
        <PlaceList />
      </Box>
    </PageContainer>
  );
}
