import { useMemo, useState } from 'react';
import {
  Box, Button, Card, CardActionArea, CardContent, Chip, FormControl, InputLabel,
  MenuItem, Select, Stack, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import PageContainer from '../components/common/PageContainer';
import FilterBar from '../components/common/FilterBar';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NOTIFICATION_CATEGORIES, ROLE_LABELS } from '../constants';
import { formatDateTime } from '../utils/date';

export default function NotificationsPage() {
  const { loading } = useAppData();
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, archive } = useNotifications();
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = [...notifications];
    if (category) list = list.filter((n) => n.category === category);
    if (unreadOnly) list = list.filter((n) => !n.read);
    return list;
  }, [notifications, category, unreadOnly]);

  const roleName = ROLE_LABELS[user?.role] || 'Demo';

  if (loading) return <LoadingState />;

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread · shown for ${roleName} login only.`}
        actions={
          <Button variant="outlined" onClick={() => markAllRead()} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Mark all read
          </Button>
        }
      />

      <FilterBar>
        <FormControl size="small">
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {NOTIFICATION_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Filter</InputLabel>
          <Select label="Filter" value={unreadOnly ? 'unread' : 'all'} onChange={(e) => setUnreadOnly(e.target.value === 'unread')}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="unread">Unread only</MenuItem>
          </Select>
        </FormControl>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="No notifications" description="Perform demo actions to generate new alerts." />
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((n) => (
            <Card key={n.id} variant="outlined" sx={{ bgcolor: n.read ? 'background.paper' : 'action.hover' }}>
              <CardActionArea
                onClick={async () => {
                  await markRead(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        {!n.read && <Chip size="small" color="error" label="Unread" />}
                        <Chip size="small" label={n.priority} />
                        <Typography variant="caption" color="text.secondary">{n.category}</Typography>
                      </Stack>
                      <Typography fontWeight={700} sx={{ mt: 0.5, wordBreak: 'break-word' }}>{n.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{n.message}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDateTime(n.createdAt)}</Typography>
                    </Box>
                    <Button
                      size="small"
                      sx={{ flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); archive(n.id); }}
                    >
                      Archive
                    </Button>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </PageContainer>
  );
}
