// Voice Assistant Service - Speech Recognition and Synthesis
// Works with the AI Assistant powered by Groq

import { groqService } from './groqService';
import { dataService } from './dataService';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
  }
}

export type VoiceState = 'listening' | 'processing' | 'speaking' | 'idle';

interface VoiceCommand {
  pattern: RegExp;
  action: string;
  handler: (matches: RegExpMatchArray) => Promise<string> | string;
}

class VoiceAssistantService {
  private recognition: SpeechRecognitionInterface | null = null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private responder: ((prompt: string, context: string) => Promise<string>) | undefined;
  
  // Public callbacks
  public onTranscript: ((text: string) => void) | null = null;
  public onStateChange: ((state: VoiceState) => void) | null = null;
  public onResponse: ((text: string) => void) | null = null;
  public onError: ((error: string) => void) | null = null;
  
  // Predefined voice commands for quick actions
  private commands: VoiceCommand[] = [
    {
      pattern: /(?:show|display|get)\s+(?:fleet|vehicle)\s+(?:overview|summary|status)/i,
      action: 'fleet_overview',
      handler: async () => {
        const stats = dataService.getFleetStats();
        return `Your fleet has ${stats.totalVehicles} vehicles. ${stats.operationalCount} are operational, ${stats.maintenanceCount} need maintenance, and there are ${stats.criticalAlerts} critical alerts.`;
      }
    },
    {
      pattern: /(?:how many|count)\s+(?:vehicles?|trucks?|vans?)/i,
      action: 'vehicle_count',
      handler: async () => {
        const vehicles = dataService.getVehicles();
        return `You have ${vehicles.length} vehicles in your fleet.`;
      }
    },
    {
      pattern: /(?:what|show|list)\s+(?:are the|the)?\s*(?:active)?\s*alerts?/i,
      action: 'alerts',
      handler: async () => {
        const alerts = dataService.getAllAlerts().filter(a => !a.acknowledged);
        if (alerts.length === 0) {
          return 'Great news! There are no active alerts at the moment.';
        }
        const critical = alerts.filter(a => a.severity === 'critical').length;
        const warning = alerts.filter(a => a.severity === 'warning').length;
        return `You have ${alerts.length} active alerts. ${critical} are critical and ${warning} are warnings.`;
      }
    },
    {
      pattern: /(?:vehicle|check)\s+(.+?)\s+(?:status|health|condition)/i,
      action: 'vehicle_status',
      handler: async (matches) => {
        const vehicleName = matches[1];
        const vehicles = dataService.getVehicles();
        const vehicle = vehicles.find(v => 
          v.name.toLowerCase().includes(vehicleName.toLowerCase()) ||
          v.licensePlate.toLowerCase().includes(vehicleName.toLowerCase())
        );
        if (!vehicle) {
          return `I couldn't find a vehicle matching "${vehicleName}".`;
        }
        return `${vehicle.name} has a health score of ${vehicle.healthScore}%. Status: ${vehicle.status}. Mileage: ${vehicle.mileage?.toLocaleString() || 'Unknown'} km.`;
      }
    },
    {
      pattern: /(?:which|what)\s+vehicles?\s+(?:need|require)\s+maintenance/i,
      action: 'maintenance_needed',
      handler: async () => {
        const vehicles = dataService.getVehicles();
        const needMaintenance = vehicles.filter(v => 
          v.status === 'warning' || v.status === 'critical' || v.status === 'maintenance'
        );
        if (needMaintenance.length === 0) {
          return 'All vehicles are in good condition. No maintenance needed.';
        }
        const names = needMaintenance.slice(0, 3).map(v => v.name).join(', ');
        return `${needMaintenance.length} vehicles need attention: ${names}${needMaintenance.length > 3 ? ' and more' : ''}.`;
      }
    },
    {
      pattern: /(?:fuel|efficiency)\s+(?:report|summary|average)/i,
      action: 'fuel_report',
      handler: async () => {
        const stats = dataService.getFleetStats();
        return `Your fleet's average fuel efficiency is ${stats.avgFuelEfficiency.toFixed(1)} km per liter.`;
      }
    },
    {
      pattern: /(?:navigate|go)\s+to\s+(dashboard|vehicles?|alerts?|predictions?|analytics?|reports?|upload)/i,
      action: 'navigate',
      handler: async (matches) => {
        const page = matches[1].toLowerCase();
        // Dispatch custom event for navigation
        window.dispatchEvent(new CustomEvent('voiceNavigate', { detail: { page } }));
        return `Navigating to ${page}.`;
      }
    },
    {
      pattern: /(?:refresh|update)\s+(?:data|fleet|dashboard)/i,
      action: 'refresh',
      handler: async () => {
        window.dispatchEvent(new CustomEvent('voiceRefresh'));
        return 'Refreshing fleet data.';
      }
    }
  ];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeRecognition();
    this.loadVoices();
  }

  private initializeRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange?.('listening');
    };

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      this.onTranscript?.(transcript);
      
      // If final result, process the command
      if (event.results[event.results.length - 1].isFinal) {
        this.processCommand(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.onError?.(event.error);
      this.onStateChange?.('idle');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (!this.isSpeaking) {
        this.onStateChange?.('idle');
      }
    };
  }

  private loadVoices(): void {
    const setVoice = () => {
      const voices = this.synthesis.getVoices();
      
      // Premium voice selection hierarchy for natural, professional sound
      // 1. Microsoft Azure Neural voices (most natural)
      // 2. Google WaveNet voices
      // 3. Apple Siri voices
      // 4. Other high-quality voices
      
      const preferredVoices = [
        // Microsoft Neural voices (Windows 11+)
        'Microsoft Aria Online (Natural)',
        'Microsoft Jenny Online (Natural)',
        'Microsoft Guy Online (Natural)',
        'Microsoft Zira',
        'Microsoft David',
        // Google voices
        'Google UK English Female',
        'Google UK English Male',
        'Google US English',
        // Apple voices
        'Samantha',
        'Alex',
        'Karen',
        'Daniel',
        // Edge voices
        'Microsoft Edge',
      ];

      // Find the best available voice
      for (const preferred of preferredVoices) {
        const found = voices.find(v => 
          v.name.includes(preferred) && v.lang.startsWith('en')
        );
        if (found) {
          this.selectedVoice = found;
          console.log('Selected premium voice:', found.name);
          return;
        }
      }

      // Fallback: any English Google voice
      this.selectedVoice = voices.find(v => 
        v.name.includes('Google') && v.lang.startsWith('en')
      ) || voices.find(v => 
        v.lang.startsWith('en-US') && !v.name.includes('eSpeak')
      ) || voices.find(v => 
        v.lang.startsWith('en') && v.localService
      ) || voices[0];

      if (this.selectedVoice) {
        console.log('Selected fallback voice:', this.selectedVoice.name);
      }
    };

    if (this.synthesis.getVoices().length) {
      setVoice();
    } else {
      this.synthesis.onvoiceschanged = setVoice;
    }
  }

  public async processCommand(transcript: string): Promise<void> {
    this.onStateChange?.('processing');
    
    let response: string;

    // Check for predefined commands first
    for (const command of this.commands) {
      const matches = transcript.match(command.pattern);
      if (matches) {
        try {
          response = await command.handler(matches);
          this.speak(response);
          return;
        } catch (error) {
          console.error('Command handler error:', error);
        }
      }
    }

    // If no predefined command matches, use AI
    try {
      const context = this.getFleetContext();
      if (this.responder) {
        response = await this.responder(transcript, context);
      } else {
        // Use fast, free Groq model for voice responses
        response = await groqService.chatFast(transcript, context);
      }
      this.speak(response);
    } catch (error) {
      console.error('AI response error:', error);
      this.speak('I had trouble processing that request. Please try again.');
    }
  }

  private getFleetContext(): string {
    try {
      const vehicles = dataService.getVehicles() || [];
      const operational = vehicles.filter(v => v?.status === 'operational').length;
      const total = vehicles.length;
      return `Fleet: ${total} vehicles, ${operational} operational.`;
    } catch (e) {
      console.warn('Could not get fleet context:', e);
      return 'Fleet management system.';
    }
  }

  public startListening(): void {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    // Stop any ongoing speech
    this.synthesis.cancel();
    this.isSpeaking = false;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public speak(text: string): void {
    // Clean markdown and special characters for speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')
      .replace(/\n/g, '. ')
      .replace(/•/g, '')
      .replace(/[🔧🔮📊⚠️💡🚗🚛]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    this.onStateChange?.('speaking');
    this.onResponse?.(text);
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = this.selectedVoice;
    
    // Fast speech settings for quick responses
    utterance.rate = 1.15;      // Faster speech for quick responses
    utterance.pitch = 1.0;      // Natural pitch
    utterance.volume = 1.0;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.onStateChange?.('idle');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.onStateChange?.('idle');
    };

    // Cancel any ongoing speech and speak immediately
    this.synthesis.cancel();
    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    this.synthesis.cancel();
    this.isSpeaking = false;
    this.onStateChange?.('idle');
  }

  public start(): void {
    this.startListening();
  }

  public stop(): void {
    this.stopListening();
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public getListeningState(): boolean {
    return this.isListening;
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  public setResponder(responder: ((prompt: string, context: string) => Promise<string>) | undefined) {
    this.responder = responder;
  }
}

export const voiceAssistantService = new VoiceAssistantService();
