import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Maximize2, Minimize2, RefreshCw, Layers, Car, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: 'moving' | 'idle' | 'stopped' | 'offline';
  lastUpdate: Date;
  address?: string;
  fuelLevel?: number;
  driver?: string;
}

interface VehicleMapProps {
  vehicles?: VehicleLocation[];
  selectedVehicle?: string;
  onVehicleSelect?: (vehicleId: string) => void;
  className?: string;
  showControls?: boolean;
  height?: string;
}

// Simulated GPS coordinates for demo (San Francisco area)
const generateMockLocations = (): VehicleLocation[] => {
  const baseLocations = [
    { lat: 37.7749, lng: -122.4194, address: 'Market St, San Francisco' },
    { lat: 37.7849, lng: -122.4094, address: 'Financial District, SF' },
    { lat: 37.7649, lng: -122.4294, address: 'Castro District, SF' },
    { lat: 37.7949, lng: -122.3994, address: 'Embarcadero, SF' },
    { lat: 37.7549, lng: -122.4394, address: 'Twin Peaks, SF' },
    { lat: 37.7799, lng: -122.4144, address: 'Union Square, SF' },
    { lat: 37.7699, lng: -122.4244, address: 'Mission District, SF' },
    { lat: 37.7899, lng: -122.4044, address: 'North Beach, SF' },
  ];

  const statuses: VehicleLocation['status'][] = ['moving', 'idle', 'stopped', 'offline'];
  const drivers = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emily Davis', 'Alex Wilson', 'Lisa Brown', 'Tom Garcia', 'Anna Lee'];

  return baseLocations.map((loc, index) => ({
    id: `VH-${String(index + 1).padStart(3, '0')}`,
    name: `Fleet Vehicle ${index + 1}`,
    lat: loc.lat + (Math.random() - 0.5) * 0.01,
    lng: loc.lng + (Math.random() - 0.5) * 0.01,
    speed: statuses[index % 4] === 'moving' ? Math.floor(Math.random() * 60) + 15 : 0,
    heading: Math.floor(Math.random() * 360),
    status: statuses[index % 4],
    lastUpdate: new Date(Date.now() - Math.random() * 300000),
    address: loc.address,
    fuelLevel: Math.floor(Math.random() * 60) + 40,
    driver: drivers[index],
  }));
};

