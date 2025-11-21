import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    currentUser: string | null;
    login: (username: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('currentUser');
        console.log('AuthContext: Loading saved user from localStorage:', savedUser);
        if (savedUser) {
            setCurrentUser(savedUser);
            console.log('AuthContext: User restored:', savedUser);
        }
    }, []);

    const login = (username: string) => {
        console.log('AuthContext: Logging in user:', username);
        setCurrentUser(username);
        localStorage.setItem('currentUser', username);
        console.log('AuthContext: User saved to localStorage:', username);
    };

    const logout = () => {
        console.log('AuthContext: Logging out user');
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
    };

    const value = {
        currentUser,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
