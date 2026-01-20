// Session Management Service
// Handles secure session storage, token management, and session persistence

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  loginTime: number;
  expiresAt: number;
  refreshToken?: string;
}

const SESSION_KEY = 'fleetai_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_THRESHOLD = 60 * 60 * 1000; // Refresh if less than 1 hour remaining

class SessionManager {
  private sessionCheckInterval: number | null = null;
  private listeners: Array<(session: SessionData | null) => void> = [];

  /**
   * Initialize session manager with automatic cleanup
   */
  constructor() {
    this.startSessionMonitoring();
  }

  /**
   * Create a new session
   */
  createSession(userData: {
    userId: string;
    email: string;
    name: string;
    role: string;
    status: string;
  }): SessionData {
    const now = Date.now();
    const session: SessionData = {
      ...userData,
      loginTime: now,
      expiresAt: now + SESSION_DURATION,
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('✅ Session created:', session.email, 'expires in', SESSION_DURATION / 1000 / 60, 'minutes');
      this.notifyListeners(session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Get current session
   */
  getSession(): SessionData | null {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) {
        return null;
      }

      const session: SessionData = JSON.parse(sessionStr);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        console.log('⏰ Session expired');
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null && Date.now() < session.expiresAt;
  }

  /**
   * Refresh session (extend expiration)
   */
  refreshSession(): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    const now = Date.now();
    const timeRemaining = session.expiresAt - now;

    // Only refresh if less than threshold remaining
    if (timeRemaining < REFRESH_THRESHOLD) {
      session.expiresAt = now + SESSION_DURATION;
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log('🔄 Session refreshed, new expiration:', new Date(session.expiresAt).toLocaleString());
        return true;
      } catch (error) {
        console.error('Failed to refresh session:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Update session data
   */
  updateSession(updates: Partial<Omit<SessionData, 'loginTime' | 'expiresAt'>>): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    const updatedSession = { ...session, ...updates };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      this.notifyListeners(updatedSession);
      console.log('✏️ Session updated');
      return true;
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      // Also clear legacy keys
      localStorage.removeItem('fleetai_user');
      localStorage.removeItem('fleet_user');
      console.log('🗑️ Session cleared');
      this.notifyListeners(null);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Get session expiration info
   */
  getSessionInfo(): {
    isValid: boolean;
    timeRemaining: number;
    expiresAt: Date | null;
  } {
    const session = this.getSession();
    if (!session) {
      return {
        isValid: false,
        timeRemaining: 0,
        expiresAt: null,
      };
    }

    const timeRemaining = session.expiresAt - Date.now();
    return {
      isValid: timeRemaining > 0,
      timeRemaining: Math.max(0, timeRemaining),
      expiresAt: new Date(session.expiresAt),
    };
  }

  /**
   * Start monitoring session for automatic cleanup
   */
  private startSessionMonitoring(): void {
    // Check session every minute
    this.sessionCheckInterval = setInterval(() => {
      const session = this.getSession();
      if (session) {
        const timeRemaining = session.expiresAt - Date.now();
        
        // Warn if session expiring soon (5 minutes)
        if (timeRemaining > 0 && timeRemaining < 5 * 60 * 1000) {
          console.warn('⚠️ Session expiring soon:', Math.round(timeRemaining / 1000), 'seconds remaining');
        }
        
        // Auto-refresh if needed
        if (timeRemaining < REFRESH_THRESHOLD && timeRemaining > 0) {
          this.refreshSession();
        }
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Subscribe to session changes
   */
  subscribe(callback: (session: SessionData | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current session
    callback(this.getSession());
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(session: SessionData | null): void {
    this.listeners.forEach(listener => listener(session));
  }

  /**
   * Get session duration in readable format
   */
  getSessionDuration(): string {
    const info = this.getSessionInfo();
    if (!info.isValid) {
      return 'No active session';
    }

    const hours = Math.floor(info.timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((info.timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sessionManager.stopMonitoring();
  });
}
