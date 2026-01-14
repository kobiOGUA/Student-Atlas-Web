// LocalStorage wrapper
export const storage = {
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
};
