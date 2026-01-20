/**
 * Real-time Anomaly Detection System
 * Uses statistical methods and ML-based techniques to detect
 * unusual patterns in vehicle telemetry and behavior
 */

import { Vehicle, TripData, Alert } from '@/types/vehicle';

// ============== TYPES ==============

export interface AnomalyType {
  id: string;
  category: 'sensor' | 'behavior' | 'pattern' | 'location' | 'maintenance';
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DetectedAnomaly {
  id: string;
  vehicleId: string;
  vehicleName: string;
  anomalyType: AnomalyType;
  detectedAt: Date;
  value: number;
  expectedRange: { min: number; max: number };
  deviation: number; // Standard deviations from mean
  confidence: number; // 0-1
  context: string;
  recommendation: string;
  acknowledged: boolean;
  autoResolved: boolean;
  resolvedAt?: Date;
}

export interface AnomalyStatistics {
  totalDetected: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  avgConfidence: number;
  autoResolvedRate: number;
  topAffectedVehicles: { vehicleId: string; vehicleName: string; count: number }[];
  trendsLastWeek: { date: string; count: number }[];
}

export interface VehicleBaseline {
  vehicleId: string;
  metrics: {
    engineTemp: { mean: number; stdDev: number; min: number; max: number };
    fuelEfficiency: { mean: number; stdDev: number; min: number; max: number };
    oilPressure: { mean: number; stdDev: number; min: number; max: number };
    batteryVoltage: { mean: number; stdDev: number; min: number; max: number };
    avgSpeed: { mean: number; stdDev: number; min: number; max: number };
    idleTime: { mean: number; stdDev: number; min: number; max: number };
  };
  lastUpdated: Date;
  dataPoints: number;
}

// ============== ANOMALY TYPES ==============

const ANOMALY_TYPES: AnomalyType[] = [
  // Sensor anomalies
  {
    id: 'engine_temp_high',
    category: 'sensor',
    name: 'Engine Temperature Spike',
    description: 'Engine temperature significantly above normal operating range',
    severity: 'high',
  },
  {
    id: 'engine_temp_low',
    category: 'sensor',
    name: 'Engine Temperature Drop',
    description: 'Engine temperature unexpectedly low during operation',
    severity: 'medium',
  },
  {
    id: 'oil_pressure_drop',
    category: 'sensor',
    name: 'Oil Pressure Drop',
    description: 'Oil pressure below safe operating threshold',
    severity: 'critical',
  },
  {
    id: 'battery_voltage_low',
    category: 'sensor',
    name: 'Low Battery Voltage',
    description: 'Battery voltage below normal charging levels',
    severity: 'medium',
  },
  {
    id: 'tire_pressure_anomaly',
    category: 'sensor',
    name: 'Tire Pressure Anomaly',
    description: 'Significant tire pressure deviation detected',
    severity: 'high',
  },

  // Behavior anomalies
  {
    id: 'harsh_braking_pattern',
    category: 'behavior',
    name: 'Excessive Harsh Braking',
    description: 'Driver showing pattern of aggressive braking',
    severity: 'medium',
  },
  {
    id: 'rapid_acceleration',
    category: 'behavior',
    name: 'Rapid Acceleration Pattern',
    description: 'Frequent aggressive acceleration detected',
    severity: 'medium',
  },
  {
    id: 'excessive_idling',
    category: 'behavior',
    name: 'Excessive Idling',
    description: 'Vehicle idle time significantly above average',
    severity: 'low',
  },
  {
    id: 'speed_violation',
    category: 'behavior',
    name: 'Persistent Speeding',
    description: 'Consistent operation above speed limits',
    severity: 'high',
  },

  // Pattern anomalies
  {
    id: 'fuel_efficiency_drop',
    category: 'pattern',
    name: 'Fuel Efficiency Degradation',
    description: 'Gradual decline in fuel efficiency over time',
    severity: 'medium',
  },
  {
    id: 'unusual_route',
    category: 'pattern',
    name: 'Unusual Route Pattern',
    description: 'Vehicle deviating from expected route patterns',
    severity: 'low',
  },
  {
    id: 'off_hours_usage',
    category: 'pattern',
    name: 'Off-Hours Vehicle Usage',
    description: 'Vehicle operated outside normal business hours',
    severity: 'medium',
  },

  // Maintenance anomalies
  {
    id: 'overdue_maintenance',
    category: 'maintenance',
    name: 'Overdue Maintenance',
    description: 'Scheduled maintenance significantly overdue',
    severity: 'high',
  },
  {
    id: 'rapid_component_wear',
    category: 'maintenance',
    name: 'Accelerated Component Wear',
    description: 'Component degradation faster than expected',
    severity: 'high',
  },
];

// ============== ANOMALY DETECTION ENGINE ==============

class AnomalyDetectionEngine {
  private baselines: Map<string, VehicleBaseline> = new Map();
  private detectedAnomalies: DetectedAnomaly[] = [];
  private readonly ZSCORE_THRESHOLD = 2.5; // Standard deviations for anomaly
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  // Build or update baseline for a vehicle
  updateBaseline(vehicle: Vehicle, trips: TripData[]): VehicleBaseline {
    const existingBaseline = this.baselines.get(vehicle.id);

    // Calculate statistics from trips and current sensor data
    const engineTemps: number[] = [];
    const fuelEfficiencies: number[] = [];
    const speeds: number[] = [];
    const idleTimes: number[] = [];

    trips.forEach(trip => {
      if (trip.engineTemperature) engineTemps.push(trip.engineTemperature);
      if (trip.fuelEfficiency) fuelEfficiencies.push(trip.fuelEfficiency);
      if (trip.averageSpeed) speeds.push(trip.averageSpeed);
      if (trip.idleTime) idleTimes.push(trip.idleTime);
    });

    // Add current sensor values
    if (vehicle.sensors?.engineTemp) engineTemps.push(vehicle.sensors.engineTemp);
    if (vehicle.fuelEfficiency) fuelEfficiencies.push(vehicle.fuelEfficiency);

    const calcStats = (values: number[]) => {
      if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance) || 1; // Prevent zero stdDev
      return {
        mean,
        stdDev,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    };

    const baseline: VehicleBaseline = {
      vehicleId: vehicle.id,
      metrics: {
        engineTemp: calcStats(engineTemps.length > 0 ? engineTemps : [80]),
        fuelEfficiency: calcStats(fuelEfficiencies.length > 0 ? fuelEfficiencies : [8]),
        oilPressure: { mean: vehicle.sensors?.oilPressure || 40, stdDev: 5, min: 30, max: 60 },
        batteryVoltage: { mean: vehicle.sensors?.batteryVoltage || 12.6, stdDev: 0.5, min: 11.5, max: 14.5 },
        avgSpeed: calcStats(speeds.length > 0 ? speeds : [50]),
        idleTime: calcStats(idleTimes.length > 0 ? idleTimes : [10]),
      },
      lastUpdated: new Date(),
      dataPoints: trips.length + 1,
    };

    this.baselines.set(vehicle.id, baseline);
    return baseline;
  }

