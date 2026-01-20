import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/context/DataContext';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Fuel,
  Wrench,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Route,
  MapPin,
  Timer,
  Shield,
  Activity,
  Eye,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart,
  Settings2,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  LineChart as RechartsLineChart,
  Line,
} from 'recharts';

interface Insight {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'trend' | 'prediction';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    metric: string;
    value: number;
    unit: string;
    direction: 'up' | 'down';
  };
  action: string;
  confidence: number;
  affectedVehicles: string[];
  timeframe: string;
}

interface MaintenanceSchedule {
  vehicleId: string;
  service: string;
  predictedDate: Date;
  urgency: 'immediate' | 'soon' | 'scheduled';
  estimatedCost: number;
  currentHealth: number;
  predictedFailure?: string;
}

interface RouteOptimization {
  vehicleId: string;
  currentRoute: { distance: number; time: number; fuel: number };
  optimizedRoute: { distance: number; time: number; fuel: number };
  savings: { distance: number; time: number; fuel: number; cost: number };
}

export const SmartInsightsView = () => {
  const { vehicles, fleetStats, alerts } = useData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'maintenance' | 'routes' | 'predictions'>('insights');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([]);
  const [routeOptimizations, setRouteOptimizations] = useState<RouteOptimization[]>([]);

  // Generate AI insights
  const generateInsights = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const generatedInsights: Insight[] = [];
      
      // Analyze fleet performance
      const avgHealth = vehicles.length > 0 
        ? vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length 
        : 0;
      const lowHealthVehicles = vehicles.filter(v => v.healthScore < 70);
      const criticalVehicles = vehicles.filter(v => v.status === 'critical');
      
      // Generate optimization insights
      if (lowHealthVehicles.length > 0) {
        generatedInsights.push({
          id: 'insight-1',
          type: 'warning',
          priority: lowHealthVehicles.length > 3 ? 'high' : 'medium',
          title: `${lowHealthVehicles.length} Vehicles Below Optimal Health`,
          description: `Fleet analysis detected ${lowHealthVehicles.length} vehicles operating below 70% health score. Proactive maintenance can prevent costly breakdowns.`,
          impact: {
            metric: 'Downtime Risk',
            value: lowHealthVehicles.length * 15,
            unit: '%',
            direction: 'up',
          },
          action: 'Schedule preventive maintenance',
          confidence: 0.89,
          affectedVehicles: lowHealthVehicles.map(v => v.id),
          timeframe: 'Next 7 days',
        });
      }

      // Fuel efficiency optimization
      const inefficientVehicles = vehicles.filter(v => (v.fuelEfficiency || 8) < 7);
      if (inefficientVehicles.length > 0) {
        generatedInsights.push({
          id: 'insight-2',
          type: 'opportunity',
          priority: 'medium',
          title: 'Fuel Efficiency Optimization Available',
          description: `${inefficientVehicles.length} vehicles showing below-average fuel efficiency. Driver training and route optimization could save significant costs.`,
          impact: {
            metric: 'Fuel Costs',
            value: inefficientVehicles.length * 250,
            unit: '$/month',
            direction: 'down',
          },
          action: 'Implement driver eco-coaching',
          confidence: 0.85,
          affectedVehicles: inefficientVehicles.map(v => v.id),
          timeframe: 'Monthly savings',
        });
      }

      // Predictive trend
      generatedInsights.push({
        id: 'insight-3',
        type: 'trend',
        priority: 'low',
        title: 'Fleet Health Trending Upward',
        description: `Overall fleet health score has improved by 3.2% over the past week. Current maintenance strategy is effective.`,
        impact: {
          metric: 'Health Score',
          value: 3.2,
          unit: '%',
          direction: 'up',
        },
        action: 'Continue current maintenance schedule',
        confidence: 0.92,
        affectedVehicles: [],
        timeframe: 'Past 7 days',
      });

      // Cost prediction
      generatedInsights.push({
        id: 'insight-4',
        type: 'prediction',
        priority: 'medium',
        title: 'Maintenance Cost Forecast',
        description: `Based on current wear patterns, predicted maintenance costs for next quarter are ₹${(vehicles.length * 15000).toLocaleString()}. 12% lower than last quarter.`,
        impact: {
          metric: 'Savings',
          value: 12,
          unit: '%',
          direction: 'down',
        },
        action: 'Review and approve budget allocation',
        confidence: 0.78,
        affectedVehicles: [],
        timeframe: 'Next quarter',
      });

      // Route optimization opportunity
      generatedInsights.push({
        id: 'insight-5',
        type: 'optimization',
        priority: 'high',
        title: 'Route Optimization Potential',
        description: `AI analysis identified route inefficiencies across 60% of active vehicles. Optimized routing could reduce total fleet mileage by 8%.`,
        impact: {
          metric: 'Distance',
          value: 8,
          unit: '%',
          direction: 'down',
        },
        action: 'Activate smart routing',
        confidence: 0.88,
        affectedVehicles: vehicles.slice(0, Math.floor(vehicles.length * 0.6)).map(v => v.id),
        timeframe: 'Immediate',
      });

      // Critical alert
      if (criticalVehicles.length > 0) {
        generatedInsights.push({
          id: 'insight-6',
          type: 'warning',
          priority: 'critical',
          title: `${criticalVehicles.length} Critical Vehicles Require Action`,
          description: `Vehicles in critical condition detected. Immediate inspection recommended to prevent safety issues and costly repairs.`,
          impact: {
            metric: 'Safety Risk',
            value: criticalVehicles.length * 25,
            unit: '%',
            direction: 'up',
          },
          action: 'Initiate emergency inspection',
          confidence: 0.95,
          affectedVehicles: criticalVehicles.map(v => v.id),
          timeframe: 'Immediate',
        });
      }

      setInsights(generatedInsights.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));

      // Generate maintenance schedule
      const schedule: MaintenanceSchedule[] = vehicles.slice(0, 8).map(v => {
        const healthScore = v.healthScore;
        const urgency = healthScore < 50 ? 'immediate' : healthScore < 70 ? 'soon' : 'scheduled';
        const daysUntilService = healthScore < 50 ? 0 : healthScore < 70 ? 7 : 30;
        
        return {
          vehicleId: v.id,
          service: healthScore < 50 ? 'Emergency Repair' : healthScore < 70 ? 'Preventive Maintenance' : 'Scheduled Service',
          predictedDate: new Date(Date.now() + daysUntilService * 24 * 60 * 60 * 1000),
          urgency,
          estimatedCost: Math.round(5000 + (100 - healthScore) * 200 + Math.random() * 3000),
          currentHealth: healthScore,
          predictedFailure: healthScore < 60 ? getRandomFailure() : undefined,
        };
      });
      setMaintenanceSchedule(schedule);

      // Generate route optimizations
      const optimizations: RouteOptimization[] = vehicles.slice(0, 6).map(v => {
        const currentDistance = Math.round(50 + Math.random() * 100);
        const currentTime = Math.round(currentDistance * 1.5);
        const currentFuel = Math.round(currentDistance * 0.12);
        
        const savingsPercent = 5 + Math.random() * 15;
        
        return {
          vehicleId: v.id,
          currentRoute: {
            distance: currentDistance,
            time: currentTime,
            fuel: currentFuel,
          },
          optimizedRoute: {
            distance: Math.round(currentDistance * (1 - savingsPercent / 100)),
            time: Math.round(currentTime * (1 - savingsPercent / 100)),
            fuel: Math.round(currentFuel * (1 - savingsPercent / 100)),
          },
          savings: {
            distance: Math.round(currentDistance * savingsPercent / 100),
            time: Math.round(currentTime * savingsPercent / 100),
            fuel: Math.round(currentFuel * savingsPercent / 100),
            cost: Math.round(currentFuel * savingsPercent / 100 * 95),
          },
        };
      });
      setRouteOptimizations(optimizations);
      
      setIsGenerating(false);
    }, 2000);
  };

  useEffect(() => {
    if (vehicles.length > 0) {
      generateInsights();
    }
  }, [vehicles]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const critical = insights.filter(i => i.priority === 'critical').length;
    const high = insights.filter(i => i.priority === 'high').length;
    const opportunities = insights.filter(i => i.type === 'opportunity').length;
    const totalSavings = insights
      .filter(i => i.impact.direction === 'down' && i.impact.unit === '$/month')
      .reduce((sum, i) => sum + i.impact.value, 0);
    
    return { critical, high, opportunities, totalSavings };
  }, [insights]);

  // Prediction data for chart
  const predictionData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const avgHealth = vehicles.length > 0 
      ? vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length 
      : 75;
    
    return months.map((month, i) => ({
      month,
      actual: i < 3 ? Math.round(avgHealth - 5 + i * 2 + Math.random() * 5) : null,
      predicted: Math.round(avgHealth - 3 + i * 1.5 + Math.random() * 3),
      maintenance: Math.round(vehicles.length * 5000 * (1 - i * 0.02)),
    }));
  }, [vehicles]);

  const tabs = [
    { id: 'insights', label: 'AI Insights', icon: Lightbulb },
    { id: 'maintenance', label: 'Predictive Maintenance', icon: Wrench },
    { id: 'routes', label: 'Route Optimization', icon: Route },
    { id: 'predictions', label: 'Forecasts', icon: LineChart },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </motion.div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Fleet Insights</h2>
              <p className="text-muted-foreground">
                AI-powered recommendations and predictive analytics
              </p>
            </div>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analyzing...' : 'Refresh Insights'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-muted-foreground">Critical Issues</span>
          </div>
          <p className="text-3xl font-bold font-mono text-red-500">{summaryStats.critical}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Bell className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground">High Priority</span>
          </div>
          <p className="text-3xl font-bold font-mono text-orange-500">{summaryStats.high}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Target className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm text-muted-foreground">Opportunities</span>
          </div>
          <p className="text-3xl font-bold font-mono text-green-500">{summaryStats.opportunities}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Potential Savings</span>
          </div>
          <p className="text-3xl font-bold font-mono">₹{(summaryStats.totalSavings * 83).toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {insights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </motion.div>
        )}

        {activeTab === 'maintenance' && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="glass-panel p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                AI-Predicted Maintenance Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Service</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Health</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Est. Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceSchedule.map((item, index) => (
                      <motion.tr
                        key={item.vehicleId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium">{item.vehicleId}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm">{item.service}</p>
                            {item.predictedFailure && (
                              <p className="text-xs text-destructive">{item.predictedFailure}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{item.predictedDate.toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.currentHealth >= 70 ? 'bg-success' :
                                  item.currentHealth >= 50 ? 'bg-warning' : 'bg-destructive'
                                }`}
                                style={{ width: `${item.currentHealth}%` }}
                              />
                            </div>
                            <span className="text-sm">{item.currentHealth}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">₹{item.estimatedCost.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.urgency === 'immediate' ? 'bg-red-500/20 text-red-500' :
                            item.urgency === 'soon' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {item.urgency}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'routes' && (
          <motion.div
            key="routes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Distance Savings</span>
                </div>
                <p className="text-2xl font-bold">
                  {routeOptimizations.reduce((sum, r) => sum + r.savings.distance, 0)} km
                </p>
              </div>
              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Time Savings</span>
                </div>
                <p className="text-2xl font-bold">
                  {routeOptimizations.reduce((sum, r) => sum + r.savings.time, 0)} min
                </p>
              </div>
              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Cost Savings</span>
                </div>
                <p className="text-2xl font-bold">
                  ₹{routeOptimizations.reduce((sum, r) => sum + r.savings.cost, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="glass-panel p-5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Route Optimization Recommendations
              </h3>
              <div className="space-y-4">
                {routeOptimizations.map((opt, index) => (
                  <motion.div
                    key={opt.vehicleId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{opt.vehicleId}</span>
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                        Save ₹{opt.savings.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Distance</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">{opt.currentRoute.distance} km</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="text-sm text-green-500">{opt.optimizedRoute.distance} km</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">{opt.currentRoute.time} min</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="text-sm text-green-500">{opt.optimizedRoute.time} min</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Fuel</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-muted-foreground">{opt.currentRoute.fuel} L</span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="text-sm text-green-500">{opt.optimizedRoute.fuel} L</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Health Score Prediction
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={predictionData}>
                      <defs>
                        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis domain={[60, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="actual" 
                        name="Actual"
                        stroke="hsl(var(--primary))" 
                        fill="url(#actualGradient)"
                        strokeWidth={2}
                        connectNulls={false}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predicted" 
                        name="Predicted"
                        stroke="#8b5cf6" 
                        fill="url(#predictedGradient)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-xs text-muted-foreground">Predicted</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Maintenance Cost Forecast
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={predictionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="maintenance" name="Cost (₹)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ insight, index }: { insight: Insight; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  const typeConfig = {
    optimization: { icon: Settings2, color: 'text-blue-500', bg: 'bg-blue-500/20' },
    warning: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/20' },
    opportunity: { icon: Target, color: 'text-green-500', bg: 'bg-green-500/20' },
    trend: { icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/20' },
    prediction: { icon: Brain, color: 'text-pink-500', bg: 'bg-pink-500/20' },
  };

  const priorityConfig = {
    critical: { color: 'text-red-500', border: 'border-l-red-500' },
    high: { color: 'text-orange-500', border: 'border-l-orange-500' },
    medium: { color: 'text-yellow-500', border: 'border-l-yellow-500' },
    low: { color: 'text-green-500', border: 'border-l-green-500' },
  };

  const config = typeConfig[insight.type];
  const priority = priorityConfig[insight.priority];
  const TypeIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass-panel p-4 border-l-4 ${priority.border} hover:bg-muted/30 transition-colors cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <TypeIcon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${priority.color}`}>
              {insight.priority}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground capitalize">{insight.type}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{insight.timeframe}</span>
          </div>

          <h4 className="font-medium mb-1">{insight.title}</h4>
          <p className="text-sm text-muted-foreground">{insight.description}</p>

          <div className="flex items-center gap-4 mt-3">
            <div className={`flex items-center gap-1 ${insight.impact.direction === 'up' ? 'text-red-500' : 'text-green-500'}`}>
              {insight.impact.direction === 'up' ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {insight.impact.value}{insight.impact.unit}
              </span>
              <span className="text-xs text-muted-foreground">{insight.impact.metric}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-3 h-3" />
              <span className="text-xs">{Math.round(insight.confidence * 100)}% confidence</span>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-border overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Recommended Action</p>
                    <p className="text-sm font-medium">{insight.action}</p>
                  </div>
                  {insight.affectedVehicles.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Affected Vehicles</p>
                      <p className="text-sm">{insight.affectedVehicles.length} vehicles</p>
                    </div>
                  )}
                </div>
                <Button size="sm" className="mt-3 gap-2">
                  <Zap className="w-3 h-3" />
                  Take Action
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Helper function
function getRandomFailure(): string {
  const failures = [
    'Engine bearing wear detected',
    'Brake pad replacement needed',
    'Battery degradation imminent',
    'Transmission fluid leak risk',
    'Coolant system pressure drop',
    'Tire wear approaching limit',
  ];
  return failures[Math.floor(Math.random() * failures.length)];
}

export default SmartInsightsView;
