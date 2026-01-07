import { useState } from 'react';
import { VehicleCard } from '@/components/dashboard/VehicleCard';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Vehicle } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { 
  Search, 
  Filter,
  Grid3X3,
  List,
  Bus,
  Truck,
  Car,
  Plus,
  RefreshCw,
  Download,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehiclesViewProps {
  onVehicleSelect: (vehicleId: string) => void;
}

export const VehiclesView = ({ onVehicleSelect }: VehiclesViewProps) => {
  const { vehicles, isLoading, refreshData, exportData } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusOptions = [
    { value: 'all', label: 'All', count: vehicles.length },
    { value: 'operational', label: 'Healthy', count: vehicles.filter(v => v.status === 'operational').length },
    { value: 'warning', label: 'Warning', count: vehicles.filter(v => v.status === 'warning').length },
    { value: 'critical', label: 'Critical', count: vehicles.filter(v => v.status === 'critical').length },
    { value: 'maintenance', label: 'Maintenance', count: vehicles.filter(v => v.status === 'maintenance').length },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types', icon: null },
    { value: 'bus', label: 'Bus', icon: Bus },
    { value: 'truck', label: 'Truck', icon: Truck },
    { value: 'van', label: 'Van', icon: Car },
  ];

  // Check if user can add vehicles (all roles except viewer)
  const canAddVehicle = user?.role !== 'viewer';

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Fleet Inventory</h2>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} vehicles registered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {canAddVehicle && (
            <Button 
              size="sm" 
              className="gradient-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  statusFilter === option.value && option.value === 'healthy' && 'bg-success hover:bg-success/90',
                  statusFilter === option.value && option.value === 'warning' && 'bg-warning hover:bg-warning/90 text-warning-foreground',
                  statusFilter === option.value && option.value === 'critical' && 'bg-destructive hover:bg-destructive/90'
                )}
              >
                {option.label}
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                  {option.count}
                </span>
              </Button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {typeOptions.map(option => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={typeFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(option.value)}
                >
                  {Icon && <Icon className="w-4 h-4 mr-1" />}
                  {option.label}
                </Button>
              );
            })}
          </div>

          {/* View Mode */}
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredVehicles.length}</span> of {vehicles.length} vehicles
        </p>
      </div>

      {/* Vehicle Grid */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          : 'space-y-3'
      )}>
        {filteredVehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onClick={() => onVehicleSelect(vehicle.id)}
          />
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="glass-panel p-12 text-center">
          <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          {canAddVehicle && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Vehicle
            </Button>
          )}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AddVehicleModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
};
