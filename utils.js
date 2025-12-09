// Utility functions for better code organization and reusability
class VotingUtils {

    // Debounce function to prevent rapid submissions
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for scroll/resize events
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Enhanced HTML escaping
    static escapeHtml(text) {
        if (!text) return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;');
    }

    // Enhanced markdown formatting with security
    static formatMarkdown(text) {
        if (!text) return '';

        // Remove dangerous content first
        let cleaned = text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');

        // Remove reasoning sections
        cleaned = cleaned
            .replace(/### Reasoning[\s\S]*?(?=###|$)/gi, '')
            .replace(/##+ Reasoning[\s\S]*?(?=##|$)/gi, '')
            .replace(/\*\*Reasoning\*\*[\s\S]*?(?=\*\*|$)/gi, '')
            .trim();

        // Escape HTML
        let formatted = this.escapeHtml(cleaned);

        // Apply markdown formatting
        formatted = formatted
            // Bold text
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/__([^_]+)__/g, '<strong>$1</strong>')

            // Italic text
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/_([^_]+)_/g, '<em>$1</em>')

            // Code blocks
            .replace(/`([^`]+)`/g, '<code>$1</code>')

            // Lists
            .replace(/^[\s]*[\*\-\+][\s]+(.+)$/gm, '<li>$1</li>')
            .replace(/^[\s]*(\d+)\.[\s]+(.+)$/gm, '<li>$2</li>')
            .replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, '<ul>$&</ul>')

            // Line breaks
            .replace(/\n/g, '<br>');

        return formatted;
    }

    // Network status checker
    static checkNetworkStatus() {
        return {
            online: navigator.onLine,
            connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
            effectiveType: navigator.connection?.effectiveType || 'unknown'
        };
    }

    // Loading state manager
    static createLoadingManager() {
        const loadingStates = new Map();

        return {
            setLoading: (key, isLoading, message = 'Loading...') => {
                loadingStates.set(key, { isLoading, message });
                this.updateGlobalLoadingState(loadingStates);
            },

            isLoading: (key) => {
                return loadingStates.get(key)?.isLoading || false;
            },

            clearAll: () => {
                loadingStates.clear();
                this.updateGlobalLoadingState(loadingStates);
            }
        };
    }

    // Update global loading indicators
    static updateGlobalLoadingState(loadingStates) {
        const anyLoading = Array.from(loadingStates.values()).some(state => state.isLoading);

        // Update cursor
        document.body.style.cursor = anyLoading ? 'wait' : 'default';

        // Update any global loading indicators
        const globalLoader = document.getElementById('globalLoader');
        if (globalLoader) {
            globalLoader.style.display = anyLoading ? 'block' : 'none';
        }
    }

    // Error handler with user-friendly messages
    static handleError(error, userMessage = 'Something went wrong. Please try again.') {
        console.error('Error:', error);

        // Check for specific error types
        let message = userMessage;
        if (!navigator.onLine) {
            message = 'You appear to be offline. Please check your connection.';
        } else if (error.code === '23505') {
            message = 'You have already voted on this turn.';
        } else if (error.message?.includes('network')) {
            message = 'Network error. Please check your connection and try again.';
        }

        // Show user-friendly error
        this.showToast(message, 'error');

        return message;
    }

    // Toast notification system
    static showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.voting-toast');
        existingToasts.forEach(toast => toast.remove());

        // Create toast
        const toast = document.createElement('div');
        toast.className = `voting-toast voting-toast-${type}`;
        toast.textContent = message;

        // Style toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            maxWidth: '300px',
            backgroundColor: type === 'error' ? '#dc3545' :
                           type === 'success' ? '#28a745' :
                           type === 'warning' ? '#ffc107' : '#007bff',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Validate voting data
    static validateVoteData(turnId, position, voterSession) {
        const errors = [];

        if (!turnId || typeof turnId !== 'string') {
            errors.push('Invalid turn ID');
        }

        if (!position || !['A', 'B', 'C', 'D'].includes(position)) {
            errors.push('Invalid position selection');
        }

        if (!voterSession || typeof voterSession !== 'string') {
            errors.push('Invalid voter session');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Performance monitoring
    static createPerformanceMonitor() {
        const marks = new Map();

        return {
            mark: (name) => {
                marks.set(name, performance.now());
            },

            measure: (name, startMark) => {
                const start = marks.get(startMark);
                const end = performance.now();
                const duration = end - start;

                console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VotingUtils;
} else if (typeof window !== 'undefined') {
    window.VotingUtils = VotingUtils;
}