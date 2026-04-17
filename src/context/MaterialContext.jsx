import React, { createContext, useContext, useState, useEffect } from 'react';
import * as localDb from '../services/localDb';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const MaterialContext = createContext();

export const useMaterials = () => useContext(MaterialContext);

export const MaterialProvider = ({ children }) => {
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const fetchMaterials = () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = localDb.getMaterials(user._id);
            setMaterials(data);
        } catch (error) {
            console.error('Fetch materials error:', error);
            toast.error('Failed to load study materials');
        } finally {
            setIsLoading(false);
        }
    };

    const addMaterial = async (title, description, fileUrl, fileType, fileName) => {
        if (!user) return;
        const newMaterial = localDb.addMaterial(user._id, { title, description, fileUrl, fileType, fileName });
        setMaterials(prev => [newMaterial, ...prev]);
        return newMaterial;
    };

    const updateMaterial = async (id, materialData) => {
        if (!user) return;
        const updated = localDb.updateMaterial(user._id, id, materialData);
        setMaterials(prev => prev.map(m => m._id === id ? updated : m));
        return updated;
    };

    const deleteMaterial = async (id) => {
        if (!user) return;
        localDb.deleteMaterial(user._id, id);
        setMaterials(prev => prev.filter(m => m._id !== id));
        toast.success('Material deleted');
    };

    useEffect(() => {
        if (user) {
            fetchMaterials();
        } else {
            setMaterials([]);
            setIsLoading(false);
        }
    }, [user]);

    return (
        <MaterialContext.Provider value={{
            materials,
            isLoading,
            fetchMaterials,
            addMaterial,
            updateMaterial,
            deleteMaterial
        }}>
            {children}
        </MaterialContext.Provider>
    );
};
