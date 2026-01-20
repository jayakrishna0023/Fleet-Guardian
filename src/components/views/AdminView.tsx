import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { DatabaseTestPanel } from '@/components/admin/DatabaseTestPanel';
import { 
  Users, 
  Car, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  UserCheck,
  UserX,
  ChevronDown,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Building2,
  Calendar,
  BarChart3,
  Activity,
  MapPin,
  Loader2,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { UserRole } from '@/types/auth';

type AdminTab = 'users' | 'vehicles' | 'stats' | 'tests';

export const AdminView = () => {
  const { user, getAllUsers, approveUser, rejectUser, updateUserRole } = useAuth();
  const { vehicleRequests, approveVehicleRequest, rejectVehicleRequest, vehicles } = useData();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  const [loadingVehicles, setLoadingVehicles] = useState<Set<string>>(new Set());

  const handleApproveUser = async (userId: string) => {
    console.log('🔵 BUTTON CLICKED: handleApproveUser called with userId:', userId);
    setLoadingUsers(prev => new Set(prev).add(userId));
    try {
      await approveUser(userId);
      console.log('User approved successfully:', userId);
    } catch (error) {
      console.error('Failed to approve user:', error);
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    console.log('🔴 BUTTON CLICKED: handleRejectUser called with userId:', userId);
    setLoadingUsers(prev => new Set(prev).add(userId));
    try {
      await rejectUser(userId);
      console.log('User rejected successfully:', userId);
    } catch (error) {
      console.error('Failed to reject user:', error);
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleApproveVehicle = async (requestId: string) => {
    console.log('🚗 BUTTON CLICKED: handleApproveVehicle called with requestId:', requestId);
    setLoadingVehicles(prev => new Set(prev).add(requestId));
    try {
      await approveVehicleRequest(requestId);
      console.log('Vehicle approved successfully:', requestId);
    } catch (error) {
      console.error('Failed to approve vehicle:', error);
    } finally {
      setLoadingVehicles(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleRejectVehicle = async (requestId: string) => {
    console.log('🚫 BUTTON CLICKED: handleRejectVehicle called with requestId:', requestId);
    setLoadingVehicles(prev => new Set(prev).add(requestId));
    try {
      await rejectVehicleRequest(requestId);
      console.log('Vehicle rejected successfully:', requestId);
    } catch (error) {
      console.error('Failed to reject vehicle:', error);
    } finally {
      setLoadingVehicles(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const users = getAllUsers();
  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const pendingVehicles = vehicleRequests.filter(r => r.status === 'pending');

  // Calculate user statistics with vehicle counts
  const userStats = useMemo(() => {
    return users.map(u => {
      const userVehicles = vehicles.filter(v => v.ownerId === u.id);
      const userTrips = userVehicles.reduce((acc, v) => acc + (v.trips?.length || 0), 0);
      return {
        ...u,
        vehicleCount: userVehicles.length,
        tripCount: userTrips,
        vehicles: userVehicles,
      };
    });
  }, [users, vehicles]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = userFilter === 'all' || u.status === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredVehicleRequests = vehicleRequests.filter(r => {
    const matchesFilter = vehicleFilter === 'all' || r.status === vehicleFilter;
    return matchesFilter;
  });

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-destructive/20 text-destructive border-destructive/30',
    manager: 'bg-primary/20 text-primary border-primary/30',
    operator: 'bg-success/20 text-success border-success/30',
    viewer: 'bg-muted text-muted-foreground border-border',
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-panel p-12 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access the admin panel. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Users</span>
          </div>
          <p className="text-3xl font-bold font-mono">{users.length}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <UserCheck className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Active Users</span>
          </div>
          <p className="text-3xl font-bold font-mono text-success">{approvedUsers.length}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Pending Users</span>
          </div>
          <p className="text-3xl font-bold font-mono text-warning">{pendingUsers.length}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Vehicles</span>
          </div>
          <p className="text-3xl font-bold font-mono">{vehicles.length}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Clock className="w-5 h-5 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Pending Vehicles</span>
          </div>
          <p className="text-3xl font-bold font-mono text-destructive">{pendingVehicles.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-1 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'users' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Users className="w-4 h-4" />
          User Management
          {pendingUsers.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-warning text-warning-foreground">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'vehicles' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Car className="w-4 h-4" />
          Vehicle Requests
          {pendingVehicles.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-warning text-warning-foreground">
              {pendingVehicles.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'stats' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <BarChart3 className="w-4 h-4" />
          User Statistics
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'tests' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-secondary'
          )}
        >
          <Database className="w-4 h-4" />
          Database Tests
        </button>
      </div>

      {/* Database Tests Tab */}
      {activeTab === 'tests' && <DatabaseTestPanel />}

      {/* User Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="glass-panel p-4">
            <h3 className="font-semibold mb-4">Users & Their Vehicles</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Vehicles</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Total Trips</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Last Login</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Login Count</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.filter(u => u.status === 'approved').map(u => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium text-sm">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          'px-2 py-1 rounded-lg border text-xs font-medium',
                          roleColors[u.role]
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{u.vehicleCount}</span>
                        </div>
                        {u.vehicles.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {u.vehicles.slice(0, 2).map(v => v.licensePlate).join(', ')}
                            {u.vehicles.length > 2 && ` +${u.vehicles.length - 2} more`}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono">{u.tripCount}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {u.lastLogin ? format(new Date(u.lastLogin), 'MMM dd, HH:mm') : 'Never'}
                      </td>
                      <td className="p-3">
                        <span className="font-mono">{u.loginCount || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Ownership Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Vehicles by Owner
              </h3>
              <div className="space-y-3">
                {userStats
                  .filter(u => u.vehicleCount > 0)
                  .sort((a, b) => b.vehicleCount - a.vehicleCount)
                  .slice(0, 5)
                  .map(u => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                          {u.name.charAt(0)}
                        </div>
                        <span className="text-sm">{u.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min((u.vehicleCount / vehicles.length) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono w-8 text-right">{u.vehicleCount}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="glass-panel p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Most Active Users
              </h3>
              <div className="space-y-3">
                {userStats
                  .filter(u => u.tripCount > 0)
                  .sort((a, b) => b.tripCount - a.tripCount)
                  .slice(0, 5)
                  .map(u => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-xs font-medium">
                          {u.name.charAt(0)}
                        </div>
                        <span className="text-sm">{u.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{u.tripCount} trips</span>
                      </div>
                    </div>
                  ))}
                {userStats.filter(u => u.tripCount > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No trip data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(filter => (
                <Button
                  key={filter}
                  variant={userFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Department</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                          disabled={u.id === user?.id}
                          className={cn(
                            'px-2 py-1 rounded-lg border text-xs font-medium bg-transparent cursor-pointer',
                            roleColors[u.role]
                          )}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="operator">Operator</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          u.status === 'approved' && 'bg-success/20 text-success',
                          u.status === 'pending' && 'bg-warning/20 text-warning',
                          u.status === 'rejected' && 'bg-destructive/20 text-destructive',
                          u.status === 'suspended' && 'bg-muted text-muted-foreground'
                        )}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{u.department || '-'}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDistanceToNow(u.createdAt, { addSuffix: true })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-success border-success/30 hover:bg-success/10"
                                onClick={() => handleApproveUser(u.id)}
                                disabled={loadingUsers.has(u.id)}
                              >
                                {loadingUsers.has(u.id) ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleRejectUser(u.id)}
                                disabled={loadingUsers.has(u.id)}
                              >
                                {loadingUsers.has(u.id) ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <UserX className="w-4 h-4 mr-1" />
                                )}
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Requests Tab */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-4 flex gap-2">
            {['pending', 'approved', 'rejected', 'all'].map(filter => (
              <Button
                key={filter}
                variant={vehicleFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVehicleFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>

          {/* Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVehicleRequests.map(request => (
              <div key={request.id} className="glass-panel p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{request.vehicleData.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {request.vehicleData.licensePlate}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    request.status === 'approved' && 'bg-success/20 text-success',
                    request.status === 'pending' && 'bg-warning/20 text-warning',
                    request.status === 'rejected' && 'bg-destructive/20 text-destructive'
                  )}>
                    {request.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{request.vehicleData.type}</span>
                  </div>
                  {request.vehicleData.manufacturer && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Make/Model</span>
                      <span>{request.vehicleData.manufacturer} {request.vehicleData.model}</span>
                    </div>
                  )}
                  {request.vehicleData.year && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Year</span>
                      <span>{request.vehicleData.year}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Requested By</span>
                    <span>{request.requestedByName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{format(request.requestedAt, 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t border-border/50">
                    <Button
                      size="sm"
                      className="flex-1 bg-success hover:bg-success/90"
                      onClick={() => handleApproveVehicle(request.id)}
                      disabled={loadingVehicles.has(request.id)}
                    >
                      {loadingVehicles.has(request.id) ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleRejectVehicle(request.id)}
                      disabled={loadingVehicles.has(request.id)}
                    >
                      {loadingVehicles.has(request.id) ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  </div>
                )}

                {request.notes && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm">
                    <p className="text-muted-foreground">{request.notes}</p>
                  </div>
                )}
              </div>
            ))}

            {filteredVehicleRequests.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No vehicle requests found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
