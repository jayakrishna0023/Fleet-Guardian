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
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hello! I'm analyzing the telemetry data for **${vehicle.name}**. I can help you interpret its sensors, explain predictive risks, or suggest maintenance. What would you like to know?`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    vehicleAge: 3, // Approximation if unknown
                    batteryVoltage: vehicle.sensors.batteryVoltage ?? 12.5,
                    tirePressure: avgTirePressure,
                    engineHours: (vehicle.mileage ?? 0) / 40,
                });

                predictions = preds.map(p =>
                    `- ${p.component}: Risk ${p.probability}%, ${p.recommendation}`
                ).join('\n');
            }
        } catch (e) {
            console.error('Prediction error:', e);
        }

        // Construct rich context
        return `Vehicle Analysis Context:
Vehicle: ${vehicle.name} (${vehicle.type})
License: ${vehicle.licensePlate}
Status: ${vehicle.status}
Health Score: ${vehicle.healthScore}%
Mileage: ${vehicle.mileage?.toLocaleString()} km
Fuel Efficiency: ${vehicle.fuelEfficiency} km/L

Current Sensor Readings:
- Engine Temp: ${vehicle.sensors?.engineTemp ?? 'N/A'}°C
- Oil Pressure: ${vehicle.sensors?.oilPressure ?? 'N/A'} psi
- Battery: ${vehicle.sensors?.batteryVoltage ?? 'N/A'} V
- Fuel Level: ${vehicle.sensors?.fuelLevel ?? 'N/A'}%

Active Alerts:
${vehicle.alerts?.map(a => `- [${a.severity}] ${a.message}`).join('\n') || 'None'}

ML Failure Predictions:
${predictions}`;
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
            const context = getVehicleContext();
            const response = await aiService.chat(input, context);

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
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>Groq Powered</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                : "bg-primary text-primary-foreground rounded-tr-none"
                        )}>
                            <div className={cn("whitespace-pre-wrap leading-relaxed", msg.role === 'assistant' && "prose prose-invert prose-sm max-w-none")}>
                                {msg.content.split('\n').map((line, i) => (
                                    <p key={i} className={cn(line === '' && 'h-2')}>
                                        {line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
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
