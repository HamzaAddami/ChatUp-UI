import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { generateAndStoreKeys } from '../services/crypto';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      const userId = await SecureStore.getItemAsync('user_id');
      if (token && userId) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser({ id: userId, token });
      }
    } catch (e) {
      console.error("Erreur checkLogin:", e);
    } finally {
      setLoading(false);
    }
  };

  
  const handleAuthResponse = async (token, userId) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    await SecureStore.setItemAsync('jwt_token', token);
    await SecureStore.setItemAsync('user_id', userId);

    try {
      const publicKey = await generateAndStoreKeys(userId);
      await api.post('/keys/register', { publicKey });
    } catch (cryptoError) {
      console.error("Erreur lors de l'enregistrement des clés:", cryptoError);
    }

    setUser({ id: userId, token });
  };

  const loginWithOtp = async (phoneNumber) => {
    return await api.post('/auth/login', { phoneNumber });
  };

  const verifyOtp = async (phoneNumber, code) => {
    const res = await api.post('/auth/verify', { phoneNumber, code });
    const { token, userId } = res.data;
    await handleAuthResponse(token, userId);
  };

  const loginWithFirebase = async (firebaseToken) => {
    try {
      const res = await api.post('/auth/firebase-login', { firebaseToken });
      
      const { token, userId } = res.data;
      await handleAuthResponse(token, userId);
      
      return { success: true };
    } catch (error) {
      console.error('Firebase login error details:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 'Échec de la validation du token par le serveur'
      );
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_id');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loginWithOtp, 
        verifyOtp, 
        loginWithFirebase, 
        logout, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};