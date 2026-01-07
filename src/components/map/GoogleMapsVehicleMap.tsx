import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Navigation, Maximize2, Minimize2, RefreshCw, Locate, Car, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

interface VehicleMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  status: 'operational' | 'warning' | 'critical' | 'maintenance' | 'out-of-service' | 'moving' | 'idle' | 'stopped' | 'offline';
  lastUpdate: Date;
  address?: string;
  fuelLevel?: number;
  driver?: string;
  healthScore?: number;
}

interface GoogleMapsVehicleMapProps {
  selectedVehicle?: string;
  onVehicleSelect?: (vehicleId: string) => void;
  className?: string;
  showControls?: boolean;
  height?: string;
  showUserLocation?: boolean;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

const GoogleMapsVehicleMap: React.FC<GoogleMapsVehicleMapProps> = ({
  selectedVehicle,
  onVehicleSelect,
  className,
  showControls = true,
  height = '500px',
  showUserLocation = true,
}) => {
  const { user } = useAuth();
  const { vehicles: dataVehicles } = useData();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // Convert data vehicles to map markers
  const vehicleMarkers: VehicleMarker[] = dataVehicles.map(v => ({
    id: v.id,
    name: v.name,
    lat: v.location?.lat || 0,
    lng: v.location?.lng || 0,
    status: v.status,
    lastUpdate: v.lastUpdated || new Date(),
    address: v.location?.address,
    fuelLevel: v.sensors?.fuelLevel,
    driver: v.driver,
    healthScore: v.healthScore,
  }));

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key is not configured.');
      setIsLoading(false);
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps.');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  // Get user's current location
  useEffect(() => {
    if (!showUserLocation) return;

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          
          // Update user marker if map is ready
          if (googleMapRef.current && userMarkerRef.current) {
            userMarkerRef.current.setPosition(newLocation);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [showUserLocation]);

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Determine initial center - prioritize user location, then first vehicle, then default
    let initialCenter = { lat: 12.9716, lng: 77.5946 }; // Default: Bangalore, India
    
    if (userLocation) {
      initialCenter = userLocation;
    } else if (vehicleMarkers.length > 0 && vehicleMarkers[0].lat !== 0) {
      initialCenter = { lat: vehicleMarkers[0].lat, lng: vehicleMarkers[0].lng };
    }

    const mapOptions: google.maps.MapOptions = {
      center: initialCenter,
      zoom: 12,
      mapTypeId: 'roadmap',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    };

    googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add user location marker
    if (userLocation) {
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map: googleMapRef.current,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        zIndex: 1000,
      });
    }

  }, [isLoaded, userLocation]);

  // Update vehicle markers
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current.clear();

    // Add new markers
    vehicleMarkers.forEach(vehicle => {
      if (vehicle.lat === 0 && vehicle.lng === 0) return;

      const getMarkerColor = () => {
        switch (vehicle.status) {
          case 'operational':
          case 'moving':
            return '#22c55e'; // Green
          case 'warning':
          case 'idle':
            return '#eab308'; // Yellow
          case 'critical':
          case 'stopped':
            return '#ef4444'; // Red
          case 'maintenance':
          case 'out-of-service':
          case 'offline':
            return '#6b7280'; // Gray
          default:
            return '#3b82f6'; // Blue
        }
      };

      const marker = new google.maps.Marker({
        position: { lat: vehicle.lat, lng: vehicle.lng },
        map: googleMapRef.current!,
        title: vehicle.name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: getMarkerColor(),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 22),
        },
        animation: selectedVehicle === vehicle.id ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current && googleMapRef.current) {
          const content = `
            <div style="padding: 12px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${getMarkerColor()};"></div>
                <strong style="font-size: 14px; color: #1f2937;">${vehicle.name}</strong>
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                <strong>Status:</strong> ${vehicle.status}
              </div>
              ${vehicle.driver ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;"><strong>Driver:</strong> ${vehicle.driver}</div>` : ''}
              ${vehicle.healthScore ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;"><strong>Health:</strong> ${vehicle.healthScore}%</div>` : ''}
              ${vehicle.fuelLevel ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;"><strong>Fuel:</strong> ${vehicle.fuelLevel}%</div>` : ''}
              ${vehicle.address ? `<div style="font-size: 12px; color: #6b7280;"><strong>Location:</strong> ${vehicle.address}</div>` : ''}
              <div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">
                Last updated: ${new Date(vehicle.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(googleMapRef.current, marker);
        }
        onVehicleSelect?.(vehicle.id);
      });

      markersRef.current.set(vehicle.id, marker);
    });

    // Fit bounds to show all markers
    if (vehicleMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      vehicleMarkers.forEach(v => {
        if (v.lat !== 0 && v.lng !== 0) {
          bounds.extend({ lat: v.lat, lng: v.lng });
        }
      });
      if (userLocation) {
        bounds.extend(userLocation);
      }
      // Only fit bounds on initial load
      if (markersRef.current.size === vehicleMarkers.length) {
        // googleMapRef.current?.fitBounds(bounds);
      }
    }

  }, [vehicleMarkers, selectedVehicle, isLoaded, onVehicleSelect]);

  // Center on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && googleMapRef.current) {
      googleMapRef.current.panTo(userLocation);
      googleMapRef.current.setZoom(15);
    } else if ('geolocation' in navigator) {
      setIsTracking(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          if (googleMapRef.current) {
            googleMapRef.current.panTo(loc);
            googleMapRef.current.setZoom(15);
          }
          setIsTracking(false);
        },
        () => setIsTracking(false)
      );
    }
  }, [userLocation]);

  // Refresh vehicle locations
  const handleRefresh = useCallback(() => {
    // The vehicles are automatically updated from DataContext
    // Just trigger a visual refresh
    if (googleMapRef.current && vehicleMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      vehicleMarkers.forEach(v => {
        if (v.lat !== 0 && v.lng !== 0) {
          bounds.extend({ lat: v.lat, lng: v.lng });
        }
      });
      googleMapRef.current.fitBounds(bounds);
    }
  }, [vehicleMarkers]);

  if (error) {
    return (
      <div className={cn('relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10', className)} style={{ height }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Please check VITE_GOOGLE_API_KEY in your .env file</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl',
        isFullscreen && 'fixed inset-4 z-50',
        className
      )}
      style={{ height: isFullscreen ? 'calc(100vh - 32px)' : height }}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Google Maps...</p>
          </div>
        </div>
      )}

      {/* Google Map Container */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={centerOnUser}
            disabled={isTracking}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
            title="Center on your location"
          >
            {isTracking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRefresh}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
            title="Refresh map"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* Vehicle List Sidebar */}
      <div className="absolute top-4 left-4 bottom-4 w-64 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden z-10 hidden lg:block">
        <div className="p-3 border-b border-white/10">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            Fleet Vehicles ({vehicleMarkers.length})
          </h3>
          {user && (
            <p className="text-xs text-muted-foreground mt-1">
              Logged in as: {user.name}
            </p>
          )}
        </div>
        <div className="overflow-y-auto max-h-[calc(100%-60px)]">
          {vehicleMarkers.map(vehicle => (
            <button
              key={vehicle.id}
              onClick={() => {
                onVehicleSelect?.(vehicle.id);
                if (googleMapRef.current && vehicle.lat !== 0) {
                  googleMapRef.current.panTo({ lat: vehicle.lat, lng: vehicle.lng });
                  googleMapRef.current.setZoom(15);
                }
              }}
              className={cn(
                'w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5',
                selectedVehicle === vehicle.id && 'bg-primary/20'
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  vehicle.status === 'operational' && 'bg-green-500',
                  vehicle.status === 'warning' && 'bg-yellow-500',
                  vehicle.status === 'critical' && 'bg-red-500',
                  (vehicle.status === 'maintenance' || vehicle.status === 'out-of-service') && 'bg-gray-500'
                )} />
                <span className="font-medium text-sm">{vehicle.name}</span>
              </div>
              {vehicle.driver && (
                <p className="text-xs text-muted-foreground mt-1">{vehicle.driver}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {vehicle.status}
                </Badge>
                {vehicle.healthScore && (
                  <span className="text-xs text-muted-foreground">{vehicle.healthScore}%</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User Location Indicator */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 z-10">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-muted-foreground">Your Location</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsVehicleMap;
