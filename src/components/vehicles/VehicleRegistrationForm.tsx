import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  Car,
  Truck,
  Bus,
  CircleDot,
  Fuel,
  Calendar,
  Hash,
  User,
  Building2,
  Gauge,
  Thermometer,
  Battery,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleRequest } from '@/types/auth';

type VehicleType = 'bus' | 'truck' | 'van' | 'car';
type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';

interface FormData {
  name: string;
  type: VehicleType;
  licensePlate: string;
  manufacturer: string;
  model: string;
  year: number;
  fuelType: FuelType;
  mileage: number;
  fuelEfficiency: number;
  engineNumber?: string;
  chassisNumber?: string;
  initialSensors: {
    engineTemp: number;
    oilPressure: number;
    batteryVoltage: number;
    tirePressure: number;
  };
}

const vehicleTypes: { type: VehicleType; label: string; icon: React.ElementType }[] = [
  { type: 'car', label: 'Car', icon: Car },
  { type: 'van', label: 'Van', icon: Car },
  { type: 'truck', label: 'Truck', icon: Truck },
  { type: 'bus', label: 'Bus', icon: Bus },
];

const fuelTypes: { type: FuelType; label: string }[] = [
  { type: 'petrol', label: 'Petrol' },
  { type: 'diesel', label: 'Diesel' },
  { type: 'electric', label: 'Electric' },
  { type: 'hybrid', label: 'Hybrid' },
  { type: 'cng', label: 'CNG' },
];

