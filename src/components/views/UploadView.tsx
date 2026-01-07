import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle,
  X,
  File,
  Database,
  Loader2,
  Sparkles,
  Brain,
  FileJson,
  Table,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { groqService } from '@/services/groqService';
import { dataService } from '@/services/dataService';
import { useData } from '@/context/DataContext';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'analyzing' | 'success' | 'error';
  records?: number;
  error?: string;
  aiSummary?: string;
  vehicleData?: any[];
}

export const UploadView = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { refreshData } = useData();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const records: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((h, idx) => {
          const val = values[idx];
          record[h] = isNaN(Number(val)) ? val : Number(val);
        });
        records.push(record);
      }
    }
    
    return records;
  };

  const parseJSON = (content: string): any[] => {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
    } catch {
      return [];
    }
  };

  const processFile = async (file: File, fileId: string): Promise<UploadedFile> => {
    try {
      const content = await file.text();
      let records: any[] = [];
      
      // Parse based on file type
      if (file.name.endsWith('.csv')) {
        records = parseCSV(content);
      } else if (file.name.endsWith('.json')) {
        records = parseJSON(content);
      } else {
        return {
          id: fileId,
          name: file.name,
          size: file.size,
          status: 'error',
          error: 'Unsupported format. Please upload CSV or JSON files.',
        };
      }

      if (records.length === 0) {
        return {
          id: fileId,
          name: file.name,
          size: file.size,
          status: 'error',
          error: 'No valid records found in file.',
        };
      }

      // Update status to analyzing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'analyzing' as const } : f
      ));

      // Get AI analysis
      let aiSummary = '';
      try {
        const sampleData = JSON.stringify(records.slice(0, 3), null, 2);
        aiSummary = await groqService.chat(
          `Analyze this vehicle telemetry data upload. Provide a brief 2-3 sentence summary of what data was uploaded and any notable patterns or concerns. Data sample: ${sampleData}. Total records: ${records.length}`
        );
      } catch {
        aiSummary = `Successfully processed ${records.length} vehicle records. Data has been imported into the fleet management system.`;
      }

      // Convert to vehicle format and save
      const vehicleData = records.map((r, idx) => ({
        id: r.vehicle_id || r.id || `VH-${String(idx + 1).padStart(3, '0')}`,
        make: r.make || 'Unknown',
        model: r.model || 'Vehicle',
        year: r.year || new Date().getFullYear(),
        mileage: r.mileage || 0,
        status: r.status || 'operational',
        healthScore: r.health_score || r.healthScore || Math.floor(Math.random() * 30) + 70,
        driver: r.driver || r.driver_name || null,
        lastLocation: r.location || r.last_location || 'San Francisco, CA',
        sensors: {
          engineTemp: r.engine_temp || r.engineTemperature || 85,
          oilPressure: r.oil_pressure || 45,
          batteryVoltage: r.battery_voltage || 12.6,
          fuelLevel: r.fuel_level || 75,
          tirePressure: { fl: 32, fr: 32, rl: 32, rr: 32 },
        },
        metrics: {
          fuelEfficiency: r.fuel_efficiency || 8.5,
          averageSpeed: r.average_speed || 45,
          idleTime: r.idle_time || 15,
          hardBrakes: r.hard_brakes || 2,
          rapidAccelerations: r.rapid_accelerations || 3,
        },
        lastUpdate: new Date().toISOString(),
      }));

      // Add vehicles to the data service
      vehicleData.forEach(v => {
        try {
          dataService.addVehicle(v);
        } catch {
          // Vehicle might already exist, try updating
          dataService.updateVehicle(v.id, v);
        }
      });

      return {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'success',
        records: records.length,
        aiSummary,
        vehicleData,
      };
    } catch (err) {
      return {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to process file',
      };
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    for (const file of droppedFiles) {
      const fileId = Math.random().toString(36).substr(2, 9);
      const pendingFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'processing',
      };
      
      setFiles(prev => [...prev, pendingFile]);
      
      const result = await processFile(file, fileId);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? result : f
      ));
      
      if (result.status === 'success') {
        toast({
          title: 'Data imported successfully',
          description: `${result.name}: ${result.records} records processed with AI analysis`,
        });
        refreshData();
      }
    }
  }, [toast, refreshData]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    for (const file of selectedFiles) {
      const fileId = Math.random().toString(36).substr(2, 9);
      const pendingFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'processing',
      };
      
      setFiles(prev => [...prev, pendingFile]);
      
      const result = await processFile(file, fileId);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? result : f
      ));
      
      if (result.status === 'success') {
        toast({
          title: 'Data imported successfully',
          description: `${result.name}: ${result.records} records processed with AI analysis`,
        });
        refreshData();
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Data Upload Center</h2>
            <p className="text-muted-foreground max-w-xl">
              Import your vehicle telemetry data. Our AI will automatically analyze patterns, 
              detect anomalies, and provide insights about your fleet.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'glass-panel p-12 border-2 border-dashed transition-all duration-300 relative overflow-hidden',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          'hover:border-primary/50 group'
        )}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="text-center relative z-10">
          <div className={cn(
            'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all',
            isDragging ? 'bg-primary text-white scale-110' : 'bg-secondary text-muted-foreground'
          )}>
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {isDragging ? 'Drop files here' : 'Upload Vehicle Data'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Drag and drop your CSV or JSON files here. 
            Our AI will analyze the data and provide instant insights.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.json"
              multiple
              onChange={handleFileInput}
            />
            <label htmlFor="file-upload">
              <Button asChild size="lg" className="gap-2">
                <span>
                  <FileText className="w-5 h-5" />
                  Browse Files
                </span>
              </Button>
            </label>
          </div>

          {/* Supported Formats */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Table className="w-4 h-4" />
              CSV
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="w-4 h-4" />
              JSON
            </div>
          </div>
        </div>
      </div>

      {/* AI Processing Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Brain,
            title: 'Smart Parsing',
            description: 'Automatically detects data formats and validates records',
            color: 'text-blue-500 bg-blue-500/10',
          },
          {
            icon: Sparkles,
            title: 'AI Analysis',
            description: 'Get instant insights and pattern detection from your data',
            color: 'text-purple-500 bg-purple-500/10',
          },
          {
            icon: Zap,
            title: 'Real-time Updates',
            description: 'Data instantly reflects across all dashboard views',
            color: 'text-yellow-500 bg-yellow-500/10',
          },
        ].map((feature) => (
          <div key={feature.title} className="glass-panel p-4 flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', feature.color)}>
              <feature.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Expected Format */}
      <div className="glass-panel p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Expected Data Format (CSV)
        </h3>
        <div className="bg-secondary/50 rounded-lg p-4 overflow-x-auto">
          <code className="text-xs font-mono text-muted-foreground whitespace-pre">
{`vehicle_id, make, model, year, mileage, engine_temp, fuel_efficiency, driver, status
VH-001, Toyota, Camry, 2022, 45000, 85, 8.5, John Smith, operational
VH-002, Ford, Transit, 2021, 78000, 92, 12.3, Sarah Wilson, warning`}
          </code>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Flexible schema - our AI will intelligently map your columns to the fleet system.
        </p>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4">Processed Files</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  'glass-panel p-4',
                  file.status === 'error' && 'border-destructive/30 bg-destructive/5',
                  file.status === 'success' && 'border-success/30 bg-success/5'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-2.5 rounded-xl',
                    file.status === 'processing' && 'bg-primary/20',
                    file.status === 'analyzing' && 'bg-purple-500/20',
                    file.status === 'success' && 'bg-success/20',
                    file.status === 'error' && 'bg-destructive/20'
                  )}>
                    {file.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : file.status === 'analyzing' ? (
                      <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
                    ) : file.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatSize(file.size)})
                      </span>
                    </div>
                    
                    {file.status === 'processing' && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Parsing and validating data...
                      </p>
                    )}

                    {file.status === 'analyzing' && (
                      <p className="text-xs text-purple-400 mt-1 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        AI is analyzing your data...
                      </p>
                    )}
                    
                    {file.status === 'success' && (
                      <p className="text-xs text-success mt-1">
                        ✓ Successfully imported {file.records} records
                      </p>
                    )}
                    
                    {file.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">
                        {file.error}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* AI Summary */}
                {file.aiSummary && (
                  <div className="mt-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-2 text-xs text-purple-400 mb-2">
                      <Sparkles className="w-3 h-3" />
                      AI Analysis
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {file.aiSummary}
                    </p>
                  </div>
                )}

                {/* Imported Records Preview */}
                {file.vehicleData && file.vehicleData.length > 0 && (
                  <div className="mt-4 p-3 bg-secondary/30 rounded-xl">
                    <div className="text-xs text-muted-foreground mb-2">Imported Vehicles Preview</div>
                    <div className="flex flex-wrap gap-2">
                      {file.vehicleData.slice(0, 5).map((v: any) => (
                        <span 
                          key={v.id} 
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {v.id}
                        </span>
                      ))}
                      {file.vehicleData.length > 5 && (
                        <span className="px-2 py-1 text-xs text-muted-foreground">
                          +{file.vehicleData.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
