import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Vehicle } from '@/types/vehicle';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Car,
  Gauge,
  Fuel,
  Thermometer,
  Activity,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Battery,
  Timer,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ComparisonMetric {
  name: string;
  vehicle1: number;
  vehicle2: number;
  unit: string;
  higherIsBetter: boolean;
}

export const VehicleComparisonTool = () => {
  const { vehicles } = useData();
  const [vehicle1Id, setVehicle1Id] = useState<string>('');
  const [vehicle2Id, setVehicle2Id] = useState<string>('');

  const vehicle1 = useMemo(() => vehicles.find(v => v.id === vehicle1Id), [vehicles, vehicle1Id]);
  const vehicle2 = useMemo(() => vehicles.find(v => v.id === vehicle2Id), [vehicles, vehicle2Id]);

  // Calculate comparison metrics
  const comparisonData = useMemo(() => {
    if (!vehicle1 || !vehicle2) return null;

    const metrics: ComparisonMetric[] = [
      {
        name: 'Health Score',
        vehicle1: vehicle1.healthScore,
        vehicle2: vehicle2.healthScore,
        unit: '%',
        higherIsBetter: true,
      },
      {
        name: 'Fuel Efficiency',
        vehicle1: vehicle1.fuelEfficiency,
        vehicle2: vehicle2.fuelEfficiency,
        unit: 'km/L',
        higherIsBetter: true,
      },
      {
        name: 'Engine Temp',
        vehicle1: vehicle1.sensors?.engineTemp || vehicle1.engineTemperature || 80,
        vehicle2: vehicle2.sensors?.engineTemp || vehicle2.engineTemperature || 80,
        unit: '°C',
        higherIsBetter: false,
      },
      {
        name: 'Mileage',
        vehicle1: vehicle1.mileage / 1000,
        vehicle2: vehicle2.mileage / 1000,
        unit: 'K km',
        higherIsBetter: false, // Lower mileage = newer/less wear
      },
      {
        name: 'Battery',
        vehicle1: vehicle1.sensors?.batteryVoltage || 12.6,
        vehicle2: vehicle2.sensors?.batteryVoltage || 12.6,
        unit: 'V',
        higherIsBetter: true,
      },
      {
        name: 'Oil Pressure',
        vehicle1: vehicle1.sensors?.oilPressure || 40,
        vehicle2: vehicle2.sensors?.oilPressure || 40,
        unit: 'PSI',
        higherIsBetter: true,
      },
    ];

    // Calculate winner for each metric
    const results = metrics.map(m => {
      const diff = m.vehicle1 - m.vehicle2;
      let winner: 'vehicle1' | 'vehicle2' | 'tie' = 'tie';

      if (Math.abs(diff) > 0.1) {
        if (m.higherIsBetter) {
          winner = diff > 0 ? 'vehicle1' : 'vehicle2';
        } else {
          winner = diff < 0 ? 'vehicle1' : 'vehicle2';
        }
      }

      return { ...m, winner, diff };
    });

    return results;
  }, [vehicle1, vehicle2]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!vehicle1 || !vehicle2) return [];

    return [
      { 
        subject: 'Health',
        [vehicle1.name]: vehicle1.healthScore,
        [vehicle2.name]: vehicle2.healthScore,
        fullMark: 100,
      },
      { 
        subject: 'Efficiency',
        [vehicle1.name]: (vehicle1.fuelEfficiency / 15) * 100,
        [vehicle2.name]: (vehicle2.fuelEfficiency / 15) * 100,
        fullMark: 100,
      },
      { 
        subject: 'Battery',
        [vehicle1.name]: ((vehicle1.sensors?.batteryVoltage || 12.6) / 14.5) * 100,
        [vehicle2.name]: ((vehicle2.sensors?.batteryVoltage || 12.6) / 14.5) * 100,
        fullMark: 100,
      },
      { 
        subject: 'Oil Pressure',
        [vehicle1.name]: ((vehicle1.sensors?.oilPressure || 40) / 60) * 100,
        [vehicle2.name]: ((vehicle2.sensors?.oilPressure || 40) / 60) * 100,
        fullMark: 100,
      },
      { 
        subject: 'Fuel Level',
        [vehicle1.name]: vehicle1.sensors?.fuelLevel || 50,
        [vehicle2.name]: vehicle2.sensors?.fuelLevel || 50,
        fullMark: 100,
      },
      { 
        subject: 'Tire Health',
        [vehicle1.name]: vehicle1.tireHealth 
          ? (vehicle1.tireHealth.fl + vehicle1.tireHealth.fr + vehicle1.tireHealth.rl + vehicle1.tireHealth.rr) / 4
          : 75,
        [vehicle2.name]: vehicle2.tireHealth 
          ? (vehicle2.tireHealth.fl + vehicle2.tireHealth.fr + vehicle2.tireHealth.rl + vehicle2.tireHealth.rr) / 4
          : 75,
        fullMark: 100,
      },
    ];
  }, [vehicle1, vehicle2]);

  // Bar chart data
  const barData = useMemo(() => {
    if (!comparisonData) return [];
    return comparisonData.map(m => ({
      name: m.name,
      [vehicle1?.name || 'Vehicle 1']: m.vehicle1,
      [vehicle2?.name || 'Vehicle 2']: m.vehicle2,
    }));
  }, [comparisonData, vehicle1, vehicle2]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getWinnerIcon = (winner: 'vehicle1' | 'vehicle2' | 'tie') => {
    switch (winner) {
      case 'vehicle1': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'vehicle2': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const VehicleCard = ({ vehicle, label, color }: { vehicle: Vehicle | undefined; label: string; color: string }) => {
    if (!vehicle) {
      return (
        <Card className="glass-panel h-full">
          <CardContent className="p-6 flex items-center justify-center h-full min-h-[200px]">
            <p className="text-muted-foreground">Select a vehicle to compare</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("glass-panel border-2", `border-${color}-500/30`)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn(`border-${color}-500 text-${color}-500`)}>
                {label}
              </Badge>
              <div className="flex items-center gap-1">
                {getStatusIcon(vehicle.status)}
                <span className="text-sm capitalize">{vehicle.status}</span>
              </div>
            </div>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              {vehicle.name}
            </CardTitle>
            <CardDescription>{vehicle.licensePlate}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gauge className="w-3 h-3" /> Health Score
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={vehicle.healthScore} className="h-2 flex-1" />
                  <span className="text-sm font-mono">{vehicle.healthScore}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Fuel className="w-3 h-3" /> Fuel Efficiency
                </p>
                <p className="text-lg font-bold">{vehicle.fuelEfficiency.toFixed(1)} <span className="text-xs font-normal">km/L</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> Engine Temp
                </p>
                <p className="text-lg font-bold">{vehicle.sensors?.engineTemp || vehicle.engineTemperature || 80}°C</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Mileage
                </p>
                <p className="text-lg font-bold">{(vehicle.mileage / 1000).toFixed(0)}K km</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Battery className="w-3 h-3" /> Battery
                </p>
                <p className="text-lg font-bold">{vehicle.sensors?.batteryVoltage?.toFixed(1) || '12.6'}V</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Trips
                </p>
                <p className="text-lg font-bold">{vehicle.trips?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Vehicle Comparison
          </h2>
          <p className="text-muted-foreground">Compare performance metrics between two vehicles</p>
        </div>
      </div>

      {/* Vehicle Selectors */}
      <Card className="glass-panel">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Vehicle 1</label>
              <Select value={vehicle1Id} onValueChange={setVehicle1Id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select first vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter(v => v.id !== vehicle2Id)
                    .map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.licensePlate})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center pt-6">
              <div className="p-2 rounded-full bg-primary/10">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Vehicle 2</label>
              <Select value={vehicle2Id} onValueChange={setVehicle2Id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select second vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter(v => v.id !== vehicle1Id)
                    .map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.licensePlate})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleCard vehicle={vehicle1} label="Vehicle 1" color="blue" />
        <VehicleCard vehicle={vehicle2} label="Vehicle 2" color="purple" />
      </div>

      {/* Comparison Results */}
      {comparisonData && vehicle1 && vehicle2 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Performance Radar
                  </CardTitle>
                  <CardDescription>Multi-dimensional performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <Radar
                          name={vehicle1.name}
                          dataKey={vehicle1.name}
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Radar
                          name={vehicle2.name}
                          dataKey={vehicle2.name}
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Metric Comparison
                  </CardTitle>
                  <CardDescription>Side-by-side metric analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey={vehicle1.name} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey={vehicle2.name} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
                <CardDescription>Winner highlighted for each metric</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium">Metric</th>
                        <th className="text-center p-3 font-medium text-blue-500">{vehicle1.name}</th>
                        <th className="text-center p-3 font-medium">Winner</th>
                        <th className="text-center p-3 font-medium text-purple-500">{vehicle2.name}</th>
                        <th className="text-center p-3 font-medium">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((metric, index) => (
                        <motion.tr
                          key={metric.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/50 hover:bg-secondary/30"
                        >
                          <td className="p-3 font-medium">{metric.name}</td>
                          <td className={cn(
                            "p-3 text-center font-mono",
                            metric.winner === 'vehicle1' && "bg-green-500/10 text-green-500 font-bold"
                          )}>
                            {metric.vehicle1.toFixed(1)} {metric.unit}
                          </td>
                          <td className="p-3 text-center">
                            {getWinnerIcon(metric.winner)}
                          </td>
                          <td className={cn(
                            "p-3 text-center font-mono",
                            metric.winner === 'vehicle2' && "bg-green-500/10 text-green-500 font-bold"
                          )}>
                            {metric.vehicle2.toFixed(1)} {metric.unit}
                          </td>
                          <td className="p-3 text-center font-mono text-muted-foreground">
                            {metric.diff > 0 ? '+' : ''}{metric.diff.toFixed(1)} {metric.unit}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 rounded-lg bg-secondary/30">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="text-blue-500 font-semibold">{vehicle1.name}</span> wins in{' '}
                        <span className="font-bold">
                          {comparisonData.filter(m => m.winner === 'vehicle1').length}
                        </span>{' '}
                        categories
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="text-purple-500 font-semibold">{vehicle2.name}</span> wins in{' '}
                        <span className="font-bold">
                          {comparisonData.filter(m => m.winner === 'vehicle2').length}
                        </span>{' '}
                        categories
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold">
                          {comparisonData.filter(m => m.winner === 'tie').length}
                        </span>{' '}
                        ties
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty State */}
      {(!vehicle1 || !vehicle2) && (
        <Card className="glass-panel">
          <CardContent className="p-12 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select Two Vehicles to Compare</h3>
            <p className="text-muted-foreground">
              Choose vehicles from the dropdowns above to see a detailed comparison of their performance metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleComparisonTool;
