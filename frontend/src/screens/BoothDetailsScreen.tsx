import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '../services/api';
import { trackBoothReservation, trackPaymentIntent } from '../services/analytics';

interface Booth {
  id: string;
  partner: string;
  lat: number;
  lng: number;
  address: string;
  availability: boolean;
  boothnow_enabled: boolean;
}

export default function BoothDetailsScreen({ route, navigation }: any) {
  const { booth }: { booth: Booth } = route.params;
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [boothDetails, setBoothDetails] = useState<any>(null);

  const durationOptions = [
    { minutes: 30, label: '30 min', price: 15 },
    { minutes: 60, label: '1 hour', price: 25 },
    { minutes: 120, label: '2 hours', price: 45 },
    { minutes: 240, label: '4 hours', price: 80 },
  ];

  useEffect(() => {
    fetchBoothDetails();
  }, [booth.id]);

  const fetchBoothDetails = async () => {
    try {
      const token = await getToken();
      apiClient.setAuthToken(token!);
      
      const details = await apiClient.getBooth(booth.id);
      setBoothDetails(details.booth);
    } catch (error) {
      console.error('Fetch booth details error:', error);
    }
  };

  const handleReserve = async () => {
    if (!booth.availability) {
      Alert.alert('Booth Occupied', 'This booth is currently in use. Please try another location.');
      return;
    }

    try {
      setLoading(true);
      
      const token = await getToken();
      apiClient.setAuthToken(token!);

      // Create payment intent
      const selectedOption = durationOptions.find(opt => opt.minutes === selectedDuration);
      const amount = selectedOption?.price || 25;
      
      trackPaymentIntent(amount, 'EUR', booth.id);
      
      const paymentResponse = await apiClient.createPaymentIntent(amount, 'EUR', booth.id);
      
      // Create reservation
      const reservationResponse = await apiClient.reserveBooth(booth.id, selectedDuration);
      
      trackBoothReservation(booth.id, booth.partner, selectedDuration);
      
      Alert.alert(
        'Reservation Confirmed!',
        `Your booth is reserved for ${selectedDuration} minutes. You can start your session now.`,
        [
          {
            text: 'Start Session',
            onPress: () => navigation.navigate('Session', { 
              reservation: reservationResponse.reservation,
              booth: booth 
            }),
          },
        ]
      );
      
    } catch (error) {
      console.error('Reservation error:', error);
      Alert.alert('Reservation Failed', 'Unable to reserve the booth. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = () => {
    if (!booth.boothnow_enabled) return '#FF6B6B';
    if (!booth.availability) return '#FFA500';
    return '#4ECDC4';
  };

  const getAvailabilityText = () => {
    if (!booth.boothnow_enabled) return 'BoothNow not available';
    if (!booth.availability) return 'Currently occupied';
    return 'Available now';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Booth Header */}
        <View style={styles.header}>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{booth.partner}</Text>
            <Text style={styles.address}>{booth.address}</Text>
          </View>
          <View style={styles.availabilityContainer}>
            <View style={[styles.availabilityDot, { backgroundColor: getAvailabilityColor() }]} />
            <Text style={styles.availabilityText}>{getAvailabilityText()}</Text>
          </View>
        </View>

        {/* Booth Image Placeholder */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/300x200/4ECDC4/ffffff?text=BoothNow+Workspace' }}
            style={styles.boothImage}
            resizeMode="cover"
          />
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>What's Included</Text>
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
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💡</Text>
              <Text style={styles.featureText}>LED lighting</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌡️</Text>
              <Text style={styles.featureText}>Climate control</Text>
            </View>
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.durationContainer}>
          <Text style={styles.sectionTitle}>Select Duration</Text>
          <View style={styles.durationOptions}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={[
                  styles.durationOption,
                  selectedDuration === option.minutes && styles.durationOptionSelected
                ]}
                onPress={() => setSelectedDuration(option.minutes)}
              >
                <Text style={[
                  styles.durationLabel,
                  selectedDuration === option.minutes && styles.durationLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.durationPrice,
                  selectedDuration === option.minutes && styles.durationPriceSelected
                ]}>
                  €{option.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing Info */}
        <View style={styles.pricingContainer}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingInfo}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Per minute rate:</Text>
              <Text style={styles.pricingValue}>€0.50</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Selected duration:</Text>
              <Text style={styles.pricingValue}>{selectedDuration} minutes</Text>
            </View>
            <View style={[styles.pricingRow, styles.pricingTotal]}>
              <Text style={styles.pricingTotalLabel}>Total:</Text>
              <Text style={styles.pricingTotalValue}>
                €{durationOptions.find(opt => opt.minutes === selectedDuration)?.price || 25}
              </Text>
            </View>
          </View>
        </View>

        {/* Reserve Button */}
        <TouchableOpacity
          style={[
            styles.reserveButton,
            (!booth.boothnow_enabled || !booth.availability || loading) && styles.reserveButtonDisabled
          ]}
          onPress={handleReserve}
          disabled={!booth.boothnow_enabled || !booth.availability || loading}
        >
          <Text style={[
            styles.reserveButtonText,
            (!booth.boothnow_enabled || !booth.availability || loading) && styles.reserveButtonTextDisabled
          ]}>
            {loading 
              ? 'Processing...' 
              : !booth.boothnow_enabled 
                ? 'Coming Soon' 
                : !booth.availability 
                  ? 'Currently Occupied' 
                  : 'Reserve Now'
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  partnerInfo: {
    marginBottom: 12,
  },
  partnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#666666',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#666666',
  },
  imageContainer: {
    height: 200,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  boothImage: {
    width: '100%',
    height: '100%',
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
  },
  durationContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    minWidth: 80,
  },
  durationOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  durationLabelSelected: {
    color: '#ffffff',
  },
  durationPrice: {
    fontSize: 12,
    color: '#666666',
  },
  durationPriceSelected: {
    color: '#ffffff',
  },
  pricingContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  pricingInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666666',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pricingTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  pricingTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  reserveButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  reserveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  reserveButtonTextDisabled: {
    color: '#999999',
  },
});
