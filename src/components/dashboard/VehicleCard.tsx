import { Vehicle } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { HealthGauge } from './HealthGauge';
import { motion } from 'framer-motion';
import {
  Bus,
  Truck,
  Car,
  Thermometer,
  Fuel,
  Gauge,
  Wrench,
  ChevronRight,
  Zap
} from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  selected?: boolean;
}

export const VehicleCard = ({ vehicle, onClick, selected }: VehicleCardProps) => {
  const typeIcons = {
    bus: Bus,
    truck: Truck,
    van: Car,
    car: Car,
  };

  const TypeIcon = typeIcons[vehicle.type];

  const statusConfig = {
    operational: {
      dotClass: 'bg-success',
      label: 'Operational',
      glowColor: 'rgba(34, 197, 94, 0.3)',
    },
    healthy: {
      dotClass: 'bg-success',
      label: 'Operational',
      glowColor: 'rgba(34, 197, 94, 0.3)',
    },
    warning: {
      dotClass: 'bg-warning',
      label: 'Needs Attention',
      glowColor: 'rgba(234, 179, 8, 0.3)',
    },
    critical: {
      dotClass: 'bg-destructive animate-pulse',
      label: 'Critical',
      glowColor: 'rgba(239, 68, 68, 0.4)',
    },
    maintenance: {
      dotClass: 'bg-muted-foreground',
      label: 'In Maintenance',
      glowColor: 'rgba(100, 116, 139, 0.2)',
    },
    'out-of-service': {
      dotClass: 'bg-muted-foreground',
      label: 'Out of Service',
      glowColor: 'rgba(100, 116, 139, 0.2)',
    },
  };

  const config = statusConfig[vehicle.status] || statusConfig.operational;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        boxShadow: `0 20px 40px -15px ${config.glowColor}`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'w-full glass-panel p-4 text-left transition-all duration-300',
        selected && 'border-primary bg-primary/5 ring-1 ring-primary/20',
        'group relative overflow-hidden',
        vehicle.status === 'critical' && 'border-destructive/50'
      )}
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={false}
      />

      {/* Animated scan line on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Corner accent for critical vehicles */}
      {vehicle.status === 'critical' && (
        <motion.div
          className="absolute top-0 right-0 w-12 h-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-destructive/30 border-l-[40px] border-l-transparent" />
          <motion.div
            className="absolute top-1 right-1"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-destructive" />
          </motion.div>
        </motion.div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2 rounded-lg bg-secondary group-hover:bg-primary/20 transition-colors duration-300"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <TypeIcon className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{vehicle.licensePlate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div 
              className={cn('w-2.5 h-2.5 rounded-full', config.dotClass)}
              animate={vehicle.status === 'critical' ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        </div>

        {vehicle.status !== 'maintenance' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <HealthGauge score={vehicle.healthScore} size="sm" label="Health" />

              <div className="flex-1 ml-4 space-y-2">
                <motion.div 
                  className="flex items-center justify-between text-sm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Thermometer className="w-3.5 h-3.5" />
                    Temp
                  </span>
                  <span className={cn(
                    'font-mono',
                    (vehicle.sensors?.engineTemp ?? vehicle.engineTemperature ?? 0) > 100 && 'text-warning',
                    (vehicle.sensors?.engineTemp ?? vehicle.engineTemperature ?? 0) > 110 && 'text-destructive'
                  )}>
                    {(vehicle.sensors?.engineTemp ?? vehicle.engineTemperature ?? 0).toFixed(0)}°C
                  </span>
                </motion.div>

                <motion.div 
                  className="flex items-center justify-between text-sm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Fuel className="w-3.5 h-3.5" />
                    Efficiency
                  </span>
                  <span className="font-mono">{(vehicle.fuelEfficiency ?? 0).toFixed(1)} km/L</span>
                </motion.div>

                <motion.div 
                  className="flex items-center justify-between text-sm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="w-3.5 h-3.5" />
                    Mileage
                  </span>
                  <span className="font-mono">{(vehicle.mileage ?? 0).toLocaleString()} km</span>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last updated: Just now</span>
              <motion.div
                className="opacity-0 group-hover:opacity-100"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </div>
          </>
        ) : (
          <motion.div 
            className="flex items-center justify-center py-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Wrench className="w-5 h-5 mr-2" />
            </motion.div>
            <span>Currently in maintenance</span>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};