  // Detect anomalies in a vehicle's current state
  detectAnomalies(vehicle: Vehicle): DetectedAnomaly[] {
    const baseline = this.baselines.get(vehicle.id);
    const anomalies: DetectedAnomaly[] = [];

    // If no baseline, create one with defaults
    if (!baseline) {
      this.updateBaseline(vehicle, vehicle.trips || []);
      return anomalies; // Need baseline data first
    }

    const createAnomaly = (
      typeId: string,
      value: number,
      expected: { min: number; max: number },
      deviation: number,
      confidence: number,
      context: string,
      recommendation: string
    ): DetectedAnomaly | null => {
      const anomalyType = ANOMALY_TYPES.find(t => t.id === typeId);
      if (!anomalyType || confidence < this.CONFIDENCE_THRESHOLD) return null;

      return {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        anomalyType,
        detectedAt: new Date(),
        value,
        expectedRange: expected,
        deviation,
        confidence,
        context,
        recommendation,
        acknowledged: false,
        autoResolved: false,
      };
    };

    // Check engine temperature
    if (vehicle.sensors?.engineTemp) {
      const temp = vehicle.sensors.engineTemp;
      const stats = baseline.metrics.engineTemp;
      const zScore = Math.abs((temp - stats.mean) / stats.stdDev);

      if (temp > 100 || zScore > this.ZSCORE_THRESHOLD) {
        const anomaly = createAnomaly(
          temp > stats.mean ? 'engine_temp_high' : 'engine_temp_low',
          temp,
          { min: stats.mean - stats.stdDev * 2, max: stats.mean + stats.stdDev * 2 },
          zScore,
          Math.min(0.95, 0.5 + zScore * 0.15),
          `Engine temperature at ${temp}°C, expected ${stats.mean.toFixed(0)}°C ± ${stats.stdDev.toFixed(0)}`,
          temp > 100 
            ? 'Check cooling system immediately. Reduce load and allow engine to cool.'
            : 'Monitor warm-up procedure. Check thermostat if persists.'
        );
        if (anomaly) anomalies.push(anomaly);
      }
    }

    // Check oil pressure
    if (vehicle.sensors?.oilPressure) {
      const pressure = vehicle.sensors.oilPressure;
      if (pressure < 25) {
        const anomaly = createAnomaly(
          'oil_pressure_drop',
          pressure,
          { min: 30, max: 60 },
          (30 - pressure) / 5,
          0.9,
          `Oil pressure at ${pressure} PSI, critically low`,
          'STOP VEHICLE IMMEDIATELY. Low oil pressure can cause severe engine damage.'
        );
        if (anomaly) anomalies.push(anomaly);
      }
    }

    // Check battery voltage
    if (vehicle.sensors?.batteryVoltage) {
      const voltage = vehicle.sensors.batteryVoltage;
      if (voltage < 12.0 || voltage > 14.8) {
        const anomaly = createAnomaly(
          'battery_voltage_low',
          voltage,
          { min: 12.0, max: 14.8 },
          Math.abs((voltage - 12.6) / 0.5),
          0.85,
          `Battery voltage at ${voltage}V, ${voltage < 12 ? 'undercharging' : 'overcharging'}`,
          voltage < 12 
            ? 'Check alternator and battery connections. Battery may need replacement.'
            : 'Check voltage regulator. Overcharging can damage battery.'
        );
        if (anomaly) anomalies.push(anomaly);
      }
    }

    // Check tire pressure anomalies
    if (vehicle.sensors?.tirePressure) {
      const tp = vehicle.sensors.tirePressure;
      const pressures = [tp.fl, tp.fr, tp.rl, tp.rr];
      const avgPressure = pressures.reduce((a, b) => a + b, 0) / 4;
      const variance = pressures.reduce((sum, p) => sum + Math.pow(p - avgPressure, 2), 0) / 4;

      // Check for significant pressure differences between tires
      if (variance > 9) { // More than 3 PSI variance
        const anomaly = createAnomaly(
          'tire_pressure_anomaly',
          Math.sqrt(variance),
          { min: 0, max: 2 },
          Math.sqrt(variance) / 2,
          0.8,
          `Uneven tire pressures: FL=${tp.fl}, FR=${tp.fr}, RL=${tp.rl}, RR=${tp.rr} PSI`,
          'Check tires for leaks or damage. Uneven pressure affects handling and fuel efficiency.'
        );
        if (anomaly) anomalies.push(anomaly);
      }

      // Check for low pressures
      const lowPressureTires = pressures.filter(p => p < 28);
      if (lowPressureTires.length > 0) {
        const anomaly = createAnomaly(
          'tire_pressure_anomaly',
          Math.min(...pressures),
          { min: 30, max: 35 },
          (30 - Math.min(...pressures)) / 3,
          0.85,
          `Low tire pressure detected: ${Math.min(...pressures)} PSI`,
          'Inflate tires to recommended pressure. Check for punctures or slow leaks.'
        );
        if (anomaly) anomalies.push(anomaly);
      }
    }

    // Check fuel efficiency
    const efficiencyStats = baseline.metrics.fuelEfficiency;
    if (vehicle.fuelEfficiency < efficiencyStats.mean - efficiencyStats.stdDev * 2) {
      const anomaly = createAnomaly(
        'fuel_efficiency_drop',
        vehicle.fuelEfficiency,
        { min: efficiencyStats.mean - efficiencyStats.stdDev, max: efficiencyStats.mean + efficiencyStats.stdDev },
        (efficiencyStats.mean - vehicle.fuelEfficiency) / efficiencyStats.stdDev,
        0.75,
        `Fuel efficiency at ${vehicle.fuelEfficiency.toFixed(1)} km/L, expected ${efficiencyStats.mean.toFixed(1)} km/L`,
        'Check air filter, tire pressure, and driving habits. Consider engine diagnostics.'
      );
      if (anomaly) anomalies.push(anomaly);
    }

    // Check maintenance status
    if (vehicle.maintenanceInfo?.insuranceExpiry) {
      const daysUntilExpiry = Math.floor(
        (new Date(vehicle.maintenanceInfo.insuranceExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry < 0) {
        const anomaly = createAnomaly(
          'overdue_maintenance',
          Math.abs(daysUntilExpiry),
          { min: 0, max: 0 },
          Math.abs(daysUntilExpiry) / 7,
          0.95,
          `Insurance expired ${Math.abs(daysUntilExpiry)} days ago`,
          'Renew insurance immediately. Vehicle may not be legally operable.'
        );
        if (anomaly) anomalies.push(anomaly);
      }
    }

    // Store detected anomalies
    this.detectedAnomalies.push(...anomalies);

    return anomalies;
  }

  // Detect anomalies across all vehicles
  detectFleetAnomalies(vehicles: Vehicle[]): DetectedAnomaly[] {
    const allAnomalies: DetectedAnomaly[] = [];

    vehicles.forEach(vehicle => {
      // Update baseline with current data
      this.updateBaseline(vehicle, vehicle.trips || []);
      
      // Detect anomalies
      const vehicleAnomalies = this.detectAnomalies(vehicle);
      allAnomalies.push(...vehicleAnomalies);
    });

    return allAnomalies;
  }

  // Get anomaly statistics
  getStatistics(): AnomalyStatistics {
    const anomalies = this.detectedAnomalies;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Count by category
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const vehicleCounts: Map<string, { vehicleName: string; count: number }> = new Map();

    anomalies.forEach(a => {
      byCategory[a.anomalyType.category] = (byCategory[a.anomalyType.category] || 0) + 1;
      bySeverity[a.anomalyType.severity] = (bySeverity[a.anomalyType.severity] || 0) + 1;

      if (!vehicleCounts.has(a.vehicleId)) {
        vehicleCounts.set(a.vehicleId, { vehicleName: a.vehicleName, count: 0 });
      }
      vehicleCounts.get(a.vehicleId)!.count++;
    });

    // Top affected vehicles
    const topAffectedVehicles = Array.from(vehicleCounts.entries())
      .map(([vehicleId, data]) => ({ vehicleId, vehicleName: data.vehicleName, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trends last week
    const trendsLastWeek: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = anomalies.filter(a => 
        a.detectedAt.toISOString().split('T')[0] === dateStr
      ).length;
      trendsLastWeek.push({ date: dateStr, count });
    }

    // Auto-resolved rate
    const resolved = anomalies.filter(a => a.autoResolved).length;
    const autoResolvedRate = anomalies.length > 0 ? (resolved / anomalies.length) * 100 : 0;

    // Average confidence
    const avgConfidence = anomalies.length > 0
      ? anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length
      : 0;

    return {
      totalDetected: anomalies.length,
      byCategory,
      bySeverity,
      avgConfidence,
      autoResolvedRate,
      topAffectedVehicles,
      trendsLastWeek,
    };
  }

  // Get recent anomalies
  getRecentAnomalies(limit: number = 20): DetectedAnomaly[] {
    return this.detectedAnomalies
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  // Get anomalies for a specific vehicle
  getVehicleAnomalies(vehicleId: string): DetectedAnomaly[] {
    return this.detectedAnomalies.filter(a => a.vehicleId === vehicleId);
  }

  // Acknowledge an anomaly
  acknowledgeAnomaly(anomalyId: string): void {
    const anomaly = this.detectedAnomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.acknowledged = true;
    }
  }

  // Mark anomaly as resolved
  resolveAnomaly(anomalyId: string, auto: boolean = false): void {
    const anomaly = this.detectedAnomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.autoResolved = auto;
      anomaly.resolvedAt = new Date();
    }
  }

  // Get all anomaly types
  getAnomalyTypes(): AnomalyType[] {
    return ANOMALY_TYPES;
  }

  // Clear old anomalies (older than specified days)
  clearOldAnomalies(days: number = 30): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const beforeCount = this.detectedAnomalies.length;
    this.detectedAnomalies = this.detectedAnomalies.filter(
      a => a.detectedAt > cutoff || (!a.acknowledged && !a.autoResolved)
    );
    return beforeCount - this.detectedAnomalies.length;
  }
}

// Export singleton instance
export const anomalyDetector = new AnomalyDetectionEngine();

