// AppNavigator.js
import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext, useAuth } from '../context/AuthContext'; 
import LoginScreen from '../screens/LoginScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ChatScreen from '../screens/ChatScreen';
import FirebaseLoginScreen from '../screens/FirebaseLoginScreen';
import MainTabs from './MainTabs';
import AuthMethodScreen from '../screens/AuthMethodScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
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
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AuthMethod" component={AuthMethodScreen} />
            <Stack.Screen name="OtpLogin" component={LoginScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
            <Stack.Screen name="FirebaseLogin" component={FirebaseLoginScreen} />
          </Stack.Group>  
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
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