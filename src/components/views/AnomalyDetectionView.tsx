import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/context/DataContext';
import { anomalyDetector, DetectedAnomaly, AnomalyStatistics } from '@/services/anomalyDetection';
import {
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  RefreshCw,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ThermometerSun,
  Droplets,
  Battery,
  Gauge,
  Brain,
  BarChart3,
  Bell,
  AlertOctagon,
  ChevronRight,
  Target,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
type CategoryType = 'sensor' | 'behavior' | 'pattern' | 'location' | 'maintenance';

export const AnomalyDetectionView = () => {
  const { vehicles } = useData();
  const [anomalies, setAnomalies] = useState<DetectedAnomaly[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | SeverityLevel>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // Run anomaly detection
  const runDetection = async () => {
    setIsScanning(true);
    
    // Simulate processing time for effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const detectedAnomalies = anomalyDetector.detectFleetAnomalies(vehicles);
    setAnomalies(detectedAnomalies);
    setLastScanTime(new Date());
    setIsScanning(false);
  };

  // Auto-run detection on mount and when vehicles change
  useEffect(() => {
    if (vehicles.length > 0) {
      runDetection();
    }
  }, [vehicles]);

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      if (selectedSeverity !== 'all' && a.anomalyType.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'all' && a.anomalyType.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          a.vehicleId.toLowerCase().includes(query) ||
          a.vehicleName.toLowerCase().includes(query) ||
          a.anomalyType.name.toLowerCase().includes(query) ||
          a.anomalyType.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [anomalies, selectedSeverity, selectedCategory, searchQuery]);

  // Statistics
  const stats: AnomalyStatistics = useMemo(() => {
    return anomalyDetector.getStatistics();
  }, [anomalies]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    anomalies.forEach(a => {
      distribution[a.anomalyType.category] = (distribution[a.anomalyType.category] || 0) + 1;
    });
    return Object.entries(distribution).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
      color: getCategoryColor(category),
    }));
  }, [anomalies]);

  // Severity distribution
  const severityDistribution = useMemo(() => {
    const bySeverity = stats.bySeverity || { critical: 0, high: 0, medium: 0, low: 0 };
    return [
      { name: 'Critical', value: bySeverity['critical'] || 0, color: '#ef4444' },
      { name: 'High', value: bySeverity['high'] || 0, color: '#f97316' },
      { name: 'Medium', value: bySeverity['medium'] || 0, color: '#eab308' },
      { name: 'Low', value: bySeverity['low'] || 0, color: '#22c55e' },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Confidence distribution
  const confidenceData = useMemo(() => {
    const ranges = [
      { name: '90-100%', min: 0.9, max: 1 },
      { name: '80-90%', min: 0.8, max: 0.9 },
      { name: '70-80%', min: 0.7, max: 0.8 },
      { name: '<70%', min: 0, max: 0.7 },
    ];
    return ranges.map(r => ({
      name: r.name,
      count: anomalies.filter(a => a.confidence >= r.min && a.confidence < r.max).length,
    }));
  }, [anomalies]);

  // Vehicle anomaly counts
  const vehicleAnomalyCounts = useMemo(() => {
    const counts: Record<string, { critical: number; high: number; medium: number; low: number; name: string }> = {};
    anomalies.forEach(a => {
      if (!counts[a.vehicleId]) {
        counts[a.vehicleId] = { critical: 0, high: 0, medium: 0, low: 0, name: a.vehicleName };
      }
      const severity = a.anomalyType.severity;
      counts[a.vehicleId][severity]++;
    });
    return Object.entries(counts)
      .map(([id, c]) => ({ id, ...c, total: c.critical + c.high + c.medium + c.low }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [anomalies]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-destructive/10 via-warning/10 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-destructive/20 to-warning/20">
                <Brain className="w-8 h-8 text-destructive" />
              </div>
              {isScanning && (
                <motion.div
                  className="absolute -inset-1 rounded-xl border-2 border-primary"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                AI Anomaly Detection
                <Sparkles className="w-5 h-5 text-warning animate-pulse" />
              </h2>
              <p className="text-muted-foreground">
                Real-time ML-powered anomaly detection across your fleet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastScanTime && (
              <span className="text-xs text-muted-foreground">
                Last scan: {lastScanTime.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={runDetection}
              disabled={isScanning}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Run Detection'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-destructive/20">
              <AlertOctagon className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Total Anomalies</span>
          </div>
          <p className="text-3xl font-bold font-mono">{stats.totalDetected}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Detected across {new Set(anomalies.map(a => a.vehicleId)).size} vehicles
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
          <p className="text-3xl font-bold font-mono text-red-500">
            {stats.bySeverity?.['critical'] || 0}
          </p>
          <p className="text-xs text-destructive mt-1">Requires immediate attention</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground">High Priority</span>
          </div>
          <p className="text-3xl font-bold font-mono text-orange-500">
            {stats.bySeverity?.['high'] || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Review within 24 hours</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Avg Confidence</span>
          </div>
          <p className="text-3xl font-bold font-mono">{Math.round(stats.avgConfidence * 100)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Detection accuracy</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Severity Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {severityDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Anomaly Categories
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Confidence Levels
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vehicle Anomaly Overview */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Anomalies by Vehicle
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleAnomalyCounts} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="id" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Tooltip />
              <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" />
              <Bar dataKey="high" name="High" stackId="a" fill="#f97316" />
              <Bar dataKey="medium" name="Medium" stackId="a" fill="#eab308" />
              <Bar dataKey="low" name="Low" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search anomalies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Severity:</span>
            <div className="flex gap-1">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => (
                <Button
                  key={severity}
                  variant={selectedSeverity === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity(severity)}
                  className="text-xs capitalize"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredAnomalies.length} of {anomalies.length} anomalies
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAnomalies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel p-12 text-center"
            >
              <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
              <h3 className="text-lg font-semibold">No Anomalies Detected</h3>
              <p className="text-muted-foreground">
                {anomalies.length === 0 
                  ? 'All systems are operating within normal parameters'
                  : 'No anomalies match your current filters'}
              </p>
            </motion.div>
          ) : (
            filteredAnomalies.slice(0, 20).map((anomaly, index) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Anomaly Card Component
const AnomalyCard = ({ anomaly, index }: { anomaly: DetectedAnomaly; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    critical: { color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500/50' },
    high: { color: 'bg-orange-500', textColor: 'text-orange-500', borderColor: 'border-orange-500/50' },
    medium: { color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-500/50' },
    low: { color: 'bg-green-500', textColor: 'text-green-500', borderColor: 'border-green-500/50' },
  };

  const config = severityConfig[anomaly.anomalyType.severity];
  const TypeIcon = getCategoryIcon(anomaly.anomalyType.category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-panel p-4 border-l-4 ${config.borderColor} hover:bg-muted/50 transition-colors cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.color}/20`}>
          <TypeIcon className={`w-5 h-5 ${config.textColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
              {anomaly.anomalyType.severity}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground capitalize">
              {anomaly.anomalyType.category}
            </span>
          </div>

          <h4 className="font-medium">{anomaly.anomalyType.name}</h4>
          <p className="text-sm text-muted-foreground">{anomaly.context}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              {anomaly.vehicleName}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {Math.round(anomaly.confidence * 100)}% confidence
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {anomaly.deviation.toFixed(1)}σ deviation
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {anomaly.detectedAt.toLocaleTimeString()}
            </span>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-border overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">Detected Value</h5>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary">{anomaly.value?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: {anomaly.expectedRange.min.toFixed(2)} - {anomaly.expectedRange.max.toFixed(2)}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2">Recommendation</h5>
                    <p className="text-sm flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      {anomaly.recommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// Helper functions
function getCategoryIcon(category: string) {
  const icons: Record<string, any> = {
    sensor: ThermometerSun,
    behavior: Activity,
    pattern: Zap,
    location: Gauge,
    maintenance: AlertOctagon,
  };
  return icons[category] || AlertTriangle;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    sensor: '#f97316',
    behavior: '#8b5cf6',
    pattern: '#3b82f6',
    location: '#22c55e',
    maintenance: '#ef4444',
  };
  return colors[category] || '#6b7280';
}

export default AnomalyDetectionView;
