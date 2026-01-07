import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { VehicleMetrics } from '@/types/vehicle';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';

interface TrendChartProps {
  data: VehicleMetrics[];
  metric: 'engineTemperature' | 'fuelEfficiency' | 'healthScore' | 'brakingIntensity';
  title: string;
  unit?: string;
  color?: string;
  showArea?: boolean;
  index?: number;
}

export const TrendChart = ({ 
  data, 
  metric, 
  title, 
  unit = '',
  color = 'hsl(var(--primary))',
  showArea = true,
  index = 0
}: TrendChartProps) => {
  const chartData = useMemo(() => {
    return data.map(d => ({
      timestamp: d.timestamp ? format(d.timestamp, 'MMM dd HH:mm') : '',
      value: d[metric] ?? 0,
    }));
  }, [data, metric]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const recent = chartData.slice(-3).reduce((a, b) => a + b.value, 0) / 3;
    const older = chartData.slice(0, 3).reduce((a, b) => a + b.value, 0) / 3;
    return ((recent - older) / older) * 100;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          className="glass-panel p-3 border border-border/50 backdrop-blur-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="font-mono font-semibold text-lg">
            {(payload[0].value ?? 0).toFixed(1)}{unit}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="glass-panel p-4 relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />

      {/* Animated scan line */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"
        initial={{ y: '-100%' }}
        animate={{ y: '100%' }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: index * 0.5 }}
      />

      <div className="relative z-10">
        {/* Header with trend indicator */}
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Activity className="w-4 h-4 text-primary" />
            </motion.div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </motion.div>
          
          <motion.div 
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              trend >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            <motion.div
              animate={{ y: trend >= 0 ? [-1, 1, -1] : [1, -1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            </motion.div>
            <span className="font-mono">{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
          </motion.div>
        </div>

        {/* Chart container */}
        <motion.div 
          className="h-48"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {showArea ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                  {/* Glow filter */}
                  <filter id={`glow-${metric}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.2} 
                />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${metric})`}
                  filter={`url(#glow-${metric})`}
                  animationBegin={index * 100}
                  animationDuration={1500}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <filter id={`glow-line-${metric}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.2} 
                />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
                  filter={`url(#glow-line-${metric})`}
                  animationBegin={index * 100}
                  animationDuration={1500}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};
