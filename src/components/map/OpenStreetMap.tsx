import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, LocationHistory } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { Bus, Truck, Car, Navigation, MapPin } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OpenStreetMapProps {
  vehicles: Vehicle[];
  selectedVehicle?: string | null;
  onVehicleSelect?: (vehicleId: string) => void;
  showRoute?: boolean;
  routeHistory?: LocationHistory[];
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

// Custom vehicle icons based on type and status
const createVehicleIcon = (type: Vehicle['type'], status: Vehicle['status']) => {
  const statusColors: Record<string, string> = {
    operational: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
    maintenance: '#6B7280',
    'out-of-service': '#374151',
  };

  const color = statusColors[status] || '#6B7280';

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
        ${type === 'bus' ? 'B' : type === 'truck' ? 'T' : type === 'van' ? 'V' : 'C'}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-vehicle-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// User location icon
const userLocationIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `,
  className: 'user-location-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to handle map view updates
const MapController: React.FC<{
  center?: [number, number];
  selectedVehicle?: Vehicle | null;
  vehicles: Vehicle[];
}> = ({ center, selectedVehicle, vehicles }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicle?.location?.lat && selectedVehicle?.location?.lng) {
      map.flyTo([selectedVehicle.location.lat, selectedVehicle.location.lng], 15, {
        duration: 1,
      });
    } else if (center) {
      map.setView(center, map.getZoom());
    } else if (vehicles.length > 0) {
      const validLocations = vehicles
        .filter(v => v.location && typeof v.location.lat === 'number' && typeof v.location.lng === 'number')
        .map(v => [v.location.lat, v.location.lng] as [number, number]);

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(validLocations);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedVehicle, center, vehicles, map]);

  return null;
};

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  showRoute = false,
  routeHistory = [],
  userLocation,
  className,
  center = [17.385, 78.4867], // Default: Hyderabad
  zoom = 12,
}) => {
  const [mapReady, setMapReady] = useState(false);

  const selectedVehicleData = useMemo(() =>
    vehicles.find(v => v.id === selectedVehicle),
    [vehicles, selectedVehicle]
  );

  // Generate route polyline from location history
  const routePositions = useMemo(() => {
    if (!showRoute || !selectedVehicleData?.locationHistory) return [];
    return selectedVehicleData.locationHistory
      .filter(loc => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number')
      .map(loc => [loc.lat, loc.lng] as [number, number]);
  }, [showRoute, selectedVehicleData]);

  // Custom route from props
  const customRoutePositions = useMemo(() => {
    return routeHistory
      .filter(loc => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number')
      .map(loc => [loc.lat, loc.lng] as [number, number]);
  }, [routeHistory]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    operational: { label: 'Operational', color: 'text-green-500' },
    warning: { label: 'Warning', color: 'text-yellow-500' },
    critical: { label: 'Critical', color: 'text-red-500' },
    maintenance: { label: 'Maintenance', color: 'text-gray-500' },
    'out-of-service': { label: 'Out of Service', color: 'text-gray-700' },
  };

  const typeIcons = {
    bus: Bus,
    truck: Truck,
    van: Car,
    car: Car,
  };

  return (
    <div className={cn('relative w-full h-full rounded-lg overflow-hidden', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          center={center}
          selectedVehicle={selectedVehicleData}
          vehicles={vehicles}
        />

        {/* User location marker */}
        {userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Vehicle markers */}
        {vehicles.map((vehicle) => {
          if (!vehicle.location || typeof vehicle.location.lat !== 'number' || typeof vehicle.location.lng !== 'number') {
            return null;
          }

          const TypeIcon = typeIcons[vehicle.type] || Car;
          const status = statusConfig[vehicle.status];
          const isSelected = selectedVehicle === vehicle.id;

          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.location.lat, vehicle.location.lng]}
              icon={createVehicleIcon(vehicle.type, vehicle.status)}
              eventHandlers={{
                click: () => onVehicleSelect?.(vehicle.id),
              }}
            >
              <Popup>
                <div className="min-w-[200px] p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="w-5 h-5" />
                    <span className="font-bold">{vehicle.name}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">License:</span> {vehicle.licensePlate}</p>
                    <p><span className="text-gray-500">Status:</span> <span className={status?.color}>{status?.label}</span></p>
                    <p><span className="text-gray-500">Health:</span> {vehicle.healthScore}%</p>
                    <p><span className="text-gray-500">Mileage:</span> {vehicle.mileage.toLocaleString()} km</p>
                    {vehicle.driver && (
                      <p><span className="text-gray-500">Driver:</span> {vehicle.driver}</p>
                    )}
                    {vehicle.location.address && (
                      <p><span className="text-gray-500">Location:</span> {vehicle.location.address}</p>
                    )}
                  </div>
                  {onVehicleSelect && (
                    <button
                      onClick={() => onVehicleSelect(vehicle.id)}
                      className="mt-2 w-full px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Route polyline for selected vehicle */}
        {showRoute && routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#3B82F6',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Custom route polyline */}
        {customRoutePositions.length > 1 && (
          <Polyline
            positions={customRoutePositions}
            pathOptions={{
              color: '#10B981',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <p className="text-xs font-semibold mb-2">Vehicle Status</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Vehicle count */}
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <p className="text-sm font-medium">{vehicles.length} Vehicles</p>
      </div>
    </div>
  );
};

export default OpenStreetMap;
