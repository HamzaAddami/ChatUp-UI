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
    const token = await SecureStore.getItemAsync('jwt_token');
    const userId = await SecureStore.getItemAsync('user_id');
    if (token && userId) {
      setUser({ id: userId, token });
    }
    setLoading(false);
  };

  const login = async (phoneNumber) => {
    await api.post('/auth/login', { phoneNumber });
  };

  const verifyOtp = async (phoneNumber, code) => {
    const res = await api.post('/auth/verify', { phoneNumber, code });
    const { token, userId } = res.data;

    await SecureStore.setItemAsync('jwt_token', token);
    await SecureStore.setItemAsync('user_id', userId);

    const publicKey = await generateAndStoreKeys(userId);
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await api.post('/keys/register', { publicKey });

    setUser({ id: userId, token });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};