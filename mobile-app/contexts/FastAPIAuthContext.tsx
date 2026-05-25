/**
 * Context per la gestione dello stato di autenticazione globale
 * Versione per backend FastAPI
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { UserResponse } from '@/types/api';
import {
  signIn as authSignIn,
  signOut as authSignOut,
  getCurrentUser,
  isAuthenticated as checkAuth,
  getUserProfile,
} from '@/services/fastapi-auth-service';
// TEMPORANEAMENTE DISABILITATO - Richiede migrazione Supabase
// import { registerForPushNotifications } from '@/services/notification-service';

// =============================================================================
// TIPI
// =============================================================================

interface SignInData {
  email: string;
  password: string;
}

interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
}

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carica utente all'avvio
  useEffect(() => {
    loadInitialUser();
  }, []);

  // TEMPORANEAMENTE DISABILITATO - Richiede migrazione Supabase
  // Registra per notifiche push quando l'utente è autenticato
  /*
  useEffect(() => {
    if (user) {
      // Registra dispositivo per notifiche push
      registerForPushNotifications().then(result => {
        if (result.success) {
          console.log('Push notifications registered successfully');
        } else {
          console.warn('Push notifications not registered:', result.error);
        }
      });
    }
  }, [user]);
  */

  /**
   * Carica l'utente iniziale
   */
  async function loadInitialUser() {
    try {
      setLoading(true);

      // Verifica se è autenticato
      const authenticated = await checkAuth();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Carica i dati dell'utente
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error loading initial user:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Carica il profilo utente
   */
  async function loadUserProfile() {
    try {
      const result = await getUserProfile();
      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  /**
   * Effettua il login
   */
  async function signIn(data: SignInData) {
    try {
      const result = await authSignIn(data);

      if (result.success && result.data) {
        setUser(result.data.user);
        setIsAuthenticated(true);
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'Errore durante il login',
      };
    }
  }

  /**
   * Effettua il logout
   */
  async function signOut() {
    try {
      await authSignOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Ricarica il profilo utente
   */
  async function refreshProfile() {
    await loadUserProfile();
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook per accedere al context di autenticazione
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook per verificare se l'utente è autenticato
 */
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();

  return {
    isAuthenticated,
    loading,
  };
}
