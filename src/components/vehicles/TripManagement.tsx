import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Vehicle, TripData, LocationHistory } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  X,
  MapPin,
  Clock,
  Fuel,
  Navigation,
  Loader2,
  Calendar,
  Route,
  Play,
  Square,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TripManagementProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

interface TripFormData {
  startLocation: string;
  endLocation: string;
  tripPurpose: string;
  notes: string;
  distanceTraveled: string;
  fuelConsumed: string;
}

export const TripManagement = ({ vehicle, isOpen, onClose }: TripManagementProps) => {
  const { user } = useAuth();
  const { updateVehicle } = useData();
  const [activeTab, setActiveTab] = useState<'trips' | 'add' | 'ongoing'>('trips');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [ongoingTrip, setOngoingTrip] = useState<TripData | null>(null);
  
  const [formData, setFormData] = useState<TripFormData>({
    startLocation: '',
    endLocation: '',
    tripPurpose: '',
    notes: '',
    distanceTraveled: '',
    fuelConsumed: '',
  });

  const trips = vehicle.trips || [];

  const handleStartTrip = async () => {
    setIsLoading(true);
    try {
      const newTrip: TripData = {
        id: `trip_${Date.now()}`,
        vehicleId: vehicle.id,
        userId: user?.id,
        startTime: new Date(),
        timestamp: new Date(),
        startLocation: vehicle.location,
        mileage: vehicle.mileage,
        engineTemperature: vehicle.sensors?.engineTemp || 0,
        fuelEfficiency: vehicle.fuelEfficiency || 0,
        brakingIntensity: 0,
        speedVariation: 0,
        idleTime: 0,
        tripDuration: 0,
        averageSpeed: 0,
        tripPurpose: formData.tripPurpose,
        notes: formData.notes,
        status: 'ongoing',
        route: [{ 
          lat: vehicle.location.lat, 
          lng: vehicle.location.lng, 
          timestamp: new Date() 
        }],
      };

      setOngoingTrip(newTrip);
      setMessage({ type: 'success', text: 'Trip started successfully!' });
      setActiveTab('ongoing');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start trip' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!ongoingTrip) return;
    
    setIsLoading(true);
    try {
      const endTime = new Date();
      const duration = (endTime.getTime() - ongoingTrip.startTime.getTime()) / (1000 * 60); // minutes
      const distance = parseFloat(formData.distanceTraveled) || 0;
      const fuel = parseFloat(formData.fuelConsumed) || 0;
      
      const completedTrip: TripData = {
        ...ongoingTrip,
        endTime,
        endLocation: vehicle.location,
        tripDuration: duration,
        distanceTraveled: distance,
        fuelConsumed: fuel,
        averageSpeed: distance / (duration / 60),
        fuelEfficiency: fuel > 0 ? distance / fuel : 0,
        status: 'completed',
      };

      // Update vehicle with new trip and updated mileage
      await updateVehicle(vehicle.id, {
        trips: [...trips, completedTrip],
        mileage: vehicle.mileage + distance,
      });

      setOngoingTrip(null);
      setMessage({ type: 'success', text: 'Trip completed successfully!' });
      setActiveTab('trips');
      setFormData({
        startLocation: '',
        endLocation: '',
        tripPurpose: '',
        notes: '',
        distanceTraveled: '',
        fuelConsumed: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to end trip' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManualTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const distance = parseFloat(formData.distanceTraveled) || 0;
      const fuel = parseFloat(formData.fuelConsumed) || 0;
      
      const newTrip: TripData = {
        id: `trip_${Date.now()}`,
        vehicleId: vehicle.id,
        userId: user?.id,
        startTime: new Date(),
        endTime: new Date(),
        timestamp: new Date(),
        mileage: vehicle.mileage + distance,
        distanceTraveled: distance,
        fuelConsumed: fuel,
        engineTemperature: vehicle.sensors?.engineTemp || 0,
        fuelEfficiency: fuel > 0 ? distance / fuel : 0,
        brakingIntensity: 0,
        speedVariation: 0,
        idleTime: 0,
        tripDuration: 60, // Default 1 hour
        averageSpeed: distance, // distance/1hr
        tripPurpose: formData.tripPurpose,
        notes: formData.notes,
        status: 'completed',
      };

      await updateVehicle(vehicle.id, {
        trips: [...trips, newTrip],
        mileage: vehicle.mileage + distance,
      });

      setMessage({ type: 'success', text: 'Trip added successfully!' });
      setFormData({
        startLocation: '',
        endLocation: '',
        tripPurpose: '',
        notes: '',
        distanceTraveled: '',
        fuelConsumed: '',
      });
      setActiveTab('trips');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add trip' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Route className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Trip Management - {vehicle.name}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('trips')}
            className={cn(
              'px-4 py-3 font-medium text-sm transition-colors',
              activeTab === 'trips' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            Trip History ({trips.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              'px-4 py-3 font-medium text-sm transition-colors',
              activeTab === 'add' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            Add Trip
          </button>
          {ongoingTrip && (
            <button
              onClick={() => setActiveTab('ongoing')}
              className={cn(
                'px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2',
                activeTab === 'ongoing' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Ongoing Trip
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {message && (
            <div className={cn(
              'p-3 rounded-lg mb-4 flex items-center gap-2',
              message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            )}>
              {message.text}
            </div>
          )}

          {/* Trip History */}
          {activeTab === 'trips' && (
            <div className="space-y-3">
              {trips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No trips recorded yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('add')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Trip
                  </Button>
                </div>
              ) : (
                trips.slice().reverse().map((trip) => (
                  <div key={trip.id} className="glass-panel p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(trip.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {trip.status === 'ongoing' && (
                          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                            Ongoing
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Distance</span>
                        <p className="font-mono font-medium">{trip.distanceTraveled || trip.mileage} km</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration</span>
                        <p className="font-mono font-medium">{Math.round(trip.tripDuration)} min</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Speed</span>
                        <p className="font-mono font-medium">{trip.averageSpeed?.toFixed(0) || 0} km/h</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fuel Used</span>
                        <p className="font-mono font-medium">{trip.fuelConsumed || '-'} L</p>
                      </div>
                    </div>
                    {trip.tripPurpose && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Purpose: {trip.tripPurpose}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add Trip Form */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddManualTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Distance (km) *</label>
                  <input
                    type="number"
                    value={formData.distanceTraveled}
                    onChange={(e) => setFormData(prev => ({ ...prev, distanceTraveled: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    placeholder="0"
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fuel Consumed (L)</label>
                  <input
                    type="number"
                    value={formData.fuelConsumed}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelConsumed: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trip Purpose</label>
                <select
                  value={formData.tripPurpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripPurpose: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                >
                  <option value="">Select purpose</option>
                  <option value="business">Business</option>
                  <option value="delivery">Delivery</option>
                  <option value="passenger">Passenger Transport</option>
                  <option value="personal">Personal</option>
                  <option value="maintenance">Maintenance Run</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none resize-none"
                  placeholder="Additional notes about the trip..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Trip
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleStartTrip}
                  disabled={isLoading || !!ongoingTrip}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Live Trip
                </Button>
              </div>
            </form>
          )}

          {/* Ongoing Trip */}
          {activeTab === 'ongoing' && ongoingTrip && (
            <div className="space-y-4">
              <div className="glass-panel p-4 border-2 border-green-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-green-500">Trip in Progress</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Started At</span>
                    <p className="font-medium">{format(ongoingTrip.startTime, 'HH:mm:ss')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <p className="font-mono font-medium">
                      {Math.round((new Date().getTime() - ongoingTrip.startTime.getTime()) / (1000 * 60))} min
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Distance Traveled (km) *</label>
                    <input
                      type="number"
                      value={formData.distanceTraveled}
                      onChange={(e) => setFormData(prev => ({ ...prev, distanceTraveled: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                      placeholder="Enter distance"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuel Consumed (L)</label>
                    <input
                      type="number"
                      value={formData.fuelConsumed}
                      onChange={(e) => setFormData(prev => ({ ...prev, fuelConsumed: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                      placeholder="Enter fuel used"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleEndTrip} 
                  className="w-full bg-red-500 hover:bg-red-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  End Trip
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