interface VehicleRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const VehicleRegistrationForm = ({ onSuccess, onCancel }: VehicleRegistrationFormProps) => {
  const { toast } = useToast();
  const { submitVehicleRequest } = useData();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'car',
    licensePlate: '',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'petrol',
    mileage: 0,
    fuelEfficiency: 15,
    engineNumber: '',
    chassisNumber: '',
    initialSensors: {
      engineTemp: 75,
      oilPressure: 40,
      batteryVoltage: 12.8,
      tirePressure: 32,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vehicle name is required';
    }
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    } else if (!/^[A-Z0-9-]+$/i.test(formData.licensePlate)) {
      newErrors.licensePlate = 'Invalid license plate format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Invalid year';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const vehicleData: VehicleRequest['vehicleData'] = {
        name: formData.name,
        type: formData.type,
        licensePlate: formData.licensePlate.toUpperCase(),
        manufacturer: formData.manufacturer,
        model: formData.model,
        year: formData.year,
        fuelType: formData.fuelType,
        mileage: formData.mileage,
        fuelEfficiency: formData.fuelEfficiency,
        engineNumber: formData.engineNumber,
        chassisNumber: formData.chassisNumber,
        initialSensors: formData.initialSensors,
      };

      console.log('Submitting vehicle registration:', vehicleData);
      
      const result = await submitVehicleRequest(vehicleData);
      
      if (result.success) {
        toast({
          title: user?.role === 'admin' ? 'Vehicle Added!' : 'Registration Submitted!',
          description: result.message,
        });
        onSuccess?.();
      } else {
        toast({
          title: 'Registration Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Vehicle registration error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vehicle registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateSensor = (key: keyof FormData['initialSensors'], value: number) => {
    setFormData(prev => ({
      ...prev,
      initialSensors: { ...prev.initialSensors, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                step >= s
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  'w-16 h-1 mx-2 rounded-full transition-all',
                  step > s ? 'bg-primary' : 'bg-secondary'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">Basic Information</h3>
            <p className="text-muted-foreground text-sm">Enter vehicle identification details</p>
          </div>

          {/* Vehicle Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              Vehicle Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Delivery Van 01"
              className={cn(
                'w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                errors.name && 'border-destructive'
              )}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* License Plate */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              License Plate
            </label>
            <input
              type="text"
              value={formData.licensePlate}
              onChange={(e) => updateField('licensePlate', e.target.value.toUpperCase())}
              placeholder="e.g., AP-09-AB-1234"
              className={cn(
                'w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase',
                errors.licensePlate && 'border-destructive'
              )}
            />
            {errors.licensePlate && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.licensePlate}
              </p>
            )}
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-primary" />
              Vehicle Type
            </label>
            <div className="grid grid-cols-4 gap-3">
              {vehicleTypes.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField('type', type)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                    formData.type === type
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className={cn('w-6 h-6', formData.type === type ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Details */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">Vehicle Details</h3>
            <p className="text-muted-foreground text-sm">Provide manufacturer and specifications</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Manufacturer */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => updateField('manufacturer', e.target.value)}
                placeholder="e.g., Toyota"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                  errors.manufacturer && 'border-destructive'
                )}
              />
              {errors.manufacturer && (
                <p className="text-xs text-destructive">{errors.manufacturer}</p>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="e.g., Innova"
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                  errors.model && 'border-destructive'
                )}
              />
              {errors.model && (
                <p className="text-xs text-destructive">{errors.model}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => updateField('year', parseInt(e.target.value) || new Date().getFullYear())}
                min={1990}
                max={new Date().getFullYear() + 1}
                className={cn(
                  'w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
                  errors.year && 'border-destructive'
                )}
              />
            </div>

            {/* Mileage */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                Mileage (km)
              </label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => updateField('mileage', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Fuel className="w-4 h-4 text-primary" />
              Fuel Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {fuelTypes.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField('fuelType', type)}
                  className={cn(
                    'px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium',
                    formData.fuelType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 text-muted-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Engine & Chassis Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Engine Number (Optional)</label>
              <input
                type="text"
                value={formData.engineNumber}
                onChange={(e) => updateField('engineNumber', e.target.value)}
                placeholder="Engine number"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Chassis Number (Optional)</label>
              <input
                type="text"
                value={formData.chassisNumber}
                onChange={(e) => updateField('chassisNumber', e.target.value)}
                placeholder="Chassis number"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Initial Sensor Data */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">Initial Sensor Data</h3>
            <p className="text-muted-foreground text-sm">Set initial readings (optional - defaults will be used)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Engine Temp */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Engine Temp (°C)
              </label>
              <input
                type="number"
                value={formData.initialSensors.engineTemp}
                onChange={(e) => updateSensor('engineTemp', parseInt(e.target.value) || 75)}
                min={0}
                max={150}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>

            {/* Oil Pressure */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Gauge className="w-4 h-4 text-yellow-500" />
                Oil Pressure (PSI)
              </label>
              <input
                type="number"
                value={formData.initialSensors.oilPressure}
                onChange={(e) => updateSensor('oilPressure', parseInt(e.target.value) || 40)}
                min={0}
                max={100}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>

            {/* Battery Voltage */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Battery className="w-4 h-4 text-green-500" />
                Battery (V)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.initialSensors.batteryVoltage}
                onChange={(e) => updateSensor('batteryVoltage', parseFloat(e.target.value) || 12.8)}
                min={10}
                max={15}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>

            {/* Tire Pressure */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-blue-500" />
                Tire Pressure (PSI)
              </label>
              <input
                type="number"
                value={formData.initialSensors.tirePressure}
                onChange={(e) => updateSensor('tirePressure', parseInt(e.target.value) || 32)}
                min={20}
                max={50}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Summary Card */}
          <div className="glass-panel p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Registration Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Vehicle:</span>{' '}
                <span className="font-medium">{formData.name || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plate:</span>{' '}
                <span className="font-medium">{formData.licensePlate || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="font-medium capitalize">{formData.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Model:</span>{' '}
                <span className="font-medium">{formData.manufacturer} {formData.model}</span>
              </div>
            </div>
            
            {user?.role !== 'admin' && (
              <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-xs text-warning flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your request will be sent to admin for approval
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < 3 ? (
          <Button onClick={handleNext} className="gap-2">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {user?.role === 'admin' ? 'Add Vehicle' : 'Submit for Approval'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VehicleRegistrationForm;
