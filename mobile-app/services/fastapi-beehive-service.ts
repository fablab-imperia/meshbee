/**
 * Servizio per caricare i dati delle arnie da FastAPI Backend
 */

import { apiClient, buildPath } from './api-client';
import { API_CONFIG } from '@/config/api';
import {
  ArniaConStato,
  LetturaResponse,
  SerieTemperaturaResponse,
  SerieUmiditaResponse,
  SeriePesoResponse,
  AttivitaResponse,
  AttivitaCreate,
  AttivitaUpdate,
} from '@/types/api';
import { BeehiveData, SensorReading } from '@/types/sensors';

// =============================================================================
// MAPPING DA API A TIPI APP
// =============================================================================

/**
 * Converte ArniaConStato in BeehiveData
 */
function mapArniaToBeehive(arnia: ArniaConStato): BeehiveData {
  return {
    id: String(arnia.id_arnia),
    deviceId: arnia.id_nodo,
    name: arnia.nome_arnia || `Arnia ${arnia.id_arnia}`,
    weight: [],
    temperature: [],
    humidity: [],
    currentWeight: arnia.ultimo_peso ? parseFloat(arnia.ultimo_peso) : 0,
    currentTemperature: arnia.ultima_temperatura ? parseFloat(arnia.ultima_temperatura) : 0,
    currentHumidity: arnia.ultima_umidita ? parseFloat(arnia.ultima_umidita) : 0,
    lastUpdate: arnia.ultimo_aggiornamento ? new Date(arnia.ultimo_aggiornamento) : undefined,
  };
}

// =============================================================================
// ARNIE
// =============================================================================

/**
 * Carica i dati di tutte le arnie dell'utente
 */
export async function loadBeehivesData(): Promise<{
  success: boolean;
  data?: BeehiveData[];
  error?: string;
}> {
  try {
    console.log('🐝 Inizio caricamento dati arnie da FastAPI...');

    const response = await apiClient.get<ArniaConStato[]>(
      API_CONFIG.ENDPOINTS.USER_ARNIE,
      undefined,
      true // Requires auth
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nel caricamento delle arnie',
      };
    }

    const arnie = response.data;
    console.log(`📋 Trovate ${arnie.length} arnie`);

    // Mappa arnie e carica serie temporali in parallelo
    const beehivesData: BeehiveData[] = await Promise.all(
      arnie.map(async (arnia) => {
        const beehive = mapArniaToBeehive(arnia);

        // Carica serie temporali degli ultimi 7 giorni (limite 100 punti per serie)
        const [tempResult, humidityResult, weightResult] = await Promise.all([
          loadTemperatureSeries(arnia.id_arnia, { limit: 100 }),
          loadHumiditySeries(arnia.id_arnia, { limit: 100 }),
          loadWeightSeries(arnia.id_arnia, { limit: 100 }),
        ]);

        // Aggiungi serie temporali se disponibili
        if (tempResult.success && tempResult.data) {
          beehive.temperature = tempResult.data;
        }
        if (humidityResult.success && humidityResult.data) {
          beehive.humidity = humidityResult.data;
        }
        if (weightResult.success && weightResult.data) {
          beehive.weight = weightResult.data;
        }

        return beehive;
      })
    );

    console.log('✅ Caricamento completato con successo!');
    return {
      success: true,
      data: beehivesData,
    };
  } catch (error) {
    console.error('❌ ERRORE nel caricamento dati arnie:', error);
    return {
      success: false,
      error: 'Errore durante il caricamento dei dati',
    };
  }
}

/**
 * Carica i dati di una singola arnia
 */
export async function loadSingleBeehiveData(
  arniaId: string | number
): Promise<{
  success: boolean;
  data?: BeehiveData;
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_ARNIA, { id: arniaId });

    const response = await apiClient.get<ArniaConStato>(
      path,
      undefined,
      true
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nel caricamento dell\'arnia',
      };
    }

    const beehiveData = mapArniaToBeehive(response.data);

    return {
      success: true,
      data: beehiveData,
    };
  } catch (error) {
    console.error('Errore caricamento dati arnia:', error);
    return {
      success: false,
      error: 'Errore durante il caricamento dei dati',
    };
  }
}

// =============================================================================
// SERIE TEMPORALI
// =============================================================================

/**
 * Carica serie temporale temperatura
 */
export async function loadTemperatureSeries(
  arniaId: string | number,
  options?: {
    dataInizio?: Date;
    dataFine?: Date;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: SensorReading[];
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_LETTURE_TEMPERATURA, { id: arniaId });

    const params: any = {
      limit: options?.limit || 1000,
    };

    if (options?.dataInizio) {
      params.data_inizio = options.dataInizio.toISOString();
    }
    if (options?.dataFine) {
      params.data_fine = options.dataFine.toISOString();
    }

    const response = await apiClient.get<SerieTemperaturaResponse[]>(
      path,
      params,
      true
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nel caricamento della serie temperatura',
      };
    }

    const series: SensorReading[] = response.data
      .filter(item => item.temperatura !== null)
      .map(item => ({
        timestamp: new Date(item.timestamp),
        value: parseFloat(item.temperatura!),
      }));

    return {
      success: true,
      data: series,
    };
  } catch (error) {
    console.error('Errore caricamento serie temperatura:', error);
    return {
      success: false,
      error: 'Errore durante il caricamento dei dati',
    };
  }
}

/**
 * Carica serie temporale umidità
 */
