// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

<<<<<<< HEAD
const API_URL = 'http://192.168.137.73:5182/api';
=======
const Ip = "192.168.137.64";

const API_URL = `http://${Ip}:5182/api`;
>>>>>>> fcbcfeb (Fixing Ip)

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

export const HubUrl = Platform.OS === 'android' 
<<<<<<< HEAD
  ? API_URL 
  : API_URL;
=======
  ? `http://${Ip}:5182/hubs/chat` 
  : `http://${Ip}:5182/hubs/chat`;
>>>>>>> fcbcfeb (Fixing Ip)

export default api;