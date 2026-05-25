// Tipi per i dati dei sensori

export interface SensorReading {
  timestamp: Date;
  value: number;
}

export interface BeehiveData {
  id: string;
  name: string;
  deviceId: string; // ID del dispositivo/nodo IoT
  weight: SensorReading[];
  temperature: SensorReading[];
  humidity: SensorReading[];
  currentWeight: number;
  currentTemperature: number;
  currentHumidity: number;
  lastUpdate?: Date;
}

export interface BeehiveSummary {
  id: string;
  name: string;
  deviceId: string; // ID del dispositivo/nodo IoT
  lastWeight: SensorReading;
  lastTemperature: SensorReading;
  lastHumidity: SensorReading;
}

export interface SoilSensor {
  id: string;
  location: string;
  temperature: SensorReading[];
  humidity: SensorReading[];
  currentTemperature: number;
  currentHumidity: number;
}

export interface IrrigationSystem {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastActivation: Date;
  waterFlow: SensorReading[]; // litri per ora
  currentFlow: number;
}

export interface FarmData {
  beehives: BeehiveData[];
  lastUpdate: Date;
}
