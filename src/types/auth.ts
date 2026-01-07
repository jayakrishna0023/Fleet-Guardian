export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  department?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  lastLogin?: Date;
  loginCount?: number;
  vehicleCount?: number;
  vehicleIds?: string[]; // IDs of vehicles owned by this user
}

export interface UserStats {
  userId: string;
  totalLogins: number;
  totalVehicles: number;
  totalTrips: number;
  lastActive: Date;
}

export interface LoginHistory {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  loginTime: Date;
  logoutTime?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  department?: string;
  phone?: string;
  address?: string;
}

export type VehicleApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface VehicleRequest {
  id: string;
  vehicleData: {
    name: string;
    type: 'bus' | 'truck' | 'van' | 'car';
    licensePlate: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    engineNumber?: string;
    chassisNumber?: string;
    fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
    mileage?: number;
    fuelEfficiency?: number;
    initialSensors?: {
      engineTemp?: number;
      oilPressure?: number;
      batteryVoltage?: number;
      tirePressure?: number;
    };
  };
  requestedBy: string;
  requestedByName: string;
  status: VehicleApprovalStatus;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}
