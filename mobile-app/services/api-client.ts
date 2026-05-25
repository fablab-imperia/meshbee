/**
 * API Client per backend FastAPI
 * Gestisce autenticazione JWT e chiamate HTTP
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiError } from '@/types/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@beehive_access_token',
  REFRESH_TOKEN: '@beehive_refresh_token',
  USER_DATA: '@beehive_user_data',
};

// ============================================================================
// Storage per tokens
// ============================================================================

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
}

export async function saveUserData(userData: any): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

export async function getUserData(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

// ============================================================================
// API Client
// ============================================================================

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean | null | undefined>;
  requiresAuth?: boolean;
  timeout?: number;
}

export interface ApiClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Classe principale per chiamate API
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Costruisce URL completo con parametri query
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Prepara headers per la richiesta
   */
  private async prepareHeaders(
    customHeaders?: Record<string, string>,
    requiresAuth: boolean = false
  ): Promise<Record<string, string>> {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    if (requiresAuth) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Esegue una richiesta HTTP
   */
  private async executeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiClientResponse<T>> {
    const {
      method = 'GET',
      headers: customHeaders,
      body,
      params,
      requiresAuth = false,
      timeout = this.timeout,
    } = options;

    try {
      const url = this.buildUrl(endpoint, params);
      const headers = await this.prepareHeaders(customHeaders, requiresAuth);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      console.log(`🌐 API Request: ${method} ${url}`);

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Parsing risposta
      let data: any;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Gestione risposta non OK
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, data);

        return {
          success: false,
          error: this.parseError(data),
          statusCode: response.status,
        };
      }

      console.log(`✅ API Success: ${method} ${url}`);

      return {
        success: true,
        data,
        statusCode: response.status,
      };

    } catch (error: any) {
      console.error(`❌ API Request failed:`, error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
        };
      }

      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  /**
   * Estrae messaggio di errore da risposta API
   */
  private parseError(errorData: any): string {
    if (typeof errorData === 'string') {
      return errorData;
    }

    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      }

      if (Array.isArray(errorData.detail)) {
        return errorData.detail
          .map((err: any) => err.msg || JSON.stringify(err))
          .join(', ');
      }
    }

    if (errorData.message) {
      return errorData.message;
    }

    return 'Errore sconosciuto';
  }

  // ==========================================================================
  // Metodi pubblici HTTP
  // ==========================================================================

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    requiresAuth: boolean = false
  ): Promise<ApiClientResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'GET',
      params,
      requiresAuth,
    });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    requiresAuth: boolean = false
  ): Promise<ApiClientResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'POST',
      body,
      requiresAuth,
    });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    requiresAuth: boolean = false
  ): Promise<ApiClientResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'PUT',
      body,
      requiresAuth,
    });
  }

  async delete<T>(
    endpoint: string,
    requiresAuth: boolean = false
  ): Promise<ApiClientResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'DELETE',
      requiresAuth,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    requiresAuth: boolean = false
  ): Promise<ApiClientResponse<T>> {
    return this.executeRequest<T>(endpoint, {
      method: 'PATCH',
      body,
      requiresAuth,
    });
  }
}

// Istanza singleton del client
export const apiClient = new ApiClient();

// =============================================================================
// Utility functions
// =============================================================================

/**
 * Sostituisce parametri nell'URL (es: /api/arnie/:id -> /api/arnie/123)
 */
export function buildPath(template: string, params: Record<string, string | number>): string {
  let path = template;
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, String(params[key]));
  });
  return path;
}
