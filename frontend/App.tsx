import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import BoothDetailsScreen from './src/screens/BoothDetailsScreen';
import SessionScreen from './src/screens/SessionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Components
import TabBarIcon from './src/components/TabBarIcon';

// Services
import { supabase } from './src/services/supabase';
import { posthog } from './src/services/analytics';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main App Stack
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen 
        name="BoothDetails" 
        component={BoothDetailsScreen}
        options={{
          headerShown: true,
          title: 'Booth Details',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="Session" 
        component={SessionScreen}
        options={{
          headerShown: true,
          title: 'Active Session',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
}

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={AppStack}
        options={{ title: 'Find Booth' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    throw new Error('Missing Clerk publishable key');
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <PostHogProvider client={posthog}>
            <NavigationContainer>
              <SignedIn>
                <TabNavigator />
              </SignedIn>
              <SignedOut>
                <LoginScreen />
              </SignedOut>
            </NavigationContainer>
          </PostHogProvider>
        </ClerkProvider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
