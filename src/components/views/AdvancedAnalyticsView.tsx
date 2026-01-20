import { useMemo, useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  advancedAnalytics,
  DriverScore,
  CarbonFootprint,
  CostForecast,
  FleetEfficiencyMetrics,
  SmartNotification,
} from '@/services/advancedAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Leaf,
  DollarSign,
  Shield,
  Gauge,
  AlertTriangle,
  Bell,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Car,
  Fuel,
  Thermometer,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Brain,
  Trees,
  Wallet,
  TrendingUp as TrendUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export const AdvancedAnalyticsView = () => {
  const { vehicles, alerts } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Calculate all analytics
  const driverScores = useMemo(() => {
    const scores: DriverScore[] = [];
    const driversMap = new Map<string, { name: string; trips: any[]; vehicles: string[] }>();

    vehicles.forEach(v => {
      if (v.driver) {
        if (!driversMap.has(v.driver)) {
          driversMap.set(v.driver, { name: v.driver, trips: [], vehicles: [] });
        }
        const driver = driversMap.get(v.driver)!;
        driver.vehicles.push(v.id);
        if (v.trips) {
          driver.trips.push(...v.trips);
        }
      }
    });

    driversMap.forEach((data, driverId) => {
      const score = advancedAnalytics.calculateDriverScore(
        driverId,
        data.name,
        data.trips,
        alerts.filter(a => data.vehicles.includes(a.vehicleId))
      );
      scores.push(score);
    });

    return scores.sort((a, b) => b.overallScore - a.overallScore);
  }, [vehicles, alerts]);

  const carbonFootprints = useMemo(() => {
    return vehicles.map(v => 
      advancedAnalytics.calculateCarbonFootprint(v, v.trips || [], 'monthly')
    );
  }, [vehicles]);

  const costForecast = useMemo(() => {
    const allTrips = vehicles.flatMap(v => v.trips || []);
    return advancedAnalytics.forecastCosts(vehicles, allTrips, selectedPeriod);
  }, [vehicles, selectedPeriod]);

  const fleetEfficiency = useMemo(() => {
    return advancedAnalytics.calculateFleetEfficiency(vehicles, driverScores, carbonFootprints);
  }, [vehicles, driverScores, carbonFootprints]);

  const notifications = useMemo(() => {
    return advancedAnalytics.generateSmartNotifications(vehicles, alerts, new Map());
  }, [vehicles, alerts]);

  // Chart colors
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Radar chart data for fleet efficiency
  const radarData = [
    { subject: 'Health', value: fleetEfficiency.avgHealthScore, fullMark: 100 },
    { subject: 'Efficiency', value: (fleetEfficiency.avgFuelEfficiency / 15) * 100, fullMark: 100 },
    { subject: 'Safety', value: fleetEfficiency.avgDriverScore, fullMark: 100 },
    { subject: 'Utilization', value: fleetEfficiency.utilizationRate, fullMark: 100 },
    { subject: 'Compliance', value: fleetEfficiency.maintenanceComplianceRate, fullMark: 100 },
    { subject: 'Eco Score', value: Math.max(0, 100 - fleetEfficiency.carbonIntensity * 500), fullMark: 100 },
  ];

  // Cost breakdown data for pie chart
  const costBreakdown = [
    { name: 'Fuel', value: costForecast.predictions.fuel.amount, color: '#ef4444' },
    { name: 'Maintenance', value: costForecast.predictions.maintenance.amount, color: '#f59e0b' },
    { name: 'Repairs', value: costForecast.predictions.repairs.amount, color: '#8b5cf6' },
    { name: 'Insurance', value: costForecast.predictions.insurance.amount, color: '#3b82f6' },
    { name: 'Depreciation', value: costForecast.predictions.depreciation.amount, color: '#6b7280' },
  ];

  // Carbon comparison data
  const carbonComparison = carbonFootprints.slice(0, 8).map(c => ({
    name: c.vehicleName.length > 10 ? c.vehicleName.substring(0, 10) + '...' : c.vehicleName,
    emissions: c.totalEmissions,
    target: c.totalEmissions * 0.8, // 20% reduction target
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights and predictions for your fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            ML Powered
          </Badge>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-panel border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fleet Score</p>
                  <p className="text-3xl font-bold">{fleetEfficiency.overallScore}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl",
                  fleetEfficiency.overallScore >= 80 ? "bg-green-500/10" :
                  fleetEfficiency.overallScore >= 60 ? "bg-yellow-500/10" : "bg-red-500/10"
                )}>
                  <Gauge className={cn(
                    "w-6 h-6",
                    fleetEfficiency.overallScore >= 80 ? "text-green-500" :
                    fleetEfficiency.overallScore >= 60 ? "text-yellow-500" : "text-red-500"
                  )} />
                </div>
              </div>
              <Progress value={fleetEfficiency.overallScore} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-panel border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                  <p className="text-3xl font-bold">
                    {carbonFootprints.reduce((sum, c) => sum + c.totalEmissions, 0).toFixed(0)}
                    <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Leaf className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
                <TrendingDown className="w-4 h-4" />
                <span>-5.2% from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-panel border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cost Forecast</p>
                  <p className="text-3xl font-bold">
                    ₹{(costForecast.predictions.total.amount / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Wallet className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <span>Confidence: {(costForecast.predictions.total.confidence * 100).toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-panel border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Driver Score</p>
                  <p className="text-3xl font-bold">
                    {driverScores.length > 0 
                      ? Math.round(driverScores.reduce((s, d) => s + d.overallScore, 0) / driverScores.length)
                      : 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span>+2.3% improvement</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-panel p-1">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="w-4 h-4" />
            Driver Scores
          </TabsTrigger>
          <TabsTrigger value="carbon" className="gap-2">
            <Leaf className="w-4 h-4" />
            Carbon Tracking
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Forecast
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Smart Alerts
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Efficiency Radar */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Fleet Performance Radar
                </CardTitle>
                <CardDescription>Multi-dimensional fleet analysis</CardDescription>
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
                        name="Performance"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp className="w-5 h-5 text-primary" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Week-over-week changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fleetEfficiency.trends.map((trend, index) => (
                    <motion.div
                      key={trend.metric}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          trend.isPositive ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          {trend.isPositive ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <span className="font-medium">{trend.metric}</span>
                      </div>
                      <Badge variant={trend.isPositive ? "default" : "destructive"}>
                        {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry Rankings */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Industry Benchmarks
              </CardTitle>
              <CardDescription>How your fleet compares to industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fleetEfficiency.rankings.map((ranking, index) => (
                  <motion.div
                    key={ranking.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg bg-secondary/30 text-center"
                  >
                    <div className={cn(
                      "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3",
                      ranking.percentile >= 80 ? "bg-green-500/20" :
                      ranking.percentile >= 60 ? "bg-yellow-500/20" : "bg-red-500/20"
                    )}>
                      <span className={cn(
                        "text-2xl font-bold",
                        ranking.percentile >= 80 ? "text-green-500" :
                        ranking.percentile >= 60 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {ranking.percentile}%
                      </span>
                    </div>
                    <h4 className="font-semibold">{ranking.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      Rank #{ranking.rank} of {ranking.totalInCategory}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Scores Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Driver Leaderboard
              </CardTitle>
              <CardDescription>Performance rankings based on safety, efficiency, and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              {driverScores.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No driver data available</p>
                  <p className="text-sm">Assign drivers to vehicles to see scores</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {driverScores.map((driver, index) => (
                    <motion.div
                      key={driver.odriverId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            index === 0 ? "bg-yellow-500 text-yellow-900" :
                            index === 1 ? "bg-gray-300 text-gray-700" :
                            index === 2 ? "bg-orange-400 text-orange-900" :
                            "bg-secondary text-muted-foreground"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">{driver.driverName}</h4>
                            <Badge variant={
                              driver.riskLevel === 'low' ? 'default' :
                              driver.riskLevel === 'medium' ? 'secondary' : 'destructive'
                            } className="text-xs">
                              {driver.riskLevel} risk
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{driver.overallScore}</p>
                          <p className={cn(
                            "text-xs flex items-center justify-end gap-1",
                            driver.trend === 'improving' ? "text-green-500" :
                            driver.trend === 'declining' ? "text-red-500" : "text-muted-foreground"
                          )}>
                            {driver.trend === 'improving' && <TrendingUp className="w-3 h-3" />}
                            {driver.trend === 'declining' && <TrendingDown className="w-3 h-3" />}
                            {driver.trend}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Safety</p>
                          <div className="flex items-center gap-2">
                            <Progress value={driver.safetyScore} className="h-2 flex-1" />
                            <span className="text-sm font-mono">{driver.safetyScore}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
                          <div className="flex items-center gap-2">
                            <Progress value={driver.efficiencyScore} className="h-2 flex-1" />
                            <span className="text-sm font-mono">{driver.efficiencyScore}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Compliance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={driver.complianceScore} className="h-2 flex-1" />
                            <span className="text-sm font-mono">{driver.complianceScore}</span>
                          </div>
                        </div>
                      </div>

                      {driver.recommendations.length > 0 && (
                        <div className="text-sm text-muted-foreground bg-background/50 p-2 rounded">
                          💡 {driver.recommendations[0]}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carbon Tracking Tab */}
        <TabsContent value="carbon" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Emissions */}
            <Card className="glass-panel lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-500" />
                  Vehicle Emissions Comparison
                </CardTitle>
                <CardDescription>Monthly CO₂ emissions vs reduction targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={carbonComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="emissions" name="Current" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Carbon Summary */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trees className="w-5 h-5 text-green-500" />
                  Carbon Offset
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-500">
                    {carbonFootprints.reduce((sum, c) => sum + c.offsetRequired, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Trees needed to offset</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm">Driving</span>
                    <span className="font-mono">
                      {carbonFootprints.reduce((sum, c) => sum + c.breakdown.driving, 0).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm">Idling</span>
                    <span className="font-mono">
                      {carbonFootprints.reduce((sum, c) => sum + c.breakdown.idling, 0).toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-sm">Cold Starts</span>
                    <span className="font-mono">
                      {carbonFootprints.reduce((sum, c) => sum + c.breakdown.coldStart, 0).toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Carbon Details */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Vehicle Carbon Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carbonFootprints.slice(0, 6).map((carbon, index) => (
                  <motion.div
                    key={carbon.vehicleId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold truncate">{carbon.vehicleName}</h4>
                      <Badge variant={
                        carbon.trend === 'improving' ? 'default' :
                        carbon.trend === 'worsening' ? 'destructive' : 'secondary'
                      }>
                        {carbon.trend}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total CO₂</span>
                        <span className="font-mono">{carbon.totalEmissions.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per km</span>
                        <span className="font-mono">{(carbon.emissionsPerKm * 1000).toFixed(0)} g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">vs Fleet Avg</span>
                        <span className={cn(
                          "font-mono",
                          carbon.comparedToFleetAverage < 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {carbon.comparedToFleetAverage > 0 ? '+' : ''}{carbon.comparedToFleetAverage}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Forecast Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Forecast Period:</span>
            {(['month', 'quarter', 'year'] as const).map(period => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown Pie */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Cost Distribution
                </CardTitle>
                <CardDescription>Forecasted cost breakdown for {selectedPeriod}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {costBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `₹${(value / 1000).toFixed(1)}K`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cost Details */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Cost Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(costForecast.predictions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="font-medium capitalize">{key}</p>
                        <p className="text-xs text-muted-foreground">
                          {(value.confidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                      <p className="text-xl font-bold font-mono">
                        ₹{(value.amount / 1000).toFixed(1)}K
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Opportunities */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Savings Opportunities
              </CardTitle>
              <CardDescription>AI-identified cost reduction opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {costForecast.savingsOpportunities.map((opp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <p className="font-medium mb-2">{opp.opportunity}</p>
                    <p className="text-2xl font-bold text-green-500">
                      ₹{(opp.potentialSavings / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-muted-foreground">potential savings</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Smart Notifications
              </CardTitle>
              <CardDescription>AI-prioritized alerts and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">All Clear!</p>
                  <p className="text-sm">No notifications at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 rounded-lg border",
                        notif.priority === 'critical' ? "bg-red-500/10 border-red-500/30" :
                        notif.priority === 'high' ? "bg-orange-500/10 border-orange-500/30" :
                        notif.priority === 'medium' ? "bg-yellow-500/10 border-yellow-500/30" :
                        "bg-secondary/30 border-border/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            notif.type === 'alert' ? "bg-red-500/20" :
                            notif.type === 'insight' ? "bg-blue-500/20" :
                            notif.type === 'recommendation' ? "bg-green-500/20" :
                            notif.type === 'milestone' ? "bg-yellow-500/20" :
                            "bg-secondary"
                          )}>
                            {notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            {notif.type === 'insight' && <Zap className="w-4 h-4 text-blue-500" />}
                            {notif.type === 'recommendation' && <Target className="w-4 h-4 text-green-500" />}
                            {notif.type === 'milestone' && <Award className="w-4 h-4 text-yellow-500" />}
                            {notif.type === 'reminder' && <Clock className="w-4 h-4 text-orange-500" />}
                          </div>
                          <div>
                            <h4 className="font-semibold">{notif.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                            {notif.actions && (
                              <div className="flex gap-2 mt-3">
                                {notif.actions.map((action, i) => (
                                  <Button key={i} size="sm" variant={i === 0 ? 'default' : 'outline'}>
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant={
                          notif.priority === 'critical' ? 'destructive' :
                          notif.priority === 'high' ? 'default' :
                          'secondary'
                        }>
                          {notif.priority}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsView;
