import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Vehicle, Alert } from '@/types/vehicle';
import { VehicleRequest } from '@/types/auth';
import { dataService, VehicleTelemetry, FleetStats } from '@/services/dataService';
import { firestoreService } from '@/services/firestoreService';
import { isFirebaseConfigured } from '@/config/firebase';
import { fleetMLEngine, PredictionResult } from '@/services/mlEngine';
import { useAuth } from './AuthContext';

interface DataContextType {
  vehicles: Vehicle[];
  alerts: Alert[];
  telemetry: Map<string, VehicleTelemetry>;
  fleetStats: FleetStats;
  predictions: Map<string, PredictionResult[]>;
  isLoading: boolean;
  isMLReady: boolean;
  isFirebaseMode: boolean;

  // Vehicle request state
  vehicleRequests: VehicleRequest[];

  // Actions
  refreshData: () => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<Vehicle | undefined>;
  deleteVehicle: (id: string) => Promise<boolean>;
  acknowledgeAlert: (alertId: string, userName?: string) => Promise<void>;
  getVehiclePredictions: (vehicleId: string) => PredictionResult[];
  getVehicleById: (id: string) => Vehicle | undefined;
  resetAllData: () => void;
  exportData: () => string;
  importData: (json: string) => Promise<boolean>;

