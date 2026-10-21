import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_USERS, ROLES } from '../constants';
import { loadSession, saveSession, clearSession } from '../utils/storage';

const AuthContext = createContext(null);

function findDemoUser(userId) {
  return DEMO_USERS.find((u) => u.id === userId) || null;
}

function toSessionUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session?.userId) {
      const found = findDemoUser(session.userId);
      if (found) setUser(toSessionUser(found));
    }
    setReady(true);
  }, []);

  const login = useCallback((username, password) => {
    const normalized = String(username || '').trim().toLowerCase();
    const found = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === normalized && u.password === String(password || ''),
    );
    if (!found) {
      const err = new Error('Invalid username or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }
    const safe = toSessionUser(found);
    setUser(safe);
    saveSession({
      userId: found.id,
      role: found.role,
      loggedInAt: new Date().toISOString(),
    });
    return safe;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    isCitizen: user?.role === ROLES.CITIZEN,
    isSupervisor: user?.role === ROLES.SUPERVISOR,
    isAdmin: user?.role === ROLES.ADMIN,
    login,
    logout,
    demoUsers: DEMO_USERS.map(toSessionUser),
  }), [user, ready, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
