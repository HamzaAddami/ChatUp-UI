import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../services/firebase'; 
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function FirebaseLoginScreen({ navigation }) {
  const { loginWithFirebase } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '504752010744-l0toc0fhvlh40kalv669oij0c7u4t0cu.apps.googleusercontent.com',
    androidClientId: '504752010744-srpiupc7her2nj5h47u2qkbm6cpd8u4r.apps.googleusercontent.com',
    webClientId: '504752010744-srpiupc7her2nj5h47u2qkbm6cpd8u4r.apps.googleusercontent.com',
    responseType: 'id_token',
    redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.chatupapp',
        path: 'google-auth',
    }),

  });

  useEffect(() => {
    console.log('Firebase Login Screen mounted');
    
    const checkFirebaseConnection = () => {
      try {
        console.log('Firebase auth object available:', !!auth);
        console.log('Auth current user:', auth.currentUser);
        setFirebaseReady(true);
      } catch (error) {
        console.error('Firebase initialization error:', error);
        Alert.alert(
          'Erreur Firebase', 
          'L\'authentification Firebase n\'est pas correctement initialisée. Vérifiez votre configuration.'
        );
      }
    };

    checkFirebaseConnection();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user ? `User ${user.uid}` : 'No user');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('Google response changed:', response?.type);
    
    if (response?.type === 'success') {
      const { id_token } = response.params;
      console.log('Google auth success, token received');
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
      Alert.alert('Erreur Google', `Échec de l'authentification Google: ${response.error}`);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    console.log('Starting Google sign-in with token');
    setLoading(true);
    
    try {
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      console.log('Google credential created');
      
      console.log('Signing in with Firebase credential...');
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('Firebase Google sign-in successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });
      
      const firebaseToken = await userCredential.user.getIdToken();
      console.log('Firebase token obtained, first 20 chars:', firebaseToken.substring(0, 20) + '...');
      console.log('Firebase token obtained, length:', firebaseToken.length);
      
      await loginWithFirebase(firebaseToken);
      
    } catch (error) {
      console.error('Google sign-in error details:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      
      let errorMessage = 'Échec de la connexion avec Google';
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Problème de connexion réseau';
      } else if (error.code === 'auth/internal-error') {
        errorMessage = 'Erreur interne Firebase. Vérifiez votre configuration.';
      }
      
      Alert.alert('Erreur Google', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    console.log('Attempting email auth:', { email, isSignUp });
    
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez entrer un email et un mot de passe.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    
    try {
      let userCredential;
      const operation = isSignUp ? 'sign-up' : 'sign-in';
      
      console.log(`Starting Firebase ${operation}...`);
      
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Firebase user created:', userCredential.user.uid);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase sign-in successful:', userCredential.user.uid);
      }

      console.log('Getting Firebase ID token...');
      const firebaseToken = await userCredential.user.getIdToken();
      console.log('Firebase token obtained, first 20 chars:', firebaseToken.substring(0, 20) + '...');
      
      console.log('Sending token to backend...');
      await loginWithFirebase(firebaseToken);
      
    } catch (error) {
      console.error('Email auth error details:', {
        code: error.code,
        message: error.message,
        email: email,
        operation: isSignUp ? 'sign-up' : 'sign-in'
      });
      
      let message = 'Une erreur est survenue. Veuillez réessayer.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          message = 'Mot de passe incorrect.';
          break;
        case 'auth/user-not-found':
          message = isSignUp ? 'Impossible de créer le compte.' : 'Aucun compte trouvé avec cet email.';
          break;
        case 'auth/email-already-in-use':
          message = 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.';
          break;
        case 'auth/invalid-email':
          message = 'Adresse email invalide.';
          break;
        case 'auth/weak-password':
          message = 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
          break;
        case 'auth/network-request-failed':
          message = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
          break;
        case 'auth/too-many-requests':
          message = 'Trop de tentatives. Veuillez réessayer plus tard.';
          break;
        case 'auth/user-disabled':
          message = 'Ce compte a été désactivé.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Cette méthode d\'authentification n\'est pas activée. Contactez le support.';
          break;
      }
      
      Alert.alert('Erreur d\'authentification', message);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignUp ? 'Créer un compte' : 'Bon retour !'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp 
                ? 'Inscrivez-vous pour commencer votre expérience' 
                : 'Connectez-vous à votre compte pour continuer'}
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity 
              style={[styles.googleButton, (loading || !request) && styles.disabledButton]} 
              onPress={() => {
                console.log('Google button pressed');
                promptAsync();
              }}
              disabled={loading || !request || !firebaseReady}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>
                {loading ? 'Chargement...' : 'Continuer avec Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OU</Text>
              <View style={styles.line} />
            </View>

            <Text style={styles.label}>Adresse email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              placeholderTextColor="#999"
            />

            {/* Bouton principal */}
            <TouchableOpacity 
              style={[
                styles.mainButton, 
                loading && styles.disabledButton,
                (!firebaseReady || !email || !password) && styles.disabledButton
              ]} 
              onPress={handleEmailAuth}
              disabled={loading || !firebaseReady || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.mainButtonText}>
                  {isSignUp ? "S'inscrire gratuitement" : "Se connecter"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                if (!loading) {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                }
              }}
              style={styles.switchContainer}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp 
                  ? "Déjà un compte ? Connectez-vous" 
                  : "Pas encore de compte ? Inscrivez-vous gratuitement"}
              </Text>
            </TouchableOpacity>

            {!firebaseReady && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ Firebase n'est pas encore initialisé. Vérifiez votre configuration.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: { 
    padding: 24, 
    flexGrow: 1,
    justifyContent: 'center' 
  },
  backButton: { 
    marginBottom: 20,
    alignSelf: 'flex-start' 
  },
  backText: { 
    color: '#007AFF', 
    fontSize: 16,
    fontWeight: '500' 
  },
  header: { 
    marginBottom: 40 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#1a1a1a',
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666',
    lineHeight: 22 
  },
  form: { 
    flex: 1 
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 24
  },
  googleIcon: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginRight: 12, 
    color: '#4285F4' 
  },
  googleText: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#333' 
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 24 
  },
  line: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#eee' 
  },
  orText: { 
    marginHorizontal: 16, 
    color: '#999', 
    fontSize: 14,
    fontWeight: '500' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8, 
    color: '#333' 
  },
  input: { 
    backgroundColor: '#f8f9fa', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    fontSize: 16,
    color: '#333'
  },
  mainButton: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  mainButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  disabledButton: { 
    opacity: 0.5 
  },
  switchContainer: { 
    marginTop: 24, 
    alignItems: 'center',
    paddingVertical: 12 
  },
  switchText: { 
    color: '#007AFF', 
    fontWeight: '600',
    fontSize: 15 
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFEEBA'
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center'
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16
  }
});