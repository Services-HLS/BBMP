import { Box } from '@mui/material';
import { ResponsiveContainer } from 'recharts';
import SectionCard from './SectionCard';

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  height = 260,
  tall = false,
}) {
  const h = tall ? 300 : height;
  return (
    <SectionCard title={title} subtitle={subtitle} action={action} contentSx={{ pt: 0.5 }}>
      <Box
        className={tall ? 'bbmp-chart-box--tall' : 'bbmp-chart-box'}
        sx={{ width: '100%', height: { xs: Math.min(h, 220), sm: h }, minWidth: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </Box>
    </SectionCard>
  );
}
