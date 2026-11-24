import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { api, setAuthToken, getAuthToken, BootstrapAuthStatus } from '../lib/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | 'guest';
  isLoading: boolean;
  canReturnToAdmin: boolean;
  bootstrapStatus: BootstrapAuthStatus | null;
  refreshBootstrapStatus: () => Promise<void>;
  refreshSessionUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsSetup?: string }>;
  claimAdmin: (password: string) => Promise<{ success: boolean; error?: string }>;
  activateStudent: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  impersonateUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  returnToAdmin: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  updateCurrentProfile: (updates: { mobileNumber?: string; avatarUrl?: string }) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminVault, setAdminVault] = useState<{ user: UserProfile; token: string | null } | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapAuthStatus | null>(null);

  const refreshBootstrapStatus = useCallback(async () => {
    try {
      const status = await api.getAuthBootstrapStatus();
      setBootstrapStatus(status);
    } catch {
      // ignore
    }
  }, []);

  const refreshSessionUser = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setCurrentUser(user);
      if (user?.role === 'admin' && !adminVault) {
        setAdminVault({ user, token: getAuthToken() });
      }
    } catch {
      setCurrentUser(null);
    }
  }, [adminVault]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ user }, bStatus] = await Promise.all([api.getMe(), api.getAuthBootstrapStatus()]);
        if (!mounted) return;
        setCurrentUser(user);
        setBootstrapStatus(bStatus);
        if (user?.role === 'admin') {
          setAdminVault({ user, token: getAuthToken() });
        }
      } catch {
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsSetup?: string }> => {
    setIsLoading(true);
    try {
      const { user, token } = await api.login(email.trim(), password);
      setAuthToken(token);
      setCurrentUser(user);
      if (user.role === 'admin') {
        setAdminVault({ user, token });
      } else {
        setAdminVault(null);
      }
      return { success: true };
    } catch (err) {
      const e = err as Error & { needsSetup?: string };
      return { success: false, error: e.message || 'Sign in failed.', needsSetup: e.needsSetup };
    } finally {
      setIsLoading(false);
    }
  };

  const claimAdmin = async (password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { user, token } = await api.claimAdminPassword(password);
      setAuthToken(token);
      setCurrentUser(user);
      setAdminVault({ user, token });
      await refreshBootstrapStatus();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Admin setup failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const activateStudent = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { user, token } = await api.activateStudentPassword(email, password);
      setAuthToken(token);
      setCurrentUser(user);
      setAdminVault(null);
      await refreshBootstrapStatus();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Student activation failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore network error on logout
    }
    setAuthToken(null);
    setAdminVault(null);
    setCurrentUser(null);
  };

  const impersonateUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const adminToken = adminVault?.token || (currentUser?.role === 'admin' ? getAuthToken() : null);
    if (currentUser?.role === 'admin' && !adminVault) {
      setAdminVault({ user: currentUser, token: getAuthToken() });
    }
    try {
      const { user, token } = await api.impersonate(userId, adminToken || undefined);
      setAuthToken(token);
      setCurrentUser(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to switch user view.' };
    }
  };

  const returnToAdmin = async (): Promise<{ success: boolean; error?: string }> => {
    if (!adminVault) return { success: false, error: 'No admin session available.' };
    try {
      const { user, token } = await api.impersonate(adminVault.user.id, adminVault.token || undefined);
      setAuthToken(token);
      setCurrentUser(user);
      setAdminVault({ user, token });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to restore admin session.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await api.requestPasswordReset(email.trim());
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Reset request failed.' };
    }
  };

  const updateCurrentProfile = async (updates: {
    mobileNumber?: string;
    avatarUrl?: string;
  }): Promise<UserProfile | null> => {
    if (!currentUser) return null;
    const updated = await api.updateMyProfile(updates);
    setCurrentUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser ? currentUser.role : 'guest',
        isLoading,
        canReturnToAdmin: Boolean(adminVault && currentUser?.role !== 'admin'),
        bootstrapStatus,
        refreshBootstrapStatus,
        refreshSessionUser,
        login,
        claimAdmin,
        activateStudent,
        logout,
        impersonateUser,
        returnToAdmin,
        resetPassword,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
