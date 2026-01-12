import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../base/firebaseConfig';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

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

    // Function to update user's last active timestamp
    const updateUserPresence = async (username: string) => {
        try {
            const userRef = doc(db, 'Users', username);
            await updateDoc(userRef, {
                lastActive: Timestamp.now()
            });
        } catch (error) {
            console.error('Error updating user presence:', error);
        }
    };

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('currentUser');
        const savedAdminStatus = localStorage.getItem('isAdmin');
        console.log('AuthContext: Loading saved user from localStorage:', savedUser);
        if (savedUser) {
            setCurrentUser(savedUser);
            setIsAdmin(savedAdminStatus === 'true');
            console.log('AuthContext: User restored:', savedUser, 'Admin:', savedAdminStatus === 'true');
            // Update presence when user is restored from localStorage
            updateUserPresence(savedUser);
        }
    }, []);

    useEffect(() => {
        // Set up periodic presence updates for logged-in users
        if (!currentUser) return;

        // Update presence immediately
        updateUserPresence(currentUser);

        // Update presence every 8 minutes to keep user marked as active
        const interval = setInterval(() => {
            updateUserPresence(currentUser);
        }, 8 * 60 * 1000); // 8 minutes

        return () => clearInterval(interval);
    }, [currentUser]);

    const login = (username: string, adminStatus: boolean = false) => {
        console.log('AuthContext: Logging in user:', username, 'Admin:', adminStatus);
        setCurrentUser(username);
        setIsAdmin(adminStatus);
        localStorage.setItem('currentUser', username);
        localStorage.setItem('isAdmin', adminStatus.toString());
        console.log('AuthContext: User saved to localStorage:', username);
        // Update presence on login
        updateUserPresence(username);
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
