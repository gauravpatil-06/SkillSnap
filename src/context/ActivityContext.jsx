import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as localDb from '../services/localDb';
import { useAuth } from './AuthContext';

const ActivityContext = createContext();

export const useActivities = () => useContext(ActivityContext);

const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ActivityProvider = ({ children }) => {
    const { user, isSessionValid } = useAuth();
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [todayActivities, setTodayActivities] = useState([]);
    const [monthlySummary, setMonthlySummary] = useState({ studyHrs: 0, codingHrs: 0, watchingHrs: 0, totalStudyHrs: 0, totalCodingHrs: 0, totalWatchingHrs: 0 });
    const [goals, setGoals] = useState({ codingGoalHrs: 100, watchingGoalHrs: 50, studyGoalHrs: 100 });
    const [totalActivityCount, setTotalActivityCount] = useState(0);

    const fetchActivities = useCallback(() => {
        if (!user) return;
        setIsLoading(true);
        try {
            const localDate = getLocalDateStr();
            const allActivities = localDb.getActivities(user._id);
            const todayActs = localDb.getTodayActivities(user._id, localDate);
            const summary = localDb.getMonthlySummary(user._id, localDate);
            const userGoals = localDb.getGoals(user._id);

            setActivities(allActivities);
            setTotalActivityCount(allActivities.length);
            setTodayActivities(todayActs);
            setMonthlySummary(summary);
            setGoals(userGoals);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isSessionValid) {
            fetchActivities();
        } else {
            setActivities([]);
            setTodayActivities([]);
            setIsLoading(false);
        }
    }, [isSessionValid, fetchActivities]);

    const deleteActivity = async (id) => {
        if (!user) return;
        localDb.deleteActivity(user._id, id);
        setActivities(prev => prev.filter(a => a._id !== id));
        setTodayActivities(prev => prev.filter(a => a._id !== id));
        setTotalActivityCount(prev => prev - 1);
    };

    return (
        <ActivityContext.Provider value={{
            activities,
            setActivities,
            isLoading,
            fetchActivities,
            deleteActivity,
            todayActivities,
            setTodayActivities,
            monthlySummary,
            setMonthlySummary,
            goals,
            setGoals,
            totalActivityCount,
            setTotalActivityCount,
        }}>
            {children}
        </ActivityContext.Provider>
    );
};
