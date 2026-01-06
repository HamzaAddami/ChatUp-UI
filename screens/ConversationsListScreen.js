import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { User } from 'lucide-react-native';
import { decryptMessage } from '../services/crypto';
import { AuthContext } from '../context/AuthContext';
import { useChatHub } from '../hooks/useChatHub';

export default function ConversationsListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const { user } = useContext(AuthContext);
  const { 
    liveMessages, 
    isUserOnline, 
    getConversationUnreadCount,
    isUserTyping,
    refreshAllUnreadCounts,
    unreadCounts
  } = useChatHub();
  
  const userId = user?.id;

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversation');
      
      // Déchiffrer les derniers messages pour l'aperçu
      const decryptedData = await Promise.all(res.data.map(async (conv) => {
        if (conv.lastMessage) {
          try {
            const plainText = await decryptMessage(conv.lastMessage.cipherText, conv.lastMessage.iv);
            return { ...conv, lastMessageText: plainText };
          } catch (decryptError) {
            console.error('Error decrypting message:', decryptError);
            return { ...conv, lastMessageText: "Message chiffré" };
          }
        }
        return conv;
      }));
      
      setConversations(decryptedData);
    } catch (e) { 
      console.error('Error loading conversations:', e); 
    }
  };

  // Rafraîchir les conversations et compteurs au focus
  useFocusEffect(
    useCallback(() => {
      console.log("📋 ConversationsListScreen focused - refreshing...");
      loadConversations();
      // Petit délai pour s'assurer que le hub est prêt
      setTimeout(() => {
        refreshAllUnreadCounts();
      }, 500);
    }, [])
  );

  // Recharger quand nouveau message arrive
  useEffect(() => {
    if (liveMessages.length > 0) {
      loadConversations();
    }
  }, [liveMessages]);

  // Rafraîchir quand les compteurs changent
  useEffect(() => {
    // Force un re-render quand les compteurs changent
    setConversations(prev => [...prev]);
  }, [unreadCounts]);

  // Méthode pour récupérer les membres d'une conversation
  const getOtherUser = (conversation) => {
    if (conversation.type === "GROUP") return null;
    return conversation.members?.find(m => m.userId !== userId) || null;
  };

  // Méthode pour vérifier si quelqu'un tape dans une conversation
  const checkIfSomeoneIsTyping = (conversation) => {
    if (conversation.type === "GROUP") {
      return conversation.members?.some(m => 
        m.userId !== userId && 
        isUserTyping(conversation.id, m.userId)
      ) || false;
    } else {
      const otherUser = getOtherUser(conversation);
      return otherUser ? isUserTyping(conversation.id, otherUser.userId) : false;
    }
  };

  // Méthode pour vérifier le statut en ligne
  const checkOnlineStatus = (conversation) => {
    if (conversation.type === "GROUP") {
      return conversation.members?.some(m => isUserOnline(m.userId)) || false;
    } else {
      const otherUser = getOtherUser(conversation);
      return otherUser ? isUserOnline(otherUser.userId) : false;
    }
  };

  const renderItem = ({ item }) => {
    const isGroup = item.type === "GROUP";
    const otherUser = getOtherUser(item);
    
    const isOnline = checkOnlineStatus(item);
    
    const date = item.lastMessageAt ? new Date(item.lastMessageAt) : null;
    const dateDisplay = date
      ? (isToday(date)
          ? format(date, 'HH:mm')
          : format(date, 'dd/MM', { locale: fr }))
      : '';

    const displayName = isGroup
      ? item.groupName || "Groupe"
      : otherUser?.nickname || otherUser?.phoneNumber || "Utilisateur";

    const avatarUrl = isGroup
      ? item.groupAvatarUrl
      : otherUser?.avatarUrl;

    const unreadCount = getConversationUnreadCount(item.id);

    const someoneIsTyping = checkIfSomeoneIsTyping(item);

    let previewText = item.lastMessageText || "Aucun message";
    if (someoneIsTyping) {
      previewText = "Est en train d'écrire...";
    } else if (previewText.length > 50) {
      previewText = previewText.substring(0, 50) + '...';
    }

    const previewStyle = [
      styles.msgPreview, 
      someoneIsTyping && styles.typingText,
      unreadCount > 0 && styles.unreadText
    ];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log(`📖 Opening conversation ${item.id}`);
          navigation.navigate('Chat', {
            conversationId: item.id,
            name: displayName
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.img} 
                onError={() => console.log('Error loading avatar')}
              />
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
            <Text 
              style={previewStyle} 
              numberOfLines={1}
            >
              {previewText}
            </Text>

            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Afficher un état vide si nécessaire
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <User size={60} color="#ccc" />
      <Text style={styles.emptyText}>Aucune conversation</Text>
      <Text style={styles.emptySubtext}>
        Commencez une nouvelle conversation pour voir vos discussions ici
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContent : { paddingVertical: 10 }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        extraData={unreadCounts} // Force re-render quand les compteurs changent
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarWrapper: { 
    position: 'relative' 
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5, 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  img: { 
    width: '100%', 
    height: '100%', 
  },
  onlineBadge: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#4CD964', 
    borderWidth: 2, 
    borderColor: '#fff' 
  },
  mainContent: { 
    flex: 1, 
    marginLeft: 15, 
    justifyContent: 'center' 
  },
  topRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 4 
  },
  name: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1c1c1e', 
    flex: 1, 
    marginRight: 10 
  },
  time: { 
    fontSize: 13, 
    color: '#8e8e93' 
  },
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  msgPreview: { 
    fontSize: 14, 
    color: '#8e8e93', 
    flex: 1, 
    marginRight: 10 
  },
  typingText: {
    fontStyle: 'italic',
    color: '#007AFF',
    fontWeight: '500',
  },
  unreadText: {
    fontWeight: '600',
    color: '#1c1c1e'
  },
  unreadBadge: { 
    backgroundColor: '#007AFF', 
    minWidth: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 6 
  },
  unreadBadgeText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: 'bold' 
  }
});