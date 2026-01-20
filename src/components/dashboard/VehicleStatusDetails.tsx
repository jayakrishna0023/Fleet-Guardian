import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/context/DataContext';
import { Vehicle } from '@/types/vehicle';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Wrench,
  ThermometerSun,
  Droplets,
  Battery,
  Gauge,
  Fuel,
  Clock,
  ChevronRight,
  Car,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VehicleStatusDetailsProps {
  onVehicleSelect: (vehicleId: string) => void;
}

interface VehicleIssue {
  vehicle: Vehicle;
  issues: {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    value?: string;
    icon: any;
  }[];
}

export const VehicleStatusDetails = ({ onVehicleSelect }: VehicleStatusDetailsProps) => {
  const { vehicles } = useData();

  // Analyze each vehicle and find specific issues
  const vehicleIssues = useMemo((): VehicleIssue[] => {
    const issues: VehicleIssue[] = [];

    vehicles.forEach(vehicle => {
      const vehicleProblems: VehicleIssue['issues'] = [];

      // Check Health Score
      if (vehicle.healthScore < 40) {
        vehicleProblems.push({
          type: 'Health Score Critical',
          severity: 'critical',
          message: `Health score dangerously low at ${vehicle.healthScore}%`,
          value: `${vehicle.healthScore}%`,
          icon: Activity,
        });
      } else if (vehicle.healthScore < 70) {
        vehicleProblems.push({
          type: 'Low Health Score',
          severity: 'warning',
          message: `Health score below optimal at ${vehicle.healthScore}%`,
          value: `${vehicle.healthScore}%`,
          icon: Activity,
        });
      }

      // Check Engine Temperature
      const engineTemp = vehicle.sensors?.engineTemp ?? vehicle.engineTemperature ?? 85;
      if (engineTemp > 105) {
        vehicleProblems.push({
          type: 'Engine Overheating',
          severity: 'critical',
          message: `Engine temperature critically high at ${engineTemp}°C - Risk of engine damage`,
          value: `${engineTemp}°C`,
          icon: ThermometerSun,
        });
      } else if (engineTemp > 95) {
        vehicleProblems.push({
          type: 'High Engine Temperature',
          severity: 'warning',
          message: `Engine running hot at ${engineTemp}°C - Check cooling system`,
          value: `${engineTemp}°C`,
          icon: ThermometerSun,
        });
      }

      // Check Oil Pressure
      const oilPressure = vehicle.sensors?.oilPressure ?? 40;
      if (oilPressure < 20) {
        vehicleProblems.push({
          type: 'Critical Oil Pressure',
          severity: 'critical',
          message: `Oil pressure dangerously low at ${oilPressure} PSI - Stop vehicle immediately`,
          value: `${oilPressure} PSI`,
          icon: Droplets,
        });
      } else if (oilPressure < 30) {
        vehicleProblems.push({
          type: 'Low Oil Pressure',
          severity: 'warning',
          message: `Oil pressure below normal at ${oilPressure} PSI - Check oil level`,
          value: `${oilPressure} PSI`,
          icon: Droplets,
        });
      }

      // Check Battery Voltage
      const batteryVoltage = vehicle.sensors?.batteryVoltage ?? 12.5;
      if (batteryVoltage < 11.5) {
        vehicleProblems.push({
          type: 'Battery Critical',
          severity: 'critical',
          message: `Battery voltage critically low at ${batteryVoltage}V - May not start`,
          value: `${batteryVoltage}V`,
          icon: Battery,
        });
      } else if (batteryVoltage < 12.2) {
        vehicleProblems.push({
          type: 'Low Battery',
          severity: 'warning',
          message: `Battery voltage low at ${batteryVoltage}V - Check charging system`,
          value: `${batteryVoltage}V`,
          icon: Battery,
        });
      }

      // Check Fuel Level
      const fuelLevel = vehicle.sensors?.fuelLevel ?? 50;
      if (fuelLevel < 10) {
        vehicleProblems.push({
          type: 'Fuel Critical',
          severity: 'critical',
          message: `Fuel level critically low at ${fuelLevel}% - Refuel immediately`,
          value: `${fuelLevel}%`,
          icon: Fuel,
        });
      } else if (fuelLevel < 20) {
        vehicleProblems.push({
          type: 'Low Fuel',
          severity: 'warning',
          message: `Fuel level low at ${fuelLevel}% - Plan refueling`,
          value: `${fuelLevel}%`,
          icon: Fuel,
        });
      }

      // Check Tire Pressure (if any tire is low)
      if (vehicle.sensors?.tirePressure) {
        const tires = vehicle.sensors.tirePressure;
        const lowTires: string[] = [];
        if (tires.fl < 28) lowTires.push('Front Left');
        if (tires.fr < 28) lowTires.push('Front Right');
        if (tires.rl < 28) lowTires.push('Rear Left');
        if (tires.rr < 28) lowTires.push('Rear Right');
        
        if (lowTires.length > 0) {
          vehicleProblems.push({
            type: 'Low Tire Pressure',
            severity: lowTires.length > 2 ? 'critical' : 'warning',
            message: `Low tire pressure in: ${lowTires.join(', ')}`,
            value: `${lowTires.length} tire(s)`,
            icon: Gauge,
          });
        }
      }

      // Check Fuel Efficiency
      if (vehicle.fuelEfficiency < 5) {
        vehicleProblems.push({
          type: 'Poor Fuel Efficiency',
          severity: 'warning',
          message: `Fuel efficiency very low at ${vehicle.fuelEfficiency} km/L - Check engine/driving pattern`,
          value: `${vehicle.fuelEfficiency} km/L`,
          icon: TrendingDown,
        });
      }

      // Check Maintenance Status
      if (vehicle.status === 'maintenance') {
        vehicleProblems.push({
          type: 'In Maintenance',
          severity: 'info',
          message: 'Vehicle currently undergoing maintenance',
          icon: Wrench,
        });
      }

      // Check if next maintenance is overdue (based on mileage)
      if (vehicle.mileage > 50000 && !vehicle.lastMaintenance) {
        vehicleProblems.push({
          type: 'Maintenance Overdue',
          severity: 'warning',
          message: `High mileage (${vehicle.mileage.toLocaleString()} km) without recent service record`,
          value: `${vehicle.mileage.toLocaleString()} km`,
          icon: Wrench,
        });
      }

      if (vehicleProblems.length > 0) {
        issues.push({
          vehicle,
          issues: vehicleProblems.sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          }),
        });
      }
    });

    // Sort vehicles by most critical first
    return issues.sort((a, b) => {
      const aMaxSeverity = a.issues[0]?.severity || 'info';
      const bMaxSeverity = b.issues[0]?.severity || 'info';
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[aMaxSeverity] - severityOrder[bMaxSeverity];
    });
  }, [vehicles]);

  // Separate by severity
  const criticalVehicles = vehicleIssues.filter(v => 
    v.issues.some(i => i.severity === 'critical')
  );
  const warningVehicles = vehicleIssues.filter(v => 
    !v.issues.some(i => i.severity === 'critical') && 
    v.issues.some(i => i.severity === 'warning')
  );

  const severityConfig = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500',
      icon: XCircle,
    },
    warning: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-500',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-500',
      icon: AlertOctagon,
    },
  };

  if (vehicleIssues.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
        <h3 className="text-xl font-semibold mb-2">All Vehicles Healthy!</h3>
        <p className="text-muted-foreground">
          No issues detected across your fleet. All systems operating normally.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Vehicles Section */}
      {criticalVehicles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertOctagon className="w-6 h-6 text-red-500" />
            </motion.div>
            <h3 className="text-lg font-semibold text-red-500">
              Critical Issues ({criticalVehicles.length} vehicle{criticalVehicles.length > 1 ? 's' : ''})
            </h3>
          </div>
          <div className="space-y-3">
            {criticalVehicles.map((item, index) => (
              <VehicleIssueCard
                key={item.vehicle.id}
                item={item}
                index={index}
                onVehicleSelect={onVehicleSelect}
                severityConfig={severityConfig}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Warning Vehicles Section */}
      {warningVehicles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-orange-500">
              Warnings ({warningVehicles.length} vehicle{warningVehicles.length > 1 ? 's' : ''})
            </h3>
          </div>
          <div className="space-y-3">
            {warningVehicles.map((item, index) => (
              <VehicleIssueCard
                key={item.vehicle.id}
                item={item}
                index={index}
                onVehicleSelect={onVehicleSelect}
                severityConfig={severityConfig}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Individual Vehicle Issue Card
const VehicleIssueCard = ({ 
  item, 
  index, 
  onVehicleSelect,
  severityConfig 
}: { 
  item: VehicleIssue; 
  index: number; 
  onVehicleSelect: (id: string) => void;
  severityConfig: any;
}) => {
  const maxSeverity = item.issues[0]?.severity || 'info';
  const config = severityConfig[maxSeverity];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass-panel p-4 border-l-4 ${config.border} hover:bg-muted/50 transition-all cursor-pointer`}
      onClick={() => onVehicleSelect(item.vehicle.id)}
    >
      {/* Vehicle Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <Car className={`w-5 h-5 ${config.text}`} />
          </div>
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {item.vehicle.name}
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                {maxSeverity.toUpperCase()}
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              {item.vehicle.licensePlate} • {item.vehicle.type} • Health: {item.vehicle.healthScore}%
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1">
          View Details
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Issues List */}
      <div className="space-y-2 ml-12">
        {item.issues.map((issue, issueIndex) => {
          const IssueIcon = issue.icon;
          const issueConfig = severityConfig[issue.severity];
          
          return (
            <motion.div
              key={issueIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index * 0.1) + (issueIndex * 0.05) }}
              className={`flex items-start gap-3 p-2 rounded-lg ${issueConfig.bg}`}
            >
              <IssueIcon className={`w-4 h-4 mt-0.5 ${issueConfig.text} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${issueConfig.text}`}>
                    {issue.type}
                  </span>
                  {issue.value && (
                    <span className="text-xs font-mono bg-background/50 px-2 py-0.5 rounded">
                      {issue.value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{issue.message}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default VehicleStatusDetails;
