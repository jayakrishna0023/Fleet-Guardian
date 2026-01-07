import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardView } from '@/components/views/DashboardView';
import { VehiclesView } from '@/components/views/VehiclesView';
import { AlertsView } from '@/components/views/AlertsView';
import { PredictionsView } from '@/components/views/PredictionsView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { ReportsView } from '@/components/views/ReportsView';
import { UploadView } from '@/components/views/UploadView';
import { VehicleDetailView } from '@/components/views/VehicleDetailView';
import { AdminView } from '@/components/views/AdminView';
import { LoginModal } from '@/components/auth/LoginModal';
import LuminaHero from '@/components/landing/LuminaHero';
import LandingPage from '@/components/landing/LandingPage';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Loader2 } from 'lucide-react';

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Fleet Dashboard', subtitle: 'Real-time fleet intelligence and predictive insights' },
  vehicles: { title: 'Fleet Vehicles', subtitle: 'Manage and monitor all vehicles in your fleet' },
  alerts: { title: 'Alert Center', subtitle: 'Monitor and respond to system alerts' },
  predictions: { title: 'Predictive Maintenance', subtitle: 'ML-powered failure predictions and recommendations' },
  analytics: { title: 'Fleet Analytics', subtitle: 'Performance metrics and trend analysis' },
  reports: { title: 'Reports', subtitle: 'Generate and download fleet reports' },
  upload: { title: 'Data Upload', subtitle: 'Import vehicle trip and sensor data' },
  admin: { title: 'Admin Panel', subtitle: 'Manage users and vehicle approvals' },
};

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { alerts } = useData();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const activeAlerts = alerts.filter(a => !a.acknowledged).length;

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Fleet Guardian...</p>
        </div>
      </div>
    );
  }

  // Show landing page with login for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="relative">
        {/* Professional Landing Page */}
        <LandingPage onNavigateToLogin={() => setShowLogin(true)} />

        {/* Login Modal */}
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      </div>
    );
  }

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleBackFromVehicle = () => {
    setSelectedVehicleId(null);
  };

  const renderView = () => {
    // If a vehicle is selected, show the detail view
    if (selectedVehicleId) {
      return (
        <VehicleDetailView
          vehicleId={selectedVehicleId}
          onBack={handleBackFromVehicle}
        />
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <LuminaHero />
            <DashboardView onVehicleSelect={handleVehicleSelect} />
          </div>
        );
      case 'vehicles':
        return <VehiclesView onVehicleSelect={handleVehicleSelect} />;
      case 'alerts':
        return <AlertsView />;
      case 'predictions':
        return <PredictionsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'reports':
        return <ReportsView />;
      case 'upload':
        return <UploadView />;
      case 'admin':
        return <AdminView />;
      default:
        return <DashboardView onVehicleSelect={handleVehicleSelect} />;
    }
  };

  const currentViewInfo = selectedVehicleId
    ? { title: 'Vehicle Details', subtitle: 'Detailed vehicle analysis and history' }
    : viewTitles[activeView] || viewTitles.dashboard;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setSelectedVehicleId(null);
        }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user?.role}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          title={currentViewInfo.title}
          subtitle={currentViewInfo.subtitle}
          alertCount={activeAlerts}
        />

        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Index;
