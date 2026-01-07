import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, X, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { voiceAssistantService, VoiceState } from '@/services/voiceAssistant';

interface VoiceAssistantButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = ({
  className,
  variant = 'floating',
}) => {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up callbacks
    voiceAssistantService.onStateChange = (newState) => {
      setState(newState);
      if (newState === 'listening') {
        setIsExpanded(true);
        setError(null);
      }
    };

    voiceAssistantService.onTranscript = (text) => {
      setTranscript(text);
    };

    voiceAssistantService.onResponse = (text) => {
      setResponse(text);
    };

    voiceAssistantService.onError = (err) => {
      setError(err);
      setState('idle');
    };

    return () => {
      voiceAssistantService.stop();
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (state === 'listening') {
      voiceAssistantService.stop();
    } else if (state === 'idle') {
      voiceAssistantService.start();
    }
  }, [state]);

  const handleClose = useCallback(() => {
    voiceAssistantService.stop();
    setIsExpanded(false);
    setTranscript('');
    setResponse('');
    setError(null);
  }, []);

  const getStateIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className="w-6 h-6" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case 'speaking':
        return <Volume2 className="w-6 h-6" />;
      default:
        return <Mic className="w-6 h-6" />;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-red-500 hover:bg-red-600';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'speaking':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700';
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Ask FleetAI';
    }
  };

  if (variant === 'floating') {
    return (
      <>
        {/* Floating Button */}
        <button
          onClick={handleToggle}
          className={cn(
            'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl',
            'flex items-center justify-center text-white transition-all duration-300',
            'hover:scale-110 active:scale-95',
            getStateColor(),
            state === 'listening' && 'animate-pulse',
            className
          )}
        >
          {/* Ripple Effect for Listening */}
          {state === 'listening' && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
              <span className="absolute inset-[-8px] rounded-full border-2 border-red-400 animate-pulse opacity-50" />
            </>
          )}
          {getStateIcon()}
        </button>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="fixed bottom-24 right-6 z-50 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">FleetAI Assistant</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {/* State Indicator */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  getStateColor()
                )}>
                  {getStateIcon()}
                </div>
                <div>
                  <div className="font-medium text-white">{getStateText()}</div>
                  <div className="text-xs text-slate-400">
                    {state === 'listening' ? 'Speak now...' : 'Click to start'}
                  </div>
                </div>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    You said:
                  </div>
                  <div className="text-sm text-white">{transcript}</div>
                </div>
              )}

              {/* Response */}
              {response && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <div className="text-xs text-purple-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    FleetAI:
                  </div>
                  <div className="text-sm text-white leading-relaxed">{response}</div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="text-xs text-red-400 mb-1">Error</div>
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              )}

              {/* Quick Commands */}
              {state === 'idle' && !transcript && !response && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 font-medium">Try saying:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Show fleet overview',
                      'How many vehicles?',
                      'Show alerts',
                      'Check maintenance',
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => {
                          setTranscript(cmd);
                          voiceAssistantService.processCommand(cmd);
                        }}
                        className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                      >
                        "{cmd}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-800/50 border-t border-white/5">
              <button
                onClick={handleToggle}
                disabled={state === 'processing' || state === 'speaking'}
                className={cn(
                  'w-full py-2.5 rounded-xl font-medium text-sm transition-all',
                  'flex items-center justify-center gap-2',
                  state === 'listening'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
                  (state === 'processing' || state === 'speaking') && 'opacity-50 cursor-not-allowed'
                )}
              >
                {state === 'listening' ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start Listening
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Inline variant
  return (
    <Button
      onClick={handleToggle}
      variant="ghost"
      size="sm"
      className={cn(
        'gap-2 transition-all',
        state === 'listening' && 'bg-red-500/10 text-red-500',
        className
      )}
    >
      {getStateIcon()}
      <span className="hidden sm:inline">{getStateText()}</span>
    </Button>
  );
};

export default VoiceAssistantButton;