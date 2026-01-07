import { Vehicle, TripData, Alert, PredictiveInsight, VehicleMetrics, FleetSummary } from '@/types/vehicle';

// Helper to generate default sensors
const createSensors = (engineTemp: number) => ({
  engineTemp,
  oilPressure: 35 + Math.random() * 15,
  tirePressure: { fl: 32, fr: 32, rl: 31, rr: 31 },
  batteryVoltage: 12.4 + Math.random(),
  fuelLevel: 40 + Math.random() * 50,
});

export const mockVehicles: Vehicle[] = [
  {
    id: 'v-001',
    name: 'Transit Bus 101',
    type: 'bus',
    licensePlate: 'BUS-2847',
    healthScore: 94,
    status: 'operational',
    lastUpdated: new Date(),
    mileage: 145230,
    fuelEfficiency: 8.2,
    engineTemperature: 87,
    location: { lat: 40.7128, lng: -74.006 },
    sensors: createSensors(87),
    trips: [],
    alerts: [],
  },
  {
    id: 'v-002',
    name: 'Transit Bus 102',
    type: 'bus',
    licensePlate: 'BUS-3921',
    healthScore: 72,
    status: 'warning',
    lastUpdated: new Date(),
    mileage: 198450,
    fuelEfficiency: 6.8,
    engineTemperature: 102,
    location: { lat: 40.7589, lng: -73.9851 },
    sensors: createSensors(102),
    trips: [],
    alerts: [],
  },
  {
    id: 'v-003',
    name: 'Cargo Truck A1',
    type: 'truck',
    licensePlate: 'TRK-7834',
    healthScore: 45,
    status: 'critical',
    lastUpdated: new Date(),
    mileage: 312000,
    fuelEfficiency: 4.2,
    engineTemperature: 118,
    location: { lat: 40.6892, lng: -74.0445 },
    sensors: createSensors(118),
    trips: [],
    alerts: [],
  },
  {
    id: 'v-004',
    name: 'Delivery Van B2',
    type: 'van',
    licensePlate: 'VAN-1256',
    healthScore: 88,
    status: 'operational',
    lastUpdated: new Date(),
    mileage: 67890,
    fuelEfficiency: 12.4,
    engineTemperature: 82,
    location: { lat: 40.7484, lng: -73.9857 },
    sensors: createSensors(82),
    trips: [],
    alerts: [],
  },
  {
    id: 'v-005',
    name: 'Transit Bus 103',
    type: 'bus',
    licensePlate: 'BUS-5567',
    healthScore: 0,
    status: 'maintenance',
    lastUpdated: new Date(),
    mileage: 225000,
    fuelEfficiency: 0,
    engineTemperature: 0,
    location: { lat: 40.7549, lng: -73.984 },
    sensors: createSensors(0),
    trips: [],
    alerts: [],
  },
  {
    id: 'v-006',
    name: 'Cargo Truck A2',
    type: 'truck',
    licensePlate: 'TRK-9012',
    healthScore: 91,
    status: 'operational',
    lastUpdated: new Date(),
    mileage: 89500,
    fuelEfficiency: 5.8,
    engineTemperature: 85,
    location: { lat: 40.7282, lng: -73.7949 },
    sensors: createSensors(85),
    trips: [],
    alerts: [],
  },
];

export const generateMockTripData = (vehicleId: string, days: number = 30): TripData[] => {
  const trips: TripData[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const tripDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const tripsPerDay = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < tripsPerDay; j++) {
      trips.push({
        id: `trip-${vehicleId}-${i}-${j}`,
        vehicleId,
        timestamp: new Date(tripDate.getTime() + j * 8 * 60 * 60 * 1000),
        mileage: Math.floor(Math.random() * 150) + 50,
        engineTemperature: 80 + Math.random() * 30,
        fuelEfficiency: 5 + Math.random() * 10,
        brakingIntensity: Math.random() * 100,
        speedVariation: Math.random() * 50,
        idleTime: Math.random() * 30,
        tripDuration: 30 + Math.random() * 180,
        averageSpeed: 25 + Math.random() * 40,
      });
    }
  }
  
  return trips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    vehicleId: 'v-003',
    vehicleName: 'Cargo Truck A1',
    severity: 'critical',
    type: 'prediction',
    title: 'Engine Failure Risk Detected',
    message: 'ML model predicts 87% probability of engine component failure within 72 hours based on temperature anomalies and vibration patterns.',
    description: 'ML model predicts 87% probability of engine component failure within 72 hours based on temperature anomalies and vibration patterns.',
    component: 'Engine',
    probability: 0.87,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    acknowledged: false,
  },
  {
    id: 'alert-002',
    vehicleId: 'v-002',
    vehicleName: 'Transit Bus 102',
    severity: 'critical',
    type: 'anomaly',
    title: 'Abnormal Fuel Consumption',
    message: 'Fuel efficiency has dropped 23% below baseline. Possible fuel system leak or injector malfunction.',
    description: 'Fuel efficiency has dropped 23% below baseline. Possible fuel system leak or injector malfunction.',
    component: 'Fuel System',
    probability: 0.72,
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    acknowledged: false,
  },
  {
    id: 'alert-003',
    vehicleId: 'v-002',
    vehicleName: 'Transit Bus 102',
    severity: 'warning',
    type: 'threshold',
    title: 'High Engine Temperature',
    message: 'Engine temperature exceeded warning threshold of 100°C. Currently at 102°C.',
    description: 'Engine temperature exceeded warning threshold of 100°C. Currently at 102°C.',
    component: 'Cooling System',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    acknowledged: true,
    acknowledgedBy: 'John Smith',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 150),
  },
  {
    id: 'alert-004',
    vehicleId: 'v-004',
    vehicleName: 'Delivery Van B2',
    severity: 'info',
    type: 'maintenance',
    title: 'Scheduled Maintenance Due',
    message: 'Regular maintenance service due in 500 miles or 7 days.',
    description: 'Regular maintenance service due in 500 miles or 7 days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    acknowledged: false,
  },
];

