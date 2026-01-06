import * as SecureStore from 'expo-secure-store';

export const generateAndStoreKeys = async (userId) => {
  const publicKey = `pk_${userId}_mock_base64`; 
  const privateKey = `sk_${userId}_mock_base64`;
  
  await SecureStore.setItemAsync('private_key', privateKey);
  return publicKey;
};

export const encryptMessage = async (text, recipientPublicKey) => {
  
  return {
    cipherText: btoa(text), 
    iv: "mock_iv_123456" 
  };
};

export const decryptMessage = async (cipherText, iv) => {
  try {
    return atob(cipherText);
  } catch (e) {
    return "Message illisible";
  }
};