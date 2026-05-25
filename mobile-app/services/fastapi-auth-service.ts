/**
 * Servizio di Autenticazione FastAPI Backend
 * Sostituisce Supabase con il backend custom
 */

import {
  apiClient,
  saveTokens,
  getAccessToken,
  clearTokens,
  saveUserData,
  getUserData,
} from './api-client';
import { API_CONFIG } from '@/config/api';
import {
  UserLogin,
  Token,
  UserResponse,
  ApiResponse,
} from '@/types/api';

// =============================================================================
// AUTENTICAZIONE
// =============================================================================

/**
 * Registra un nuovo utente (non disponibile nell'API pubblica - solo admin)
 */
export async function signUp(data: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<ApiResponse<UserResponse>> {
  return {
    success: false,
    error: 'La registrazione è disponibile solo tramite amministratore',
  };
}

/**
 * Effettua il login
 */
export async function signIn(data: {
  email: string;
  password: string;
}): Promise<ApiResponse<{ user: UserResponse; token: Token }>> {
  try {
    const loginData: UserLogin = {
      email: data.email,
      password: data.password,
    };

    // Chiamata API login
    const response = await apiClient.post<Token>(
      API_CONFIG.ENDPOINTS.LOGIN,
      loginData,
      false // Non richiede auth
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore durante il login',
      };
    }

    const token = response.data;

    // Salva i token
    await saveTokens(token.access_token, token.refresh_token);

    // Ottieni i dati dell'utente
    const userResponse = await apiClient.get<UserResponse>(
      API_CONFIG.ENDPOINTS.ME,
      undefined,
      true // Richiede auth
    );

    if (!userResponse.success || !userResponse.data) {
      await clearTokens();
      return {
        success: false,
        error: 'Errore nel recupero dati utente',
      };
    }

    const user = userResponse.data;

    // Salva dati utente
    await saveUserData(user);

    return {
      success: true,
      data: {
        user,
        token,
      },
      message: 'Login effettuato con successo!',
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'Errore imprevisto durante il login',
    };
  }
}

/**
 * Effettua il logout
 */
export async function signOut(): Promise<ApiResponse> {
  try {
    await clearTokens();

    return {
      success: true,
      message: 'Logout effettuato con successo',
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: 'Errore durante il logout',
    };
  }
}

/**
 * Invia email per reset password (non implementato nel backend)
 */
export async function resetPassword(email: string): Promise<ApiResponse> {
  return {
    success: false,
    error: 'Funzionalità non disponibile. Contatta l\'amministratore per reimpostare la password.',
  };
}

/**
 * Aggiorna la password dell'utente
 */
export async function updatePassword(data: {
  oldPassword?: string;
  newPassword: string;
}): Promise<ApiResponse> {
  try {
    const response = await apiClient.put(
      API_CONFIG.ENDPOINTS.USER_PASSWORD,
      { new_password: data.newPassword },
      true
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Errore nell\'aggiornamento della password',
      };
    }

    return {
      success: true,
      message: 'Password aggiornata con successo',
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: 'Errore durante l\'aggiornamento della password',
    };
  }
}

// =============================================================================
// GESTIONE SESSIONE
// =============================================================================

/**
 * Ottiene l'utente corrente
 */
export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    // Prima prova da storage locale
    const cachedUser = await getUserData();
    if (cachedUser) {
      return cachedUser;
    }

    // Se non c'è cache, richiedi al server
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    const response = await apiClient.get<UserResponse>(
      API_CONFIG.ENDPOINTS.ME,
      undefined,
      true
    );

    if (response.success && response.data) {
      await saveUserData(response.data);
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Verifica se l'utente è autenticato
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

/**
 * Ottiene il profilo dell'utente corrente
 */
export async function getUserProfile(): Promise<ApiResponse<UserResponse>> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'Utente non autenticato',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: 'Errore imprevisto',
    };
  }
}

/**
 * Aggiorna il profilo dell'utente (non disponibile nell'API pubblica)
 */
export async function updateUserProfile(
  updates: Partial<UserResponse>
): Promise<ApiResponse<UserResponse>> {
  return {
    success: false,
    error: 'Aggiornamento profilo non disponibile. Contatta l\'amministratore.',
  };
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Valida formato email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida forza password
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Minimo 6 caratteri');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Almeno una maiuscola');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Almeno una minuscola');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Almeno un numero');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Refresh del token (se necessario)
 */
export async function refreshAccessToken(): Promise<boolean> {
  // TODO: Implementare refresh token se il backend lo supporta
  console.warn('Token refresh not implemented yet');
  return false;
}
