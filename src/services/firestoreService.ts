// Firebase Firestore Database Service
// Handles all vehicle, alert, and fleet data operations

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentReference,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Vehicle, Alert, TripData } from '@/types/vehicle';

// Collection names
const COLLECTIONS = {
  VEHICLES: 'vehicles',
  ALERTS: 'alerts',
  TRIPS: 'trips',
  TELEMETRY: 'telemetry',
  MAINTENANCE: 'maintenance',
  REPORTS: 'reports',
  VEHICLE_REQUESTS: 'vehicle_requests',
} as const;

// Convert Firestore timestamp to Date
const toDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return timestamp;
};

// ============== VEHICLES ==============

export async function getVehicles(): Promise<Vehicle[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);
    const q = query(vehiclesRef, orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: toDate(doc.data().lastUpdated),
    })) as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  if (!isFirebaseConfigured() || !db) return null;

  try {
    const docRef = doc(db, COLLECTIONS.VEHICLES, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        lastUpdated: toDate(docSnap.data().lastUpdated),
      } as Vehicle;
    }
    return null;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return null;
  }
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  console.log('[FirestoreService] addVehicle called with:', vehicle);
  
  if (!isFirebaseConfigured() || !db) {
    console.error('[FirestoreService] Firebase not configured!');
    throw new Error('Firebase not configured');
  }

  const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);

  // Check for duplicates by license plate
  console.log('[FirestoreService] Checking for duplicate license plate:', vehicle.licensePlate);
  const q = query(vehiclesRef, where('licensePlate', '==', vehicle.licensePlate));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    console.error('[FirestoreService] Duplicate vehicle found!');
    throw new Error(`Vehicle with license plate ${vehicle.licensePlate} already exists.`);
  }

  console.log('[FirestoreService] Adding document to Firestore...');
  const docRef = await addDoc(vehiclesRef, {
    ...vehicle,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  console.log('[FirestoreService] Vehicle added successfully with ID:', docRef.id);
  return {
    id: docRef.id,
    ...vehicle,
  };
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
  console.log('[FirestoreService] updateVehicle called with id:', id);
  console.log('[FirestoreService] updateVehicle updates:', updates);
  
  if (!isFirebaseConfigured() || !db) {
    console.error('[FirestoreService] Firebase not configured!');
    throw new Error('Firebase not configured');
  }

  // Convert Date objects to Firestore-compatible format
  const processedUpdates = JSON.parse(JSON.stringify(updates, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }));

  const docRef = doc(db, COLLECTIONS.VEHICLES, id);
  await updateDoc(docRef, {
    ...processedUpdates,
    lastUpdated: serverTimestamp(),
  });
  
  console.log('[FirestoreService] Vehicle updated successfully');
}

// Update vehicle location (for real-time GPS tracking from device)
export async function updateVehicleLocation(
  vehicleId: string,
  location: { lat: number; lng: number; address?: string }
): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const docRef = doc(db, COLLECTIONS.VEHICLES, vehicleId);
  await updateDoc(docRef, {
    location,
    lastUpdated: serverTimestamp(),
  });
}

// Get vehicles by owner/driver (for user-specific vehicle view)
export async function getVehiclesByDriver(driverName: string): Promise<Vehicle[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);
    const q = query(vehiclesRef, where('driver', '==', driverName));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: toDate(doc.data().lastUpdated),
    })) as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles by driver:', error);
    return [];
  }
}

// Get vehicles by owner ID (production-ready user-specific filtering)
export async function getVehiclesByOwner(ownerId: string): Promise<Vehicle[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);
    const q = query(vehiclesRef, where('ownerId', '==', ownerId), orderBy('name'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: toDate(doc.data().lastUpdated),
    })) as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles by owner:', error);
    return [];
  }
}

