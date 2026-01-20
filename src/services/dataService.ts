// Real-time Data Service with localStorage persistence
// Manages vehicle data, telemetry, and provides real-time updates

import { Vehicle, TripData, Alert, MaintenanceRecord } from '@/types/vehicle';
import { sendAlertEmail } from '@/services/emailService';

const STORAGE_KEYS = {
  VEHICLES: 'fleet_vehicles',
  TRIPS: 'fleet_trips',
  ALERTS: 'fleet_alerts',
  MAINTENANCE: 'fleet_maintenance',
  TELEMETRY: 'fleet_telemetry',
  SETTINGS: 'fleet_settings',
};

export interface VehicleTelemetry {
  vehicleId: string;
  timestamp: Date;
  engineTemp: number;
  oilPressure: number;
  batteryVoltage: number;
  tirePressure: { fl: number; fr: number; rl: number; rr: number };
  fuelLevel: number;
  speed: number;
  rpm: number;
  coolantTemp: number;
  transmissionTemp: number;
  location: { lat: number; lng: number };
}

export interface FleetStats {
  totalVehicles: number;
  operationalCount: number;
  maintenanceCount: number;
  outOfServiceCount: number;
  avgHealthScore: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  avgFuelEfficiency: number;
  totalMileage: number;
  totalTrips: number;
  activeTrips: number;
}

class DataService {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private telemetryInterval: number | null = null;
  private vehicles: Vehicle[] = [];
  private telemetryData: Map<string, VehicleTelemetry> = new Map();

  constructor() {
    this.initializeData();
  }

  private isVehicleValid(vehicle: any): boolean {
    // Check if vehicle has all required new fields
    return vehicle && 
           vehicle.sensors && 
           vehicle.sensors.tirePressure && 
           typeof vehicle.sensors.tirePressure === 'object' &&
           vehicle.sensors.tirePressure.fl !== undefined &&
           vehicle.trips !== undefined &&
           vehicle.alerts !== undefined;
  }

  private initializeData(): void {
    // Load vehicles from localStorage or start with empty fleet (production-ready)
    const savedVehicles = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (savedVehicles) {
      try {
        const parsed = JSON.parse(savedVehicles);
        // Validate that vehicles have the new required fields
        if (Array.isArray(parsed) && parsed.length > 0 && this.isVehicleValid(parsed[0])) {
          this.vehicles = parsed;
        } else if (Array.isArray(parsed) && parsed.length === 0) {
          // Empty array is valid - production mode with no vehicles
          this.vehicles = [];
        } else {
          // Old data format - clear and start fresh
          console.log('Clearing old vehicle data format...');
          localStorage.removeItem(STORAGE_KEYS.VEHICLES);
          // Start with empty fleet for production (no demo data)
          this.vehicles = [];
          this.saveVehicles();
        }
      } catch (e) {
        console.error('Error parsing saved vehicles:', e);
        this.vehicles = [];
        this.saveVehicles();
      }
    } else {
      // No saved data - start with empty fleet (production-ready)
      // For demo purposes, you can call createInitialFleet() instead
      this.vehicles = [];
      this.saveVehicles();
    }

    // Initialize telemetry for each vehicle
    this.vehicles.forEach(v => {
      this.telemetryData.set(v.id, this.generateTelemetry(v));
    });
  }

