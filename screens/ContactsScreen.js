import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../services/api';
import { UserPlus, MessageSquare } from 'lucide-react-native';

export default function ContactsScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await api.get('/users/contacts');
      setContacts(res.data);
    } catch (e) { console.error(e); }
  };

  const addContact = async () => {
    if(!phone) return;
    try {
      await api.post('/users/contacts', { phoneNumber: phone });
      setPhone('');
      loadContacts(); // Recharger la liste
      Alert.alert("Succès", "Contact ajouté");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'ajouter ce numéro");
    }
  };

  const startChat = async (contact) => {
    try {
      // Tenter de créer ou récupérer la conversation
      const res = await api.post('/conversation/private', {
        contactUserId: contact.id,
        myPublicKey: "mock_pk_resent"
      });
      // Navigation vers l'écran Chat (qui est dans la Stack, pas les Tabs)
      navigation.navigate('Chat', { conversationId: res.data.conversationId, name: contact.nickname || contact.phoneNumber });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Zone Ajout */}
      <View style={styles.addSection}>
        <Text style={styles.label}>Ajouter un contact :</Text>
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="+2126..." 
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addContact}>
             <UserPlus color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste Contacts */}
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => startChat(item)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.nickname?.[0] || "#"}</Text></View>
            <View style={{flex:1}}>
               <Text style={styles.name}>{item.nickname || "Sans nom"}</Text>
               <Text style={styles.phoneItem}>{item.phoneNumber}</Text>
            </View>
            <MessageSquare color="#007AFF" size={20} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    addSection: { padding: 20, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#eee' },
    label: { marginBottom: 10, fontWeight: '600', color: '#333' },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
    addBtn: { backgroundColor: '#28a745', padding: 10, borderRadius: 8, justifyContent: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#f0f0f0' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    name: { fontWeight: 'bold', fontSize: 16 },
    phoneItem: { color: '#666', fontSize: 13 }
});