// Subscribe to user-specific vehicles (real-time updates for owner only)
export function subscribeToUserVehicles(ownerId: string, callback: (vehicles: Vehicle[]) => void): () => void {
  if (!isFirebaseConfigured() || !db) return () => { };

  const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);
  const q = query(vehiclesRef, where('ownerId', '==', ownerId), orderBy('name'));

  return onSnapshot(q, (snapshot) => {
    const vehicles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: toDate(doc.data().lastUpdated),
    })) as Vehicle[];
    callback(vehicles);
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const docRef = doc(db, COLLECTIONS.VEHICLES, id);
  await deleteDoc(docRef);
}

// Real-time vehicle updates
export function subscribeToVehicles(callback: (vehicles: Vehicle[]) => void): () => void {
  if (!isFirebaseConfigured() || !db) return () => { };

  const vehiclesRef = collection(db, COLLECTIONS.VEHICLES);
  const q = query(vehiclesRef, orderBy('name'));

  return onSnapshot(q, (snapshot) => {
    const vehicles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: toDate(doc.data().lastUpdated),
    })) as Vehicle[];
    callback(vehicles);
  });
}

// ============== ALERTS ==============

export async function getAlerts(vehicleId?: string): Promise<Alert[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const alertsRef = collection(db, COLLECTIONS.ALERTS);
    let q = query(alertsRef, orderBy('timestamp', 'desc'), limit(100));

    if (vehicleId) {
      q = query(alertsRef, where('vehicleId', '==', vehicleId), orderBy('timestamp', 'desc'));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: toDate(doc.data().timestamp),
      acknowledgedAt: doc.data().acknowledgedAt ? toDate(doc.data().acknowledgedAt) : undefined,
    })) as Alert[];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

export async function addAlert(alert: Omit<Alert, 'id'>): Promise<Alert> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const alertsRef = collection(db, COLLECTIONS.ALERTS);
  const docRef = await addDoc(alertsRef, {
    ...alert,
    timestamp: serverTimestamp(),
    acknowledged: false,
  });

  return {
    id: docRef.id,
    ...alert,
    timestamp: new Date(),
    acknowledged: false,
  };
}

export async function acknowledgeAlert(id: string, acknowledgedBy: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const docRef = doc(db, COLLECTIONS.ALERTS, id);
  await updateDoc(docRef, {
    acknowledged: true,
    acknowledgedBy,
    acknowledgedAt: serverTimestamp(),
  });
}

export async function deleteAlert(id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const docRef = doc(db, COLLECTIONS.ALERTS, id);
  await deleteDoc(docRef);
}

// Real-time alerts
export function subscribeToAlerts(callback: (alerts: Alert[]) => void): () => void {
  if (!isFirebaseConfigured() || !db) return () => { };

  const alertsRef = collection(db, COLLECTIONS.ALERTS);
  const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: toDate(doc.data().timestamp),
      acknowledgedAt: doc.data().acknowledgedAt ? toDate(doc.data().acknowledgedAt) : undefined,
    })) as Alert[];
    callback(alerts);
  });
}

// ============== TRIPS ==============

export async function getTrips(vehicleId: string, limitCount: number = 50): Promise<TripData[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const tripsRef = collection(db, COLLECTIONS.TRIPS);
    const q = query(
      tripsRef,
      where('vehicleId', '==', vehicleId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: toDate(doc.data().timestamp),
    })) as TripData[];
  } catch (error) {
    console.error('Error fetching trips:', error);
    return [];
  }
}

export async function addTrip(trip: Omit<TripData, 'id'>): Promise<TripData> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const tripsRef = collection(db, COLLECTIONS.TRIPS);
  const docRef = await addDoc(tripsRef, {
    ...trip,
    timestamp: serverTimestamp(),
  });

  return {
    id: docRef.id,
    ...trip,
  };
}

// ============== BATCH OPERATIONS ==============

