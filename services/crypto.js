// src/services/crypto.js
import * as SecureStore from 'expo-secure-store';

// Simulation de génération de clés (En prod: RSA KeyPair)
export const generateAndStoreKeys = async (userId) => {
  const publicKey = `pk_${userId}_mock_base64`; 
  const privateKey = `sk_${userId}_mock_base64`;
  
  await SecureStore.setItemAsync('private_key', privateKey);
  return publicKey;
};

// Simulation chiffrement (En prod: AES-256)
export const encryptMessage = async (text, recipientPublicKey) => {
  // Ici on simule : on encode juste en base64 pour l'exemple
  // Le backend stockera ça comme "CipherText"
  return {
    cipherText: btoa(text), 
    iv: "mock_iv_123456" // L'IV doit être aléatoire en vrai
  };
};

// Simulation déchiffrement
export const decryptMessage = async (cipherText, iv) => {
  try {
    return atob(cipherText);
  } catch (e) {
    return "Message illisible";
  }
};