export const mockPredictiveInsights: PredictiveInsight[] = [
  {
    vehicleId: 'v-003',
    component: 'Engine',
    failureProbability: 0.87,
    remainingUsefulLife: 72,
    confidence: 0.92,
    trend: 'degrading',
    recommendation: 'Immediate inspection required. Schedule emergency maintenance within 24 hours.',
  },
  {
    vehicleId: 'v-003',
    component: 'Transmission',
    failureProbability: 0.45,
    remainingUsefulLife: 340,
    confidence: 0.78,
    trend: 'degrading',
    recommendation: 'Monitor closely. Schedule preventive maintenance within 2 weeks.',
  },
  {
    vehicleId: 'v-002',
    component: 'Fuel System',
    failureProbability: 0.62,
    remainingUsefulLife: 168,
    confidence: 0.85,
    trend: 'degrading',
    recommendation: 'Inspect fuel injectors and check for leaks. Service within 1 week.',
  },
  {
    vehicleId: 'v-002',
    component: 'Cooling System',
    failureProbability: 0.38,
    remainingUsefulLife: 480,
    confidence: 0.81,
    trend: 'stable',
    recommendation: 'Check coolant levels and thermostat function during next service.',
  },
  {
    vehicleId: 'v-001',
    component: 'Brakes',
    failureProbability: 0.15,
    remainingUsefulLife: 1200,
    confidence: 0.88,
    trend: 'stable',
    recommendation: 'No immediate action required. Normal wear pattern detected.',
  },
  {
    vehicleId: 'v-004',
    component: 'Battery',
    failureProbability: 0.25,
    remainingUsefulLife: 720,
    confidence: 0.75,
    trend: 'stable',
    recommendation: 'Battery health good. Replace during next scheduled maintenance.',
  },
];

export const generateMockMetrics = (days: number = 7): VehicleMetrics[] => {
  const metrics: VehicleMetrics[] = [];
  const now = new Date();
  
  for (let i = days * 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    metrics.push({
      timestamp,
      engineTemperature: 82 + Math.sin(i / 12) * 10 + Math.random() * 5,
      fuelEfficiency: 8 + Math.cos(i / 8) * 2 + Math.random() * 1,
      brakingIntensity: 30 + Math.random() * 40,
      speedVariation: 15 + Math.random() * 20,
      healthScore: 85 + Math.sin(i / 24) * 8 + Math.random() * 3,
    });
  }
  
  return metrics;
};

export const getFleetSummary = (): FleetSummary => {
  const vehicles = mockVehicles;
  const operationalCount = vehicles.filter(v => v.status === 'operational').length;
  const warningCount = vehicles.filter(v => v.status === 'warning').length;
  const criticalCount = vehicles.filter(v => v.status === 'critical').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
  
  const activeVehicles = vehicles.filter(v => v.status !== 'maintenance');
  const avgHealth = activeVehicles.length > 0
    ? activeVehicles.reduce((sum, v) => sum + v.healthScore, 0) / activeVehicles.length
    : 0;
  
  return {
    totalVehicles: vehicles.length,
    healthyVehicles: operationalCount,
    warningVehicles: warningCount,
    criticalVehicles: criticalCount,
    maintenanceVehicles: maintenanceCount,
    averageHealthScore: Math.round(avgHealth),
    activeAlerts: mockAlerts.filter(a => !a.acknowledged).length,
    upcomingMaintenance: 3,
  };
};
