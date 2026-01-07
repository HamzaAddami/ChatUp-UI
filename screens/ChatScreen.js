import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useChatHub } from "../hooks/useChatHub";
import api from "../services/api";
import { encryptMessage, decryptMessage } from "../services/crypto";
import { Send, ShieldAlert, ShieldCheck } from "lucide-react-native";
import * as signalR from "@microsoft/signalr";

export default function ChatScreen({ route, navigation }) {
  const { conversationId, name } = route.params;
  const { user } = useContext(AuthContext);
  const {
    connection,
    liveMessages,
    sendTyping,
    markMessagesAsRead,
    isUserTyping,
    errors,
  } = useChatHub();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [conversationMembers, setConversationMembers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rejoindre la conversation
  useEffect(() => {
    const joinChat = async () => {
      if (!connection) return;

      try {
        if (connection.state === signalR.HubConnectionState.Connected) {
          await connection.invoke("JoinConversation", conversationId);
          console.log("✅ Joined conversation:", conversationId);
          await loadConversationInfo();
        }
      } catch (err) {
        console.error("❌ Join err", err);
      }
    };

    joinChat();

    return () => {
      if (
        connection &&
        connection.state === signalR.HubConnectionState.Connected
      ) {
        if (isTyping) {
          sendTyping(conversationId, false);
        }
        connection
          .invoke("LeaveConversation", conversationId)
          .catch((e) => console.log("Error leaving:", e));
      }
    };
  }, [connection, conversationId, connection?.state]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (liveMessages.length > 0) {
      const newMsgs = liveMessages.filter(
        (m) =>
          m.conversationId === conversationId &&
          !messages.some((existing) => existing.id === m.id)
      );

      if (newMsgs.length > 0) {
        processMessages(newMsgs, true);

        if (navigation.isFocused()) {
          const newMessageIds = newMsgs
            .filter((m) => m.senderId !== user.id)
            .map((m) => m.id);

          if (newMessageIds.length > 0) {
            setTimeout(() => {
              markMessagesAsRead(conversationId, newMessageIds);
            }, 500);
          }
        }
      }
    }
  }, [liveMessages]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      const unreadIds = messages
        .filter((m) => m.senderId !== user.id && !m.readBy?.includes(user.id))
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        markMessagesAsRead(conversationId, unreadIds);
      }
    });

    return unsubscribeFocus;
  }, [navigation, messages]);

  useEffect(() => {
    if (!connection) return;

    const handleMessageRead = (statusNotification) => {
      console.log("✓✓ Message read update in ChatScreen:", statusNotification);
      
      setMessages((prev) => 
        prev.map(msg => {
          if (statusNotification.messageId === msg.id || 
              statusNotification.messageIds?.includes(msg.id)) {
            const updatedReadBy = [...(msg.readBy || [])];
            statusNotification.readerIds?.forEach(readerId => {
              if (!updatedReadBy.includes(readerId)) {
                updatedReadBy.push(readerId);
              }
            });
            return { ...msg, readBy: updatedReadBy };
          }
          return msg;
        })
      );
    };

    if (connection.state === signalR.HubConnectionState.Connected) {
      connection.on("MessageRead", handleMessageRead);
    }

    return () => {
      if (connection) {
        connection.off("MessageRead", handleMessageRead);
      }
    };
  }, [connection, connection?.state]);

  useEffect(() => {
    if (errors && errors.length > 0) {
      const lastError = errors[errors.length - 1];
      Alert.alert("Erreur", lastError.message);
    }
  }, [errors]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={isBlockedByMe ? handleUnblock : confirmBlock}
          style={{ marginRight: 15 }}
        >
          {isBlockedByMe ? (
            <ShieldCheck size={24} color="#4CD964" />
          ) : (
            <ShieldAlert size={24} color="#FF3B30" />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isBlockedByMe, conversationMembers]);

  const loadConversationInfo = async () => {
    try {
      const res = await api.get(`/conversation/${conversationId}`);
      setConversationMembers(res.data.members);

      const other = res.data.members.find((m) => m.userId !== user.id);
      if (other) {
        setOtherUserId(other.userId);
      }

      const blockedRes = await api.get("/users/blocked");
      const isBlocked = blockedRes.data.some((u) => u.id === other?.userId);
      setIsBlockedByMe(isBlocked);
    } catch (e) {
      console.error("Error loading conversation info:", e);
    }
  };

  const processMessages = async (msgs, append = false) => {
    const decryptedPromises = msgs.map(async (msg) => {
      const plainText = await decryptMessage(msg.cipherText, msg.iv);
      return { ...msg, text: plainText };
    });

    const decryptedMsgs = await Promise.all(decryptedPromises);

    setMessages((prev) => {
      if (append) {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNewMsgs = decryptedMsgs.filter(
          (m) => !existingIds.has(m.id)
        );
        return [...uniqueNewMsgs, ...prev];
      }
      return decryptedMsgs;
    });
  };

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/messages/conversation/${conversationId}`);
      await processMessages(res.data);

      const unreadIds = res.data
        .filter((m) => m.senderId !== user.id && !m.readBy?.includes(user.id))
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        setTimeout(() => {
          markMessagesAsRead(conversationId, unreadIds);
        }, 800);
      }
    } catch (e) {
      console.error("Error loading history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTyping(conversationId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(conversationId, false);
    }, 2000);

    if (text.length === 0 && isTyping) {
      setIsTyping(false);
      sendTyping(conversationId, false);
    }
  };

  const handleUnblock = async () => {
    try {
      const otherMember = conversationMembers.find((m) => m.userId !== user.id);
      await api.post("/users/unblock", {
        phoneNumber: otherMember.phoneNumber,
      });
      setIsBlockedByMe(false);
      Alert.alert("Succès", "Utilisateur débloqué.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible de débloquer.");
    }
  };

  const sendMessage = async () => {
    if (isBlockedByMe) {
      Alert.alert("Action impossible", "Vous avez bloqué cet utilisateur.");
      return;
    }

    if (!inputText.trim() || !connection) return;

    if (isTyping) {
      setIsTyping(false);
      sendTyping(conversationId, false);
    }

    try {
      const { cipherText, iv } = await encryptMessage(
        inputText,
        "some_public_key"
      );

      const request = {
        ConversationId: conversationId,
        CipherText: cipherText,
        Iv: iv,
      };

      await connection.invoke("SendMessage", request);
      setInputText("");
    } catch (err) {
      console.error("Send error", err);
      Alert.alert("Erreur", err.message || "Erreur lors de l'envoi du message");
    }
  };

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
              const otherMember = conversationMembers.find(
                (m) => m.userId !== user.id
              );

              if (otherMember && otherMember.phoneNumber) {
                await api.post("/users/block", {
                  phoneNumber: otherMember.phoneNumber,
                });

                Alert.alert("Succès", "Utilisateur bloqué.");
                navigation.goBack();
              } else {
                throw new Error("Numéro de téléphone introuvable");
              }
            } catch (e) {
              console.error(e);
              Alert.alert(
                "Erreur",
                e.response?.data || "Impossible de bloquer cet utilisateur."
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === user.id;
    
    // Pour une conversation privée, vérifier si l'autre participant a lu
    const otherParticipant = conversationMembers.find(m => m.userId !== user.id);
    const isReadByOther = otherParticipant && 
                         item.readBy && 
                         Array.isArray(item.readBy) &&
                         item.readBy.includes(otherParticipant.userId);
    
    return (
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.msgText, isMe ? styles.myText : styles.otherText]}>
          {item.text}
        </Text>
        {isMe && (
          <Text style={styles.readStatus}>
            {isReadByOther ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserId || !isUserTyping(conversationId, otherUserId)) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{name} est en train d'écrire</Text>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ padding: 10 }}
      />

      {renderTypingIndicator()}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Message..."
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Send color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2" },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 15, marginVertical: 5 },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 2,
  },
  msgText: { fontSize: 16 },
  myText: { color: "#fff" },
  otherText: { color: "#000" },
  readStatus: {
    fontSize: 10,
    color: "#fff",
    alignSelf: "flex-end",
    marginTop: 2,
    opacity: 0.7,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 5,
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: "#8e8e93",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendBtn: { backgroundColor: "#007AFF", padding: 10, borderRadius: 20 },
});