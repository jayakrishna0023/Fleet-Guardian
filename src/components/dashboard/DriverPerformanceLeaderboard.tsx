import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/context/DataContext';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Fuel,
  Clock,
  Zap,
  Award,
  Crown,
  ChevronRight,
  User,
  Car,
  Activity,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DriverScore {
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  overallScore: number;
  safetyScore: number;
  efficiencyScore: number;
  complianceScore: number;
  tripsCompleted: number;
  totalDistance: number;
  avgSpeed: number;
  harshBrakingEvents: number;
  rapidAccelerationEvents: number;
  idleTimeMinutes: number;
  fuelEfficiency: number;
  trend: 'up' | 'down' | 'stable';
  rank: number;
  previousRank: number;
}

interface DriverPerformanceLeaderboardProps {
  onVehicleSelect?: (vehicleId: string) => void;
}

export const DriverPerformanceLeaderboard = ({ onVehicleSelect }: DriverPerformanceLeaderboardProps) => {
  const { vehicles } = useData();
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'safety' | 'efficiency' | 'compliance'>('overall');

  // Calculate driver scores from vehicle data
  const driverScores = useMemo((): DriverScore[] => {
    const scores: DriverScore[] = [];

    vehicles.forEach(vehicle => {
      if (!vehicle.driver) return; // Skip vehicles without assigned drivers

      // Calculate scores from trip data
      const trips = vehicle.trips || [];
      const totalTrips = trips.length;
      const totalDistance = trips.reduce((sum, t) => sum + (t.distanceTraveled || t.mileage || 0), 0);
      const avgSpeed = trips.length > 0 
        ? trips.reduce((sum, t) => sum + (t.averageSpeed || 0), 0) / trips.length 
        : 0;
      const avgBraking = trips.length > 0
        ? trips.reduce((sum, t) => sum + (t.brakingIntensity || 30), 0) / trips.length
        : 30;
      const avgFuelEfficiency = trips.length > 0
        ? trips.reduce((sum, t) => sum + (t.fuelEfficiency || vehicle.fuelEfficiency), 0) / trips.length
        : vehicle.fuelEfficiency;
      const totalIdleTime = trips.reduce((sum, t) => sum + (t.idleTime || 0), 0);

      // Calculate safety score (based on braking intensity and speed variation)
      const safetyScore = Math.max(0, Math.min(100, 
        100 - (avgBraking > 50 ? (avgBraking - 50) * 2 : 0) - 
        (avgSpeed > 80 ? (avgSpeed - 80) * 0.5 : 0)
      ));

      // Calculate efficiency score (based on fuel efficiency and idle time)
      const efficiencyScore = Math.max(0, Math.min(100,
        (avgFuelEfficiency / 10) * 60 + // Higher fuel efficiency = better
        Math.max(0, 40 - (totalIdleTime / totalTrips || 0) * 2) // Less idle time = better
      ));

      // Calculate compliance score (based on speed violations, etc.)
      const maxSpeedTrips = trips.filter(t => (t.maxSpeed || 0) > 100).length;
      const complianceScore = Math.max(0, Math.min(100,
        100 - (maxSpeedTrips / Math.max(1, totalTrips)) * 50
      ));

      // Overall score is weighted average
      const overallScore = Math.round(
        safetyScore * 0.4 + efficiencyScore * 0.35 + complianceScore * 0.25
      );

      // Determine trend (simulated for now)
      const trend = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down';

      scores.push({
        driverId: `driver-${vehicle.id}`,
        driverName: vehicle.driver,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        overallScore,
        safetyScore: Math.round(safetyScore),
        efficiencyScore: Math.round(efficiencyScore),
        complianceScore: Math.round(complianceScore),
        tripsCompleted: totalTrips,
        totalDistance: Math.round(totalDistance),
        avgSpeed: Math.round(avgSpeed),
        harshBrakingEvents: Math.round(avgBraking > 50 ? (avgBraking - 50) / 10 : 0),
        rapidAccelerationEvents: Math.floor(Math.random() * 5),
        idleTimeMinutes: Math.round(totalIdleTime),
        fuelEfficiency: Math.round(avgFuelEfficiency * 10) / 10,
        trend: trend as 'up' | 'down' | 'stable',
        rank: 0, // Will be calculated after sorting
        previousRank: 0,
      });
    });

    // Sort by selected metric and assign ranks
    const sortedScores = scores.sort((a, b) => {
      switch (selectedMetric) {
        case 'safety': return b.safetyScore - a.safetyScore;
        case 'efficiency': return b.efficiencyScore - a.efficiencyScore;
        case 'compliance': return b.complianceScore - a.complianceScore;
        default: return b.overallScore - a.overallScore;
      }
    });

    sortedScores.forEach((score, index) => {
      score.rank = index + 1;
      score.previousRank = Math.max(1, score.rank + (score.trend === 'up' ? 1 : score.trend === 'down' ? -1 : 0));
    });

    return sortedScores;
  }, [vehicles, selectedMetric]);

  const metrics = [
    { id: 'overall', label: 'Overall', icon: Trophy },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'efficiency', label: 'Efficiency', icon: Fuel },
    { id: 'compliance', label: 'Compliance', icon: Target },
  ] as const;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-700" />;
      default: return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  if (driverScores.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Driver Data Available</h3>
        <p className="text-muted-foreground">
          Assign drivers to vehicles to see performance rankings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-yellow-500/10 via-transparent to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Driver Performance Leaderboard</h2>
              <p className="text-muted-foreground">
                Rankings based on safety, efficiency, and compliance scores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Filter */}
      <div className="flex gap-2 flex-wrap">
        {metrics.map(metric => (
          <Button
            key={metric.id}
            variant={selectedMetric === metric.id ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => setSelectedMetric(metric.id)}
          >
            <metric.icon className="w-4 h-4" />
            {metric.label}
          </Button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {driverScores.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* Second Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-4 text-center mt-8"
          >
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-500/20 flex items-center justify-center">
              <Medal className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-semibold truncate">{driverScores[1]?.driverName}</p>
            <p className="text-xs text-muted-foreground truncate">{driverScores[1]?.vehicleName}</p>
            <p className={`text-2xl font-bold mt-2 ${getScoreColor(driverScores[1]?.overallScore || 0)}`}>
              {driverScores[1]?.overallScore}
            </p>
          </motion.div>

          {/* First Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 text-center border-yellow-500/30 bg-yellow-500/5"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center"
            >
              <Crown className="w-8 h-8 text-yellow-500" />
            </motion.div>
            <p className="font-semibold truncate">{driverScores[0]?.driverName}</p>
            <p className="text-xs text-muted-foreground truncate">{driverScores[0]?.vehicleName}</p>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(driverScores[0]?.overallScore || 0)}`}>
              {driverScores[0]?.overallScore}
            </p>
            <span className="text-xs text-yellow-500">🏆 Champion</span>
          </motion.div>

          {/* Third Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-4 text-center mt-12"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-700/20 flex items-center justify-center">
              <Medal className="w-5 h-5 text-amber-700" />
            </div>
            <p className="font-semibold truncate text-sm">{driverScores[2]?.driverName}</p>
            <p className="text-xs text-muted-foreground truncate">{driverScores[2]?.vehicleName}</p>
            <p className={`text-xl font-bold mt-2 ${getScoreColor(driverScores[2]?.overallScore || 0)}`}>
              {driverScores[2]?.overallScore}
            </p>
          </motion.div>
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Driver</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vehicle</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Overall</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Safety</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Efficiency</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Compliance</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Trips</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Trend</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {driverScores.map((driver, index) => (
                  <motion.tr
                    key={driver.driverId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(driver.rank)}
                        {driver.rank !== driver.previousRank && (
                          <span className={`text-xs ${
                            driver.rank < driver.previousRank ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {driver.rank < driver.previousRank ? '↑' : '↓'}
                            {Math.abs(driver.rank - driver.previousRank)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{driver.driverName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{driver.vehicleName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${getScoreColor(driver.overallScore)}`}>
                        {driver.overallScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm px-2 py-1 rounded ${getScoreBg(driver.safetyScore)} ${getScoreColor(driver.safetyScore)}`}>
                        {driver.safetyScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm px-2 py-1 rounded ${getScoreBg(driver.efficiencyScore)} ${getScoreColor(driver.efficiencyScore)}`}>
                        {driver.efficiencyScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-sm px-2 py-1 rounded ${getScoreBg(driver.complianceScore)} ${getScoreColor(driver.complianceScore)}`}>
                        {driver.complianceScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                      {driver.tripsCompleted}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getTrendIcon(driver.trend)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVehicleSelect?.(driver.vehicleId)}
                        className="gap-1"
                      >
                        View
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Avg Score</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.round(driverScores.reduce((sum, d) => sum + d.overallScore, 0) / driverScores.length)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Avg Safety</span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {Math.round(driverScores.reduce((sum, d) => sum + d.safetyScore, 0) / driverScores.length)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Top Performers</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">
            {driverScores.filter(d => d.overallScore >= 80).length}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Improving</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">
            {driverScores.filter(d => d.trend === 'up').length}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DriverPerformanceLeaderboard;
