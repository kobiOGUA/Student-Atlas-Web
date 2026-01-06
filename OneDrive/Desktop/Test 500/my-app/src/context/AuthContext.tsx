import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserId, saveUserId, saveUserEmail, clearAuthData, getUserEmail } from '../utils/storage';

interface AuthContextType {
    user: { uid: string } | null;
    loading: boolean;
    signIn: (userId: string, email: string) => Promise<void>;
    signOut: () => Promise<void>;
    userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ uid: string } | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load persisted auth data on mount (only email, not auto-login)
    useEffect(() => {
        const loadAuthData = async () => {
            try {
                const storedEmail = await getUserEmail();
                if (storedEmail) {
                    setUserEmail(storedEmail);
                }
                // Do NOT auto-login; we require PIN entry each session
            } catch (error) {
                console.error('Failed to load auth data', error);
            } finally {
                setLoading(false);
            }
        };
        loadAuthData();
    }, []);

    const signIn = async (userId: string, email: string) => {
        try {
            await saveUserId(userId);
            await saveUserEmail(email);
            setUser({ uid: userId });
            setUserEmail(email);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            // Clear persisted auth data so email must be entered again on next launch
            await clearAuthData();
            setUser(null);
            setUserEmail(null);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, userEmail }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
