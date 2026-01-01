// src/hooks/useChatHub.js
import { useEffect, useState, useRef, useContext } from "react";
import * as signalR from "@microsoft/signalr";
import { HubUrl } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export const useChatHub = () => {
  const { user } = useContext(AuthContext);
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!user?.token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HubUrl, { accessTokenFactory: () => user.token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);
  }, [user]);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("✅ SignalR Connected");

          // ==================== Messages ====================
          connection.on("ReceiveMessage", (notification) => {
            console.log("📩 New message received:", notification);
            setMessages((prev) => [notification.message, ...prev]);
            setUnreadCounts((prev) => ({
              ...prev,
              [notification.conversationId]:
                (prev[notification.conversationId] || 0) + 1,
            }));
          });

          // ==================== Messages Lus ====================
          connection.on("MessageRead", (statusNotification) => {
            console.log("✓✓ Message read:", statusNotification);
            if (
              statusNotification.conversationId &&
              statusNotification.readerIds
            ) {
              // Réduire le compteur si ce n'est pas moi qui a lu
              const currentUserId = user?.id;
              if (!statusNotification.readerIds.includes(currentUserId)) {
                setUnreadCounts((prev) => {
                  const currentCount =
                    prev[statusNotification.conversationId] || 0;
                  return {
                    ...prev,
                    [statusNotification.conversationId]: Math.max(
                      0,
                      currentCount - 1
                    ),
                  };
                });
              }
            }
          });

          // ==================== Statut En Ligne ====================
          connection.on("UserOnline", (userId) => {
            console.log("🟢 User online:", userId);
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              next.add(userId);
              return next;
            });
          });

          connection.on("UserOffline", (userId, lastSeen) => {
            console.log("⚫ User offline:", userId, "at", lastSeen);
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          });

          // ==================== Typing Indicator ====================
          connection.on("UserTyping", (notif) => {
            console.log("⌨️ User typing:", notif);
            setTypingStatus((prev) => ({
              ...prev,
              [notif.conversationId]: {
                ...prev[notif.conversationId],
                [notif.userId]: notif.isTyping,
              },
            }));

            // Auto-clear typing status after 3 seconds
            if (notif.isTyping) {
              setTimeout(() => {
                setTypingStatus((prev) => ({
                  ...prev,
                  [notif.conversationId]: {
                    ...prev[notif.conversationId],
                    [notif.userId]: false,
                  },
                }));
              }, 3000);
            }
          });

          // ==================== Compteur de messages non lus ====================
          connection.on("UnreadCounts", (unreadCounts) => {
            console.log("🔔 Unread counts received:", unreadCounts);
            setUnreadCounts(unreadCounts); // C'est un dictionnaire {conversationId: count}
          });

          connection.on("UpdateUnreadCount", (conversationId, count) => {
            console.log(`🔔 Unread count for ${conversationId}: ${count}`);
            setUnreadCounts((prev) => ({
              ...prev,
              [conversationId]: count,
            }));
          });

          // ==================== Gestion des erreurs ====================
          connection.on("Error", (errorMessage) => {
            console.error("❌ SignalR Error:", errorMessage);
            setErrors((prev) => [
              ...prev,
              { message: errorMessage, timestamp: new Date() },
            ]);
          });
        })
        .catch((err) => {
          console.error("❌ SignalR Connection Error:", err);
        });

      // Gestion de la reconnexion
      connection.onreconnecting((error) => {
        console.log("🔄 Reconnecting...", error);
      });

      connection.onreconnected((connectionId) => {
        console.log("✅ Reconnected! ConnectionId:", connectionId);
      });

      connection.onclose((error) => {
        console.log("🔴 Connection closed", error);
      });

      return () => {
        console.log("🛑 Stopping SignalR connection");
        connection.stop();
      };
    }
  }, [connection]);

  // ==================== Méthodes Helper ====================

  const sendTyping = async (conversationId, isTyping) => {
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke("SendTyping", conversationId, isTyping);
      } catch (err) {
        console.error("Error sending typing status:", err);
      }
    }
  };

  const getUnreadCount = async (conversationId) => {
    await connection.invoke("GetUnreadCount", conversationId);
};

// CORRECTION : La méthode backend s'appelle "GetUnreadCounts" (au pluriel) sans paramètre
const refreshAllUnreadCounts = async () => {
    if (connection?.state === signalR.HubConnectionState.Connected) {
        try {
            await connection.invoke("GetUnreadCounts");
        } catch (err) {
            console.error("Error getting unread counts:", err);
        }
    }
};

  const markMessagesAsRead = async (conversationId, messageIds) => {
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke("MarkMessagesAsRead", {
          ConversationId: conversationId,
          MessageIds: messageIds,
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const isUserTyping = (conversationId, userId) => {
    return typingStatus[conversationId]?.[userId] === true;
  };

  const getConversationUnreadCount = (conversationId) => {
    return unreadCounts[conversationId] || 0;
  };

  const resetLocalUnreadCount = (conversationId) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [conversationId]: 0,
    }));
  };

  return {
    connection,
    liveMessages: messages,
    typingStatus,
    onlineUsers,
    unreadCounts,
    errors,
    sendTyping,
    getUnreadCount,
    markMessagesAsRead,
    isUserOnline,
    isUserTyping,
    getConversationUnreadCount,
    resetLocalUnreadCount,
    refreshAllUnreadCounts
  };
};