  private createInitialFleet(): Vehicle[] {
    const vehicleTypes = [
      { type: 'bus' as const, prefix: 'BUS', names: ['Transit Bus', 'City Bus', 'School Bus', 'Express Bus'] },
      { type: 'truck' as const, prefix: 'TRK', names: ['Cargo Truck', 'Delivery Truck', 'Heavy Hauler', 'Box Truck'] },
      { type: 'van' as const, prefix: 'VAN', names: ['Delivery Van', 'Cargo Van', 'Passenger Van', 'Sprinter Van'] },
      { type: 'car' as const, prefix: 'CAR', names: ['Fleet Car', 'Company Car', 'Service Vehicle', 'Inspection Car'] },
    ];

    const vehicles: Vehicle[] = [];
    let id = 1;

    vehicleTypes.forEach(vType => {
      for (let i = 0; i < 3; i++) {
        const mileage = Math.floor(50000 + Math.random() * 150000);
        const healthScore = Math.floor(60 + Math.random() * 40);
        const statuses: Vehicle['status'][] = ['operational', 'operational', 'operational', 'maintenance', 'warning'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        vehicles.push({
          id: `v${id}`,
          name: `${vType.names[i % vType.names.length]} ${100 + i + 1}`,
          type: vType.type,
          licensePlate: `${vType.prefix}-${1000 + Math.floor(Math.random() * 9000)}`,
          status,
          healthScore,
          mileage,
          fuelEfficiency: 6 + Math.random() * 8,
          lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          driver: this.getRandomDriver(),
          location: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1,
            address: this.getRandomAddress(),
          },
          sensors: {
            engineTemp: 75 + Math.random() * 25,
            oilPressure: 35 + Math.random() * 15,
            tirePressure: {
              fl: 30 + Math.random() * 5,
              fr: 30 + Math.random() * 5,
              rl: 30 + Math.random() * 5,
              rr: 30 + Math.random() * 5,
            },
            batteryVoltage: 12 + Math.random() * 2,
            fuelLevel: 30 + Math.random() * 60,
          },
          trips: [],
          alerts: [],
        });
        id++;
      }
    });

    return vehicles;
  }

  private getRandomDriver(): string {
    const drivers = [
      'John Smith', 'Maria Garcia', 'James Wilson', 'Sarah Johnson',
      'Michael Brown', 'Emily Davis', 'David Miller', 'Jessica Martinez',
      'Robert Taylor', 'Amanda Anderson', 'William Thomas', 'Jennifer White'
    ];
    return drivers[Math.floor(Math.random() * drivers.length)];
  }

  private getRandomAddress(): string {
    const streets = ['Main St', 'Oak Ave', 'Industrial Blvd', 'Highway 101', 'Commerce Dr', 'Fleet Way'];
    const cities = ['New York', 'Brooklyn', 'Queens', 'Newark', 'Jersey City'];
    return `${Math.floor(100 + Math.random() * 9900)} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}`;
  }

  private generateTelemetry(vehicle: Vehicle): VehicleTelemetry {
    const baseTemp = vehicle.status === 'operational' ? 80 : 70;
    return {
      vehicleId: vehicle.id,
      timestamp: new Date(),
      engineTemp: baseTemp + Math.random() * 20 + (vehicle.status === 'warning' ? 15 : 0),
      oilPressure: 35 + Math.random() * 15 - (vehicle.status === 'warning' ? 10 : 0),
      batteryVoltage: 12.2 + Math.random() * 1.5,
      tirePressure: {
        fl: 32 + Math.random() * 3,
        fr: 32 + Math.random() * 3,
        rl: 32 + Math.random() * 3,
        rr: 32 + Math.random() * 3,
      },
      fuelLevel: vehicle.sensors.fuelLevel,
      speed: vehicle.status === 'operational' ? Math.random() * 80 : 0,
      rpm: vehicle.status === 'operational' ? 800 + Math.random() * 3000 : 0,
      coolantTemp: baseTemp - 5 + Math.random() * 10,
      transmissionTemp: baseTemp - 10 + Math.random() * 15,
      location: {
        lat: vehicle.location.lat + (Math.random() - 0.5) * 0.001,
        lng: vehicle.location.lng + (Math.random() - 0.5) * 0.001,
      },
    };
  }

