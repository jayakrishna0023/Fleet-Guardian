/**
 * Advanced Analytics Engine
 * Provides sophisticated fleet analytics, driver scoring, geofencing,
 * carbon tracking, and predictive cost forecasting
 */

import { Vehicle, TripData, Alert } from '@/types/vehicle';

// ============== TYPES ==============

export interface DriverScore {
  odriverId: string;
  driverName: string;
  overallScore: number; // 0-100
  safetyScore: number;
  efficiencyScore: number;
  complianceScore: number;
  trend: 'improving' | 'stable' | 'declining';
  metrics: {
    harshBraking: number; // incidents per 100km
    harshAcceleration: number;
    speeding: number; // % of time over limit
    idleTime: number; // % of drive time
    fuelEfficiency: number; // relative to fleet average
    onTimeDelivery: number; // %
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

export interface GeoZone {
  id: string;
  name: string;
  type: 'restricted' | 'delivery' | 'maintenance' | 'parking' | 'customer' | 'fuel';
  shape: 'circle' | 'polygon';
  center?: { lat: number; lng: number };
  radius?: number; // meters for circle
  polygon?: { lat: number; lng: number }[];
  rules: {
    maxSpeed?: number;
    allowedVehicleTypes?: string[];
    allowedTimeWindows?: { start: string; end: string }[];
    requiresCheckIn?: boolean;
    maxDwellTime?: number; // minutes
  };
  alerts: {
    onEntry: boolean;
    onExit: boolean;
    onSpeedViolation: boolean;
    onDwellExceeded: boolean;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface GeoFenceEvent {
  id: string;
  vehicleId: string;
  vehicleName: string;
  zoneId: string;
  zoneName: string;
  eventType: 'entry' | 'exit' | 'speed_violation' | 'dwell_exceeded' | 'unauthorized';
  timestamp: Date;
  location: { lat: number; lng: number };
  details?: string;
  acknowledged: boolean;
}

export interface CarbonFootprint {
  vehicleId: string;
  vehicleName: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalEmissions: number; // kg CO2
  emissionsPerKm: number;
  fuelConsumed: number; // liters
  distanceTraveled: number; // km
  comparedToFleetAverage: number; // % difference
  trend: 'improving' | 'stable' | 'worsening';
  breakdown: {
    driving: number;
    idling: number;
    coldStart: number;
  };
  offsetRequired: number; // trees needed to offset
  recommendations: string[];
}

export interface CostForecast {
  vehicleId?: string; // if null, fleet-wide
  period: 'month' | 'quarter' | 'year';
  forecastDate: Date;
  predictions: {
    fuel: { amount: number; confidence: number };
    maintenance: { amount: number; confidence: number };
    repairs: { amount: number; confidence: number };
    insurance: { amount: number; confidence: number };
    depreciation: { amount: number; confidence: number };
    total: { amount: number; confidence: number };
  };
  factors: string[];
  riskFactors: { factor: string; impact: number; probability: number }[];
  savingsOpportunities: { opportunity: string; potentialSavings: number }[];
}

export interface SmartNotification {
  id: string;
  type: 'alert' | 'insight' | 'recommendation' | 'milestone' | 'reminder';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  category: string;
  vehicleId?: string;
  vehicleName?: string;
  actionRequired: boolean;
  actions?: { label: string; action: string }[];
  expiresAt?: Date;
  createdAt: Date;
  read: boolean;
  dismissed: boolean;
}

export interface FleetEfficiencyMetrics {
  overallScore: number; // 0-100
  utilizationRate: number; // % of fleet in use
  avgHealthScore: number;
  avgFuelEfficiency: number;
  avgDriverScore: number;
  onTimeDeliveryRate: number;
  maintenanceComplianceRate: number;
  safetyIncidentRate: number; // per 100,000 km
  carbonIntensity: number; // kg CO2 per km
  costPerKm: number;
  trends: {
    metric: string;
    change: number;
    direction: 'up' | 'down' | 'stable';
    isPositive: boolean;
  }[];
  rankings: {
    category: string;
    rank: number;
    totalInCategory: number;
    percentile: number;
  }[];
}

// ============== ANALYTICS ENGINE ==============

class AdvancedAnalyticsEngine {
  private geoZones: GeoZone[] = [];
  private geoFenceEvents: GeoFenceEvent[] = [];
  private notifications: SmartNotification[] = [];

  // ============== DRIVER BEHAVIOR SCORING ==============

  calculateDriverScore(
    driverId: string,
    driverName: string,
    trips: TripData[],
    alerts: Alert[]
  ): DriverScore {
    if (trips.length === 0) {
      return this.createDefaultDriverScore(driverId, driverName);
    }

    const totalDistance = trips.reduce((sum, t) => sum + (t.mileage || 0), 0);
    const totalDuration = trips.reduce((sum, t) => sum + (t.tripDuration || 0), 0);

    // Calculate metrics from trip data
    const avgBrakingIntensity = trips.reduce((sum, t) => sum + (t.brakingIntensity || 30), 0) / trips.length;
    const avgSpeedVariation = trips.reduce((sum, t) => sum + (t.speedVariation || 10), 0) / trips.length;
    const avgIdleTime = trips.reduce((sum, t) => sum + (t.idleTime || 5), 0) / trips.length;
    const avgFuelEfficiency = trips.reduce((sum, t) => sum + (t.fuelEfficiency || 8), 0) / trips.length;

    // Harsh braking incidents (simulated from braking intensity)
    const harshBrakingPer100km = Math.max(0, (avgBrakingIntensity - 40) / 10) * (100 / Math.max(totalDistance, 1));
    
    // Harsh acceleration (derived from speed variation)
    const harshAccelPer100km = Math.max(0, (avgSpeedVariation - 15) / 5) * (100 / Math.max(totalDistance, 1));

    // Speeding percentage (simulated)
    const speedingPercent = Math.max(0, Math.min(30, (avgSpeedVariation - 10) * 2));

    // Idle time percentage
    const idlePercent = Math.min(30, (avgIdleTime / Math.max(totalDuration, 1)) * 100);

    // Calculate component scores (0-100)
    const safetyScore = Math.max(0, Math.min(100, 
      100 - (harshBrakingPer100km * 10) - (harshAccelPer100km * 8) - (speedingPercent * 1.5)
    ));

    const efficiencyScore = Math.max(0, Math.min(100,
      (avgFuelEfficiency / 12) * 70 + (30 - idlePercent) * 1.5
    ));

    // Compliance score based on alerts
    const driverAlerts = alerts.filter(a => 
      trips.some(t => t.vehicleId === a.vehicleId) && 
      a.severity !== 'info'
    );
    const complianceScore = Math.max(0, 100 - (driverAlerts.length * 5));

    // Overall score (weighted average)
    const overallScore = Math.round(
      safetyScore * 0.4 + efficiencyScore * 0.35 + complianceScore * 0.25
    );

    // Determine trend (would use historical data in production)
    const trend = overallScore > 75 ? 'improving' : overallScore > 50 ? 'stable' : 'declining';

    // Risk level
    const riskLevel = overallScore >= 70 ? 'low' : overallScore >= 50 ? 'medium' : 'high';

    // Generate recommendations
    const recommendations: string[] = [];
    if (harshBrakingPer100km > 2) {
      recommendations.push('Practice smoother braking by anticipating stops earlier');
    }
    if (speedingPercent > 10) {
      recommendations.push('Reduce speed to improve safety and fuel efficiency');
    }
    if (idlePercent > 15) {
      recommendations.push('Minimize idle time by turning off engine during long waits');
    }
    if (avgFuelEfficiency < 7) {
      recommendations.push('Consider eco-driving techniques to improve fuel efficiency');
    }

    return {
      odriverId: driverId,
      driverName,
      overallScore,
      safetyScore: Math.round(safetyScore),
      efficiencyScore: Math.round(efficiencyScore),
      complianceScore: Math.round(complianceScore),
      trend,
      metrics: {
        harshBraking: Math.round(harshBrakingPer100km * 10) / 10,
        harshAcceleration: Math.round(harshAccelPer100km * 10) / 10,
        speeding: Math.round(speedingPercent),
        idleTime: Math.round(idlePercent),
        fuelEfficiency: Math.round(avgFuelEfficiency * 10) / 10,
        onTimeDelivery: 85 + Math.random() * 15, // Would come from delivery system
      },
      recommendations,
      riskLevel,
      lastUpdated: new Date(),
    };
  }

  private createDefaultDriverScore(driverId: string, driverName: string): DriverScore {
    return {
      odriverId: driverId,
      driverName,
      overallScore: 75,
      safetyScore: 75,
      efficiencyScore: 75,
      complianceScore: 80,
      trend: 'stable',
      metrics: {
        harshBraking: 0,
        harshAcceleration: 0,
        speeding: 0,
        idleTime: 0,
        fuelEfficiency: 8,
        onTimeDelivery: 90,
      },
      recommendations: ['Keep up the good work!'],
      riskLevel: 'low',
      lastUpdated: new Date(),
    };
  }

  // ============== GEOFENCING ==============

  addGeoZone(zone: Omit<GeoZone, 'id' | 'createdAt'>): GeoZone {
    const newZone: GeoZone = {
      ...zone,
      id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    this.geoZones.push(newZone);
    return newZone;
  }

  getGeoZones(): GeoZone[] {
    return this.geoZones;
  }

  checkVehicleInZone(
    vehicleLocation: { lat: number; lng: number },
    zone: GeoZone
  ): boolean {
    if (zone.shape === 'circle' && zone.center && zone.radius) {
      const distance = this.calculateDistance(
        vehicleLocation.lat, vehicleLocation.lng,
        zone.center.lat, zone.center.lng
      );
      return distance <= zone.radius;
    }

    if (zone.shape === 'polygon' && zone.polygon) {
      return this.isPointInPolygon(vehicleLocation, zone.polygon);
    }

    return false;
  }

  checkAllZones(vehicle: Vehicle): GeoFenceEvent[] {
    const events: GeoFenceEvent[] = [];
    
    for (const zone of this.geoZones) {
      if (!zone.isActive) continue;

      const isInZone = this.checkVehicleInZone(vehicle.location, zone);
      
      // Check for entry/exit events (would need previous state in production)
      if (isInZone && zone.alerts.onEntry) {
        events.push({
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          zoneId: zone.id,
          zoneName: zone.name,
          eventType: 'entry',
          timestamp: new Date(),
          location: vehicle.location,
          acknowledged: false,
        });
      }

      // Check speed violations
      if (isInZone && zone.rules.maxSpeed) {
        // Would check actual vehicle speed
        const currentSpeed = 50; // Mock value
        if (currentSpeed > zone.rules.maxSpeed && zone.alerts.onSpeedViolation) {
          events.push({
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            zoneId: zone.id,
            zoneName: zone.name,
            eventType: 'speed_violation',
            timestamp: new Date(),
            location: vehicle.location,
            details: `Speed ${currentSpeed} km/h exceeds limit of ${zone.rules.maxSpeed} km/h`,
            acknowledged: false,
          });
        }
      }
    }

    this.geoFenceEvents.push(...events);
    return events;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: { lat: number; lng: number }[]
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;

      if (((yi > point.lng) !== (yj > point.lng)) &&
          (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // ============== CARBON FOOTPRINT ==============

  calculateCarbonFootprint(
    vehicle: Vehicle,
    trips: TripData[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): CarbonFootprint {
    // CO2 emission factors (kg CO2 per liter)
    const emissionFactors: Record<string, number> = {
      petrol: 2.31,
      diesel: 2.68,
      cng: 1.93,
      electric: 0, // Grid emissions would be separate
      hybrid: 1.5,
    };

    const fuelType = vehicle.fuelType || 'diesel';
    const emissionFactor = emissionFactors[fuelType] || 2.68;

    // Filter trips by period
    const now = new Date();
    const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    const periodTrips = trips.filter(t => new Date(t.timestamp) >= cutoffDate);

    const totalDistance = periodTrips.reduce((sum, t) => sum + (t.mileage || 0), 0);
    const avgEfficiency = periodTrips.length > 0
      ? periodTrips.reduce((sum, t) => sum + (t.fuelEfficiency || 8), 0) / periodTrips.length
      : vehicle.fuelEfficiency || 8;

    // Calculate fuel consumed (L = km / (km/L))
    const fuelConsumed = totalDistance / Math.max(avgEfficiency, 1);

    // Calculate emissions
    const totalIdleTime = periodTrips.reduce((sum, t) => sum + (t.idleTime || 0), 0);
    const idleEmissions = (totalIdleTime / 60) * 1.5 * emissionFactor; // Assume 1.5L/hr idle
    const drivingEmissions = fuelConsumed * emissionFactor;
    const coldStartEmissions = periodTrips.length * 0.05 * emissionFactor; // ~50ml per cold start

    const totalEmissions = drivingEmissions + idleEmissions + coldStartEmissions;
    const emissionsPerKm = totalDistance > 0 ? totalEmissions / totalDistance : 0;

    // Fleet average comparison (mock - would come from real fleet data)
    const fleetAvgEmissionsPerKm = 0.2; // kg CO2/km
    const comparedToFleetAverage = ((emissionsPerKm - fleetAvgEmissionsPerKm) / fleetAvgEmissionsPerKm) * 100;

    // Trend (would use historical data)
    const trend = comparedToFleetAverage < -5 ? 'improving' : 
                  comparedToFleetAverage > 5 ? 'worsening' : 'stable';

    // Trees needed to offset (avg tree absorbs ~21kg CO2/year)
    const offsetRequired = Math.ceil(totalEmissions / 21);

    // Generate recommendations
    const recommendations: string[] = [];
    if (idleEmissions / totalEmissions > 0.1) {
      recommendations.push('Reduce idle time to lower emissions by up to 10%');
    }
    if (avgEfficiency < 7) {
      recommendations.push('Improve driving efficiency to reduce fuel consumption');
    }
    if (fuelType === 'diesel' || fuelType === 'petrol') {
      recommendations.push('Consider transitioning to hybrid or electric vehicles');
    }
    if (recommendations.length === 0) {
      recommendations.push('Great job! Your emissions are within optimal range');
    }

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      period,
      totalEmissions: Math.round(totalEmissions * 100) / 100,
      emissionsPerKm: Math.round(emissionsPerKm * 1000) / 1000,
      fuelConsumed: Math.round(fuelConsumed * 10) / 10,
      distanceTraveled: Math.round(totalDistance),
      comparedToFleetAverage: Math.round(comparedToFleetAverage),
      trend,
      breakdown: {
        driving: Math.round(drivingEmissions * 100) / 100,
        idling: Math.round(idleEmissions * 100) / 100,
        coldStart: Math.round(coldStartEmissions * 100) / 100,
      },
      offsetRequired,
      recommendations,
    };
  }

  // ============== COST FORECASTING ==============

  forecastCosts(
    vehicles: Vehicle[],
    historicalTrips: TripData[],
    period: 'month' | 'quarter' | 'year'
  ): CostForecast {
    const periodMultiplier = period === 'month' ? 1 : period === 'quarter' ? 3 : 12;
    
    // Fuel cost prediction
    const avgMonthlyDistance = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0) / 12 / vehicles.length;
    const avgFuelEfficiency = vehicles.reduce((sum, v) => sum + (v.fuelEfficiency || 8), 0) / vehicles.length;
    const fuelPrice = 95; // ₹/liter (would be dynamic)
    const fuelCost = (avgMonthlyDistance / avgFuelEfficiency) * fuelPrice * vehicles.length * periodMultiplier;

    // Maintenance prediction based on health scores and mileage
    const avgHealth = vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length;
    const maintenanceMultiplier = avgHealth < 70 ? 1.5 : avgHealth < 85 ? 1.2 : 1.0;
    const baseMaintenance = 5000 * vehicles.length * periodMultiplier; // Base ₹5000/vehicle/month
    const maintenanceCost = baseMaintenance * maintenanceMultiplier;

    // Repair cost prediction
    const criticalVehicles = vehicles.filter(v => v.status === 'critical').length;
    const warningVehicles = vehicles.filter(v => v.status === 'warning').length;
    const repairCost = (criticalVehicles * 25000 + warningVehicles * 10000) * periodMultiplier;

    // Insurance (relatively stable)
    const insuranceCost = 2000 * vehicles.length * periodMultiplier;

    // Depreciation
    const avgVehicleValue = 800000; // ₹8L average
    const depreciationRate = 0.15; // 15% per year
    const depreciation = (avgVehicleValue * depreciationRate / 12) * vehicles.length * periodMultiplier;

    const totalCost = fuelCost + maintenanceCost + repairCost + insuranceCost + depreciation;

    // Risk factors
    const riskFactors = [];
    if (criticalVehicles > 0) {
      riskFactors.push({
        factor: `${criticalVehicles} vehicles in critical condition`,
        impact: criticalVehicles * 30000,
        probability: 0.7,
      });
    }
    if (avgHealth < 70) {
      riskFactors.push({
        factor: 'Low average fleet health',
        impact: baseMaintenance * 0.3,
        probability: 0.5,
      });
    }

    // Savings opportunities
    const savingsOpportunities = [];
    if (avgFuelEfficiency < 8) {
      savingsOpportunities.push({
        opportunity: 'Driver training for fuel efficiency',
        potentialSavings: fuelCost * 0.15,
      });
    }
    savingsOpportunities.push({
      opportunity: 'Preventive maintenance program',
      potentialSavings: repairCost * 0.4,
    });
    savingsOpportunities.push({
      opportunity: 'Route optimization',
      potentialSavings: fuelCost * 0.1,
    });

    return {
      period,
      forecastDate: new Date(),
      predictions: {
        fuel: { amount: Math.round(fuelCost), confidence: 0.85 },
        maintenance: { amount: Math.round(maintenanceCost), confidence: 0.75 },
        repairs: { amount: Math.round(repairCost), confidence: 0.6 },
        insurance: { amount: Math.round(insuranceCost), confidence: 0.95 },
        depreciation: { amount: Math.round(depreciation), confidence: 0.9 },
        total: { amount: Math.round(totalCost), confidence: 0.78 },
      },
      factors: [
        `Fleet size: ${vehicles.length} vehicles`,
        `Average health score: ${Math.round(avgHealth)}%`,
        `Fuel efficiency: ${avgFuelEfficiency.toFixed(1)} km/L`,
      ],
      riskFactors,
      savingsOpportunities,
    };
  }

  // ============== SMART NOTIFICATIONS ==============

  generateSmartNotifications(
    vehicles: Vehicle[],
    alerts: Alert[],
    predictions: Map<string, any[]>
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const now = new Date();

    // Critical vehicle alerts
    const criticalVehicles = vehicles.filter(v => v.status === 'critical');
    if (criticalVehicles.length > 0) {
      notifications.push({
        id: `notif_${Date.now()}_critical`,
        type: 'alert',
        priority: 'critical',
        title: `${criticalVehicles.length} Vehicle(s) Require Immediate Attention`,
        message: `Vehicles ${criticalVehicles.map(v => v.name).join(', ')} are in critical condition.`,
        category: 'vehicle_health',
        actionRequired: true,
        actions: [
          { label: 'View Details', action: 'view_critical' },
          { label: 'Schedule Service', action: 'schedule_service' },
        ],
        createdAt: now,
        read: false,
        dismissed: false,
      });
    }

    // Maintenance reminders
    vehicles.forEach(v => {
      if (v.maintenanceInfo?.insuranceExpiry) {
        const expiry = new Date(v.maintenanceInfo.insuranceExpiry);
        const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 30 && daysUntil > 0) {
          notifications.push({
            id: `notif_${Date.now()}_insurance_${v.id}`,
            type: 'reminder',
            priority: daysUntil <= 7 ? 'high' : 'medium',
            title: 'Insurance Expiring Soon',
            message: `Insurance for ${v.name} expires in ${daysUntil} days.`,
            category: 'compliance',
            vehicleId: v.id,
            vehicleName: v.name,
            actionRequired: true,
            actions: [{ label: 'Renew Now', action: 'renew_insurance' }],
            expiresAt: expiry,
            createdAt: now,
            read: false,
            dismissed: false,
          });
        }
      }
    });

    // Unacknowledged alerts
    const unackAlerts = alerts.filter(a => !a.acknowledged && a.severity !== 'info');
    if (unackAlerts.length > 5) {
      notifications.push({
        id: `notif_${Date.now()}_alerts`,
        type: 'alert',
        priority: 'medium',
        title: 'Multiple Unacknowledged Alerts',
        message: `You have ${unackAlerts.length} alerts requiring attention.`,
        category: 'alerts',
        actionRequired: true,
        actions: [{ label: 'Review Alerts', action: 'view_alerts' }],
        createdAt: now,
        read: false,
        dismissed: false,
      });
    }

    // Fleet efficiency insight
    const avgHealth = vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length;
    if (avgHealth >= 85) {
      notifications.push({
        id: `notif_${Date.now()}_milestone`,
        type: 'milestone',
        priority: 'info',
        title: 'Fleet Health Milestone! 🎉',
        message: `Your fleet is performing excellently with ${Math.round(avgHealth)}% average health.`,
        category: 'performance',
        actionRequired: false,
        createdAt: now,
        read: false,
        dismissed: false,
      });
    }

    // Fuel efficiency recommendation
    const lowEfficiencyVehicles = vehicles.filter(v => v.fuelEfficiency < 7);
    if (lowEfficiencyVehicles.length > 0) {
      notifications.push({
        id: `notif_${Date.now()}_efficiency`,
        type: 'recommendation',
        priority: 'low',
        title: 'Fuel Efficiency Improvement Opportunity',
        message: `${lowEfficiencyVehicles.length} vehicles have below-average fuel efficiency. Consider driver training or maintenance.`,
        category: 'efficiency',
        actionRequired: false,
        actions: [
          { label: 'View Vehicles', action: 'view_low_efficiency' },
          { label: 'Learn More', action: 'efficiency_tips' },
        ],
        createdAt: now,
        read: false,
        dismissed: false,
      });
    }

    this.notifications = notifications;
    return notifications;
  }

  getNotifications(): SmartNotification[] {
    return this.notifications;
  }

  // ============== FLEET EFFICIENCY ==============

  calculateFleetEfficiency(
    vehicles: Vehicle[],
    driverScores: DriverScore[],
    carbonData: CarbonFootprint[]
  ): FleetEfficiencyMetrics {
    const totalVehicles = vehicles.length;
    if (totalVehicles === 0) {
      return this.createDefaultEfficiencyMetrics();
    }

    // Utilization (non-maintenance vehicles)
    const activeVehicles = vehicles.filter(v => v.status !== 'maintenance' && v.status !== 'out-of-service');
    const utilizationRate = (activeVehicles.length / totalVehicles) * 100;

    // Health scores
    const avgHealthScore = vehicles.reduce((sum, v) => sum + v.healthScore, 0) / totalVehicles;

    // Fuel efficiency
    const avgFuelEfficiency = vehicles.reduce((sum, v) => sum + (v.fuelEfficiency || 8), 0) / totalVehicles;

    // Driver scores
    const avgDriverScore = driverScores.length > 0
      ? driverScores.reduce((sum, d) => sum + d.overallScore, 0) / driverScores.length
      : 75;

    // Carbon intensity
    const avgCarbonIntensity = carbonData.length > 0
      ? carbonData.reduce((sum, c) => sum + c.emissionsPerKm, 0) / carbonData.length
      : 0.2;

    // Calculate overall score (weighted)
    const overallScore = Math.round(
      utilizationRate * 0.15 +
      avgHealthScore * 0.25 +
      (avgFuelEfficiency / 15 * 100) * 0.2 +
      avgDriverScore * 0.25 +
      (1 - Math.min(avgCarbonIntensity / 0.3, 1)) * 100 * 0.15
    );

    // Calculate trends (would use historical data in production)
    const trends = [
      { metric: 'Fleet Health', change: 2.5, direction: 'up' as const, isPositive: true },
      { metric: 'Fuel Efficiency', change: 1.2, direction: 'up' as const, isPositive: true },
      { metric: 'Driver Safety', change: -0.5, direction: 'down' as const, isPositive: false },
      { metric: 'Carbon Emissions', change: -3.1, direction: 'down' as const, isPositive: true },
    ];

    // Industry rankings (mock data)
    const rankings = [
      { category: 'Fleet Health', rank: 15, totalInCategory: 100, percentile: 85 },
      { category: 'Fuel Efficiency', rank: 22, totalInCategory: 100, percentile: 78 },
      { category: 'Safety', rank: 8, totalInCategory: 100, percentile: 92 },
    ];

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      avgHealthScore: Math.round(avgHealthScore),
      avgFuelEfficiency: Math.round(avgFuelEfficiency * 10) / 10,
      avgDriverScore: Math.round(avgDriverScore),
      onTimeDeliveryRate: 87 + Math.random() * 10, // Mock
      maintenanceComplianceRate: 92 + Math.random() * 5, // Mock
      safetyIncidentRate: 0.5 + Math.random() * 0.5, // Mock
      carbonIntensity: Math.round(avgCarbonIntensity * 1000) / 1000,
      costPerKm: 12 + Math.random() * 3, // Mock
      trends,
      rankings,
    };
  }

  private createDefaultEfficiencyMetrics(): FleetEfficiencyMetrics {
    return {
      overallScore: 0,
      utilizationRate: 0,
      avgHealthScore: 0,
      avgFuelEfficiency: 0,
      avgDriverScore: 0,
      onTimeDeliveryRate: 0,
      maintenanceComplianceRate: 0,
      safetyIncidentRate: 0,
      carbonIntensity: 0,
      costPerKm: 0,
      trends: [],
      rankings: [],
    };
  }
}

// Export singleton instance
export const advancedAnalytics = new AdvancedAnalyticsEngine();

