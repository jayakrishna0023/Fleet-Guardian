import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Bot,
    Send,
    Sparkles,
    User,
    Loader2,
    RefreshCw,
    Zap,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { aiService } from '@/services/aiService';
import { fleetMLEngine } from '@/services/mlEngine';
import { Vehicle } from '@/types/vehicle';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
}

interface VehicleChatAssistantProps {
    vehicle: Vehicle;
}

export const VehicleChatAssistant = ({ vehicle }: VehicleChatAssistantProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize with comprehensive vehicle data
    useEffect(() => {
        const initializeAssistant = async () => {
            setIsLoading(true);
            console.log('🚗 Loading complete vehicle data for:', vehicle.name);
            
            try {
                // Get complete vehicle context
                const fullContext = getVehicleContext();
                console.log('📊 Vehicle context loaded:', fullContext.substring(0, 200) + '...');
                
                // Send initialization message to AI with full context
                const initResponse = await aiService.chat(
                    `I need you to analyze this specific vehicle. Please confirm you have loaded all the data and provide a brief overview of the vehicle's current status, health, and any immediate concerns.`,
                    fullContext
                );

                setMessages([
                    {
                        id: '1',
                        role: 'assistant',
                        content: initResponse,
                        timestamp: new Date(),
                    }
                ]);
                
                setIsInitialized(true);
                console.log('✅ Vehicle AI Assistant initialized with full context');
            } catch (error) {
                console.error('Failed to initialize assistant:', error);
                setMessages([
                    {
                        id: '1',
                        role: 'assistant',
                        content: `Hello! I'm having trouble loading the complete data for **${vehicle.name}**. I'll use the basic information available. What would you like to know?`,
                        timestamp: new Date(),
                        isError: true,
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        if (!isInitialized) {
            initializeAssistant();
        }
    }, [vehicle.id, isInitialized]);

    // Removed auto-scroll to keep chat static - user can scroll manually

    const getVehicleContext = (): string => {
        // Generate fresh ML predictions
        let predictions = 'No predictions available.';

        try {
            if (vehicle.sensors && vehicle.sensors.tirePressure) {
                const tp = vehicle.sensors.tirePressure;
                const avgTirePressure = typeof tp === 'object'
                    ? (tp.fl + tp.fr + tp.rl + tp.rr) / 4
                    : (tp as number);

                const preds = fleetMLEngine.getVehiclePredictions({
                    engineTemp: vehicle.sensors.engineTemp ?? 80,
                    oilPressure: vehicle.sensors.oilPressure ?? 40,
                    mileage: vehicle.mileage ?? 0,
                    vehicleAge: 3,
                    batteryVoltage: vehicle.sensors.batteryVoltage ?? 12.5,
                    tirePressure: avgTirePressure,
                    engineHours: (vehicle.mileage ?? 0) / 40,
                });

                predictions = preds.map(p =>
                    `- ${p.component}: Risk ${p.probability.toFixed(1)}%, ${p.recommendation}`
                ).join('\n');
            }
        } catch (e) {
            console.error('Prediction error:', e);
        }

        // Get tire pressure details
        const tirePressure = vehicle.sensors?.tirePressure;
        const tireDetails = typeof tirePressure === 'object'
            ? `FL: ${tirePressure.fl} psi, FR: ${tirePressure.fr} psi, RL: ${tirePressure.rl} psi, RR: ${tirePressure.rr} psi`
            : `${tirePressure ?? 'N/A'} psi`;

        // Get tire health if available
        const tireHealth = vehicle.tireHealth;
        const tireHealthDetails = tireHealth
            ? `FL: ${tireHealth.fl}%, FR: ${tireHealth.fr}%, RL: ${tireHealth.rl}%, RR: ${tireHealth.rr}%`
            : 'Not monitored';

        // Get maintenance info
        const maintenance = vehicle.maintenanceInfo;
        const maintenanceDetails = maintenance ? `
- Last Oil Change: ${maintenance.lastOilChange ? new Date(maintenance.lastOilChange).toLocaleDateString() : 'Not recorded'}
- Next Oil Change Due: ${maintenance.nextOilChangeDue ? `${maintenance.nextOilChangeDue} km` : 'Not scheduled'}
- Last Tyre Change: ${maintenance.lastTyreChange ? new Date(maintenance.lastTyreChange).toLocaleDateString() : 'Not recorded'}
- Last Brake Service: ${maintenance.lastBrakeService ? new Date(maintenance.lastBrakeService).toLocaleDateString() : 'Not recorded'}
- Last Full Service: ${maintenance.lastFullService ? new Date(maintenance.lastFullService).toLocaleDateString() : 'Not recorded'}
- Insurance Expiry: ${maintenance.insuranceExpiry ? new Date(maintenance.insuranceExpiry).toLocaleDateString() : 'Not recorded'}
- Registration Expiry: ${maintenance.registrationExpiry ? new Date(maintenance.registrationExpiry).toLocaleDateString() : 'Not recorded'}
- Pollution Certificate: ${maintenance.pollutionCertExpiry ? new Date(maintenance.pollutionCertExpiry).toLocaleDateString() : 'Not recorded'}` : '- No maintenance records available';

        // Construct comprehensive context with ALL vehicle details
        return `=== COMPLETE VEHICLE DATA FOR ${vehicle.name} ===

📋 BASIC INFORMATION:
- Vehicle Name: ${vehicle.name}
- Type: ${vehicle.type.toUpperCase()}
- License Plate: ${vehicle.licensePlate}
- Manufacturer: ${vehicle.manufacturer || 'Not specified'}
- Model: ${vehicle.model || 'Not specified'}
- Year: ${vehicle.year || 'Not specified'}
- VIN/Chassis: ${vehicle.chassisNumber || vehicle.engineNumber || 'Not specified'}
- Engine Number: ${vehicle.engineNumber || 'Not specified'}
- Owner: ${vehicle.ownerName || 'Fleet'} (ID: ${vehicle.ownerId || 'N/A'})
- Driver: ${vehicle.driver || 'Not assigned'}

🔧 OPERATIONAL STATUS:
- Current Status: ${vehicle.status.toUpperCase()}
- Health Score: ${vehicle.healthScore}%
- Mileage: ${vehicle.mileage?.toLocaleString() || '0'} km
- Fuel Type: ${vehicle.fuelType || 'Not specified'}
- Fuel Efficiency: ${vehicle.fuelEfficiency || 'N/A'} km/L
- Last Maintenance: ${vehicle.lastMaintenance ? new Date(vehicle.lastMaintenance).toLocaleDateString() : 'Not recorded'}
- Next Maintenance: ${vehicle.nextMaintenance ? new Date(vehicle.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
- Engine Temperature: ${vehicle.engineTemperature || vehicle.sensors?.engineTemp || 'N/A'}°C
- Last Updated: ${vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleString() : 'Unknown'}

📍 LOCATION:
- Latitude: ${vehicle.location?.lat || 'N/A'}
- Longitude: ${vehicle.location?.lng || 'N/A'}
- Address: ${vehicle.location?.address || 'Not available'}
- Location Updated: ${vehicle.location?.timestamp ? new Date(vehicle.location.timestamp).toLocaleString() : 'Unknown'}

🔬 DETAILED SENSOR READINGS:
- Engine Temperature: ${vehicle.sensors?.engineTemp ?? 'N/A'}°C
- Oil Pressure: ${vehicle.sensors?.oilPressure ?? 'N/A'} psi
- Battery Voltage: ${vehicle.sensors?.batteryVoltage ?? 'N/A'} V
- Fuel Level: ${vehicle.sensors?.fuelLevel ?? 'N/A'}%
- Brake Wear: ${vehicle.sensors?.brakeWear ?? 'N/A'}%
- Coolant Level: ${vehicle.sensors?.coolantLevel ?? 'N/A'}%
- Tire Pressures: ${tireDetails}
- Tire Health: ${tireHealthDetails}

🛠️ MAINTENANCE RECORDS:
${maintenanceDetails}

🚨 ACTIVE ALERTS (${vehicle.alerts?.length || 0}):
${vehicle.alerts?.length > 0 ? vehicle.alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.message} (${a.type})`).join('\n') : '✓ No active alerts'}

🚗 TRIP HISTORY (${vehicle.trips?.length || 0} trips):
${vehicle.trips?.length > 0 ? vehicle.trips.slice(0, 5).map((t, i) => 
    `${i + 1}. ${t.startLocation?.address || 'Unknown'} → ${t.endLocation?.address || 'Unknown'}\n   Distance: ${t.distanceTraveled || t.mileage || 0} km, Duration: ${t.endTime && t.startTime ? Math.round((new Date(t.endTime).getTime() - new Date(t.startTime).getTime()) / 60000) : 'N/A'} min\n   Fuel: ${t.fuelConsumed || 'N/A'} L, Efficiency: ${t.fuelEfficiency || 'N/A'} km/L, Max Speed: ${t.maxSpeed || 'N/A'} km/h`
).join('\n') : '- No trips recorded'}

🤖 ML PREDICTIVE ANALYSIS:
${predictions}

💡 ADDITIONAL NOTES:
${vehicle.description || 'No additional notes available'}

=== END OF VEHICLE DATA ===`;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Always provide complete vehicle context with every message
            const fullContext = getVehicleContext();
            console.log('📤 Sending message with full vehicle context');
            const response = await aiService.chat(input, fullContext);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to the AI brain. Please try again.",
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] glass-panel bg-secondary/10">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-sm">Vehicle AI Assistant</h3>
                    {isInitialized && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Data Loaded
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            aiService.resetConversation();
                            setIsInitialized(false);
                            setMessages([]);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        title="Reload vehicle data"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Reload
                    </button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span>Groq Powered</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isInitialized && messages.length === 0 && isLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Loading Complete Vehicle Data...</p>
                            <p className="text-xs text-muted-foreground">
                                Analyzing sensors, trips, alerts, and ML predictions for<br />
                                <strong>{vehicle.name}</strong>
                            </p>
                        </div>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'assistant' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                        )}>
                            {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                            msg.role === 'assistant'
                                ? "bg-secondary text-foreground rounded-tl-none"
                                : "bg-primary text-primary-foreground rounded-tr-none",
                            msg.isError && "border border-red-500/50"
                        )}>
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {msg.content.split('\n').map((line, i) => {
                                    // Handle bold text **text**
                                    const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                    return (
                                        <p 
                                            key={i} 
                                            className={cn(line === '' && 'h-2')}
                                            dangerouslySetInnerHTML={{ __html: boldProcessed }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && isInitialized && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing vehicle data...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask specific questions about this vehicle..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="bg-purple-600 hover:bg-purple-500 text-white"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
