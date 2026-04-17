import React, { createContext, useContext, useState, useEffect } from 'react';
import * as localDb from '../services/localDb';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore session from localStorage on mount
        const storedUser = localDb.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const userData = localDb.loginUser({ email, password });
            setUser(userData);
            return userData;
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    };

    const register = async (name, college, email, password) => {
        try {
            const userData = localDb.registerUser({ name, college, email, password });
            // Mark as new signup for welcome screen
            localStorage.setItem('studyhub_welcome_new_signup', 'true');
            setUser(userData);
            return userData;
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    };

    // Google login (Local adaptation)
    // Uses Google's userinfo to auto-register or log in locally
    const googleLogin = async (_, googleData) => {
        try {
            // Use localDb.getUsers() to avoid the double-prefix bug
            const users = localDb.getUsers();
            const existingUser = users.find(u => u.email.toLowerCase() === googleData.email.toLowerCase());

            if (existingUser) {
                // User exists locally -> log them in
                const { _pw, ...safeUser } = existingUser;
                localDb.setCurrentUser(safeUser);
                setUser(safeUser);
                return safeUser;
            } else {
                // User does not exist locally -> register them silently
                const password = `google_${googleData.id || Date.now()}`;
                const userData = localDb.registerUser({
                    name: googleData.name || 'Google User',
                    college: 'N/A',
                    email: googleData.email,
                    password: password
                });
                localStorage.setItem('studyhub_welcome_new_signup', 'true');
                setUser(userData);
                return userData;
            }
        } catch (error) {
            throw new Error(error.message || 'Google Login failed');
        }
    };

    const logout = () => {
        localDb.logoutUser();
        setUser(null);
    };

    const fetchMe = () => {
        // In offline mode, user data is already in state from localStorage.
        // This is a no-op but kept for API compatibility with existing components.
        return Promise.resolve(user);
    };

    const addStudyHours = async (hours, method, type = 'Study') => {
        if (!user) return;
        const updatedUser = localDb.addStudyHours(user._id, hours, type);
        if (updatedUser) setUser(updatedUser);
    };

    const updateProfile = async (profileData) => {
        if (!user) return;
        try {
            const updatedUser = localDb.updateUserProfile(user._id, profileData);
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            throw new Error(error.message || 'Failed to update profile');
        }
    };

    const value = {
        user,
        isSessionValid: !!user,
        isLoading,
        login,
        register,
        logout,
        fetchMe,
        addStudyHours,
        updateProfile,
        googleLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