export async function loadHumiditySeries(
  arniaId: string | number,
  options?: {
    dataInizio?: Date;
    dataFine?: Date;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: SensorReading[];
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_LETTURE_UMIDITA, { id: arniaId });

    const params: any = {
      limit: options?.limit || 1000,
    };

    if (options?.dataInizio) {
      params.data_inizio = options.dataInizio.toISOString();
    }
    if (options?.dataFine) {
      params.data_fine = options.dataFine.toISOString();
    }

    const response = await apiClient.get<SerieUmiditaResponse[]>(
      path,
      params,
      true
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nel caricamento della serie umidità',
      };
    }

    const series: SensorReading[] = response.data
      .filter(item => item.umidita !== null)
      .map(item => ({
        timestamp: new Date(item.timestamp),
        value: parseFloat(item.umidita!),
      }));

    return {
      success: true,
      data: series,
    };
  } catch (error) {
    console.error('Errore caricamento serie umidità:', error);
    return {
      success: false,
      error: 'Errore durante il caricamento dei dati',
    };
  }
}

/**
 * Carica serie temporale peso
 */
export async function loadWeightSeries(
  arniaId: string | number,
  options?: {
    dataInizio?: Date;
    dataFine?: Date;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: SensorReading[];
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_LETTURE_PESO, { id: arniaId });

    const params: any = {
      limit: options?.limit || 1000,
    };

    if (options?.dataInizio) {
      params.data_inizio = options.dataInizio.toISOString();
    }
    if (options?.dataFine) {
      params.data_fine = options.dataFine.toISOString();
    }

    const response = await apiClient.get<SeriePesoResponse[]>(
      path,
      params,
      true
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nel caricamento della serie peso',
      };
    }

    const series: SensorReading[] = response.data
      .filter(item => item.peso !== null)
      .map(item => ({
        timestamp: new Date(item.timestamp),
        value: parseFloat(item.peso!),
      }));

    return {
      success: true,
      data: series,
    };
  } catch (error) {
    console.error('Errore caricamento serie peso:', error);
    return {
      success: false,
      error: 'Errore durante il caricamento dei dati',
    };
  }
}

// =============================================================================
// ATTIVITÀ
// =============================================================================

/**
 * Carica le attività di un'arnia
 */
export async function loadBeehiveActivities(
  arniaId: string | number,
  options?: {
    dataInizio?: Date;
    dataFine?: Date;
    tipoAttivita?: string;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: AttivitaResponse[];
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_ATTIVITA, { id: arniaId });

    const params: any = {
      limit: options?.limit || 100,
    };

    if (options?.dataInizio) {
      params.data_inizio = options.dataInizio.toISOString();
    }
    if (options?.dataFine) {
      params.data_fine = options.dataFine.toISOString();
    }
    if (options?.tipoAttivita) {
      params.tipo_attivita = options.tipoAttivita;
    }

    const response = await apiClient.get<AttivitaResponse[]>(
      path,
      params,
      true
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nel caricamento delle attività',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Errore caricamento attività:', error);
    return {
      success: false,
      error: 'Errore durante il caricamento delle attività',
    };
  }
}

/**
 * Crea una nuova attività
 */
export async function createBeehiveActivity(
  arniaId: string | number,
  activity: Omit<AttivitaCreate, 'id_arnia'>
): Promise<{
  success: boolean;
  data?: AttivitaResponse;
  error?: string;
}> {
  try {
    console.log('📝 Creazione attività per arnia:', arniaId, activity);
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_ATTIVITA, { id: arniaId });

    const activityData: AttivitaCreate = {
      ...activity,
      id_arnia: typeof arniaId === 'string' ? parseInt(arniaId) : arniaId,
    };

    const response = await apiClient.post<AttivitaResponse>(
      path,
      activityData,
      true
    );

    if (!response.success || !response.data) {
      console.error('❌ Errore API creazione attività:', response.error);
      return {
        success: false,
        error: response.error || 'Errore nella creazione dell\'attività',
      };
    }

    console.log('✅ Attività creata con successo:', response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Errore creazione attività:', error);
    return {
      success: false,
      error: 'Errore durante la creazione dell\'attività',
    };
  }
}

/**
 * Aggiorna un'attività esistente
 */
export async function updateBeehiveActivity(
  arniaId: string | number,
  activityId: string | number,
  activity: AttivitaUpdate
): Promise<{
  success: boolean;
  data?: AttivitaResponse;
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_ATTIVITA_DETAIL, { 
      id_arnia: arniaId,
      id_log: activityId 
    });

    const response = await apiClient.patch<AttivitaResponse>(
      path,
      activity,
      true
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Errore nell\'aggiornamento dell\'attività',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Errore aggiornamento attività:', error);
    return {
      success: false,
      error: 'Errore durante l\'aggiornamento dell\'attività',
    };
  }
}

/**
 * Elimina un'attività
 */
export async function deleteBeehiveActivity(
  arniaId: string | number,
  activityId: string | number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const path = buildPath(API_CONFIG.ENDPOINTS.USER_ATTIVITA_DETAIL, { 
      id_arnia: arniaId,
      id_log: activityId 
    });

    const response = await apiClient.delete(
      path,
      true
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Errore nell\'eliminazione dell\'attività',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Errore eliminazione attività:', error);
    return {
      success: false,
      error: 'Errore durante l\'eliminazione dell\'attività',
    };
  }
}
