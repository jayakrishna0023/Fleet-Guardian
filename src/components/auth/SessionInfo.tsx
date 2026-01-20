import { useState, useEffect } from 'react';
import { sessionManager } from '@/services/sessionManager';
import { Clock, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const SessionInfo = () => {
  const [sessionInfo, setSessionInfo] = useState(sessionManager.getSessionInfo());
  const [duration, setDuration] = useState(sessionManager.getSessionDuration());

  useEffect(() => {
    // Update every 30 seconds
    const interval = setInterval(() => {
      setSessionInfo(sessionManager.getSessionInfo());
      setDuration(sessionManager.getSessionDuration());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    const success = sessionManager.refreshSession();
    if (success) {
      setSessionInfo(sessionManager.getSessionInfo());
      setDuration(sessionManager.getSessionDuration());
    }
  };

  if (!sessionInfo.isValid) {
    return null;
  }

  const timeRemaining = sessionInfo.timeRemaining;
  const isExpiringSoon = timeRemaining < 5 * 60 * 1000; // Less than 5 minutes

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
      isExpiringSoon ? "bg-yellow-500/10 text-yellow-500" : "bg-secondary/50 text-muted-foreground"
    )}>
      <div className="flex items-center gap-2">
        {isExpiringSoon ? (
          <Clock className="w-3 h-3 animate-pulse" />
        ) : (
          <Shield className="w-3 h-3" />
        )}
        <span>{duration}</span>
      </div>
      {isExpiringSoon && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Extend
        </Button>
      )}
    </div>
  );
};
