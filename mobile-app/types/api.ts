/**
 * Types per API Backend FastAPI
 * Generati da OpenAPI spec
 */

// ============================================================================
// Autenticazione
// ============================================================================

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id_utente: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: string;
  data_creazione: string;
  data_attivazione: string | null;
  data_disattivazione: string | null;
  ultimo_accesso: string | null;
  attivo: boolean;
}

// ============================================================================
// Arnie
// ============================================================================

export interface ArniaConStato {
  id_arnia: number;
  id_nodo: string;
  id_sensore_fisico: string;
  nome_arnia: string | null;
  descrizione: string | null;
  posizione: string | null;
  latitudine: string | null;
  longitudine: string | null;
  data_installazione: string;
  data_rimozione: string | null;
  attiva: boolean;
  metadati: Record<string, any> | null;
  // Ultime letture
  ultima_temperatura: string | null;
  ultima_umidita: string | null;
  ultimo_peso: string | null;
  ultimo_aggiornamento: string | null;
}

export interface ArniaCreate {
  id_nodo: string;
  id_sensore_fisico: string;
  nome_arnia?: string | null;
  descrizione?: string | null;
  posizione?: string | null;
  latitudine?: number | string | null;
  longitudine?: number | string | null;
  metadati?: Record<string, any> | null;
}

export interface ArniaUpdate {
  nome_arnia?: string | null;
  descrizione?: string | null;
  posizione?: string | null;
  latitudine?: number | string | null;
  longitudine?: number | string | null;
  metadati?: Record<string, any> | null;
}

// ============================================================================
// Letture
// ============================================================================

export interface LetturaResponse {
  id_lettura: number;
  id_arnia: number;
  id_nodo: string;
  timestamp: string;
  temperatura: string | null;
  umidita: string | null;
  peso: string | null;
  dati_raw: Record<string, any> | null;
}

export interface SerieTemperaturaResponse {
  timestamp: string;
  temperatura: string | null;
}

export interface SerieUmiditaResponse {
  timestamp: string;
  umidita: string | null;
}

export interface SeriePesoResponse {
  timestamp: string;
  peso: string | null;
}

// ============================================================================
// Attività
// ============================================================================

export interface AttivitaResponse {
  id_log: number;
  id_arnia: number;
  id_utente: number | null;
  timestamp: string;
  tipo_attivita: string;
  descrizione: string | null;
  dati: Record<string, any> | null;
}

export interface AttivitaCreate {
  id_arnia: number;
  tipo_attivita: string;
  descrizione?: string | null;
  timestamp?: string | null;
  dati?: Record<string, any> | null;
}

export interface AttivitaUpdate {
  tipo_attivita?: string;
  descrizione?: string | null;
  timestamp?: string | null;
  dati?: Record<string, any> | null;
}

// ============================================================================
// Nodi
// ============================================================================

export interface NodoResponse {
  id_nodo: string;
  descrizione: string | null;
  tipo_nodo: string | null;
  ultimo_messaggio: string | null;
  attivo: boolean;
  metadati: Record<string, any> | null;
}

// ============================================================================
// Messaggi
// ============================================================================

export interface MessageResponse {
  message: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  detail: string | { loc: string[]; msg: string; type: string }[];
}
