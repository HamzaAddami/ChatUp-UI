

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