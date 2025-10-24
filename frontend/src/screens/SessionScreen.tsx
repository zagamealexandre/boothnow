import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '../services/api';
import { trackSessionStart, trackSessionEnd } from '../services/analytics';

interface Session {
  id: string;
  user_id: string;
  booth_id: string;
  start_time: string;
  end_time?: string;
  total_minutes?: number;
  total_cost?: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface Booth {
  id: string;
  partner: string;
  address: string;
  lat: number;
  lng: number;
}

export default function SessionScreen({ route, navigation }: any) {
  const { reservation, booth }: { reservation: any; booth: Booth } = route.params;
  const { getToken } = useAuth();
  
  const [session, setSession] = useState<Session | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startSession();
    startTimer();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startSession = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      apiClient.setAuthToken(token!);

      const response = await apiClient.startSession(booth.id, reservation.id);
      setSession(response.session);
      setSessionStarted(true);
      
      trackSessionStart(response.session.id, booth.id, booth.partner);
    } catch (error) {
      console.error('Start session error:', error);
      Alert.alert('Session Error', 'Failed to start session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      if (session) {
        const startTime = new Date(session.start_time);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
        setElapsedMinutes(elapsed);
      }
    }, 1000);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const endSession = async () => {
    if (!session) return;

    Alert.alert(
      'End Session',
      'Are you sure you want to end your session? You will be charged for the time used.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await getToken();
              apiClient.setAuthToken(token!);

              const cost = Math.max(elapsedMinutes * 0.5, 5); // Minimum €5
              
              const response = await apiClient.endSession(session.id, elapsedMinutes, cost);
              
              trackSessionEnd(session.id, elapsedMinutes, cost);
              
              Alert.alert(
                'Session Ended',
                `Your session lasted ${elapsedMinutes} minutes. Total cost: €${cost.toFixed(2)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Home'),
                  },
                ]
              );
            } catch (error) {
              console.error('End session error:', error);
              Alert.alert('Error', 'Failed to end session. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getCost = () => {
    return Math.max(elapsedMinutes * 0.5, 5).toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Session</Text>
        <TouchableOpacity onPress={endSession} style={styles.endButton}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.boothName}>{booth.partner}</Text>
        <Text style={styles.boothAddress}>{booth.address}</Text>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.timerText}>{formatTime(elapsedMinutes)}</Text>
          <Text style={styles.timerLabel}>Elapsed Time</Text>
        </Animated.View>
      </View>

      {/* Session Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>€{getCost()}</Text>
          <Text style={styles.statLabel}>Current Cost</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>€0.50</Text>
          <Text style={styles.statLabel}>Per Minute</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{elapsedMinutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      {/* Features Available */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Your Workspace Includes:</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔇</Text>
            <Text style={styles.featureText}>Soundproof environment</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💻</Text>
            <Text style={styles.featureText}>High-speed WiFi</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔌</Text>
            <Text style={styles.featureText}>Power outlets</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🪑</Text>
            <Text style={styles.featureText}>Ergonomic seating</Text>
          </View>
        </View>
      </View>

      {/* Session Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Session Tips</Text>
        <Text style={styles.tipText}>• Your session is automatically tracked</Text>
        <Text style={styles.tipText}>• You can end your session anytime</Text>
        <Text style={styles.tipText}>• Minimum charge is €5 (10 minutes)</Text>
        <Text style={styles.tipText}>• Payment is processed when you end</Text>
      </View>

      {/* End Session Button */}
      <TouchableOpacity
        style={[styles.endSessionButton, loading && styles.endSessionButtonDisabled]}
        onPress={endSession}
        disabled={loading}
      >
        <Text style={[styles.endSessionButtonText, loading && styles.endSessionButtonTextDisabled]}>
          {loading ? 'Processing...' : 'End Session'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  endButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionInfo: {
    padding: 20,
    alignItems: 'center',
  },
  boothName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  boothAddress: {
    fontSize: 14,
    color: '#666666',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  endSessionButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    alignItems: 'center',
  },
  endSessionButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  endSessionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  endSessionButtonTextDisabled: {
    color: '#999999',
  },
});
