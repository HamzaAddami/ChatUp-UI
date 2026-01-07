import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { generateAndStoreKeys } from '../services/crypto';


const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,
    


    checkLogin: async () => {
        try {
            const token = await SecureStore.getItemAsync('jwt_token');
            const userId = await SecureStore.getItemAsync('user_id');

            if (token && userId) {
                set({ user: { id: userId, token } });
            }

            set({ loading: false });

        } catch (error) {
            console.error("Error checking login:", error);
            set({ loading: false });
        }
    },

    login: async (phoneNumber) => {

        await api.post('/auth/login', { phoneNumber });

    },

    verifyOtp: async (phoneNumber, code) => {

        const res = await api.post('/auth/verify', { phoneNumber, code });

        const { token, userId } = res.data;

        await SecureStore.setItemAsync('jwt_token', token);
        await SecureStore.setItemAsync('user_id', userId);

        const publicKey = await generateAndStoreKeys(userId);

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        await api.post('/keys/register', { publicKey });

        set({ user: { id: userId, token } });
    },

    logout: async () => {

        await SecureStore.deleteItemAsync('jwt_token');
        await SecureStore.deleteItemAsync('user_id');

        set({ user: null });
    },

}));

export default useAuthStore;

