import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearApiToken, getApiToken, setApiToken } from '../api/client';
import { useAuthApi } from '../api/hooks';
import { useMocks } from '../api/mockMode';
import { readMockValue, removeMockValue, writeMockValue } from '../mocks/storage';
import { clearApiQueryCache } from '../api/hooks/queryClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authApi = useAuthApi();
  const [user, setUser] = useState(() => useMocks ? readMockValue('session-user', null) : null);
  const [loading, setLoading] = useState(!useMocks && Boolean(getApiToken()));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (useMocks || !getApiToken()) return;
    authApi.me()
      .then(setUser)
      .catch((requestError) => setError(requestError))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const result = await authApi.login({ email, password });
    if (!useMocks) setApiToken(result.token);
    else writeMockValue('session-user', result.user);
    setUser(result.user);
    return { success: true, user: result.user };
  }, [authApi]);

  const refreshSession = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setUser(await authApi.me());
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [authApi]);

  const logout = useCallback(() => {
    if (!useMocks) clearApiToken();
    else removeMockValue('session-user');
    clearApiQueryCache();
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (useMocks) writeMockValue('session-user', updatedUser);
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, error, isAuthenticated: Boolean(user), login, logout, refreshSession, updateCurrentUser }),
    [user, loading, error, login, logout, refreshSession, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
