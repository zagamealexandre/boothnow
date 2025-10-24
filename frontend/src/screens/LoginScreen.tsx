import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { trackEvent } from '../services/analytics';

export default function LoginScreen() {
  const { signIn, isLoaded, isSignedIn } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (isSignedIn) {
      navigation.navigate('Home' as never);
    }
  }, [isSignedIn, navigation]);

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    try {
      await signIn.create({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
      });
      
      trackEvent('login_attempted', { method: 'google' });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('Sign In Error', error.errors?.[0]?.message || 'Failed to sign in with Google');
    }
  };

  const handleAppleSignIn = async () => {
    if (!isLoaded) return;

    try {
      await signIn.create({
        strategy: 'oauth_apple',
        redirectUrl: '/sso-callback',
      });
      
      trackEvent('login_attempted', { method: 'apple' });
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      Alert.alert('Sign In Error', error.errors?.[0]?.message || 'Failed to sign in with Apple');
    }
  };

  const handleEmailSignIn = async () => {
    if (!isLoaded) return;

    try {
      await signIn.create({
        strategy: 'email_code',
        identifier: 'user@example.com', // In real app, get from input
      });
      
      trackEvent('login_attempted', { method: 'email' });
    } catch (error: any) {
      console.error('Email sign in error:', error);
      Alert.alert('Sign In Error', error.errors?.[0]?.message || 'Failed to sign in with email');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>BoothNow</Text>
          <Text style={styles.subtitle}>
            Find your perfect workspace in convenience stores
          </Text>
        </View>

        {/* Sign In Options */}
        <View style={styles.signInContainer}>
          <TouchableOpacity
            style={[styles.signInButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInButton, styles.appleButton]}
            onPress={handleAppleSignIn}
          >
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInButton, styles.emailButton]}
            onPress={handleEmailSignIn}
          >
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Why BoothNow?</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔇</Text>
            <Text style={styles.featureText}>Soundproof workspaces</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Instant access</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureText}>Convenient locations</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  signInContainer: {
    marginBottom: 48,
  },
  signInButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emailButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#666666',
  },
});
