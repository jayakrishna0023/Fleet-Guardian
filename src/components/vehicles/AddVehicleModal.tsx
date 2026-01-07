import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Car,
  Bus,
  Truck,
  X,
  CheckCircle,
  Clock,
  Loader2,
  FileText,
  Calendar,
  Hash,
  Activity,
  Gauge,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AddVehicleFormData {
  name: string;
  type: 'bus' | 'truck' | 'van' | 'car';
  licensePlate: string;
  manufacturer: string;
  model: string;
  year: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  mileage: string;
  fuelEfficiency: string;
  engineTemp: string;
  oilPressure: string;
  batteryVoltage: string;
  tirePressure: string;
}

export const AddVehicleModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { submitVehicleRequest, vehicleRequests } = useData();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [formSection, setFormSection] = useState<'basic' | 'specs' | 'status'>('basic');

  const [formData, setFormData] = useState<AddVehicleFormData>({
    name: '',
    type: 'van',
    licensePlate: '',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'diesel',
    mileage: '0',
    fuelEfficiency: '10',
    engineTemp: '85',
    oilPressure: '40',
    batteryVoltage: '12.6',
    tirePressure: '32',
  });

  const userRequests = vehicleRequests.filter(r => r.requestedBy === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const result = await submitVehicleRequest({
      name: formData.name,
      type: formData.type,
      licensePlate: formData.licensePlate.toUpperCase(),
      manufacturer: formData.manufacturer,
      model: formData.model,
      year: parseInt(formData.year),
      fuelType: formData.fuelType,
      mileage: parseFloat(formData.mileage),
      fuelEfficiency: parseFloat(formData.fuelEfficiency),
      initialSensors: {
        engineTemp: parseFloat(formData.engineTemp),
        oilPressure: parseFloat(formData.oilPressure),
        batteryVoltage: parseFloat(formData.batteryVoltage),
        tirePressure: parseFloat(formData.tirePressure),
      }
    });

    setIsLoading(false);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setFormData({
        name: '',
        type: 'van',
        licensePlate: '',
        manufacturer: '',
        model: '',
        year: new Date().getFullYear().toString(),
        fuelType: 'diesel',
        mileage: '0',
        fuelEfficiency: '10',
        engineTemp: '85',
        oilPressure: '40',
        batteryVoltage: '12.6',
        tirePressure: '32',
      });
      setFormSection('basic');

      if (user?.role !== 'admin') {
        setActiveTab('history');
      }
    }
  };

  const typeOptions = [
    { value: 'bus', label: 'Bus', icon: Bus },
    { value: 'truck', label: 'Truck', icon: Truck },
    { value: 'van', label: 'Van', icon: Car },
    { value: 'car', label: 'Car', icon: Car },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden glass-panel animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New Vehicle</h2>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'admin'
                  ? 'Add directly to fleet'
                  : 'Submit request for admin approval'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        {user?.role !== 'admin' && (
          <div className="flex gap-1 p-2 mx-6 mt-4 bg-secondary/50 rounded-lg w-fit shrink-0">
            <button
              onClick={() => setActiveTab('form')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === 'form'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              New Request
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              My Requests ({userRequests.length})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {message && (
            <div className={cn(
              'flex items-center gap-2 p-4 rounded-lg mb-6',
              message.type === 'success'
                ? 'bg-success/10 border border-success/30 text-success'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
            )}>
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {message.text}
            </div>
          )}

          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Form Section Tabs */}
              <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-2">
                <button
                  type="button"
                  onClick={() => setFormSection('basic')}
                  className={cn("px-3 py-1 text-sm font-medium rounded-md transition-colors", formSection === 'basic' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('specs')}
                  className={cn("px-3 py-1 text-sm font-medium rounded-md transition-colors", formSection === 'specs' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  Technical Specs
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('status')}
                  className={cn("px-3 py-1 text-sm font-medium rounded-md transition-colors", formSection === 'status' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  Initial Status
                </button>
              </div>

              {formSection === 'basic' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Vehicle Type</label>
                    <div className="grid grid-cols-4 gap-3">
                      {typeOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: option.value as any })}
                            className={cn(
                              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                              formData.type === option.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border/50 hover:border-primary/50'
                            )}
                          >
                            <Icon className="w-8 h-8" />
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vehicle Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Vehicle Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Delivery Van 01"
                      className="w-full h-12 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>

                  {/* License Plate */}
                  <div>
                    <label className="block text-sm font-medium mb-2">License Plate</label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                      placeholder="e.g., ABC-1234"
                      className="w-full h-12 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono uppercase"
                      required
                    />
                  </div>
                </div>
              )}

              {formSection === 'specs' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Manufacturer & Model */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Manufacturer</label>
                      <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="e.g., Ford"
                        className="w-full h-12 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Model</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g., Transit"
                        className="w-full h-12 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Year */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Year</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        className="w-full h-12 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    {/* Fuel Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Fuel Type</label>
                      <select
                        value={formData.fuelType}
                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                        className="w-full h-12 px-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="diesel">Diesel</option>
                        <option value="petrol">Petrol</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="cng">CNG</option>
                      </select>
                    </div>
                  </div>

                  {/* Fuel Efficiency */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Expected Efficiency ({formData.fuelType === 'electric' ? 'km/kWh' : 'km/l'})</label>
                    <div className="relative">
                      <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.1"
                        value={formData.fuelEfficiency}
                        onChange={(e) => setFormData({ ...formData, fuelEfficiency: e.target.value })}
                        className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Important for anomaly detection</p>
                  </div>
                </div>
              )}

              {formSection === 'status' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Mileage */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Mileage (km)</label>
                    <div className="relative">
                      <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="number"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/20 rounded-xl border border-border/50">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Initial Sensor Readings
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Engine Temp (°C)</label>
                        <input
                          type="number"
                          value={formData.engineTemp}
                          onChange={(e) => setFormData({ ...formData, engineTemp: e.target.value })}
                          className="w-full h-10 px-3 bg-secondary/50 border border-border/50 rounded-md text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Oil Pressure (psi)</label>
                        <input
                          type="number"
                          value={formData.oilPressure}
                          onChange={(e) => setFormData({ ...formData, oilPressure: e.target.value })}
                          className="w-full h-10 px-3 bg-secondary/50 border border-border/50 rounded-md text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Battery (V)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.batteryVoltage}
                          onChange={(e) => setFormData({ ...formData, batteryVoltage: e.target.value })}
                          className="w-full h-10 px-3 bg-secondary/50 border border-border/50 rounded-md text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tire Pressure (psi)</label>
                        <input
                          type="number"
                          value={formData.tirePressure}
                          onChange={(e) => setFormData({ ...formData, tirePressure: e.target.value })}
                          className="w-full h-10 px-3 bg-secondary/50 border border-border/50 rounded-md text-sm mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>

                {formSection !== 'status' ? (
                  <Button
                    type="button"
                    onClick={() => setFormSection(formSection === 'basic' ? 'specs' : 'status')}
                    className="flex-1"
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading} className="flex-1 gradient-primary">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        {user?.role === 'admin' ? 'Add Vehicle' : 'Submit Request'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {userRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No requests submitted yet</p>
                </div>
              ) : (
                userRequests.map(request => (
                  <div key={request.id} className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{request.vehicleData.name}</h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {request.vehicleData.licensePlate}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                        request.status === 'approved' && 'bg-success/20 text-success',
                        request.status === 'pending' && 'bg-warning/20 text-warning',
                        request.status === 'rejected' && 'bg-destructive/20 text-destructive'
                      )}>
                        {request.status === 'pending' && <Clock className="w-3 h-3" />}
                        {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {request.status}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(request.requestedAt, 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        {request.vehicleData.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
