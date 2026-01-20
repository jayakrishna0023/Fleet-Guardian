import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { voiceAssistantService, VoiceState } from '@/services/voiceAssistant';
import { geminiService } from '@/services/geminiService';
import { X, Mic, MicOff, Volume2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceAssistantOrbProps {
  className?: string;
}

export const VoiceAssistantOrb: React.FC<VoiceAssistantOrbProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const isSupported = voiceAssistantService.isSupported();

  useEffect(() => {
    // Wire up voice assistant callbacks
    voiceAssistantService.onStateChange = (s) => setState(s);
    voiceAssistantService.onTranscript = (t) => setTranscript(t);
    voiceAssistantService.onResponse = (r) => {
      setResponse(r);
      setHistory(prev => [...prev, { role: 'assistant', text: r }]);
    };
    voiceAssistantService.onError = (err) => {
      console.error('Voice error:', err);
      setState('idle');
    };

    return () => {
      voiceAssistantService.onStateChange = null;
      voiceAssistantService.onTranscript = null;
      voiceAssistantService.onResponse = null;
      voiceAssistantService.onError = null;
    };
  }, []);

  const handleOrbClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      toggleListening();
    }
  };

  const toggleListening = () => {
    if (!isSupported) return;

    const isListening = voiceAssistantService.getListeningState();
    
    if (!isListening) {
      // Set responder based on API key
      if (apiKey) {
        voiceAssistantService.setResponder(async (prompt, context) => {
          return await geminiService.chat(prompt, context);
        });
      } else {
        voiceAssistantService.setResponder(undefined);
      }
      
      // Add user transcript to history when speech ends
      if (transcript) {
        setHistory(prev => [...prev, { role: 'user', text: transcript }]);
      }
      setTranscript('');
      voiceAssistantService.start();
    } else {
      if (transcript) {
        setHistory(prev => [...prev, { role: 'user', text: transcript }]);
      }
      voiceAssistantService.stop();
    }
  };

  const handleClose = () => {
    voiceAssistantService.stop();
    voiceAssistantService.stopSpeaking();
    setIsOpen(false);
    setTranscript('');
  };

  const getStateColor = () => {
    switch (state) {
      case 'listening': return 'from-blue-500 to-cyan-500';
      case 'processing': return 'from-purple-500 to-pink-500';
      case 'speaking': return 'from-emerald-500 to-teal-500';
      default: return 'from-primary to-accent';
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Tap to speak';
    }
  };

  return (
    <>
      {/* Floating Orb Button */}
      <button
        onClick={handleOrbClick}
        aria-label="Open AI Voice Assistant"
        className={cn(
          'relative w-10 h-10 rounded-full overflow-hidden transition-all duration-500',
          'border-2 border-white/20 shadow-xl backdrop-blur-sm',
          'hover:scale-110 hover:shadow-2xl hover:border-white/40',
          'bg-gradient-to-br',
          getStateColor(),
          state !== 'idle' && 'animate-pulse',
          className
        )}
      >
        {/* Animated rings */}
        <span className={cn(
          'absolute inset-0 rounded-full bg-white/20',
          state === 'listening' && 'animate-ping'
        )} />
        <span className={cn(
          'absolute inset-1 rounded-full bg-white/10',
          state === 'processing' && 'animate-spin'
        )} />
        
        {/* Center icon */}
        <span className="absolute inset-0 flex items-center justify-center text-white">
          {state === 'listening' ? (
            <Mic className="w-4 h-4" />
          ) : state === 'processing' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </span>
      </button>

      {/* Full Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-border/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-4">
                {/* Animated orb */}
                <div className={cn(
                  'relative w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center',
                  getStateColor(),
                  'shadow-lg'
                )}>
                  {/* Pulse rings */}
                  {state === 'listening' && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-current opacity-30 animate-ping" />
                      <span className="absolute -inset-2 rounded-full border-2 border-current opacity-20 animate-pulse" />
                      <span className="absolute -inset-4 rounded-full border border-current opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  
                  {state === 'processing' && (
                    <span className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  
                  {state === 'speaking' && (
                    <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
                  )}
                  
                  <span className="relative text-white">
                    {state === 'listening' ? (
                      <Mic className="w-7 h-7" />
                    ) : state === 'processing' ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : state === 'speaking' ? (
                      <Volume2 className="w-7 h-7" />
                    ) : (
                      <Sparkles className="w-7 h-7" />
                    )}
                  </span>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold">Fleet Guardian AI</h2>
                  <p className="text-sm text-muted-foreground">
                    {apiKey ? 'Powered by Gemini' : 'Powered by Groq'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Conversation History */}
            <div 
              ref={historyRef}
              className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-thin"
            >
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm">Ask me anything about your fleet!</p>
                  <p className="text-xs mt-1 opacity-70">
                    Try: "Show fleet overview" or "Which vehicles need maintenance?"
                  </p>
                </div>
              ) : (
                history.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      'max-w-[85%] p-3 rounded-2xl text-sm',
                      item.role === 'user' 
                        ? 'ml-auto bg-primary text-primary-foreground rounded-tr-sm'
                        : 'mr-auto bg-secondary rounded-tl-sm'
                    )}
                  >
                    {item.text}
                  </div>
                ))
              )}
              
              {/* Live transcript */}
              {transcript && state === 'listening' && (
                <div className="max-w-[85%] ml-auto p-3 rounded-2xl rounded-tr-sm bg-primary/50 text-primary-foreground text-sm animate-pulse">
                  {transcript}
                </div>
              )}
            </div>
            
            {/* Status Bar */}
            <div className="p-4 border-t border-border/30 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  'text-sm font-medium',
                  state === 'listening' && 'text-blue-500',
                  state === 'processing' && 'text-purple-500',
                  state === 'speaking' && 'text-emerald-500'
                )}>
                  {getStateText()}
                </span>
                
                {!isSupported && (
                  <span className="text-xs text-destructive">
                    Speech not supported
                  </span>
                )}
              </div>
              
              {/* Main action button */}
              <Button
                onClick={toggleListening}
                disabled={!isSupported || state === 'processing'}
                className={cn(
                  'w-full h-12 rounded-xl font-semibold transition-all duration-300',
                  state === 'listening' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                )}
              >
                {state === 'listening' ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Listening
                  </>
                ) : state === 'processing' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : state === 'speaking' ? (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" />
                    Speaking...
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistantOrb;
