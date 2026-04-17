import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as localDb from '../services/localDb';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { user, isSessionValid, fetchMe } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = useCallback(() => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = localDb.getTasks(user._id);
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isSessionValid) {
            fetchTasks();
        } else {
            setTasks([]);
            setIsLoading(false);
        }
    }, [isSessionValid, fetchTasks]);

    const addTask = async (title, description = '', pdfUrl = '', fileName = '') => {
        if (!user) return;
        const newTask = localDb.addTask(user._id, { title, description, pdfUrl, fileName });
        setTasks(prev => [newTask, ...prev]);
    };

    const updateTask = async (id, updates) => {
        if (!user) return;
        const updated = localDb.updateTask(user._id, id, updates);
        setTasks(prev => prev.map(t => t._id === id ? updated : t));
    };

    const deleteTask = async (id) => {
        if (!user) return;
        localDb.deleteTask(user._id, id);
        setTasks(prev => prev.filter(t => t._id !== id));
    };

    const toggleTaskStatus = async (id) => {
        if (!user) return;
        const task = tasks.find(t => t._id === id);
        if (!task) return;
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const updated = localDb.updateTask(user._id, id, { status: newStatus });
        setTasks(prev => prev.map(t => t._id === id ? updated : t));
        if (newStatus === 'completed' && fetchMe) {
            fetchMe();
        }
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            isLoading,
            addTask,
            updateTask,
            deleteTask,
            toggleTaskStatus,
            fetchTasks
        }}>
            {children}
        </TaskContext.Provider>
    );
};
