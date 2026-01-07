import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Vehicle } from '@/types/vehicle';
import { VehicleRequest, VehicleApprovalStatus } from '@/types/auth';
import { mockVehicles as initialVehicles } from '@/data/mockData';
import { useAuth } from './AuthContext';

interface VehicleContextType {
  vehicles: Vehicle[];
  vehicleRequests: VehicleRequest[];
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'lastUpdated'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  submitVehicleRequest: (data: VehicleRequest['vehicleData']) => Promise<{ success: boolean; message: string }>;
  approveVehicleRequest: (requestId: string, notes?: string) => void;
  rejectVehicleRequest: (requestId: string, notes?: string) => void;
  getVehicleById: (id: string) => Vehicle | undefined;
  getPendingRequests: () => VehicleRequest[];
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

const INITIAL_REQUESTS: VehicleRequest[] = [
  {
    id: 'req-001',
    vehicleData: {
      name: 'New Delivery Van',
      type: 'van',
      licensePlate: 'VAN-9999',
      manufacturer: 'Ford',
      model: 'Transit',
      year: 2024,
    },
    requestedBy: 'operator-001',
    requestedByName: 'John Operator',
    status: 'pending',
    requestedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'req-002',
    vehicleData: {
      name: 'Express Cargo Truck',
      type: 'truck',
      licensePlate: 'TRK-5555',
      manufacturer: 'Volvo',
      model: 'FH16',
      year: 2023,
    },
    requestedBy: 'manager-001',
    requestedByName: 'Fleet Manager',
    status: 'pending',
    requestedAt: new Date(Date.now() - 172800000),
  },
];

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [vehicleRequests, setVehicleRequests] = useState<VehicleRequest[]>(INITIAL_REQUESTS);

  const addVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'lastUpdated'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`,
      lastUpdated: new Date(),
    };
    setVehicles(prev => [...prev, newVehicle]);
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => 
      v.id === id ? { ...v, ...updates, lastUpdated: new Date() } : v
    ));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const submitVehicleRequest = useCallback(async (data: VehicleRequest['vehicleData']) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!user) {
      return { success: false, message: 'You must be logged in to submit a request.' };
    }

    const existingPlate = vehicles.find(v => v.licensePlate === data.licensePlate);
    if (existingPlate) {
      return { success: false, message: 'A vehicle with this license plate already exists.' };
    }

    const pendingPlate = vehicleRequests.find(
      r => r.vehicleData.licensePlate === data.licensePlate && r.status === 'pending'
    );
    if (pendingPlate) {
      return { success: false, message: 'A pending request with this license plate already exists.' };
    }

    const newRequest: VehicleRequest = {
      id: `req-${Date.now()}`,
      vehicleData: data,
      requestedBy: user.id,
      requestedByName: user.name,
      status: 'pending',
      requestedAt: new Date(),
    };

    setVehicleRequests(prev => [...prev, newRequest]);

    // If admin, auto-approve
    if (user.role === 'admin') {
      const newVehicle: Vehicle = {
        id: `v-${Date.now()}`,
        name: data.name,
        type: data.type,
        licensePlate: data.licensePlate,
        healthScore: 100,
        status: 'operational',
        lastUpdated: new Date(),
        mileage: 0,
        fuelEfficiency: 0,
        engineTemperature: 25,
        sensors: {
          engineTemp: 75,
          oilPressure: 45,
          batteryVoltage: 12.6,
          tirePressure: { fl: 35, fr: 35, rl: 34, rr: 34 },
          fuelLevel: 100,
          brakeWear: 15,
          coolantLevel: 100,
        },
        location: { lat: 40.7128, lng: -74.006 },
        trips: [],
        alerts: [],
      };
      setVehicles(prev => [...prev, newVehicle]);
      setVehicleRequests(prev => prev.map(r => 
        r.id === newRequest.id 
          ? { ...r, status: 'approved' as VehicleApprovalStatus, reviewedBy: user.id, reviewedAt: new Date() }
          : r
      ));
      return { success: true, message: 'Vehicle added successfully!' };
    }

    return { success: true, message: 'Vehicle request submitted! Awaiting admin approval.' };
  }, [user, vehicles, vehicleRequests]);

  const approveVehicleRequest = useCallback((requestId: string, notes?: string) => {
    const request = vehicleRequests.find(r => r.id === requestId);
    if (!request || !user) return;

    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      name: request.vehicleData.name,
      type: request.vehicleData.type,
      licensePlate: request.vehicleData.licensePlate,
      healthScore: 100,
      status: 'operational',
      lastUpdated: new Date(),
      mileage: 0,
      fuelEfficiency: 0,
      engineTemperature: 25,
      sensors: {
        engineTemp: 75,
        oilPressure: 45,
        batteryVoltage: 12.6,
        tirePressure: { fl: 35, fr: 35, rl: 34, rr: 34 },
        fuelLevel: 100,
        brakeWear: 15,
        coolantLevel: 100,
      },
      location: { lat: 40.7128, lng: -74.006 },
      trips: [],
      alerts: [],
    };

    setVehicles(prev => [...prev, newVehicle]);
    setVehicleRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'approved' as VehicleApprovalStatus, 
            reviewedBy: user.id, 
            reviewedAt: new Date(),
            notes 
          }
        : r
    ));
  }, [vehicleRequests, user]);

  const rejectVehicleRequest = useCallback((requestId: string, notes?: string) => {
    if (!user) return;
    
    setVehicleRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: 'rejected' as VehicleApprovalStatus, 
            reviewedBy: user.id, 
            reviewedAt: new Date(),
            notes 
          }
        : r
    ));
  }, [user]);

  const getVehicleById = useCallback((id: string) => {
    return vehicles.find(v => v.id === id);
  }, [vehicles]);

  const getPendingRequests = useCallback(() => {
    return vehicleRequests.filter(r => r.status === 'pending');
  }, [vehicleRequests]);

  return (
    <VehicleContext.Provider value={{
      vehicles,
      vehicleRequests,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      submitVehicleRequest,
      approveVehicleRequest,
      rejectVehicleRequest,
      getVehicleById,
      getPendingRequests,
    }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};
