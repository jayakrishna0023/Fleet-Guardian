import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Vehicle, MaintenanceInfo, TireHealth } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { 
  X,
  Save,
  Loader2,
  Car,
  Gauge,
  Fuel,
  Calendar,
  Wrench,
  Settings,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EditVehicleModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

interface VehicleFormData {
  name: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  mileage: string;
  fuelEfficiency: string;
  // Maintenance Info
  lastOilChange: string;
  nextOilChangeDue: string;
  lastTyreChange: string;
  lastBrakeService: string;
  lastFullService: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  pollutionCertExpiry: string;
  // Tire Health
  tireHealthFL: string;
  tireHealthFR: string;
  tireHealthRL: string;
  tireHealthRR: string;
  // Sensors
  fuelLevel: string;
  engineTemp: string;
  oilPressure: string;
  batteryVoltage: string;
  brakeWear: string;
  coolantLevel: string;
}

export const EditVehicleModal = ({ vehicle, isOpen, onClose }: EditVehicleModalProps) => {
  const { updateVehicle } = useData();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'maintenance' | 'sensors'>('basic');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    licensePlate: '',
    manufacturer: '',
    model: '',
    year: '',
    engineNumber: '',
    chassisNumber: '',
    fuelType: 'diesel',
    mileage: '',
    fuelEfficiency: '',
    lastOilChange: '',
    nextOilChangeDue: '',
    lastTyreChange: '',
    lastBrakeService: '',
    lastFullService: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    pollutionCertExpiry: '',
    tireHealthFL: '',
    tireHealthFR: '',
    tireHealthRL: '',
    tireHealthRR: '',
    fuelLevel: '',
    engineTemp: '',
    oilPressure: '',
    batteryVoltage: '',
    brakeWear: '',
    coolantLevel: '',
  });

  useEffect(() => {
    if (vehicle) {
      const formatDate = (date: Date | string | undefined) => {
        if (!date) return '';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd');
      };

      setFormData({
        name: vehicle.name || '',
        licensePlate: vehicle.licensePlate || '',
        manufacturer: vehicle.manufacturer || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        engineNumber: vehicle.engineNumber || '',
        chassisNumber: vehicle.chassisNumber || '',
        fuelType: vehicle.fuelType || 'diesel',
        mileage: vehicle.mileage?.toString() || '',
        fuelEfficiency: vehicle.fuelEfficiency?.toString() || '',
        lastOilChange: formatDate(vehicle.maintenanceInfo?.lastOilChange),
        nextOilChangeDue: vehicle.maintenanceInfo?.nextOilChangeDue?.toString() || '',
        lastTyreChange: formatDate(vehicle.maintenanceInfo?.lastTyreChange),
        lastBrakeService: formatDate(vehicle.maintenanceInfo?.lastBrakeService),
        lastFullService: formatDate(vehicle.maintenanceInfo?.lastFullService),
        insuranceExpiry: formatDate(vehicle.maintenanceInfo?.insuranceExpiry),
        registrationExpiry: formatDate(vehicle.maintenanceInfo?.registrationExpiry),
        pollutionCertExpiry: formatDate(vehicle.maintenanceInfo?.pollutionCertExpiry),
        tireHealthFL: vehicle.tireHealth?.fl?.toString() || '100',
        tireHealthFR: vehicle.tireHealth?.fr?.toString() || '100',
        tireHealthRL: vehicle.tireHealth?.rl?.toString() || '100',
        tireHealthRR: vehicle.tireHealth?.rr?.toString() || '100',
        fuelLevel: vehicle.sensors?.fuelLevel?.toString() || '',
        engineTemp: vehicle.sensors?.engineTemp?.toString() || '',
        oilPressure: vehicle.sensors?.oilPressure?.toString() || '',
        batteryVoltage: vehicle.sensors?.batteryVoltage?.toString() || '',
        brakeWear: vehicle.sensors?.brakeWear?.toString() || '',
        coolantLevel: vehicle.sensors?.coolantLevel?.toString() || '',
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const parseDate = (dateStr: string): Date | undefined => {
        if (!dateStr) return undefined;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? undefined : d;
      };

      const maintenanceInfo: MaintenanceInfo = {
        lastOilChange: parseDate(formData.lastOilChange),
        nextOilChangeDue: formData.nextOilChangeDue ? parseInt(formData.nextOilChangeDue) : undefined,
        lastTyreChange: parseDate(formData.lastTyreChange),
        lastBrakeService: parseDate(formData.lastBrakeService),
        lastFullService: parseDate(formData.lastFullService),
        insuranceExpiry: parseDate(formData.insuranceExpiry),
        registrationExpiry: parseDate(formData.registrationExpiry),
        pollutionCertExpiry: parseDate(formData.pollutionCertExpiry),
      };

      const tireHealth: TireHealth = {
        fl: parseInt(formData.tireHealthFL) || 100,
        fr: parseInt(formData.tireHealthFR) || 100,
        rl: parseInt(formData.tireHealthRL) || 100,
        rr: parseInt(formData.tireHealthRR) || 100,
        lastChecked: new Date(),
      };

      const updates: Partial<Vehicle> = {
        name: formData.name,
        licensePlate: formData.licensePlate,
        manufacturer: formData.manufacturer,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : undefined,
        engineNumber: formData.engineNumber,
        chassisNumber: formData.chassisNumber,
        fuelType: formData.fuelType,
        mileage: parseInt(formData.mileage) || vehicle.mileage,
        fuelEfficiency: parseFloat(formData.fuelEfficiency) || vehicle.fuelEfficiency,
        maintenanceInfo,
        tireHealth,
        sensors: {
          ...vehicle.sensors,
          fuelLevel: parseFloat(formData.fuelLevel) || vehicle.sensors.fuelLevel,
          engineTemp: parseFloat(formData.engineTemp) || vehicle.sensors.engineTemp,
          oilPressure: parseFloat(formData.oilPressure) || vehicle.sensors.oilPressure,
          batteryVoltage: parseFloat(formData.batteryVoltage) || vehicle.sensors.batteryVoltage,
          brakeWear: formData.brakeWear ? parseFloat(formData.brakeWear) : vehicle.sensors.brakeWear,
          coolantLevel: formData.coolantLevel ? parseFloat(formData.coolantLevel) : vehicle.sensors.coolantLevel,
        },
        // Preserve existing trips and alerts
        trips: vehicle.trips || [],
        alerts: vehicle.alerts || [],
        lastUpdated: new Date(),
      };

      console.log('[EditVehicleModal] Updating vehicle with:', updates);
      await updateVehicle(vehicle.id, updates);
      console.log('[EditVehicleModal] Vehicle updated successfully');
      setMessage({ type: 'success', text: 'Vehicle updated successfully!' });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Failed to update vehicle. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Edit Vehicle - {vehicle.name}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('basic')}
            className={cn(
              'px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2',
              activeTab === 'basic' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            <Car className="w-4 h-4" />
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={cn(
              'px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2',
              activeTab === 'maintenance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            <Wrench className="w-4 h-4" />
            Maintenance
          </button>
          <button
            onClick={() => setActiveTab('sensors')}
            className={cn(
              'px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2',
              activeTab === 'sensors' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            <Gauge className="w-4 h-4" />
            Sensors & Health
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {message && (
              <div className={cn(
                'p-3 rounded-lg mb-4 flex items-center gap-2',
                message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              )}>
                {message.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">License Plate *</label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Manufacturer</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                      placeholder="e.g., Tata, Ashok Leyland"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                      placeholder="e.g., Prima, Dost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Engine Number</label>
                    <input
                      type="text"
                      value={formData.engineNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, engineNumber: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Chassis Number</label>
                    <input
                      type="text"
                      value={formData.chassisNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, chassisNumber: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuel Type</label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mileage (km)</label>
                    <input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuel Efficiency (km/L)</label>
                    <input
                      type="number"
                      value={formData.fuelEfficiency}
                      onChange={(e) => setFormData(prev => ({ ...prev, fuelEfficiency: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Service History</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Oil Change</label>
                    <input
                      type="date"
                      value={formData.lastOilChange}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastOilChange: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Next Oil Change Due (km)</label>
                    <input
                      type="number"
                      value={formData.nextOilChangeDue}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextOilChangeDue: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Tyre Change</label>
                    <input
                      type="date"
                      value={formData.lastTyreChange}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastTyreChange: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Brake Service</label>
                    <input
                      type="date"
                      value={formData.lastBrakeService}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastBrakeService: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Last Full Service</label>
                  <input
                    type="date"
                    value={formData.lastFullService}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastFullService: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                  />
                </div>

                <h3 className="font-medium text-sm text-muted-foreground pt-4">Documents & Expiry</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Insurance Expiry</label>
                    <input
                      type="date"
                      value={formData.insuranceExpiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Registration Expiry</label>
                    <input
                      type="date"
                      value={formData.registrationExpiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationExpiry: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pollution Certificate</label>
                    <input
                      type="date"
                      value={formData.pollutionCertExpiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, pollutionCertExpiry: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sensors & Health Tab */}
            {activeTab === 'sensors' && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Tire Health (%)</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Front Left</label>
                    <input
                      type="number"
                      value={formData.tireHealthFL}
                      onChange={(e) => setFormData(prev => ({ ...prev, tireHealthFL: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Front Right</label>
                    <input
                      type="number"
                      value={formData.tireHealthFR}
                      onChange={(e) => setFormData(prev => ({ ...prev, tireHealthFR: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rear Left</label>
                    <input
                      type="number"
                      value={formData.tireHealthRL}
                      onChange={(e) => setFormData(prev => ({ ...prev, tireHealthRL: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rear Right</label>
                    <input
                      type="number"
                      value={formData.tireHealthRR}
                      onChange={(e) => setFormData(prev => ({ ...prev, tireHealthRR: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <h3 className="font-medium text-sm text-muted-foreground pt-4">Sensor Readings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuel Level (%)</label>
                    <input
                      type="number"
                      value={formData.fuelLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, fuelLevel: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Engine Temp (°C)</label>
                    <input
                      type="number"
                      value={formData.engineTemp}
                      onChange={(e) => setFormData(prev => ({ ...prev, engineTemp: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Oil Pressure (PSI)</label>
                    <input
                      type="number"
                      value={formData.oilPressure}
                      onChange={(e) => setFormData(prev => ({ ...prev, oilPressure: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Battery Voltage (V)</label>
                    <input
                      type="number"
                      value={formData.batteryVoltage}
                      onChange={(e) => setFormData(prev => ({ ...prev, batteryVoltage: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Brake Wear (%)</label>
                    <input
                      type="number"
                      value={formData.brakeWear}
                      onChange={(e) => setFormData(prev => ({ ...prev, brakeWear: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Coolant Level (%)</label>
                    <input
                      type="number"
                      value={formData.coolantLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, coolantLevel: e.target.value }))}
                      className="w-full px-3 py-2 bg-secondary rounded-lg border border-border focus:border-primary outline-none font-mono"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
