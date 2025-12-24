// src/screens/ConversationsListScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User, CheckCheck } from 'lucide-react-native';
import { decryptMessage } from '../services/crypto';
import { AuthContext } from '../context/AuthContext';

export default function ConversationsListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);

  const { user } = React.useContext(AuthContext);
  const userId = user?.id;

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversation');
      
      // Déchiffrer les derniers messages pour l'aperçu
      const decryptedData = await Promise.all(res.data.map(async (conv) => {
        if (conv.lastMessage) {
          const plainText = await decryptMessage(conv.lastMessage.cipherText, conv.lastMessage.iv);
          return { ...conv, lastMessageText: plainText };
        }
        return conv;
      }));
      
      setConversations(decryptedData);
    } catch (e) { console.error(e); }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

 const renderItem = ({ item }) => {
  const isGroup = item.type === "GROUP";


  // 🔥 récupérer l'autre utilisateur (PRIVATE)
  const otherUser = !isGroup
    ? item.members.find(m => m.userId !== userId)
    : null;

  // 🔹 online status
  const isOnline = isGroup
    ? item.members.some(m => m.isOnline)
    : otherUser?.isOnline;

  // 🔹 date
  const date = item.lastMessageAt ? new Date(item.lastMessageAt) : null;
  const dateDisplay = date
    ? (isToday(date)
        ? format(date, 'HH:mm')
        : format(date, 'dd/MM', { locale: fr }))
    : '';

  // 🔹 nom affiché
  const displayName = isGroup
    ? item.groupName
    : otherUser?.nickname || "Utilisateur";

  // 🔹 avatar
  const avatarUrl = isGroup
    ? item.groupAvatarUrl
    : otherUser?.avatarUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('Chat', {
          conversationId: item.id,
          name: displayName
        })
      }
    >
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.img} />
          ) : (
            <User color="#999" size={28} />
          )}
        </View>

        {isOnline && <View style={styles.onlineBadge} />}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.time}>{dateDisplay}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.msgPreview} numberOfLines={1}>
            {item.lastMessageText || "Aucun message"}
          </Text>

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};


  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 55, height: 55, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  img: { width: 55, height: 55, borderRadius: 20 },
  onlineBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    width: 14, height: 14, borderRadius: 7, 
    backgroundColor: '#4CD964', borderWidth: 2, borderColor: '#fff' 
  },
  mainContent: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 17, fontWeight: '700', color: '#1c1c1e', flex: 1, marginRight: 10 },
  time: { fontSize: 13, color: '#8e8e93' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  msgPreview: { fontSize: 15, color: '#8e8e93', flex: 1, marginRight: 10 },
  unreadBadge: { backgroundColor: '#007AFF', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});