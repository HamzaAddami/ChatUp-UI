// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const Ip = "192.168.137.64";

const API_URL = `http://${Ip}:5182/api`;


const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const HubUrl = Platform.OS === 'android' ? `http://${Ip}:5182/hubs/chat` : `http://${Ip}:5182/hubs/chat`;

export default api;