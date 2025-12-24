import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function VerifyOtpScreen({ route }) {
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const { verifyOtp } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>Code envoyé au {phone}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
      />

      <TouchableOpacity style={styles.button} onPress={() => verifyOtp(phone, code)}>
        <Text style={styles.btnText}>Vérifier</Text>
      </TouchableOpacity>
    </View>
  );
}
// Utiliser les mêmes styles que LoginScreen
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});