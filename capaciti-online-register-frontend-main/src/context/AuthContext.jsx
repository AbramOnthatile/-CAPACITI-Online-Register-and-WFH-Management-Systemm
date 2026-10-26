import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearApiToken, getApiToken, setApiToken } from '../api/client';
import { useAuthApi } from '../api/hooks';
import { useMocks } from '../api/mockMode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authApi = useAuthApi();
  const [user, setUser] = useState(null);
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
    setUser(result.user);
    return { success: true, user: result.user };
  }, [authApi]);

  const logout = useCallback(() => {
    if (!useMocks) clearApiToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, isAuthenticated: Boolean(user), login, logout }),
    [user, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
