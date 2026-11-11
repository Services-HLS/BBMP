import { useEffect, useState } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import CivicMark from '../brand/CivicMark';
import { colors } from '../../theme/tokens';

const SPLASH_KEY = 'bswml-splash-seen-v8';
const DURATION_MS = 6000;
const STREET_SRC = '/splash-street.jpg?v=2';
const AUTO_SRC = '/splash-auto-cutout.png?v=4';
const BAG_BLACK = '/splash-bag-black.png?v=2';
const BAG_WHITE = '/splash-bag-white.png?v=2';
const BAG_GREEN = '/splash-bag-green.png?v=1';

function shouldPlaySplash() {
  try {
    if (new URLSearchParams(window.location.search).has('forceSplash')) return true;
    return sessionStorage.getItem(SPLASH_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Single tipper auto — wheels planted on asphalt */
function RoadAuto() {
  return (
    <Box
      aria-hidden
      className="bswml-auto-drive"
      sx={{
        position: 'absolute',
        left: 0,
        /* sit on the photo asphalt band */
        bottom: { xs: '6%', sm: '7%' },
        width: { xs: 230, sm: 310, md: 380 },
        zIndex: 6,
        willChange: 'transform',
        filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.6))',
        '& img': {
          /* flip on img so parent can animate transform safely */
          transform: 'scaleX(-1)',
          width: '100%',
          height: 'auto',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        },
      }}
    >
      <Box component="img" src={AUTO_SRC} alt="" draggable={false} />
    </Box>
  );
}

/** Photorealistic garbage bag / waste on the curb */
function RealisticBag({ left, delay, src, width, bottom }) {
  return (
    <Box
      aria-hidden
      className="bswml-bag-collect"
      sx={{
        position: 'absolute',
        left,
        bottom: bottom ?? { xs: '23%', sm: '25%' },
        width,
        zIndex: 5,
        animationDelay: `${delay}s`,
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))',
        '& img': {
          width: '100%',
          height: 'auto',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        },
      }}
    >
      <Box component="img" src={src} alt="" draggable={false} />
    </Box>
  );
}

/**
 * Startup splash: logo on top, one auto on the road collecting realistic bags.
 * Plays once per browser session.
 */
export default function SplashIntro({ children }) {
  const [show, setShow] = useState(() => shouldPlaySplash());
  const [visible, setVisible] = useState(() => shouldPlaySplash());

  useEffect(() => {
    if (!show) return undefined;

    const fadeTimer = window.setTimeout(() => {
      setVisible(false);
      try {
        if (!new URLSearchParams(window.location.search).has('forceSplash')) {
          sessionStorage.setItem(SPLASH_KEY, '1');
        }
      } catch {
        /* ignore */
      }
    }, DURATION_MS);

    const unmountTimer = window.setTimeout(() => {
      setShow(false);
    }, DURATION_MS + 500);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [show]);

  if (!show) return children;

  return (
    <>
      {children}
      <Fade in={visible} timeout={420}>
        <Box
          role="dialog"
          aria-label="BSWML One App starting"
          aria-busy="true"
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 4000,
            overflow: 'hidden',
            bgcolor: colors.navyDeep,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 8,
              flexShrink: 0,
              px: { xs: 2, sm: 3 },
              pt: { xs: 1.75, sm: 2.1 },
              pb: { xs: 1.1, sm: 1.25 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.65,
              background:
                'linear-gradient(180deg, rgba(8,18,28,0.88) 0%, rgba(8,18,28,0.35) 85%, transparent 100%)',
              animation: 'bswml-brand-in 0.7s ease-out both',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 1.6 } }}>
              <CivicMark size={48} variant="dark" />
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
                    fontWeight: 800,
                    fontSize: { xs: '1.35rem', sm: '1.65rem' },
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    display: 'flex',
                    gap: 0.75,
                  }}
                >
                  <Box component="span" sx={{ color: '#fff' }}>
                    BSWML
                  </Box>
                  <Box component="span" sx={{ color: colors.leafBright }}>
                    One App
                  </Box>
                </Typography>
                <Typography
                  sx={{
                    mt: 0.3,
                    fontSize: { xs: '0.7rem', sm: '0.78rem' },
                    fontWeight: 600,
                    color: 'rgba(220,230,236,0.8)',
                  }}
                >
                  Bengaluru Solid Waste Management Limited
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", "Source Sans 3", sans-serif',
                fontSize: { xs: '0.78rem', sm: '0.88rem' },
                color: 'rgba(255,255,255,0.78)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Collection auto on route · loading your workspace…
            </Typography>

            <Box
              sx={{
                width: 200,
                height: 3,
                borderRadius: 99,
                bgcolor: 'rgba(255,255,255,0.14)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  bgcolor: colors.leaf,
                  transformOrigin: 'left center',
                  animation: 'bswml-splash-progress 6s linear both',
                }}
              />
            </Box>
          </Box>

          <Box sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  linear-gradient(180deg, rgba(8,22,34,0.55) 0%, rgba(8,22,34,0.12) 38%, rgba(8,22,34,0.18) 100%),
                  url(${STREET_SRC})
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom',
                animation: 'bswml-splash-ken 6s ease-out both',
              }}
            />

            {/* realistic waste bags on curb — collected into hopper */}
            <RealisticBag
              left={{ xs: '34%', sm: '36%' }}
              delay={0}
              src={BAG_WHITE}
              width={{ xs: 52, sm: 68 }}
            />
            <RealisticBag
              left={{ xs: '42%', sm: '44%' }}
              delay={0.08}
              src={BAG_BLACK}
              width={{ xs: 48, sm: 62 }}
              bottom={{ xs: '22%', sm: '24%' }}
            />
            <RealisticBag
              left={{ xs: '50%', sm: '52%' }}
              delay={0.16}
              src={BAG_GREEN}
              width={{ xs: 46, sm: 58 }}
            />
            <RealisticBag
              left={{ xs: '57%', sm: '59%' }}
              delay={0.24}
              src={BAG_BLACK}
              width={{ xs: 40, sm: 52 }}
              bottom={{ xs: '22.5%', sm: '24.5%' }}
            />

            <RoadAuto />
          </Box>
        </Box>
      </Fade>
    </>
  );
}