export async function batchAddVehicles(vehicles: Omit<Vehicle, 'id'>[]): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const batch = writeBatch(db);

  vehicles.forEach((vehicle) => {
    const docRef = doc(collection(db, COLLECTIONS.VEHICLES));
    batch.set(docRef, {
      ...vehicle,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function batchAddTrips(trips: Omit<TripData, 'id'>[]): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  // Firestore batch limit is 500
  const batchSize = 500;
  for (let i = 0; i < trips.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = trips.slice(i, i + batchSize);

    chunk.forEach((trip) => {
      const docRef = doc(collection(db, COLLECTIONS.TRIPS));
      batch.set(docRef, {
        ...trip,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

// ============== FLEET STATS ==============

export async function getFleetStats() {
  if (!isFirebaseConfigured()) {
    return {
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
    };
  }

  try {
    const vehicles = await getVehicles();
    const alerts = await getAlerts();

    const operationalCount = vehicles.filter(v => v.status === 'operational').length;
    const maintenanceCount = vehicles.filter(v => v.status === 'maintenance' || v.status === 'warning').length;
    const outOfServiceCount = vehicles.filter(v => v.status === 'critical' || v.status === 'out-of-service').length;
    const avgHealthScore = vehicles.length > 0
      ? vehicles.reduce((acc, v) => acc + (v.healthScore || 0), 0) / vehicles.length
      : 0;
    const avgFuelEfficiency = vehicles.length > 0
      ? vehicles.reduce((acc, v) => acc + (v.fuelEfficiency || 0), 0) / vehicles.length
      : 0;
    const totalMileage = vehicles.reduce((acc, v) => acc + (v.mileage || 0), 0);

    const activeAlerts = alerts.filter(a => !a.acknowledged);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = activeAlerts.filter(a => a.severity === 'warning').length;

    return {
      totalVehicles: vehicles.length,
      operationalCount,
      maintenanceCount,
      outOfServiceCount,
      avgHealthScore: Math.round(avgHealthScore),
      totalAlerts: activeAlerts.length,
      criticalAlerts,
      warningAlerts,
      avgFuelEfficiency: Math.round(avgFuelEfficiency * 10) / 10,
      totalMileage,
    };
  } catch (error) {
    console.error('Error calculating fleet stats:', error);
    return {
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
    };
  }
}

// ============== VEHICLE REQUESTS ==============

import { VehicleRequest } from '@/types/auth';

export async function getVehicleRequests(): Promise<VehicleRequest[]> {
  if (!isFirebaseConfigured() || !db) return [];

  try {
    const requestsRef = collection(db, COLLECTIONS.VEHICLE_REQUESTS || 'vehicle_requests');
    const q = query(requestsRef, orderBy('requestedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: toDate(doc.data().requestedAt),
      reviewedAt: doc.data().reviewedAt ? toDate(doc.data().reviewedAt) : undefined,
    })) as VehicleRequest[];
  } catch (error) {
    console.error('Error fetching vehicle requests:', error);
    return [];
  }
}

export async function addVehicleRequest(request: VehicleRequest): Promise<VehicleRequest> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const requestsRef = collection(db, COLLECTIONS.VEHICLE_REQUESTS || 'vehicle_requests');
  const docRef = await addDoc(requestsRef, {
    ...request,
    requestedAt: serverTimestamp(),
  });

  return {
    ...request,
    id: docRef.id,
  };
}

export async function updateVehicleRequest(
  id: string,
  updates: Partial<Pick<VehicleRequest, 'status' | 'reviewedAt' | 'reviewedBy' | 'notes'>>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');

  const docRef = doc(db, COLLECTIONS.VEHICLE_REQUESTS || 'vehicle_requests', id);
  await updateDoc(docRef, {
    ...updates,
    reviewedAt: updates.reviewedAt ? serverTimestamp() : undefined,
  });
}

// Export all functions
export const firestoreService = {
  // Vehicles
  getVehicles,
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  subscribeToVehicles,
  batchAddVehicles,
  getVehiclesByDriver,
  getVehiclesByOwner,
  subscribeToUserVehicles,

  // Alerts
  getAlerts,
  addAlert,
  acknowledgeAlert,
  deleteAlert,
  subscribeToAlerts,

  // Trips
  getTrips,
  addTrip,
  batchAddTrips,

  // Stats
  getFleetStats,

  // Vehicle Requests
  getVehicleRequests,
  addVehicleRequest,
  updateVehicleRequest,
};
