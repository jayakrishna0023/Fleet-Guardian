// Unified AI Service - Uses Groq API for all AI features
// Voice assistant, chat, and report generation all use this single service

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fleet management system prompt
const SYSTEM_PROMPT = `You are FleetAI, an advanced AI assistant specialized in fleet management, vehicle maintenance, and predictive analytics. You help fleet managers and operators with:

1. **Vehicle Health Analysis**: Interpret health scores, sensor data, and identify potential issues
2. **Predictive Maintenance**: Suggest maintenance schedules based on vehicle data, mileage, and usage patterns
3. **Fleet Optimization**: Provide recommendations for fuel efficiency, route optimization, and cost reduction
4. **Alert Interpretation**: Explain alerts and provide actionable solutions
5. **Data Insights**: Analyze trends and patterns in fleet performance

Always provide specific, actionable advice. Use technical terms appropriately but explain them when needed. Keep responses concise but informative.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AIService {
  private conversationHistory: ChatMessage[] = [];
  private maxHistoryLength = 10;

  private getApiKey(): string | undefined {
    return import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!(key && key.length > 10);
  }

  resetConversation(): void {
    this.conversationHistory = [];
  }

  async chat(userMessage: string, vehicleContext?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return 'AI service is not configured. Please add VITE_GROQ_API_KEY to your .env file.';
    }

    try {
      // Build the messages array
      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT }
      ];

      // Add context as a system message if provided
      if (vehicleContext) {
        messages.push({
          role: 'system',
          content: `[Current Fleet Data Context]\n${vehicleContext}`
        });
      }

      // Add conversation history
      if (this.conversationHistory.length > 0) {
        const recentHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        messages.push(...recentHistory);
      }

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API error:', errorData);
        return 'I encountered an error connecting to the AI service. Please check your API key and try again.';
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'I could not generate a response. Please try again.';

      // Add to conversation history
      this.conversationHistory.push({ role: 'user', content: userMessage });
      this.conversationHistory.push({ role: 'assistant', content: assistantMessage });

      // Trim history if too long
      if (this.conversationHistory.length > this.maxHistoryLength * 2) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
      }

      return assistantMessage;
    } catch (error) {
      console.error('AI service error:', error);
      return 'Unable to reach the AI service. Please check your internet connection and try again.';
    }
  }

  async generateReport(reportType: string, context: string): Promise<string> {
    const prompt = `Generate a detailed ${reportType} report based on the following fleet data:\n\n${context}\n\nProvide the report in a clear, professional format with sections, bullet points, and actionable recommendations.`;
    return this.chat(prompt);
  }

  async analyzeVehicle(vehicleData: string): Promise<string> {
    const prompt = `Analyze the following vehicle data and provide insights on its health, potential issues, and maintenance recommendations:\n\n${vehicleData}`;
    return this.chat(prompt);
  }
}

export const aiService = new AIService();
