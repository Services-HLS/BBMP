import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useAppData } from './AppDataContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { data, api, refreshKey } = useAppData();
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // refreshKey keeps unread in sync after store updates
  }, [refreshKey]);

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  const markRead = useCallback(async (id) => {
    await api.markNotificationRead(id);
  }, [api]);

  const markAllRead = useCallback(async () => {
    await api.markAllNotificationsRead();
    showToast('All notifications marked as read');
  }, [api, showToast]);

  const archive = useCallback(async (id) => {
    await api.archiveNotification(id);
  }, [api]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    showToast,
    markRead,
    markAllRead,
    archive,
  }), [notifications, unreadCount, showToast, markRead, markAllRead, archive]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
