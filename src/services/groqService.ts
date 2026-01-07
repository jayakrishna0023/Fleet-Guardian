// Groq API Service for AI Assistant
// This runs entirely in the browser - no server needed

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Fleet management system prompt
const SYSTEM_PROMPT = `You are FleetAI, an advanced AI assistant specialized in fleet management, vehicle maintenance, and predictive analytics. You help fleet managers and operators with:

1. **Vehicle Health Analysis**: Interpret health scores, sensor data, and identify potential issues
2. **Predictive Maintenance**: Suggest maintenance schedules based on vehicle data, mileage, and usage patterns
3. **Fleet Optimization**: Provide recommendations for fuel efficiency, route optimization, and cost reduction
4. **Alert Interpretation**: Explain alerts and provide actionable solutions
5. **Data Insights**: Analyze trends and patterns in fleet performance

You have access to real-time vehicle data including:
- Engine temperature, oil pressure, battery voltage, tire pressure
- Fuel efficiency, mileage, and trip data
- Maintenance history and prediction models
- Alert patterns and failure predictions

Always provide specific, actionable advice. Use technical terms appropriately but explain them when needed. Format responses with markdown for clarity.`;

class GroqService {
  private conversationHistory: ChatMessage[] = [];
  private maxHistoryLength = 20; // Keep last 20 messages for context

  private getModel(defaultModel: string): string {
    // Allow overriding via env; fallback to provided default
    const envModel = import.meta.env.VITE_GROQ_MODEL as string | undefined;
    return envModel && envModel.trim().length > 0 ? envModel : defaultModel;
  }

  private getFastModel(defaultModel: string): string {
    // Separate env for fast model used by voice assistant
    const envModel = import.meta.env.VITE_GROQ_MODEL_FAST as string | undefined;
    return envModel && envModel.trim().length > 0 ? envModel : defaultModel;
  }

  constructor() {
    this.resetConversation();
  }

  resetConversation() {
    this.conversationHistory = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
  }

  async chat(userMessage: string, vehicleContext?: string): Promise<string> {
    try {
      // Add vehicle context if provided
      let enhancedMessage = userMessage;
      if (vehicleContext) {
        enhancedMessage = `[Current Vehicle Data Context]\n${vehicleContext}\n\n[User Query]\n${userMessage}`;
      }

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: enhancedMessage
      });

      // Trim history if too long
      if (this.conversationHistory.length > this.maxHistoryLength) {
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system prompt
          ...this.conversationHistory.slice(-this.maxHistoryLength + 1)
        ];
      }

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('Groq API Key is missing. Please check your .env file.');
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Default comprehensive model; can be overridden by VITE_GROQ_MODEL
          model: this.getModel('llama-3.3-70b-versatile'),
          messages: this.conversationHistory,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: GroqResponse = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  // Quick analysis methods for specific fleet tasks
  async analyzeVehicleHealth(vehicleData: {
    name: string;
    healthScore: number;
    engineTemp: number;
    oilPressure: number;
    batteryVoltage: number;
    tirePressure: number;
    mileage: number;
    lastMaintenance?: string;
  }): Promise<string> {
    const prompt = `Analyze this vehicle's health status and provide recommendations:
    
Vehicle: ${vehicleData.name}
Health Score: ${vehicleData.healthScore}%
Engine Temperature: ${vehicleData.engineTemp}°C
Oil Pressure: ${vehicleData.oilPressure} PSI
Battery Voltage: ${vehicleData.batteryVoltage}V
Tire Pressure: ${vehicleData.tirePressure} PSI
Mileage: ${vehicleData.mileage.toLocaleString()} km
Last Maintenance: ${vehicleData.lastMaintenance || 'Unknown'}

Provide a brief health assessment and any immediate recommendations.`;

    return this.chat(prompt);
  }

  async predictMaintenance(vehicleData: {
    name: string;
    mileage: number;
    lastOilChange: number;
    lastBrakeService: number;
    engineHours: number;
    avgDailyMileage: number;
  }): Promise<string> {
    const prompt = `Predict upcoming maintenance needs for this vehicle:

Vehicle: ${vehicleData.name}
Current Mileage: ${vehicleData.mileage.toLocaleString()} km
Mileage at Last Oil Change: ${vehicleData.lastOilChange.toLocaleString()} km
Mileage at Last Brake Service: ${vehicleData.lastBrakeService.toLocaleString()} km
Total Engine Hours: ${vehicleData.engineHours}
Average Daily Mileage: ${vehicleData.avgDailyMileage} km

Predict when the next maintenance items will be due and prioritize them.`;

    return this.chat(prompt);
  }

  async interpretAlert(alert: {
    type: string;
    severity: string;
    vehicle: string;
    message: string;
    sensorData?: Record<string, number>;
  }): Promise<string> {
    const prompt = `Interpret this fleet alert and provide solutions:

Alert Type: ${alert.type}
Severity: ${alert.severity}
Vehicle: ${alert.vehicle}
Message: ${alert.message}
${alert.sensorData ? `Sensor Data: ${JSON.stringify(alert.sensorData)}` : ''}

Explain what this alert means, potential causes, and recommended actions.`;

    return this.chat(prompt);
  }

  async getFleetInsights(fleetData: {
    totalVehicles: number;
    operationalCount: number;
    maintenanceCount: number;
    avgHealthScore: number;
    totalAlerts: number;
    criticalAlerts: number;
    avgFuelEfficiency: number;
    totalMileage: number;
  }): Promise<string> {
    const prompt = `Provide insights for this fleet's overall status:

Fleet Overview:
- Total Vehicles: ${fleetData.totalVehicles}
- Operational: ${fleetData.operationalCount}
- In Maintenance: ${fleetData.maintenanceCount}
- Average Health Score: ${fleetData.avgHealthScore.toFixed(1)}%
- Active Alerts: ${fleetData.totalAlerts} (${fleetData.criticalAlerts} critical)
- Average Fuel Efficiency: ${fleetData.avgFuelEfficiency.toFixed(1)} km/L
- Total Fleet Mileage: ${fleetData.totalMileage.toLocaleString()} km

Provide a brief fleet health summary with key observations and recommendations.`;

    return this.chat(prompt);
  }

  // Faster, concise chat for voice assistant with free, fast model
  async chatFast(userMessage: string, vehicleContext?: string): Promise<string> {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('Groq API Key is missing. Please check your .env file.');
      }

      // Build concise prompt emphasizing short, direct answers
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are FleetAI Voice. Respond in 1-2 sentences. Be direct, fast, and actionable. Avoid markdown except simple lists when necessary.'
        }
      ];

      if (vehicleContext) {
        messages.push({ role: 'system', content: `[Fleet Context]
${vehicleContext}` });
      }

      messages.push({ role: 'user', content: userMessage });

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Fast free model by default; override via VITE_GROQ_MODEL_FAST
          model: this.getFastModel('llama-3.1-8b-instant'),
          messages,
          temperature: 0.6,
          max_tokens: 256,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: GroqResponse = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a quick response.';
      return assistantMessage;
    } catch (error) {
      console.error('Groq API Fast Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const groqService = new GroqService();
