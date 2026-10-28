import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearApiToken, getApiToken, setApiToken } from '../api/client';
import { useAuthApi } from '../api/hooks';
import { clearApiQueryCache } from '../api/hooks/queryClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authApi = useAuthApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getApiToken()));
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearApiQueryCache();
      setUser(null);
      setLoading(false);
      setError(null);
    };
    window.addEventListener('capaciti:session-expired', handleSessionExpired);
    return () => window.removeEventListener('capaciti:session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!getApiToken()) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(setUser)
      .catch((requestError) => setError(requestError))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const result = await authApi.login({ email, password });
    setApiToken(result.token, result.expiresAt);
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
    clearApiToken({ redirect: false });
    clearApiQueryCache();
    setUser(null);
    setLoading(false);
    setError(null);
  }, []);

  const updateCurrentUser = useCallback((updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
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
