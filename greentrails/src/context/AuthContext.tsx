import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    currentUser: string | null;
    isAdmin: boolean;
    login: (username: string, isAdmin?: boolean) => void;
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
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('currentUser');
        const savedAdminStatus = localStorage.getItem('isAdmin');
        console.log('AuthContext: Loading saved user from localStorage:', savedUser);
        if (savedUser) {
            setCurrentUser(savedUser);
            setIsAdmin(savedAdminStatus === 'true');
            console.log('AuthContext: User restored:', savedUser, 'Admin:', savedAdminStatus === 'true');
        }
    }, []);

    const login = (username: string, adminStatus: boolean = false) => {
        console.log('AuthContext: Logging in user:', username, 'Admin:', adminStatus);
        setCurrentUser(username);
        setIsAdmin(adminStatus);
        localStorage.setItem('currentUser', username);
        localStorage.setItem('isAdmin', adminStatus.toString());
        console.log('AuthContext: User saved to localStorage:', username);
    };

    const logout = () => {
        console.log('AuthContext: Logging out user');
        setCurrentUser(null);
        setIsAdmin(false);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
    };

    const value = {
        currentUser,
        isAdmin,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
