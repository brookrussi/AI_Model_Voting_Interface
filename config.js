// Configuration file - move sensitive data here
// In production, serve this from a secure endpoint or use environment variables

const CONFIG = {
    // Supabase configuration
    supabase: {
        url: 'https://tmkobgbqrbaascebzbny.supabase.co',
        // Note: In production, use Row Level Security and proper API keys
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta29iZ2JxcmJhYXNjZWJ6Ym55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjg3NTQsImV4cCI6MjA4MDgwNDc1NH0.YYa6MZbpspu3q27rTGZ2RZvJnhm0JIHOiih8IWDieFU'
    },

    // Voting system settings
    voting: {
        // Maximum votes per session to prevent abuse
        maxVotesPerSession: 50,
        // Debounce time for vote submissions (ms)
        submitDebounceMs: 1000,
        // Auto-save interval for progress
        autoSaveIntervalMs: 30000
    },

    // UI settings
    ui: {
        // Number of turns to load at once
        turnsPerPage: 5,
        // Animation durations
        animationDurationMs: 300,
        // Responsive breakpoints
        mobileBreakpoint: 768
    },

    // Model configuration
    models: {
        'google/gemini-2.5-pro': {
            name: 'Gemini 2.5 Pro',
            color: '#4285f4',
            class: 'gemini'
        },
        'anthropic/claude-sonnet-4.5': {
            name: 'Claude Sonnet 4.5',
            color: '#ff6b35',
            class: 'claude'
        },
        'openai/gpt-4.1': {
            name: 'GPT-4.1',
            color: '#10a37f',
            class: 'gpt4'
        },
        'openai/gpt-5': {
            name: 'GPT-5',
            color: '#6c5ce7',
            class: 'gpt5'
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}