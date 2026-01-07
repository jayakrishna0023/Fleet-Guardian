export interface TirePressure {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

export interface TireHealth {
  fl: number; // percentage 0-100
  fr: number;
  rl: number;
  rr: number;
  lastChecked?: Date;
}

export interface VehicleSensors {
  engineTemp: number;
  oilPressure: number;
  tirePressure: TirePressure;
  batteryVoltage: number;
  fuelLevel: number;
  brakeWear?: number;
  coolantLevel?: number;
}

export interface VehicleLocation {
  lat: number;
  lng: number;
  address?: string;
  timestamp?: Date;
}

export interface LocationHistory {
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
}

export interface MaintenanceInfo {
  lastOilChange?: Date;
  nextOilChangeDue?: number; // km
  lastTyreChange?: Date;
  lastBrakeService?: Date;
  lastFullService?: Date;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
  pollutionCertExpiry?: Date;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'bus' | 'truck' | 'van' | 'car';
  licensePlate: string;
  healthScore: number;
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'out-of-service';
  lastUpdated?: Date;
  mileage: number;
  fuelEfficiency: number;
  engineTemperature?: number;
  driver?: string;
  ownerId?: string; // User ID who owns this vehicle
  ownerName?: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  sensors: VehicleSensors;
  location: VehicleLocation;
  locationHistory?: LocationHistory[]; // For traceability
  tireHealth?: TireHealth;
  maintenanceInfo?: MaintenanceInfo;
  manufacturer?: string;
  model?: string;
  year?: number;
  engineNumber?: string;
  chassisNumber?: string;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  trips: TripData[];
  alerts: Alert[];
}

export interface TripData {
  id: string;
  vehicleId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  timestamp: Date;
  startLocation?: VehicleLocation;
  endLocation?: VehicleLocation;
  route?: LocationHistory[]; // GPS route trace
  mileage: number;
  distanceTraveled?: number;
  engineTemperature: number;
  fuelEfficiency: number;
  fuelConsumed?: number;
  brakingIntensity: number;
  speedVariation: number;
  maxSpeed?: number;
  idleTime: number;
  tripDuration: number;
  averageSpeed: number;
  tripPurpose?: string;
  notes?: string;
  status?: 'ongoing' | 'completed' | 'cancelled';
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'warning' | 'critical';
  type: 'anomaly' | 'prediction' | 'threshold' | 'maintenance' | string;
  title?: string;
  message: string;
  description?: string;
  component?: string;
  probability?: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface PredictiveInsight {
  id?: string;
  vehicleId: string;
  vehicleName?: string;
  component: string;
  failureProbability: number;
  estimatedDaysToFailure?: number;
  remainingUsefulLife?: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'degrading';
  recommendation: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  date: Date;
  mileage: number;
  cost?: number;
  technician?: string;
  notes?: string;
}

export interface VehicleMetrics {
  timestamp: Date;
  engineTemperature: number;
  fuelEfficiency: number;
  brakingIntensity: number;
  speedVariation: number;
  healthScore: number;
}

export interface FleetSummary {
  totalVehicles: number;
  healthyVehicles: number;
  warningVehicles: number;
  criticalVehicles: number;
  maintenanceVehicles: number;
  averageHealthScore: number;
  activeAlerts: number;
  upcomingMaintenance: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'health' | 'performance' | 'maintenance' | 'incident';
  vehicleId?: string;
  generatedAt: Date;
  summary: string;
  insights: string[];
  recommendations: string[];
}
