import { FleetSummary } from '@/types/vehicle';
import { MetricCard } from './MetricCard';
import { HealthGauge } from './HealthGauge';
import { motion } from 'framer-motion';
import {
  Car,
  AlertTriangle,
  Wrench,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';

interface FleetOverviewProps {
  summary: FleetSummary;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export const FleetOverview = ({ summary }: FleetOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Main Stats Row */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Fleet Health Gauge */}
        <motion.div 
          className="glass-panel p-6 flex flex-col items-center justify-center lg:row-span-2 relative overflow-hidden group"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <motion.div
            className="absolute -inset-10 opacity-0 group-hover:opacity-30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-full h-full bg-gradient-conic from-primary via-accent to-primary rounded-full blur-3xl" />
          </motion.div>
          
          <div className="relative z-10">
            <HealthGauge
              score={summary.averageHealthScore}
              size="lg"
              label="Fleet Health"
            />
          </div>
          <motion.p 
            className="text-sm text-muted-foreground mt-4 text-center relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Average health score across <CountUp end={summary.totalVehicles - summary.maintenanceVehicles} /> active vehicles
          </motion.p>
        </motion.div>

        {/* Vehicle Status Cards */}
        <motion.div variants={itemVariants}>
          <MetricCard
            title="Total Vehicles"
            value={<CountUp end={summary.totalVehicles} />}
            icon={<Car className="w-5 h-5" />}
            trend="stable"
            trendValue="Fleet size"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Healthy"
            value={<CountUp end={summary.healthyVehicles} />}
            icon={<CheckCircle className="w-5 h-5" />}
            status="healthy"
            trend="up"
            trendValue={`${summary.totalVehicles > 0 ? ((summary.healthyVehicles / summary.totalVehicles) * 100).toFixed(0) : 0}%`}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Needs Attention"
            value={<CountUp end={summary.warningVehicles} />}
            icon={<AlertCircle className="w-5 h-5" />}
            status="warning"
            trend={summary.warningVehicles > 0 ? 'up' : 'stable'}
            trendValue={summary.warningVehicles > 0 ? 'Action needed' : 'All clear'}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Critical"
            value={<CountUp end={summary.criticalVehicles} />}
            icon={<XCircle className="w-5 h-5" />}
            status={summary.criticalVehicles > 0 ? 'critical' : 'healthy'}
            trend={summary.criticalVehicles > 0 ? 'down' : 'stable'}
            trendValue={summary.criticalVehicles > 0 ? 'Immediate action' : 'None critical'}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="In Maintenance"
            value={<CountUp end={summary.maintenanceVehicles} />}
            icon={<Wrench className="w-5 h-5" />}
            trend="stable"
            trendValue="Scheduled"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MetricCard
            title="Active Alerts"
            value={<CountUp end={summary.activeAlerts} />}
            icon={<AlertTriangle className="w-5 h-5" />}
            status={summary.activeAlerts > 3 ? 'warning' : undefined}
            trend={summary.activeAlerts > 0 ? 'up' : 'stable'}
            trendValue={summary.activeAlerts > 0 ? 'Pending review' : 'All addressed'}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