  // Vehicle request actions
  submitVehicleRequest: (data: VehicleRequest['vehicleData']) => Promise<{ success: boolean; message: string }>;
  approveVehicleRequest: (requestId: string, notes?: string) => Promise<void>;
  rejectVehicleRequest: (requestId: string, notes?: string) => Promise<void>;
  getPendingRequests: () => VehicleRequest[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicleRequests, setVehicleRequests] = useState<VehicleRequest[]>([]);
  const [telemetry, setTelemetry] = useState<Map<string, VehicleTelemetry>>(new Map());
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    totalVehicles: 0,
    operationalCount: 0,
    maintenanceCount: 0,
    outOfServiceCount: 0,
    avgHealthScore: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    avgFuelEfficiency: 0,
    totalMileage: 0,
    totalTrips: 0,
    activeTrips: 0,
  });
  const [predictions, setPredictions] = useState<Map<string, PredictionResult[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isMLReady, setIsMLReady] = useState(false);

  // Get current user from auth context
  const { user } = useAuth();

  // Determine Firebase mode synchronously
  const isFirebaseMode = isFirebaseConfigured();

  // Log mode on mount
  useEffect(() => {
    console.log(`Data mode: ${isFirebaseMode ? 'Firebase Firestore' : 'Local Storage'}`);
  }, [isFirebaseMode]);

  // Prediction update function
  const updatePredictions = useCallback((vehicleList: Vehicle[]) => {
    const predMap = new Map<string, PredictionResult[]>();

    vehicleList.forEach(vehicle => {
      if (!vehicle.sensors || !vehicle.sensors.tirePressure) {
        return;
      }

      try {
        const tp = vehicle.sensors.tirePressure;
        const avgTirePressure = typeof tp === 'object'
          ? (tp.fl + tp.fr + tp.rl + tp.rr) / 4
          : (tp as number);

        const preds = fleetMLEngine.getVehiclePredictions({
          engineTemp: vehicle.sensors.engineTemp ?? 80,
          oilPressure: vehicle.sensors.oilPressure ?? 40,
          mileage: vehicle.mileage ?? 0,
          vehicleAge: 3 + Math.random() * 5,
          batteryVoltage: vehicle.sensors.batteryVoltage ?? 12.5,
          tirePressure: avgTirePressure,
          engineHours: (vehicle.mileage ?? 0) / 40,
        });
        predMap.set(vehicle.id, preds);
      } catch (error) {
        console.error(`Error predicting for vehicle ${vehicle.id}:`, error);
      }
    });

    setPredictions(predMap);
  }, []);

  // Initialize data and ML engine
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      try {
        // Initialize ML engine
        await fleetMLEngine.initialize();
        setIsMLReady(true);

        if (isFirebaseMode) {
          // Load data from Firebase based on user role
          const currentUser = user;
          const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

          let vehicleList: Vehicle[];

          if (isAdminOrManager || !currentUser) {
            // Admins and managers see all vehicles
            vehicleList = await firestoreService.getVehicles();
          } else {
            // Regular users only see their own vehicles
            vehicleList = await firestoreService.getVehiclesByOwner(currentUser.id);
          }

          const alertList = await firestoreService.getAlerts();

          // Deduplicate vehicles by ID (in case of DB duplicates)
          const uniqueVehicles = Array.from(new Map(vehicleList.map(v => [v.id, v])).values());
          setVehicles(uniqueVehicles);
          setAlerts(alertList);

          const stats = await firestoreService.getFleetStats();
          setFleetStats({
            ...stats,
            totalTrips: 0,
            activeTrips: 0,
          });

          // Generate predictions for all vehicles
          updatePredictions(vehicleList);

          // Subscribe to real-time updates based on role
          if (isAdminOrManager || !currentUser) {
            firestoreService.subscribeToVehicles((updatedVehicles) => {
              const uniqueVehicles = Array.from(new Map(updatedVehicles.map(v => [v.id, v])).values());
              setVehicles(uniqueVehicles);
              updatePredictions(uniqueVehicles);
            });
          } else if (currentUser) {
            // Subscribe only to user's own vehicles
            firestoreService.subscribeToUserVehicles(currentUser.id, (updatedVehicles) => {
              const uniqueVehicles = Array.from(new Map(updatedVehicles.map(v => [v.id, v])).values());
              setVehicles(uniqueVehicles);
              updatePredictions(uniqueVehicles);
            });
          }

          firestoreService.subscribeToAlerts((updatedAlerts) => {
            setAlerts(updatedAlerts);
          });
        } else {
          // Load initial data from local storage
          const vehicleList = dataService.getVehicles();
          setVehicles(vehicleList);
          setAlerts(dataService.getAllAlerts());
          setFleetStats(dataService.getFleetStats());
          setTelemetry(dataService.getAllTelemetry());

          // Generate predictions for all vehicles
          updatePredictions(vehicleList);

          // Start real-time telemetry simulation (local mode only)
          dataService.startTelemetrySimulation(5000);
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      if (!isFirebaseMode) {
        dataService.stopTelemetrySimulation();
      }
    };
  }, [isFirebaseMode, user]);

  // Subscribe to local data updates (non-Firebase mode only)
  useEffect(() => {
    if (isFirebaseMode) return;

    const unsubVehicles = dataService.subscribe('vehicles', (data) => {
      setVehicles(data);
      setFleetStats(dataService.getFleetStats());
      if (isMLReady) {
        updatePredictions(data);
      }
    });

    const unsubAlerts = dataService.subscribe('alerts', (data) => {
      setAlerts(data);
    });

    const unsubTelemetry = dataService.subscribe('telemetry', (data) => {
      setTelemetry(new Map(Object.entries(data)));
    });

    return () => {
      unsubVehicles();
      unsubAlerts();
      unsubTelemetry();
    };
  }, [isFirebaseMode, isMLReady, updatePredictions]);

  const refreshData = useCallback(async () => {
    if (isFirebaseMode) {
      const [vehicleList, alertList, stats] = await Promise.all([
        firestoreService.getVehicles(),
        firestoreService.getAlerts(),
        firestoreService.getFleetStats(),
      ]);
      setVehicles(vehicleList);
      setAlerts(alertList);
      setFleetStats({
        ...stats,
        totalTrips: 0,
        activeTrips: 0,
      });
      if (isMLReady) {
        updatePredictions(vehicleList);
      }
    } else {
      const vehicleList = dataService.getVehicles();
      setVehicles(vehicleList);
      setAlerts(dataService.getAllAlerts());
      setFleetStats(dataService.getFleetStats());
      setTelemetry(dataService.getAllTelemetry());
      if (isMLReady) {
        updatePredictions(vehicleList);
      }
    }
  }, [isFirebaseMode, isMLReady, updatePredictions]);

  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    console.log('[DataContext] addVehicle called with:', vehicle);
    console.log('[DataContext] Firebase mode:', isFirebaseMode);
    
    if (isFirebaseMode) {
      console.log('[DataContext] Adding vehicle to Firestore...');
      const newVehicle = await firestoreService.addVehicle(vehicle);
      console.log('[DataContext] Vehicle added to Firestore:', newVehicle);
      await refreshData();
      return newVehicle;
    } else {
      console.log('[DataContext] Adding vehicle to local data service...');
      const newVehicle = dataService.addVehicle(vehicle);
      console.log('[DataContext] Vehicle added locally:', newVehicle);
      await refreshData();
      return newVehicle;
    }
  }, [isFirebaseMode, refreshData]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> => {
    if (isFirebaseMode) {
      await firestoreService.updateVehicle(id, updates);
      await refreshData();
      return vehicles.find(v => v.id === id);
    } else {
      const updated = dataService.updateVehicle(id, updates);
      await refreshData();
      return updated;
    }
  }, [isFirebaseMode, refreshData, vehicles]);

  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    if (isFirebaseMode) {
      await firestoreService.deleteVehicle(id);
      await refreshData();
      return true;
    } else {
      const success = dataService.deleteVehicle(id);
      await refreshData();
      return success;
    }
  }, [isFirebaseMode, refreshData]);

  const acknowledgeAlert = useCallback(async (alertId: string, userName?: string): Promise<void> => {
    if (isFirebaseMode) {
      await firestoreService.acknowledgeAlert(alertId, userName || 'User');
      await refreshData();
    } else {
      dataService.acknowledgeAlert(alertId);
      setAlerts(dataService.getAllAlerts());
    }
  }, [isFirebaseMode, refreshData]);

  const getVehiclePredictions = useCallback((vehicleId: string): PredictionResult[] => {
    return predictions.get(vehicleId) || [];
  }, [predictions]);

  const resetAllData = useCallback(() => {
    if (!isFirebaseMode) {
      dataService.resetData();
      refreshData();
    }
  }, [isFirebaseMode, refreshData]);

  const exportData = useCallback(() => {
    if (!isFirebaseMode) {
      return dataService.exportData();
    }
    // For Firebase mode, export current state
    return JSON.stringify({
      vehicles,
      alerts,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }, [isFirebaseMode, vehicles, alerts]);

  const importData = useCallback(async (json: string): Promise<boolean> => {
    try {
      const data = JSON.parse(json);

      if (isFirebaseMode) {
        // Import to Firebase
        if (data.vehicles && Array.isArray(data.vehicles)) {
          await firestoreService.batchAddVehicles(data.vehicles);
        }
        await refreshData();
        return true;
      } else {
        const success = dataService.importData(json);
        if (success) {
          await refreshData();
        }
        return success;
      }
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }, [isFirebaseMode, refreshData]);

  // Get vehicle by ID
  const getVehicleById = useCallback((id: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === id);
  }, [vehicles]);

  // Vehicle request handlers
  const submitVehicleRequest = useCallback(async (
    data: VehicleRequest['vehicleData']
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Get current user from auth context - we need to use a try-catch since we can't call hooks here
      let userId = 'unknown';
      let userName = 'Unknown User';
      let userRole = 'viewer';

      // Check if there's a user in localStorage (fallback for non-hook access)
      const storedUser = localStorage.getItem('fleet_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed.id || parsed.uid || 'unknown';
        userName = parsed.name || parsed.email || 'Unknown User';
        userRole = parsed.role || 'viewer';
      }

      console.log('[DataContext] submitVehicleRequest - User:', { userId, userName, userRole });
      console.log('[DataContext] submitVehicleRequest - Vehicle Data:', data);

      // If admin, add vehicle directly without creating a request
      if (userRole === 'admin') {
        console.log('[DataContext] Admin user - adding vehicle directly');
        
        const initialSensors = data.initialSensors;
        const initialTirePressure = initialSensors?.tirePressure || 32;

        // Get current location for the vehicle (or use default)
        let vehicleLocation = { lat: 17.385, lng: 78.4867, address: 'Default Location' };

        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            vehicleLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location',
            };
          } catch {
            console.log('Geolocation unavailable, using default location');
          }
        }

        // Create the vehicle directly for admin
        const newVehicle: Omit<Vehicle, 'id'> = {
          name: data.name,
          type: data.type,
          licensePlate: data.licensePlate,
          manufacturer: data.manufacturer,
          model: data.model,
          year: data.year,
          fuelType: data.fuelType,
          status: 'operational',
          healthScore: 100,
          location: vehicleLocation,
          lastMaintenance: new Date(),
          mileage: data.mileage || 0,
          fuelEfficiency: data.fuelEfficiency || 15,
          ownerId: userId,
          ownerName: userName,
          sensors: {
            engineTemp: initialSensors?.engineTemp || 75,
            oilPressure: initialSensors?.oilPressure || 40,
            batteryVoltage: initialSensors?.batteryVoltage || 12.8,
            tirePressure: {
              fl: initialTirePressure,
              fr: initialTirePressure,
              rl: initialTirePressure,
              rr: initialTirePressure
            },
            fuelLevel: 100,
          },
          trips: [],
          alerts: [],
        };

        await addVehicle(newVehicle);
        console.log('[DataContext] Vehicle added successfully');
        return { success: true, message: 'Vehicle added successfully to the fleet!' };
      }

      // For non-admin users, create a request
      const newRequest: VehicleRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vehicleData: data,
        requestedBy: userId,
        requestedByName: userName,
        status: 'pending',
        requestedAt: new Date(),
      };

      console.log('[DataContext] Non-admin user - creating vehicle request:', newRequest);

      if (isFirebaseMode) {
        await firestoreService.addVehicleRequest(newRequest);
        console.log('[DataContext] Request added to Firestore');
        // Reload requests
        const requests = await firestoreService.getVehicleRequests();
        setVehicleRequests(requests);
      } else {
        setVehicleRequests(prev => [...prev, newRequest]);
      }

      return { success: true, message: 'Vehicle request submitted successfully!' };
    } catch (error) {
      console.error('[DataContext] Failed to submit vehicle request:', error);
      return { success: false, message: 'Failed to submit request. Please try again.' };
    }
  }, [isFirebaseMode, addVehicle]);

  const approveVehicleRequest = useCallback(async (requestId: string, notes?: string): Promise<void> => {
    console.log('ApproveVehicleRequest called with requestId:', requestId);
    console.log('Current vehicleRequests:', vehicleRequests);
    console.log('IsFirebaseMode:', isFirebaseMode);
    
    const request = vehicleRequests.find(r => r.id === requestId);
    if (!request) {
      console.error('No request found for ID:', requestId);
      return;
    }
    
    console.log('Found request to approve:', request);

    try {
      // Parse sensor data if available
      const initialSensors = request.vehicleData.initialSensors;
      const initialTirePressure = initialSensors?.tirePressure || 32;

      // Get current location for the vehicle (or use default)
      let vehicleLocation = { lat: 17.385, lng: 78.4867, address: 'Default Location' };

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          vehicleLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current Location',
          };
        } catch {
          console.log('Geolocation unavailable, using default location');
        }
      }

      // Create the vehicle from the request data with owner information
      const newVehicle: Omit<Vehicle, 'id'> = {
        name: request.vehicleData.name,
        type: request.vehicleData.type,
        licensePlate: request.vehicleData.licensePlate,
        manufacturer: request.vehicleData.manufacturer,
        model: request.vehicleData.model,
        year: request.vehicleData.year,
        fuelType: request.vehicleData.fuelType,
        status: 'operational',
        healthScore: 100,
        location: vehicleLocation,
        lastMaintenance: new Date(),
        mileage: request.vehicleData.mileage || 0,
        fuelEfficiency: request.vehicleData.fuelEfficiency || 15,
        // IMPORTANT: Set owner information for user-specific filtering
        ownerId: request.requestedBy,
        ownerName: request.requestedByName,
        sensors: {
          engineTemp: initialSensors?.engineTemp || 75,
          oilPressure: initialSensors?.oilPressure || 40,
          batteryVoltage: initialSensors?.batteryVoltage || 12.8,
          tirePressure: {
            fl: initialTirePressure,
            fr: initialTirePressure,
            rl: initialTirePressure,
            rr: initialTirePressure
          },
          fuelLevel: 100,
        },
        trips: [],
        alerts: [],
      };

      // Add vehicle to database
      await addVehicle(newVehicle);

      // Update request status
      if (isFirebaseMode) {
        await firestoreService.updateVehicleRequest(requestId, {
          status: 'approved',
          reviewedAt: new Date(),
          notes,
        });
        const requests = await firestoreService.getVehicleRequests();
        setVehicleRequests(requests);
      } else {
        console.log('Approving vehicle request in local mode');
        setVehicleRequests(prev => {
          const updated = prev.map(r =>
            r.id === requestId
              ? { ...r, status: 'approved' as const, reviewedAt: new Date(), notes }
              : r
          );
          console.log('Updated vehicle requests after approval:', updated);
          return updated;
        });
      }
      console.log('Vehicle request approved successfully');
    } catch (error) {
      console.error('Failed to approve vehicle request:', error);
    }
  }, [vehicleRequests, addVehicle, isFirebaseMode]);

  const rejectVehicleRequest = useCallback(async (requestId: string, notes?: string): Promise<void> => {
    console.log('RejectVehicleRequest called with requestId:', requestId);
    console.log('Current vehicleRequests:', vehicleRequests);
    console.log('IsFirebaseMode:', isFirebaseMode);
    
    try {
      if (isFirebaseMode) {
        await firestoreService.updateVehicleRequest(requestId, {
          status: 'rejected',
          reviewedAt: new Date(),
          notes,
        });
        const requests = await firestoreService.getVehicleRequests();
        setVehicleRequests(requests);
      } else {
        console.log('Rejecting vehicle request in local mode');
        setVehicleRequests(prev => {
          const updated = prev.map(r =>
            r.id === requestId
              ? { ...r, status: 'rejected' as const, reviewedAt: new Date(), notes }
              : r
          );
          console.log('Updated vehicle requests after rejection:', updated);
          return updated;
        });
      }
      console.log('Vehicle request rejected successfully');
    } catch (error) {
      console.error('Failed to reject vehicle request:', error);
    }
  }, [isFirebaseMode]);

  const getPendingRequests = useCallback((): VehicleRequest[] => {
    return vehicleRequests.filter(r => r.status === 'pending');
  }, [vehicleRequests]);

  // Load vehicle requests on mount
  useEffect(() => {
    const loadVehicleRequests = async () => {
      if (isFirebaseMode) {
        try {
          const requests = await firestoreService.getVehicleRequests();
          setVehicleRequests(requests);
        } catch (error) {
          console.error('Failed to load vehicle requests:', error);
        }
      }
    };
    loadVehicleRequests();
  }, [isFirebaseMode]);

  return (
    <DataContext.Provider
      value={{
        vehicles,
        alerts,
        telemetry,
        fleetStats,
        predictions,
        isLoading,
        isMLReady,
        isFirebaseMode,
        vehicleRequests,
        refreshData,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        acknowledgeAlert,
        getVehiclePredictions,
        getVehicleById,
        resetAllData,
        exportData,
        importData,
        submitVehicleRequest,
        approveVehicleRequest,
        rejectVehicleRequest,
        getPendingRequests,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
