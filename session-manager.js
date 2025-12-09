// Enhanced session management with better security and persistence
class SessionManager {
    constructor() {
        this.sessionKey = 'voting_session';
        this.progressKey = 'voting_progress';
        this.session = this.initializeSession();
    }

    // Generate more secure session ID with browser fingerprinting
    generateSecureSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const browserInfo = this.getBrowserFingerprint();

        return `session_${timestamp}_${random}_${browserInfo}`;
    }

    // Basic browser fingerprinting for better session uniqueness
    getBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Voting session fingerprint', 2, 2);

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }

    // Initialize or restore session
    initializeSession() {
        let session = this.getStoredSession();

        if (!session || this.isSessionExpired(session)) {
            session = {
                id: this.generateSecureSessionId(),
                startTime: Date.now(),
                votedTurns: new Set(),
                progress: {},
                lastActivity: Date.now()
            };
            this.saveSession(session);
        } else {
            // Convert votedTurns array back to Set
            session.votedTurns = new Set(session.votedTurns || []);
            session.lastActivity = Date.now();
            this.saveSession(session);
        }

        return session;
    }

    // Get stored session from localStorage
    getStoredSession() {
        try {
            const stored = localStorage.getItem(this.sessionKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error reading session:', error);
            return null;
        }
    }

    // Save session to localStorage
    saveSession(session) {
        try {
            // Convert Set to Array for JSON serialization
            const toSave = {
                ...session,
                votedTurns: Array.from(session.votedTurns)
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(toSave));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    // Check if session is expired (24 hours)
    isSessionExpired(session) {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return (Date.now() - session.startTime) > maxAge;
    }

    // Mark a turn as voted
    markTurnVoted(turnId) {
        this.session.votedTurns.add(turnId);
        this.session.lastActivity = Date.now();
        this.saveSession(this.session);
    }

    // Check if turn was voted on
    hasTurnVoted(turnId) {
        return this.session.votedTurns.has(turnId);
    }

    // Save voting progress
    saveProgress(conversationId, progress) {
        this.session.progress[conversationId] = {
            ...progress,
            lastUpdated: Date.now()
        };
        this.saveSession(this.session);
    }

    // Get voting progress
    getProgress(conversationId) {
        return this.session.progress[conversationId] || null;
    }

    // Get session ID
    getSessionId() {
        return this.session.id;
    }

    // Clear session (for testing/reset)
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.progressKey);
        this.session = this.initializeSession();
    }

    // Get session stats
    getSessionStats() {
        return {
            sessionId: this.session.id,
            startTime: this.session.startTime,
            votesSubmitted: this.session.votedTurns.size,
            lastActivity: this.session.lastActivity,
            sessionDuration: Date.now() - this.session.startTime
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
} else if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
}