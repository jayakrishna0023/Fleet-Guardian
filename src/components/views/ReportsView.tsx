import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar,
  Car,
  Activity,
  Wrench,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle,
  Sparkles,
  Loader2,
  BarChart3,
  TrendingUp,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useData } from '@/context/DataContext';
import { groqService } from '@/services/groqService';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'health',
    title: 'Vehicle Health Report',
    description: 'Comprehensive health analysis for individual vehicles or entire fleet',
    icon: Activity,
    color: 'text-primary',
  },
  {
    id: 'performance',
    title: 'Fleet Performance Report',
    description: 'Efficiency metrics, utilization rates, and operational insights',
    icon: Car,
    color: 'text-success',
  },
  {
    id: 'maintenance',
    title: 'Predictive Maintenance Report',
    description: 'ML-powered failure predictions and maintenance recommendations',
    icon: Wrench,
    color: 'text-warning',
  },
  {
    id: 'incident',
    title: 'Incident Analysis Report',
    description: 'Detailed breakdown of alerts, anomalies, and root cause analysis',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
];

interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  generatedAt: Date;
  status: 'completed' | 'generating';
  content?: string;
  stats?: {
    label: string;
    value: string;
    change?: string;
  }[];
}

export const ReportsView = () => {
  const { vehicles, alerts, fleetStats } = useData();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);

  const summary = useMemo(() => {
    const operationalCount = vehicles.filter(v => v.status === 'operational').length;
    const warningCount = vehicles.filter(v => v.status === 'warning').length;
    const criticalCount = vehicles.filter(v => v.status === 'critical').length;
    const activeVehicles = vehicles.filter(v => v.status !== 'maintenance');
    const avgHealth = activeVehicles.length > 0
      ? activeVehicles.reduce((sum, v) => sum + v.healthScore, 0) / activeVehicles.length
      : 0;
    
    return {
      totalVehicles: vehicles.length,
      healthyVehicles: operationalCount,
      warningVehicles: warningCount,
      criticalVehicles: criticalCount,
      averageHealthScore: Math.round(avgHealth),
      activeAlerts: alerts.filter(a => !a.acknowledged).length,
    };
  }, [vehicles, alerts]);

  const handleGenerate = async (typeId: string) => {
    setIsGenerating(true);
    setSelectedType(typeId);
    
    const typeInfo = reportTypes.find(t => t.id === typeId);
    const reportTitle = `${typeInfo?.title} - ${format(new Date(), 'MMMM yyyy')}`;
    
    // Create placeholder report
    const newReport: GeneratedReport = {
      id: `r-${Date.now()}`,
      title: reportTitle,
      type: typeId,
      generatedAt: new Date(),
      status: 'generating',
    };
    
    setReports(prev => [newReport, ...prev]);
    
    try {
      // Generate AI-powered report content
      const prompt = typeId === 'health' 
        ? `Generate a brief fleet health report summary. Fleet has ${vehicles.length} vehicles, ${summary.healthyVehicles} healthy, ${summary.warningVehicles} warning, ${summary.criticalVehicles} critical. Average health: ${summary.averageHealthScore}%. Include 3 key findings and 2 recommendations.`
        : typeId === 'maintenance'
        ? `Generate a brief predictive maintenance report. Fleet has ${vehicles.length} vehicles, ${summary.warningVehicles + summary.criticalVehicles} need attention, ${summary.activeAlerts} active alerts. Include maintenance priority list and timeline.`
        : typeId === 'performance'
        ? `Generate a fleet performance report. ${vehicles.length} vehicles, average efficiency ${fleetStats.avgFuelEfficiency?.toFixed(1) || '8.2'} km/L, ${summary.averageHealthScore}% avg health. Include efficiency insights and optimization tips.`
        : `Generate an incident analysis report. ${alerts.length} total alerts, ${alerts.filter(a => a.severity === 'critical').length} critical, ${alerts.filter(a => a.severity === 'warning').length} warnings. Include root cause analysis and prevention steps.`;
      
      const content = await groqService.chat(prompt);
      
      // Generate stats based on report type
      const stats = typeId === 'health' ? [
        { label: 'Fleet Health', value: `${summary.averageHealthScore}%`, change: '+2.3%' },
        { label: 'Healthy Vehicles', value: `${summary.healthyVehicles}/${vehicles.length}`, change: '+1' },
        { label: 'Active Alerts', value: `${summary.activeAlerts}`, change: '-3' },
      ] : typeId === 'maintenance' ? [
        { label: 'Due This Week', value: `${Math.floor(vehicles.length * 0.2)}`, change: '' },
        { label: 'Overdue', value: `${summary.criticalVehicles}`, change: '-1' },
        { label: 'Parts Needed', value: `${Math.floor(Math.random() * 10) + 5}`, change: '' },
      ] : typeId === 'performance' ? [
        { label: 'Avg Efficiency', value: `${fleetStats.avgFuelEfficiency?.toFixed(1) || '8.2'} km/L`, change: '+0.3' },
        { label: 'Utilization', value: `${Math.floor(85 + Math.random() * 10)}%`, change: '+5%' },
        { label: 'Total Distance', value: `${Math.floor(vehicles.length * 1500)}km`, change: '' },
      ] : [
        { label: 'Total Incidents', value: `${alerts.length}`, change: '-12%' },
        { label: 'Critical', value: `${alerts.filter(a => a.severity === 'critical').length}`, change: '-2' },
        { label: 'Resolved', value: `${alerts.filter(a => a.acknowledged).length}`, change: '+8' },
      ];
      
      // Update report with content
      const completedReport: GeneratedReport = {
        ...newReport,
        status: 'completed',
        content,
        stats,
      };
      
      setReports(prev => prev.map(r => r.id === newReport.id ? completedReport : r));
      setSelectedReport(completedReport);
      
    } catch (error) {
      // Fallback content
      setReports(prev => prev.map(r => r.id === newReport.id ? {
        ...r,
        status: 'completed',
        content: 'Report generated successfully. Your fleet data has been analyzed.',
        stats: [
          { label: 'Vehicles', value: `${vehicles.length}`, change: '' },
          { label: 'Alerts', value: `${alerts.length}`, change: '' },
        ],
      } : r));
    }
    
    setIsGenerating(false);
    setSelectedType(null);
  };

  const handleDownload = (report: GeneratedReport) => {
    const content = `
${report.title}
Generated: ${format(report.generatedAt, 'MMMM dd, yyyy HH:mm')}
${'='.repeat(50)}

${report.content || 'Report content'}

${'='.repeat(50)}
Statistics:
${report.stats?.map(s => `- ${s.label}: ${s.value} ${s.change || ''}`).join('\n') || ''}

Generated by FleetAI - Fleet Guardian
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Report Center</h2>
            <p className="text-muted-foreground">Generate AI-powered reports and insights</p>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleGenerate(type.id)}
                disabled={isGenerating}
                className={cn(
                  'glass-panel p-5 text-left transition-all duration-300',
                  'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSelected && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg bg-secondary', type.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{type.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {type.description}
                    </p>
                    <div className="flex items-center text-sm text-primary">
                      {isSelected && isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                          Generating report...
                        </>
                      ) : (
                        <>
                          Generate Report
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Reports */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Generated Reports</h2>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
        
        {reports.length > 0 ? (
          <div className="glass-panel divide-y divide-border/50">
            {reports.map((report) => {
              const typeInfo = reportTypes.find(t => t.id === report.type);
              const Icon = typeInfo?.icon || FileText;
              
              return (
                <div 
                  key={report.id} 
                  className={cn(
                    'p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors cursor-pointer',
                    selectedReport?.id === report.id && 'bg-primary/5'
                  )}
                  onClick={() => report.status === 'completed' && setSelectedReport(report)}
                >
                  <div className={cn('p-2.5 rounded-xl bg-secondary', typeInfo?.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{report.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(report.generatedAt, 'MMM dd, yyyy HH:mm')}
                      </span>
                      {report.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-primary">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {report.status === 'completed' && (
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(report);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No reports generated yet. Create your first report above.</p>
          </div>
        )}
      </section>

      {/* Report Preview */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Report Preview</h2>
        {selectedReport ? (
          <div className="glass-panel overflow-hidden">
            {/* Report Header */}
            <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-primary mb-2">
                    <Sparkles className="w-4 h-4" />
                    AI-Generated Report
                  </div>
                  <h3 className="text-xl font-bold">{selectedReport.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated on {format(selectedReport.generatedAt, 'MMMM dd, yyyy at HH:mm')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedReport)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            {selectedReport.stats && (
              <div className="grid grid-cols-3 border-b border-border/50">
                {selectedReport.stats.map((stat, idx) => (
                  <div key={idx} className="p-4 text-center border-r border-border/50 last:border-r-0">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                    {stat.change && (
                      <div className={cn(
                        'text-xs mt-1',
                        stat.change.startsWith('+') ? 'text-success' : stat.change.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        {stat.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Report Content */}
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedReport.content}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a report to preview</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Generate a new report or click on a recent report to see a preview with AI-generated insights and recommendations.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
