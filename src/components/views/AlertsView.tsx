import { useState, useMemo } from 'react';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { useData } from '@/context/DataContext';
import { Alert } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { 
  Filter,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AlertsView = () => {
  const { alerts: dataAlerts, acknowledgeAlert, isLoading, refreshData } = useData();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('all');

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  const filteredAlerts = useMemo(() => {
    return dataAlerts.filter(alert => {
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesAcknowledged = 
        acknowledgedFilter === 'all' || 
        (acknowledgedFilter === 'pending' && !alert.acknowledged) ||
        (acknowledgedFilter === 'acknowledged' && alert.acknowledged);
      
      return matchesSeverity && matchesAcknowledged;
    });
  }, [dataAlerts, severityFilter, acknowledgedFilter]);

  const severityOptions = [
    { value: 'all', label: 'All Severities', icon: Filter },
    { value: 'critical', label: 'Critical', icon: XCircle, color: 'text-destructive' },
    { value: 'high', label: 'High', icon: AlertTriangle, color: 'text-warning' },
    { value: 'medium', label: 'Medium', icon: AlertCircle, color: 'text-warning' },
    { value: 'low', label: 'Low', icon: Info, color: 'text-muted-foreground' },
  ];

  const acknowledgedCounts = {
    all: dataAlerts.length,
    pending: dataAlerts.filter(a => !a.acknowledged).length,
    acknowledged: dataAlerts.filter(a => a.acknowledged).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alert Center</h2>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="glass-panel p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-2xl font-bold font-mono text-destructive">
              {dataAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length}
            </p>
            <p className="text-xs text-muted-foreground">Critical Pending</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-2xl font-bold font-mono text-warning">
              {dataAlerts.filter(a => (a.severity === 'high' || a.severity === 'warning') && !a.acknowledged).length}
            </p>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary">
            <p className="text-2xl font-bold font-mono">
              {acknowledgedCounts.pending}
            </p>
            <p className="text-xs text-muted-foreground">Total Pending</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10 border border-success/30">
            <p className="text-2xl font-bold font-mono text-success">
              {acknowledgedCounts.acknowledged}
            </p>
            <p className="text-xs text-muted-foreground">Acknowledged</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Severity Filter */}
          <div className="flex flex-wrap gap-2">
            {severityOptions.map(option => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={severityFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSeverityFilter(option.value)}
                  className={cn(
                    severityFilter === option.value && option.color
                  )}
                >
                  <Icon className={cn('w-4 h-4 mr-1', option.color)} />
                  {option.label}
                </Button>
              );
            })}
          </div>

          {/* Acknowledged Filter */}
          <div className="flex gap-2 md:ml-auto">
            <Button
              variant={acknowledgedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAcknowledgedFilter('all')}
            >
              All ({acknowledgedCounts.all})
            </Button>
            <Button
              variant={acknowledgedFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAcknowledgedFilter('pending')}
            >
              Pending ({acknowledgedCounts.pending})
            </Button>
            <Button
              variant={acknowledgedFilter === 'acknowledged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAcknowledgedFilter('acknowledged')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Done ({acknowledgedCounts.acknowledged})
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))
        ) : (
          <div className="glass-panel p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-success mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts match your filters</h3>
            <p className="text-muted-foreground">
              Try adjusting your filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
