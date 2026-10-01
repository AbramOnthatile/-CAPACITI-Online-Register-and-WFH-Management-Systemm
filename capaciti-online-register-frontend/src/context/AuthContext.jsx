import { createContext, useContext, useMemo, useState } from 'react';
import { login as mockLogin } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('capaciti-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const result = await mockLogin(email, password);
    if (!result.success) {
      return result;
    }

    setUser(result.user);
    localStorage.setItem('capaciti-user', JSON.stringify(result.user));
    return result;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('capaciti-user');
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
      setUser,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
