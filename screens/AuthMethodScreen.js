import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';

export default function AuthMethodScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ChatUp</Text>
        <Text style={styles.subtitle}>Choisissez votre méthode d'authentification</Text>
      </View>

      <View style={styles.methodsContainer}>
        <TouchableOpacity
          style={styles.methodCard}
          onPress={() => navigation.navigate('OtpLogin')}
        >
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>Numero de téléphone</Text>
            <Text style={styles.methodDescription}>
              Recevez un code par SMS
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.methodCard}
          onPress={() => navigation.navigate('FirebaseLogin')}
        >
          
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>Connexion rapide</Text>
            <Text style={styles.methodDescription}>
              Email
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  methodsContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});