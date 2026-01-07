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
  AlertCircle,
  Zap
} from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useData } from '@/context/DataContext';
import { fleetMLEngine } from '@/services/mlEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm **FleetAI**, your intelligent fleet management assistant powered by **Groq AI**. 

I can help you with:

• 🔧 **Vehicle Health Analysis** - Understanding health scores and sensor data
• 🔮 **Predictive Maintenance** - ML-powered failure predictions
• 📊 **Fleet Analytics** - Performance insights and trends
• ⚠️ **Alert Investigation** - Understanding and resolving issues
• 💡 **Optimization Tips** - Fuel efficiency and route suggestions

I have access to real-time telemetry data and trained ML models running directly in your browser. What would you like to know about your fleet?`,
    timestamp: new Date(),
  },
];

// Quick action suggestions
const QUICK_ACTIONS = [
  { label: '📊 Fleet Overview', query: 'Give me a complete overview of my fleet status' },
  { label: '⚠️ Active Alerts', query: 'What are the current alerts I should focus on?' },
  { label: '🔧 Maintenance Due', query: 'Which vehicles need maintenance soon?' },
  { label: '🔮 Predictions', query: 'What are the ML predictions for potential failures?' },
];

export const AIAssistant = () => {
  const { vehicles, alerts, fleetStats } = useData();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize ML engine on component mount
  useEffect(() => {
    const initML = async () => {
      try {
        await fleetMLEngine.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize ML engine:', error);
      }
    };
    initML();
  }, []);

  // Get current fleet context for the AI
  const getFleetContext = (): string => {
    const activeAlerts = alerts.filter(a => !a.acknowledged);

    // Get ML predictions for critical vehicles
    const criticalVehicles = vehicles.filter(v =>
      (v.status === 'warning' || v.status === 'critical') && v.sensors
    );
    let predictions = '';

    if (isInitialized && criticalVehicles.length > 0) {
      predictions = '\n\nML Predictions for Critical Vehicles:\n';
      criticalVehicles.slice(0, 3).forEach(v => {
        try {
          if (!v.sensors || !v.sensors.tirePressure) return;

          const tp = v.sensors.tirePressure;
          const avgTirePressure = typeof tp === 'object'
            ? (tp.fl + tp.fr + tp.rl + tp.rr) / 4
            : (tp as number);
          const preds = fleetMLEngine.getVehiclePredictions({
            engineTemp: v.sensors.engineTemp ?? 80,
            oilPressure: v.sensors.oilPressure ?? 40,
            mileage: v.mileage ?? 0,
            vehicleAge: 3,
            batteryVoltage: v.sensors.batteryVoltage ?? 12.5,
            tirePressure: avgTirePressure,
            engineHours: (v.mileage ?? 0) / 40,
          });
          predictions += `\n${v.name}: Engine Risk ${preds[0].probability}%, Brake Risk ${preds[1].probability}%, Battery Risk ${preds[2].probability}%`;
        } catch (error) {
          console.error(`Error predicting for vehicle ${v.name}:`, error);
        }
      });
    }

    return `Fleet Status Summary:
- Total Vehicles: ${fleetStats.totalVehicles}
- Operational: ${fleetStats.operationalCount}
- In Maintenance: ${fleetStats.maintenanceCount}
- Average Health Score: ${fleetStats.avgHealthScore?.toFixed(1) ?? 0}%
- Active Alerts: ${fleetStats.totalAlerts} (${fleetStats.criticalAlerts} critical, ${fleetStats.warningAlerts} warning)
- Average Fuel Efficiency: ${fleetStats.avgFuelEfficiency?.toFixed(1) ?? 0} km/L
- Total Fleet Mileage: ${fleetStats.totalMileage.toLocaleString()} km

Vehicles with Issues:
${vehicles.filter(v => v.status !== 'operational').map(v => {
      const temp = v.sensors?.engineTemp ?? v.engineTemperature ?? 0;
      return `- ${v.name} (${v.licensePlate}): ${v.status.toUpperCase()}, Health: ${v.healthScore}%, Engine Temp: ${temp.toFixed(1)}°C`;
    }).join('\n')}

Recent Alerts:
${alerts.slice(0, 5).map(a => `- ${a.message || a.title || a.description || 'Alert'} (${a.severity})`).join('\n')}
${predictions}`;
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
      // Get fleet context and send to AI service
      const context = getFleetContext();
      const response = await aiService.chat(query, context);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error connecting to my AI backend. Please check your internet connection and try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
    aiService.resetConversation();
  };

  return (
    <motion.div 
      className="glass-panel flex flex-col h-[600px] relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
        animate={{ opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{ left: `${10 + i * 12}%` }}
            animate={{
              y: ['100%', '-100%'],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-border/50 relative z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 rounded-lg gradient-primary relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <motion.span 
              className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              FleetAI Assistant
              <motion.span 
                className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                Llama 3.3
              </motion.span>
            </h3>
            <p className="text-xs text-muted-foreground">Powered by Groq + Browser ML</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AnimatePresence>
            {isInitialized && (
              <motion.span 
                className="text-xs text-success flex items-center gap-1 mr-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Zap className="w-3 h-3" />
                </motion.div>
                ML Ready
              </motion.span>
            )}
          </AnimatePresence>
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <Button variant="ghost" size="icon" onClick={resetChat} title="Reset conversation">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative z-10">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0.1 : 0 }}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              <motion.div 
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  message.role === 'assistant' ? 'bg-primary/20' : 'bg-secondary'
                )}
                whileHover={{ scale: 1.1 }}
              >
                {message.role === 'assistant' ? (
                  <motion.div
                    animate={message.id === messages[messages.length - 1]?.id && message.role === 'assistant' 
                      ? { rotate: [0, 10, -10, 0] } 
                      : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Bot className="w-4 h-4 text-primary" />
                  </motion.div>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </motion.div>
              <motion.div 
                className={cn(
                  'max-w-[80%] rounded-xl px-4 py-3 relative overflow-hidden',
                  message.role === 'assistant'
                    ? 'bg-secondary/50 rounded-tl-none'
                    : 'bg-primary text-primary-foreground rounded-tr-none'
                )}
                whileHover={{ scale: 1.01 }}
              >
                {/* Shimmer effect for new messages */}
                {index === messages.length - 1 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                )}
                <div className={cn(
                  'text-sm whitespace-pre-wrap relative z-10',
                  message.role === 'assistant' && 'prose prose-sm prose-invert max-w-none'
                )}>
                  {message.content.split('\n').map((line, i) => {
                    // Simple markdown-like parsing
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
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Bot className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
              <motion.div 
                className="bg-secondary/50 rounded-xl rounded-tl-none px-4 py-3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing fleet data...</span>
                  <motion.div 
                    className="flex gap-1"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        className="p-4 border-t border-border/50 space-y-3 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Quick Actions */}
        <AnimatePresence>
          {messages.length <= 2 && (
            <motion.div 
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {QUICK_ACTIONS.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSend(action.query)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs bg-secondary/50 hover:bg-secondary border border-border/50 rounded-full transition-colors disabled:opacity-50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <motion.textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about vehicle health, alerts, predictions..."
            className="flex-1 min-h-[44px] max-h-32 px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
            rows={1}
            whileFocus={{ scale: 1.01 }}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="h-auto gradient-primary relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
              <Send className="w-4 h-4 relative z-10" />
            </Button>
          </motion.div>
        </div>
        <motion.p 
          className="text-xs text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          🔒 AI runs securely via Groq API • ML models run locally in your browser
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
