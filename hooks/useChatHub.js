// src/hooks/useChatHub.js
import { useEffect, useState, useRef, useContext } from 'react';
import * as signalR from '@microsoft/signalr';
import { HubUrl } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const useChatHub = () => {
  const { user } = useContext(AuthContext);
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user?.token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HubUrl, {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    setConnection(newConnection);
  }, [user]);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => console.log('🟢 SignalR Connected'))
        .catch((err) => console.error('🔴 SignalR Error:', err));

      connection.on('ReceiveMessage', (notification) => {
        setMessages((prev) => [notification.message, ...prev]);
      });
      

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  return { connection, liveMessages: messages };
};