  private saveVehicles(): void {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(this.vehicles));
  }

  // Start real-time telemetry simulation
  startTelemetrySimulation(intervalMs: number = 3000): void {
    if (this.telemetryInterval) return;

    this.telemetryInterval = window.setInterval(() => {
      this.vehicles.forEach(vehicle => {
        if (vehicle.status === 'operational') {
          const telemetry = this.telemetryData.get(vehicle.id);
          if (telemetry) {
            // Update telemetry with realistic variations
            telemetry.timestamp = new Date();
            telemetry.engineTemp += (Math.random() - 0.5) * 2;
            telemetry.oilPressure += (Math.random() - 0.5) * 1;
            telemetry.speed = Math.max(0, telemetry.speed + (Math.random() - 0.5) * 10);
            telemetry.rpm = telemetry.speed > 0 ? 800 + telemetry.speed * 30 + Math.random() * 200 : 0;
            telemetry.fuelLevel = Math.max(0, telemetry.fuelLevel - Math.random() * 0.05);
            telemetry.location.lat += (Math.random() - 0.5) * 0.0001;
            telemetry.location.lng += (Math.random() - 0.5) * 0.0001;

            // Update vehicle sensors
            vehicle.sensors.engineTemp = telemetry.engineTemp;
            vehicle.sensors.oilPressure = telemetry.oilPressure;
            vehicle.sensors.fuelLevel = telemetry.fuelLevel;

            // Check for alert conditions
            if (telemetry.engineTemp > 105) {
              this.createAlert(vehicle.id, 'High Engine Temperature', 'warning', `Engine temp: ${telemetry.engineTemp.toFixed(1)}°C`);
            }
            if (telemetry.oilPressure < 25) {
              this.createAlert(vehicle.id, 'Low Oil Pressure', 'critical', `Oil pressure: ${telemetry.oilPressure.toFixed(1)} PSI`);
            }

            this.telemetryData.set(vehicle.id, telemetry);
          }
        }
      });

      // Notify listeners
      this.notifyListeners('telemetry', Object.fromEntries(this.telemetryData));
      this.notifyListeners('vehicles', this.vehicles);
    }, intervalMs);
  }

  stopTelemetrySimulation(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }

  // CRUD Operations
  getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }

  addVehicle(vehicle: Omit<Vehicle, 'id'>): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `v${Date.now()}`,
    };
    this.vehicles.push(newVehicle);
    this.telemetryData.set(newVehicle.id, this.generateTelemetry(newVehicle));
    this.saveVehicles();
    this.notifyListeners('vehicles', this.vehicles);
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | undefined {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      this.vehicles[index] = { ...this.vehicles[index], ...updates };
      this.saveVehicles();
      this.notifyListeners('vehicles', this.vehicles);
      return this.vehicles[index];
    }
    return undefined;
  }

  deleteVehicle(id: string): boolean {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      this.vehicles.splice(index, 1);
      this.telemetryData.delete(id);
      this.saveVehicles();
      this.notifyListeners('vehicles', this.vehicles);
      return true;
    }
    return false;
  }

  getTelemetry(vehicleId: string): VehicleTelemetry | undefined {
    return this.telemetryData.get(vehicleId);
  }

  getAllTelemetry(): Map<string, VehicleTelemetry> {
    return new Map(this.telemetryData);
  }

  // Alerts
  private createAlert(vehicleId: string, title: string, severity: 'info' | 'warning' | 'critical', message: string): void {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      vehicleId,
      type: title.toLowerCase().replace(/\s+/g, '_') as any,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };

    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.alerts.push(alert);
      if (severity === 'warning') vehicle.status = 'warning';
      if (severity === 'critical') vehicle.status = 'critical';
      this.saveVehicles();
      this.notifyListeners('alerts', this.getAllAlerts());
      
      // Send email notification for critical alerts
      if (severity === 'critical') {
        this.sendAlertNotification(vehicle, title, message, severity);
      }
    }
  }

  private async sendAlertNotification(
    vehicle: Vehicle, 
    title: string, 
    message: string, 
    severity: 'info' | 'warning' | 'critical'
  ): Promise<void> {
    try {
      const userEmail = localStorage.getItem('user_email');
      const userName = localStorage.getItem('user_name') || 'Fleet Manager';
      
      if (userEmail) {
        await sendAlertEmail({
          userName,
          userEmail,
          alertTime: new Date().toLocaleString(),
          alertType: severity,
          vehicleName: vehicle.name,
          licensePlate: vehicle.licensePlate,
          alertTitle: title,
          alertMessage: message,
          recommendedAction: this.getRecommendedAction(title, severity),
        });
        console.log('Alert email notification sent for:', title);
      }
    } catch (error) {
      console.log('Alert email not sent:', error);
    }
  }

  private getRecommendedAction(title: string, severity: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('engine') || titleLower.includes('temperature')) {
      return 'Stop the vehicle immediately and allow the engine to cool down. Schedule immediate inspection.';
    }
    if (titleLower.includes('brake')) {
      return 'Reduce speed and avoid sudden braking. Schedule immediate brake system inspection.';
    }
    if (titleLower.includes('fuel')) {
      return 'Refuel the vehicle as soon as possible to avoid breakdowns.';
    }
    if (titleLower.includes('oil') || titleLower.includes('pressure')) {
      return 'Stop driving immediately. Low oil pressure can cause severe engine damage. Tow to service center.';
    }
    if (titleLower.includes('battery')) {
      return 'Check battery connections and consider replacement if voltage remains low.';
    }
    if (severity === 'critical') {
      return 'Take immediate action to address this issue. Contact maintenance team.';
    }
    return 'Monitor the situation and take action if conditions worsen.';
  }

  getAllAlerts(): Alert[] {
    return this.vehicles.flatMap(v => v.alerts || []).filter(a => a != null);
  }

  acknowledgeAlert(alertId: string): void {
    this.vehicles.forEach(v => {
      const alert = v.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    });
    this.saveVehicles();
    this.notifyListeners('alerts', this.getAllAlerts());
  }

  // Fleet Statistics
  getFleetStats(): FleetStats {
    const vehicles = this.vehicles || [];
    const alerts = this.getAllAlerts().filter(a => a && !a.acknowledged);

    return {
      totalVehicles: vehicles.length,
      operationalCount: vehicles.filter(v => v.status === 'operational').length,
      maintenanceCount: vehicles.filter(v => v.status === 'maintenance').length,
      outOfServiceCount: vehicles.filter(v => v.status === 'out-of-service').length,
      avgHealthScore: vehicles.reduce((acc, v) => acc + v.healthScore, 0) / vehicles.length,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      avgFuelEfficiency: vehicles.reduce((acc, v) => acc + v.fuelEfficiency, 0) / vehicles.length,
      totalMileage: vehicles.reduce((acc, v) => acc + v.mileage, 0),
      totalTrips: vehicles.reduce((acc, v) => acc + v.trips.length, 0),
      activeTrips: 0, // Could be enhanced
    };
  }

  // Event subscription
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Reset all data (starts with empty fleet)
  resetData(): void {
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    this.vehicles = [];
    this.saveVehicles();
    this.telemetryData.clear();
    this.notifyListeners('vehicles', this.vehicles);
  }

  // Load demo data (for development/testing)
  loadDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.VEHICLES);
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    this.vehicles = this.createInitialFleet();
    this.saveVehicles();
    this.vehicles.forEach(v => {
      this.telemetryData.set(v.id, this.generateTelemetry(v));
    });
    this.notifyListeners('vehicles', this.vehicles);
  }

  // Export data
  exportData(): string {
    return JSON.stringify({
      vehicles: this.vehicles,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // Import data
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.vehicles && Array.isArray(data.vehicles)) {
        this.vehicles = data.vehicles;
        this.saveVehicles();
        this.vehicles.forEach(v => {
          this.telemetryData.set(v.id, this.generateTelemetry(v));
        });
        this.notifyListeners('vehicles', this.vehicles);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const dataService = new DataService();