const VehicleMap: React.FC<VehicleMapProps> = ({
  vehicles: propVehicles,
  selectedVehicle,
  onVehicleSelect,
  className,
  showControls = true,
  height = '500px',
}) => {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>(propVehicles || generateMockLocations());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<'road' | 'satellite' | 'terrain'>('road');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [zoom, setZoom] = useState(13);

  // Update vehicles when props change
  useEffect(() => {
    if (propVehicles && propVehicles.length > 0) {
      setVehicles(propVehicles);
      // Update map center to first vehicle
      if (propVehicles[0].lat && propVehicles[0].lng) {
        setMapCenter({ lat: propVehicles[0].lat, lng: propVehicles[0].lng });
      }
    }
  }, [propVehicles]);

  // Simulate real-time GPS updates ONLY if no props provided
  useEffect(() => {
    if (propVehicles && propVehicles.length > 0) return;

    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status === 'moving') {
          return {
            ...v,
            lat: v.lat + (Math.random() - 0.5) * 0.001,
            lng: v.lng + (Math.random() - 0.5) * 0.001,
            speed: Math.floor(Math.random() * 60) + 15,
            heading: (v.heading + Math.random() * 20 - 10 + 360) % 360,
            lastUpdate: new Date(),
          };
        }
        return v;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setVehicles(generateMockLocations());
    setIsRefreshing(false);
  }, []);

  const getStatusColor = (status: VehicleLocation['status']) => {
    switch (status) {
      case 'moving': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'stopped': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: VehicleLocation['status']) => {
    switch (status) {
      case 'moving': return 'default';
      case 'idle': return 'secondary';
      case 'stopped': return 'outline';
      case 'offline': return 'destructive';
      default: return 'secondary';
    }
  };

  // Convert lat/lng to pixel position on the map (simplified projection)
  const toPixel = (lat: number, lng: number, containerWidth: number, containerHeight: number) => {
    const latRange = 0.06;
    const lngRange = 0.08;
    
    const x = ((lng - mapCenter.lng + lngRange / 2) / lngRange) * containerWidth;
    const y = ((mapCenter.lat - lat + latRange / 2) / latRange) * containerHeight;
    
    return { x: Math.max(0, Math.min(containerWidth - 20, x)), y: Math.max(0, Math.min(containerHeight - 20, y)) };
  };

  return (
    <div 
      className={cn(
        'relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-2xl',
        isFullscreen && 'fixed inset-4 z-50',
        className
      )}
      style={{ height: isFullscreen ? 'auto' : height }}
    >
      {/* Map Background with Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]">
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Simulated Roads */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(148,163,184,0.5)" strokeWidth="2" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(148,163,184,0.5)" strokeWidth="2" />
        <line x1="20%" y1="0" x2="80%" y2="100%" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
        <line x1="80%" y1="0" x2="20%" y2="100%" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
      </svg>

      {/* Vehicle Markers */}
      <div className="absolute inset-0" id="map-container">
        {vehicles.map((vehicle) => {
          const pos = toPixel(vehicle.lat, vehicle.lng, 800, parseInt(height));
          const isSelected = selectedVehicle === vehicle.id;
          const isHovered = hoveredVehicle === vehicle.id;
          
          return (
            <div
              key={vehicle.id}
              className="absolute transition-all duration-500 ease-out cursor-pointer group"
              style={{ 
                left: `${(pos.x / 800) * 100}%`, 
                top: `${(pos.y / parseInt(height)) * 100}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected || isHovered ? 20 : 10,
              }}
              onClick={() => onVehicleSelect?.(vehicle.id)}
              onMouseEnter={() => setHoveredVehicle(vehicle.id)}
              onMouseLeave={() => setHoveredVehicle(null)}
            >
              {/* Pulse Animation for Moving Vehicles */}
              {vehicle.status === 'moving' && (
                <div className="absolute inset-0 -m-2">
                  <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                </div>
              )}
              
              {/* Vehicle Icon */}
              <div 
                className={cn(
                  'relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
                  isSelected ? 'scale-125 ring-4 ring-blue-500/50' : '',
                  isHovered ? 'scale-110' : '',
                  getStatusColor(vehicle.status)
                )}
                style={{ transform: `rotate(${vehicle.heading}deg)` }}
              >
                <Car className="w-5 h-5 text-white" style={{ transform: `rotate(-${vehicle.heading}deg)` }} />
              </div>

              {/* Info Popup */}
              {(isSelected || isHovered) && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-white/10 min-w-[220px] z-30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-white">{vehicle.id}</span>
                    <Badge variant={getStatusBadge(vehicle.status)} className="capitalize text-xs">
                      {vehicle.status}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate">{vehicle.address}</span>
                    </div>
                    {vehicle.driver && (
                      <div className="text-slate-400">
                        Driver: <span className="text-slate-200">{vehicle.driver}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Speed: <span className="text-white">{vehicle.speed} mph</span></span>
                      <span>Fuel: <span className="text-white">{vehicle.fuelLevel}%</span></span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Updated: {vehicle.lastUpdate.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {showControls && (
        <>
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-slate-800/80 backdrop-blur-sm border-white/10 hover:bg-slate-700"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-slate-800/80 backdrop-blur-sm border-white/10 hover:bg-slate-700"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Map Type Selector */}
          <div className="absolute top-4 left-4 flex items-center gap-1 bg-slate-800/80 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {(['road', 'satellite', 'terrain'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMapType(type)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                  mapType === type 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="text-xs font-medium text-slate-300 mb-2">Vehicle Status</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { status: 'moving', label: 'Moving', color: 'bg-green-500' },
                { status: 'idle', label: 'Idle', color: 'bg-yellow-500' },
                { status: 'stopped', label: 'Stopped', color: 'bg-orange-500' },
                { status: 'offline', label: 'Offline', color: 'bg-gray-500' },
              ].map(({ status, label, color }) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', color)} />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">{vehicles.filter(v => v.status === 'moving').length}</div>
                <div className="text-xs text-green-400">Moving</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{vehicles.filter(v => v.status === 'idle').length}</div>
                <div className="text-xs text-yellow-400">Idle</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{vehicles.filter(v => v.status === 'stopped').length}</div>
                <div className="text-xs text-orange-400">Stopped</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{vehicles.filter(v => v.status === 'offline').length}</div>
                <div className="text-xs text-gray-400">Offline</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
        <button 
          onClick={() => setZoom(z => Math.min(z + 1, 18))}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <span className="text-lg font-bold">+</span>
        </button>
        <div className="h-px bg-white/10" />
        <button 
          onClick={() => setZoom(z => Math.max(z - 1, 8))}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <span className="text-lg font-bold">−</span>
        </button>
      </div>
    </div>
  );
};

export default VehicleMap;
