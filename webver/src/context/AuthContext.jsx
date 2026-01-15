import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Check for stored session
        const storedUid = localStorage.getItem('kobi_atlas_uid');
        const storedEmail = localStorage.getItem('kobi_atlas_email');

        if (storedUid && storedEmail) {
            setUser({ uid: storedUid, email: storedEmail });
            setUserEmail(storedEmail);
        }

        setLoading(false);
    }, []);

    const signIn = (uid, email) => {
        setUser({ uid, email });
        setUserEmail(email);
        localStorage.setItem('kobi_atlas_uid', uid);
        localStorage.setItem('kobi_atlas_email', email);
    };

    const signOut = async () => {
        setUser(null);
        setUserEmail('');
        localStorage.removeItem('kobi_atlas_uid');
        localStorage.removeItem('kobi_atlas_email');
    };

    const value = {
        user,
        loading,
        userEmail,
        signIn,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
