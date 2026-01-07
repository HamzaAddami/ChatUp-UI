import { create } from 'zustand';
import api from '../services/api';
import { Alert } from 'react-native';

export const useProfileStore = create((set, get) => ({
  profile: null,
  blockedUsers: [],
  loading: true,
  saving: false,
  loadingBlocked: false,
  isEditing: false,
  editData: {
    nickname: '',
    about: '',
    avatarUrl: ''
  },

  setIsEditing: (isEditing) => set({ isEditing }),

  setEditData: (data) => set((state) => ({
    editData: { ...state.editData, ...data }
  })),

  resetEditData: () => set((state) => ({
    editData: {
      nickname: state.profile?.nickname || '',
      about: state.profile?.about || '',
      avatarUrl: state.profile?.avatarUrl || ''
    }
  })),

  loadProfile: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/users/me');
      set({
        profile: res.data,
        editData: {
          nickname: res.data.nickname || '',
          about: res.data.about || '',
          avatarUrl: res.data.avatarUrl || ''
        }
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Error Loading Profile");
    } finally {
      set({ loading: false });
    }
  },

  loadBlocked: async () => {
    try {
      set({ loadingBlocked: true });
      const res = await api.get('/users/blocked');
      
      console.log("Blocked users response:", res.data);
      
      let blockedUsers = [];
      if (Array.isArray(res.data)) {
        blockedUsers = res.data;
      } else if (res.data && typeof res.data === 'object') {
        blockedUsers = Object.values(res.data);
      }
      
      set({ blockedUsers });
    } catch (e) {
      console.error('Error loading blocked users:', e);
      Alert.alert("Erreur", "ERROR loading blocked users");
      set({ blockedUsers: [] });
    } finally {
      set({ loadingBlocked: false });
    }
  },

  unblockUser: async (userId, phoneNumber) => {
    try {
      await api.post('/users/unblock', { 
        phoneNumber: phoneNumber || userId 
      });
      
      Alert.alert("Succès", "Utilisateur débloqué");
      
      set((state) => ({
        blockedUsers: state.blockedUsers.filter(u => u.id !== userId)
      }));
    } catch (unblockError) {
      console.error("Unblock error:", unblockError);
      Alert.alert(
        "Erreur", 
        unblockError.response?.data?.error || "Impossible to unblock user"
      );
    }
  },

  saveProfile: async () => {
    const { editData, profile } = get();
    
    if (!editData.nickname.trim()) {
      Alert.alert("Erreur", "Le pseudo ne peut pas être vide.");
      return;
    }

    try {
      set({ saving: true });
      
      await api.put('/users/profile', {
        nickname: editData.nickname,
        about: editData.about,
        avatarUrl: editData.avatarUrl
      });

      set({
        profile: { ...profile, ...editData },
        isEditing: false
      });
      
      Alert.alert("Succès", "Profil mis à jour !");
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Échec de la mise à jour.");
    } finally {
      set({ saving: false });
    }
  },

  cancelEdit: () => {
    get().resetEditData();
    set({ isEditing: false });
  },

  getUserDisplayName: (blockedUser) => {
    if (!blockedUser) return "Utilisateur";
    
    if (blockedUser.nickname && blockedUser.nickname.trim() !== "") {
      return blockedUser.nickname;
    } else if (blockedUser.phoneNumber) {
      return blockedUser.phoneNumber;
    } else if (blockedUser.id) {
      return `Utilisateur ${blockedUser.id.substring(0, 8)}...`;
    }
    return "Utilisateur";
  }
}));