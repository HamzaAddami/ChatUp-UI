// src/hooks/useChatHub.js
import { useEffect, useState, useRef, useContext } from 'react';
import * as signalR from '@microsoft/signalr';
import { HubUrl } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const useChatHub = () => {
  const { user } = useContext(AuthContext);
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState({}); 
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user?.token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HubUrl, { accessTokenFactory: () => user.token })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [user]);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on('ReceiveMessage', (notification) => {
            setMessages((prev) => [notification.message, ...prev]);
          });

          // Gestion du statut En Ligne
          connection.on('UserOnline', (userId) => {
            setOnlineUsers(prev => new Set(prev).add(userId));
          });

          connection.on('UserOffline', (userId) => {
            setOnlineUsers(prev => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          });

          // Gestion de la saisie (Typing)
          connection.on('UserTyping', (notif) => {
            setTypingStatus(prev => ({
              ...prev,
              [notif.conversationId]: {
                ...prev[notif.conversationId],
                [notif.userId]: notif.isTyping
              }
            }));
          });
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      return () => connection.stop();
    }
  }, [connection]);

  return { connection, liveMessages: messages, typingStatus, onlineUsers };
};