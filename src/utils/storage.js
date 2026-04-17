const PREFIX = 'studyhub_';

export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage', error);
            return defaultValue;
        }
    },

    set: (key, value) => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage', error);
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(PREFIX + key);
        } catch (error) {
            console.error('Error removing from localStorage', error);
        }
    },

    clear: () => {
        // Only clear studyhub keys to prevent interfering with other apps on same domain
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};
