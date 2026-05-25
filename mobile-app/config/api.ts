/**
 * Configurazione API Backend FastAPI
 *
 * Imposta EXPO_PUBLIC_API_URL nel file .env (vedi .env.example)
 */

export const API_CONFIG = {
  // URL base del backend FastAPI — configurabile tramite variabile d'ambiente
  BASE_URL: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'),

  // Timeout per le richieste (ms)
  TIMEOUT: 30000,

  // Endpoints
  ENDPOINTS: {
    // Autenticazione
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',

    // Utente
    USER_ARNIE: '/api/user/arnie',
    USER_ARNIA: '/api/user/arnie/:id',
    USER_LETTURE: '/api/user/arnie/:id/letture',
    USER_LETTURE_TEMPERATURA: '/api/user/arnie/:id/letture/temperatura',
    USER_LETTURE_UMIDITA: '/api/user/arnie/:id/letture/umidita',
    USER_LETTURE_PESO: '/api/user/arnie/:id/letture/peso',
    USER_ATTIVITA: '/api/user/arnie/:id/attivita',
    USER_ATTIVITA_DETAIL: '/api/user/arnie/:id_arnia/attivita/:id_log',
    USER_PASSWORD: '/api/user/password',

    // Admin
    ADMIN_UTENTI: '/api/admin/utenti',
    ADMIN_ARNIE: '/api/admin/arnie',
    ADMIN_NODI: '/api/admin/nodi',
    ADMIN_LETTURE: '/api/admin/letture',
    ADMIN_ATTIVITA: '/api/admin/attivita',
  },

  // Headers default
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;
