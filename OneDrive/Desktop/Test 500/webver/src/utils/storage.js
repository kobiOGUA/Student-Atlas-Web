// LocalStorage wrapper - Replaces AsyncStorage from Android app

export const storage = {
    async setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error('Storage setItem error:', error);
            return false;
        }
    },

    async getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Storage getItem error:', error);
            return null;
        }
    },

    async removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage removeItem error:', error);
            return false;
        }
    },

    async clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

export async function clearAuthData() {
    await storage.removeItem('kobi_atlas_uid');
    await storage.removeItem('kobi_atlas_email');
}
