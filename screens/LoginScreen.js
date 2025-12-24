import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login(phone);
      navigation.navigate('VerifyOtp', { phone });
    } catch (e) {
      alert('Erreur: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChatUp</Text>
      <Text style={styles.subtitle}>Entrez votre numéro pour continuer</Text>
      
      <TextInput
        style={styles.input}
        placeholder="+2126..."
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer OTP</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});