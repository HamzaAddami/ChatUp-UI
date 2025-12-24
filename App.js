import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { MessageCircle, Users, Settings } from 'lucide-react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import VerifyOtpScreen from './screens/VerifyOtpScreen';
import ConversationsListScreen from './screens/ConversationsListScreen';
import ChatScreen from './screens/ChatScreen';
import ContactsScreen from './screens/ContactsScreen';
import ProfileScreen from './screens/ProfileScreen'; 

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Discussions') return <MessageCircle color={color} size={size} />;
          if (route.name === 'Contacts') return <Users color={color} size={size} />;
          if (route.name === 'Profil') return <Settings color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen 
        name="Discussions" 
        component={ConversationsListScreen} 
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen} 
        options={{ title: 'Mes Contacts' }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfileScreen} 
        options={{ title: 'Mon Compte' }}
      />
    </Tab.Navigator>
  );
}

// 2. Le Navigateur Racine (Gère la pile globale)
function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          // --- Stack Non-Connecté ---
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </Stack.Group>
        ) : (
          // --- Stack Connecté ---
          <>
            {/* L'écran principal est maintenant les Onglets */}
            <Stack.Screen 
              name="Home" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
            
            {/* L'écran Chat est en dehors des onglets pour masquer la barre du bas quand on parle */}
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{ title: 'Discussion' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}