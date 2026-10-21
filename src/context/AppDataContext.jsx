import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/mockApi';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const store = await api.initStore();
        if (!cancelled) {
          setData(store);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load demo data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const unsub = api.subscribe((next) => {
      setData({ ...next });
      setRefreshKey((k) => k + 1);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const refresh = useCallback(() => {
    const sync = api.getDataSync();
    if (sync) {
      setData({ ...sync });
      setRefreshKey((k) => k + 1);
    }
  }, []);

  const resetDemoData = useCallback(async () => {
    const store = await api.resetDemoData();
    setData(store);
    setRefreshKey((k) => k + 1);
    return store;
  }, []);

  const value = useMemo(() => ({
    data,
    loading,
    error,
    refresh,
    refreshKey,
    resetDemoData,
    api,
  }), [data, loading, error, refresh, refreshKey, resetDemoData]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
