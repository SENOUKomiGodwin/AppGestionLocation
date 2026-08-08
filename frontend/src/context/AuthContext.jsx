import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';
import { tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.user);
      setSettings(data.settings ?? {});
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    tokenStore.set(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    tokenStore.set(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* token déjà invalide */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const can = useCallback(
    (permission) => {
      if (!user) return false;
      const role = user.role;
      if (role === 'super-admin') return true;
      // Permissions par rôle
      const permissions = {
        'manage-houses': ['super-admin', 'gestionnaire'],
        'manage-tenants': ['super-admin', 'gestionnaire'],
        'manage-contracts': ['super-admin', 'gestionnaire'],
        'manage-payments': ['super-admin', 'gestionnaire', 'comptable'],
        'manage-expenses': ['super-admin', 'gestionnaire', 'comptable'],
        'manage-users': ['super-admin'],
        'manage-settings': ['super-admin', 'gestionnaire'],
        'view-audit': ['super-admin'],
      };
      return permissions[permission]?.includes(role) ?? true;
    },
    [user]
  );

  const value = {
    user,
    settings,
    setSettings,
    loading,
    login,
    register,
    logout,
    can,
    reload: loadMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
