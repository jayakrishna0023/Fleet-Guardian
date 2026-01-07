// Location Tracking Service
// Tracks the device location and updates the assigned vehicle's location in Firestore

import { updateVehicleLocation } from './firestoreService';

interface LocationTrackingOptions {
  vehicleId: string;
  updateInterval?: number; // milliseconds
  enableHighAccuracy?: boolean;
}

class LocationTrackingService {
  private watchId: number | null = null;
  private vehicleId: string | null = null;
  private lastUpdate: Date | null = null;
  private updateInterval: number = 10000; // Default 10 seconds
  private isTracking: boolean = false;

  // Callbacks
  public onLocationUpdate: ((location: { lat: number; lng: number }) => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  public onStatusChange: ((isTracking: boolean) => void) | null = null;

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Start tracking the device location and updating the vehicle in Firestore
   */
  startTracking(options: LocationTrackingOptions): boolean {
    if (!this.isSupported()) {
      this.onError?.('Geolocation is not supported by this browser.');
      return false;
    }

    this.vehicleId = options.vehicleId;
    this.updateInterval = options.updateInterval || 10000;

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Throttle updates to prevent too many writes
        const now = new Date();
        if (this.lastUpdate && (now.getTime() - this.lastUpdate.getTime()) < this.updateInterval) {
          return;
        }

        this.lastUpdate = now;
        this.onLocationUpdate?.(location);

        // Update vehicle location in Firestore
        if (this.vehicleId) {
          try {
            await updateVehicleLocation(this.vehicleId, {
              lat: location.lat,
              lng: location.lng,
              address: await this.reverseGeocode(location.lat, location.lng),
            });
          } catch (error) {
            console.error('Failed to update vehicle location:', error);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error.message);
        this.onError?.(error.message);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    this.isTracking = true;
    this.onStatusChange?.(true);
    return true;
  }

  /**
   * Stop tracking the device location
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.vehicleId = null;
    this.onStatusChange?.(false);
  }

  /**
   * Get the current tracking status
   */
  getTrackingStatus(): { isTracking: boolean; vehicleId: string | null } {
    return {
      isTracking: this.isTracking,
      vehicleId: this.vehicleId,
    };
  }

  /**
   * Get the current device location (one-time)
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    if (!this.isSupported()) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates to get address (uses Google Geocoding API)
   */
  private async reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) return undefined;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    return undefined;
  }
}

export const locationTrackingService = new LocationTrackingService();
