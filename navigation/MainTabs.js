// navigators/MainTabs.js
import React from 'react';
import { MessageCircle, Users, Settings } from 'lucide-react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { 
          paddingBottom: 5, 
          height: 60,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let icon;
          
          if (route.name === 'Discussions') {
            icon = <MessageCircle color={color} size={size} fill={focused ? color : 'none'} />;
          } else if (route.name === 'Contacts') {
            icon = <Users color={color} size={size} fill={focused ? color : 'none'} />;
          } else if (route.name === 'Profil') {
            icon = <Settings color={color} size={size} fill={focused ? color : 'none'} />;
          }
          
          return icon;
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Discussions" 
        component={ConversationsListScreen} 
        options={{ 
          title: 'Messages',
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen} 
        options={{ 
          title: 'Contacts',
          tabBarLabel: 'Contacts',
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profil',
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
}