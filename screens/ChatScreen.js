import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useChatHub } from '../hooks/useChatHub';
import api from '../services/api';
import { encryptMessage, decryptMessage } from '../services/crypto';
import { Send } from 'lucide-react-native';
import * as signalR from '@microsoft/signalr';
import { ShieldAlert } from 'lucide-react-native';
import { Alert } from 'react-native';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, name } = route.params;
  const { user } = useContext(AuthContext);
  const { connection, liveMessages } = useChatHub();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Met le titre
  useEffect(() => {
  const joinChat = async () => {
    // 1. Vérifier si l'objet de connexion existe
    if (!connection) return;

    try {
      // 2. Attendre que la connexion soit prête si elle est en cours de démarrage
      // State 1 correspond à 'Connected' dans SignalR
      if (connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke("JoinConversation", conversationId);
        console.log("✅ Joined conversation:", conversationId);
      } else {
        // Si la connexion n'est pas encore prête, on attend un peu ou on réessaie
        console.log("⏳ Connection state is:", connection.state, "waiting...");
      }
    } catch (err) {
      console.error("❌ Join err", err);
    }
  };

  joinChat();

  return () => {
    // Quitter proprement seulement si on est connecté
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke("LeaveConversation", conversationId)
        .catch(e => console.log("Error leaving:", e));
    }
  };
}, [connection, conversationId, connection?.state]);

  // 2. Charge l'historique API
  useEffect(() => {
    loadHistory();
  }, []);

  // 3. Fusionne historique + messages SignalR
  useEffect(() => {
    if (liveMessages.length > 0) {
      // Filtrer pour ne garder que ceux de cette conversation
      const newMsgs = liveMessages.filter(m => m.conversationId === conversationId);
      processMessages(newMsgs, true);
    }
  }, [liveMessages]);

  // Dans ChatScreen.js
useEffect(() => {
    navigation.setOptions({
        headerRight: () => (
            <TouchableOpacity onPress={confirmBlock}>
                <ShieldAlert size={24} color="#FF3B30" />
            </TouchableOpacity>
        ),
    });
}, [navigation]);

const confirmBlock = () => {
    Alert.alert(
        "Bloquer l'utilisateur",
        "Voulez-vous vraiment bloquer ce contact ? Vous ne recevrez plus ses messages.",
        [
            { text: "Annuler", style: "cancel" },
            { 
              text: "Bloquer", 
              style: "destructive", 
              onPress: async () => {
                  try {
                      // On récupère le numéro via les membres de la conv
                      const res = await api.get(`/conversation/${conversationId}`);
                      const phone = res.data.members[0].phoneNumber;
                      await api.post('/users/block', { phoneNumber: phone });
                      navigation.goBack();
                  } catch (e) { Alert.alert("Erreur", "Action impossible"); }
              } 
            }
        ]
    );
};

const processMessages = async (msgs, append = false) => {
  const decryptedPromises = msgs.map(async (msg) => {
    const plainText = await decryptMessage(msg.cipherText, msg.iv);
    return { ...msg, text: plainText };
  });
  
  const decryptedMsgs = await Promise.all(decryptedPromises);
  
  setMessages(prev => {
    if (append) {
      // 1. Get IDs of messages we already have in the list
      const existingIds = new Set(prev.map(m => m.id));
      
      // 2. Only add messages that aren't already there
      const uniqueNewMsgs = decryptedMsgs.filter(m => !existingIds.has(m.id));
      
      return [...uniqueNewMsgs, ...prev];
    }
    return decryptedMsgs; 
  });
};

  const loadHistory = async () => {
    const res = await api.get(`/messages/conversation/${conversationId}`);
    await processMessages(res.data);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !connection) return;

    try {
      // 1. Chiffrer (Pour l'instant, on chiffre pour 'tout le monde' avec une fausse clé)
      const { cipherText, iv } = await encryptMessage(inputText, "some_public_key");

      // 2. Envoyer via SignalR (Ton backend attend SendMessageRequest)
      const request = {
        ConversationId: conversationId,
        CipherText: cipherText,
        Iv: iv
      };

      await connection.invoke("SendMessage", request);
      setInputText('');
    } catch (err) {
      console.error("Send error", err);
      alert("Erreur envoi");
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.msgText, isMe ? styles.myText : styles.otherText]}>
            {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        inverted // Affiche les messages du bas vers le haut
        contentContainerStyle={{ padding: 10 }}
      />
      
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Send color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 15, marginVertical: 5 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 2 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 16 },
  myText: { color: '#fff' },
  otherText: { color: '#000' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  blockedRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  blockedName: { fontSize: 16, color: '#333', fontWeight: '500' },
  unblockText: { color: '#007AFF', fontWeight: '600' },
  emptyText: { color: '#999', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  sendBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 20 }
});