import { create } from 'zustand';
import api from '../services/api';
import { Alert } from 'react-native';

export const useContactsStore = create((set, get) => ({
  contacts: [],
  loading: false,
  adding: false,
  searching: false,
  searchResults: [],

  loadContacts: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/users/contacts');
      set({ contacts: res.data });
    } catch (e) {
      console.error('Error loading contacts:', e);
      Alert.alert("Erreur", "Impossible de charger les contacts");
    } finally {
      set({ loading: false });
    }
  },

  searchUsers: async (query) => {
    if (!query || !query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      set({ searching: true });
      const res = await api.get('/users/search', {
        params: { query: query.trim() }
      });
      set({ searchResults: res.data || [] });
    } catch (e) {
      console.error('Error searching users:', e);
      set({ searchResults: [] });
    } finally {
      set({ searching: false });
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  addContact: async (phoneNumber) => {
    if (!phoneNumber || !phoneNumber.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone");
      return false;
    }

    try {
      set({ adding: true });
      await api.post('/users/contacts', { phoneNumber: phoneNumber.trim() });
      
      await get().loadContacts();
      
      Alert.alert("Succès", "Contact ajouté");
      return true;
    } catch (e) {
      console.error('Error adding contact:', e);
      const errorMsg = e.response?.data?.error || "Impossible d'ajouter ce numéro";
      Alert.alert("Erreur", errorMsg);
      return false;
    } finally {
      set({ adding: false });
    }
  },

  addUserAsContact: async (phoneNumber) => {
    try {
      set({ adding: true });
      await api.post('/users/contacts', { phoneNumber: phoneNumber.trim() });
      
      await get().loadContacts();
      
      Alert.alert("Succès", "Contact ajouté");
      return true;
    } catch (e) {
      console.error('Error adding user as contact:', e);
      const errorMsg = e.response?.data?.error || "Impossible d'ajouter cet utilisateur";
      Alert.alert("Erreur", errorMsg);
      return false;
    } finally {
      set({ adding: false });
    }
  },

  removeContact: async (contactId) => {
    try {
      await api.delete(`/users/contacts/${contactId}`);
      
      set((state) => ({
        contacts: state.contacts.filter(c => c.id !== contactId)
      }));
      
      Alert.alert("Succès", "Contact supprimé");
      return true;
    } catch (e) {
      console.error('Error removing contact:', e);
      Alert.alert("Erreur", "Impossible de supprimer ce contact");
      return false;
    }
  },

  startPrivateConversation: async (contact, myPublicKey = "mock_pk_resent") => {
    try {
      const res = await api.post('/conversation/private', {
        contactUserId: contact.id,
        myPublicKey
      });
      
      return {
        success: true,
        conversationId: res.data.conversationId,
        contactName: contact.nickname || contact.phoneNumber
      };
    } catch (e) {
      console.error('Error starting conversation:', e);
      Alert.alert("Erreur", "Impossible de démarrer la conversation");
      return { success: false };
    }
  },

  getContactById: (contactId) => {
    const { contacts } = get();
    return contacts.find(c => c.id === contactId);
  },

  isUserInContacts: (userId) => {
    const { contacts } = get();
    return contacts.some(c => c.id === userId);
  },

  searchLocalContacts: (query) => {
    const { contacts } = get();
    if (!query || !query.trim()) return contacts;
    
    const lowerQuery = query.toLowerCase().trim();
    return contacts.filter(contact => 
      (contact.nickname && contact.nickname.toLowerCase().includes(lowerQuery)) ||
      (contact.phoneNumber && contact.phoneNumber.includes(lowerQuery))
    );
  }
}));