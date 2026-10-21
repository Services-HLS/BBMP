import { Box } from '@mui/material';

/** Side-view municipal collection auto for splash motion */
export default function WasteAutoSvg({ sx, ...rest }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 280 140"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      sx={{ display: 'block', width: '100%', height: 'auto', ...sx }}
      {...rest}
    >
      {/* hopper / waste body */}
      <rect x="18" y="38" width="118" height="58" rx="8" fill="#1FA86A" />
      <rect x="26" y="46" width="102" height="18" rx="4" fill="#4CD68A" opacity="0.45" />
      <path d="M28 78h98l-6 14H34z" fill="#186B48" />
      {/* cabin */}
      <path d="M140 46h72c10 0 18 8 18 18v32H140V46z" fill="#F2C94C" />
      <path d="M152 54h48c6 0 10 4 10 9v15H152V54z" fill="#7EC8E3" opacity="0.9" />
      <rect x="210" y="72" width="14" height="10" rx="2" fill="#D99224" />
      {/* chassis */}
      <rect x="16" y="92" width="230" height="10" rx="3" fill="#143A4F" />
      {/* wheels */}
      <circle cx="58" cy="108" r="18" fill="#1A1A1A" />
      <circle cx="58" cy="108" r="8" fill="#9AA5B1" />
      <circle cx="210" cy="108" r="18" fill="#1A1A1A" />
      <circle cx="210" cy="108" r="8" fill="#9AA5B1" />
      {/* headlight */}
      <circle cx="228" cy="82" r="4" fill="#FFF3C4" />
      {/* BBMP stripe */}
      <rect x="148" y="88" width="56" height="6" rx="2" fill="#143A4F" opacity="0.35" />
    </Box>
  );
}
