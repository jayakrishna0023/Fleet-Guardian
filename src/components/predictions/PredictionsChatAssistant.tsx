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
    Brain,
    Zap
} from 'lucide-react';
import { groqService } from '@/services/groqService';
import { useData } from '@/context/DataContext';
import { fleetMLEngine } from '@/services/mlEngine';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
}

const QUICK_QUESTIONS = [
    { label: '🔮 Predict failures', query: 'Which vehicles are most likely to fail soon and why?' },
    { label: '🔧 Maintenance plan', query: 'Create a maintenance schedule for the next 30 days' },
    { label: '⚠️ Risk analysis', query: 'Analyze the highest risk components across my fleet' },
    { label: '📊 Fleet health', query: 'Give me a comprehensive fleet health summary' },
];

export const PredictionsChatAssistant = () => {
    const { vehicles, predictions, fleetStats } = useData();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `🧠 **Predictive Analytics Assistant**

I have access to your fleet's ML predictions and can help you:
• Understand failure probability scores
• Plan preventive maintenance
• Identify high-risk vehicles
• Explain prediction confidence levels

What would you like to analyze?`,
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

    const buildPredictionContext = (): string => {
        const predictionSummary: string[] = [];

        predictions.forEach((preds, vehicleId) => {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle) return;

            const riskySystems = preds.filter(p => p.probability > 40);
            if (riskySystems.length > 0) {
                predictionSummary.push(`\n**${vehicle.name}** (${vehicle.licensePlate}):`);
                riskySystems.forEach(p => {
                    predictionSummary.push(`  - ${p.component}: ${p.probability}% risk, ${p.daysUntilFailure} days until potential failure`);
                    predictionSummary.push(`    Recommendation: ${p.recommendation}`);
                });
            }
        });

        return `Fleet Prediction Data:
Total Vehicles: ${fleetStats.totalVehicles}
Operational: ${fleetStats.operationalCount}
In Maintenance: ${fleetStats.maintenanceCount}
Average Health Score: ${fleetStats.avgHealthScore?.toFixed(1) ?? 0}%
Critical Alerts: ${fleetStats.criticalAlerts}

ML Predictions Summary:
${predictionSummary.length > 0 ? predictionSummary.join('\n') : 'No high-risk predictions at this time.'}`;
    };

    const handleSend = async (queryOverride?: string) => {
        const query = queryOverride || input;
        if (!query.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const context = buildPredictionContext();
            const response = await groqService.chat(query, context);

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
                content: "I'm having trouble connecting to the AI service. Please check your Groq API key.",
                timestamp: new Date(),
                isError: true,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetChat = () => {
        groqService.resetConversation();
        setMessages([{
            id: '1',
            role: 'assistant',
            content: `🧠 **Predictive Analytics Assistant**

I have access to your fleet's ML predictions and can help you:
• Understand failure probability scores
• Plan preventive maintenance
• Identify high-risk vehicles
• Explain prediction confidence levels

What would you like to analyze?`,
            timestamp: new Date(),
        }]);
    };

    return (
        <div className="glass-panel flex flex-col h-[500px] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 relative animate-pulse-scale">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <Zap className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1" />
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            Predictions AI
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">ML Powered</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">Ask about failure predictions & maintenance</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetChat} title="Reset conversation">
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            'flex gap-3 stagger-item',
                            message.role === 'user' && 'flex-row-reverse'
                        )}
                    >
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            message.role === 'assistant' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                        )}>
                            {message.role === 'assistant' ? (
                                <Bot className="w-4 h-4 text-purple-400" />
                            ) : (
                                <User className="w-4 h-4 text-blue-400" />
                            )}
                        </div>
                        <div className={cn(
                            'max-w-[80%] rounded-xl px-4 py-3',
                            message.role === 'assistant'
                                ? 'bg-secondary/50 rounded-tl-none'
                                : 'bg-primary text-primary-foreground rounded-tr-none',
                            message.isError && 'bg-destructive/20 border border-destructive/30'
                        )}>
                            <div className={cn(
                                'text-sm whitespace-pre-wrap',
                                message.role === 'assistant' && 'prose prose-sm prose-invert max-w-none'
                            )}>
                                {message.content.split('\n').map((line, i) => {
                                    let parsedLine = line
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/`(.*?)`/g, '<code class="bg-background/50 px-1 rounded">$1</code>');

                                    return (
                                        <p
                                            key={i}
                                            className={cn(line === '' && 'h-2')}
                                            dangerouslySetInnerHTML={{ __html: parsedLine }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20">
                            <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="bg-secondary/50 rounded-xl rounded-tl-none px-4 py-3">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
                <div className="px-4 pb-2">
                    <div className="flex flex-wrap gap-2">
                        {QUICK_QUESTIONS.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => handleSend(action.query)}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full transition-colors disabled:opacity-50"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about predictions, risks, maintenance..."
                        className="flex-1 px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="bg-purple-600 hover:bg-purple-500"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
