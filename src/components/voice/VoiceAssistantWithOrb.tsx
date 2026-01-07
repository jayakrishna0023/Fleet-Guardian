import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { voiceAssistantService, VoiceState } from '@/services/voiceAssistant';
import { geminiService } from '@/services/geminiService';
import { X, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleAudioOrb } from './GoogleAudioOrb';

interface VoiceAssistantWithOrbProps {
  className?: string;
  position?: 'center' | 'bottom-right' | 'bottom-left';
}

export const VoiceAssistantWithOrb: React.FC<VoiceAssistantWithOrbProps> = ({ 
  className,
  position = 'center'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const historyRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
  const isSupported = voiceAssistantService.isSupported();

  // Initialize audio context and nodes
  useEffect(() => {
    if (isOpen && !audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      // Create output gain node
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, [isOpen]);

  // Setup voice assistant callbacks
  useEffect(() => {
    voiceAssistantService.onStateChange = (s) => {
      setState(s);
      setError(null);
    };
    
    voiceAssistantService.onTranscript = (t) => {
      setTranscript(t);
    };
    
    voiceAssistantService.onResponse = (r) => {
      setResponse(r);
      if (r) {
        setHistory(prev => [...prev, { role: 'assistant', text: r }]);
      }
    };
    
    voiceAssistantService.onError = (err) => {
      console.error('Voice error:', err);
      setError(err);
      setState('idle');
    };

    return () => {
      voiceAssistantService.onStateChange = null;
      voiceAssistantService.onTranscript = null;
      voiceAssistantService.onResponse = null;
      voiceAssistantService.onError = null;
    };
  }, []);

  // Auto-scroll chat history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history, transcript, response]);

  // Setup audio input when listening starts
  useEffect(() => {
    if (state === 'listening' && audioContextRef.current && !inputNodeRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaStreamRef.current = stream;
          if (audioContextRef.current) {
            inputNodeRef.current = audioContextRef.current.createMediaStreamSource(stream);
          }
        })
        .catch(err => {
          console.error('Failed to get audio stream:', err);
          setError('Microphone access denied');
        });
    }
    
    // Cleanup audio source when not listening
    if (state !== 'listening' && inputNodeRef.current) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      inputNodeRef.current = null;
    }
  }, [state]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    voiceAssistantService.stop();
    voiceAssistantService.stopSpeaking();
    setIsOpen(false);
    setTranscript('');
    setError(null);
    
    // Cleanup audio
    if (inputNodeRef.current) {
      inputNodeRef.current.disconnect();
      inputNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice recognition is not supported in your browser');
      return;
    }

    const isListening = voiceAssistantService.getListeningState();
    
    if (!isListening) {
      // Setup responder
      if (apiKey) {
        voiceAssistantService.setResponder(async (prompt, context) => {
          return await geminiService.chat(prompt, context);
        });
      } else {
        voiceAssistantService.setResponder(undefined);
      }
      
      // Add transcript to history if exists
      if (transcript.trim()) {
        setHistory(prev => [...prev, { role: 'user', text: transcript }]);
      }
      
      setTranscript('');
      setError(null);
      voiceAssistantService.start();
    } else {
      if (transcript.trim()) {
        setHistory(prev => [...prev, { role: 'user', text: transcript }]);
      }
      voiceAssistantService.stop();
    }
  }, [isSupported, apiKey, transcript]);

  const toggleMute = useCallback(() => {
    if (state === 'speaking') {
      if (isMuted) {
        voiceAssistantService.resumeSpeaking();
      } else {
        voiceAssistantService.pauseSpeaking();
      }
      setIsMuted(!isMuted);
    }
  }, [state, isMuted]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setTranscript('');
    setResponse('');
    setError(null);
  }, []);

  const getStateText = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className="w-5 h-5" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'speaking':
        return isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const positionClasses = {
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
  };

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        className={cn(
          'fixed z-50 rounded-full w-16 h-16 shadow-2xl',
          'bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600',
          'hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700',
          'transition-all duration-300 hover:scale-110',
          'border-2 border-white/20',
          positionClasses[position],
          className
        )}
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
        'border border-white/10 shadow-2xl backdrop-blur-xl',
        'flex flex-col overflow-hidden',
        position === 'center' 
          ? 'inset-8 rounded-3xl' 
          : 'bottom-8 w-[480px] h-[680px] rounded-3xl',
        position === 'bottom-right' && 'right-8',
        position === 'bottom-left' && 'left-8',
        className
      )}
    >
      {/* Header */}
      <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-950/50 to-purple-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              state === 'listening' && "bg-blue-500",
              state === 'processing' && "bg-purple-500",
              state === 'speaking' && "bg-emerald-500",
              state === 'idle' && "bg-slate-500"
            )} />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Voice Assistant
              </h2>
              <p className="text-sm text-slate-400">{getStateText()}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Google Audio Orb Visualizer */}
      <div className="relative flex-shrink-0 h-[300px] bg-gradient-to-b from-slate-950 to-slate-900">
        <GoogleAudioOrb
          inputNode={inputNodeRef.current || undefined}
          outputNode={outputNodeRef.current || undefined}
        />
        
        {/* Overlay info */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <div className="flex items-center gap-2 text-white text-sm">
              {getStateIcon()}
              <span>{getStateText()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={historyRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth custom-scrollbar"
      >
        {history.length === 0 && !transcript && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-sm">Start speaking to begin conversation</p>
              <p className="text-xs text-slate-500">Click the microphone button below</p>
            </div>
          </div>
        )}
        
        {history.map((entry, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3 animate-in slide-in-from-bottom-4',
              entry.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] px-4 py-3 rounded-2xl',
                entry.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-100 border border-white/10'
              )}
            >
              <p className="text-sm leading-relaxed">{entry.text}</p>
            </div>
          </div>
        ))}
        
        {transcript && (
          <div className="flex justify-end gap-3 animate-in slide-in-from-bottom-4">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gradient-to-br from-indigo-600/70 to-purple-600/70 text-white border border-indigo-400/30">
              <p className="text-sm leading-relaxed">{transcript}</p>
            </div>
          </div>
        )}
        
        {state === 'processing' && (
          <div className="flex justify-start gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-800/50 border border-white/10">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-center gap-4">
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
            >
              Clear
            </Button>
          )}
          
          <Button
            onClick={toggleListening}
            disabled={!isSupported || state === 'processing'}
            className={cn(
              'w-16 h-16 rounded-full transition-all duration-300',
              'shadow-lg hover:shadow-xl',
              state === 'listening' 
                ? 'bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse' 
                : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {state === 'listening' ? (
              <MicOff className="w-6 h-6" />
            ) : state === 'processing' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {state === 'speaking' && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          )}
        </div>
        
        {!isSupported && (
          <p className="text-center text-sm text-red-400 mt-3">
            Voice recognition not supported in your browser
          </p>
        )}
        
        {!apiKey && isSupported && (
          <p className="text-center text-sm text-yellow-400 mt-3">
            Add VITE_GOOGLE_API_KEY for AI responses
          </p>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};
