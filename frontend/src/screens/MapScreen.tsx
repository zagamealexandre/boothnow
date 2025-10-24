import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { apiClient } from '../services/api';
import { trackMapInteraction, trackBoothView } from '../services/analytics';

const { width, height } = Dimensions.get('window');

interface Booth {
  id: string;
  partner: string;
  lat: number;
  lng: number;
  address: string;
  availability: boolean;
  boothnow_enabled: boolean;
}

export default function MapScreen({ navigation }: any) {
  const { getToken } = useAuth();
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'boothnow'>('all');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyBooths();
    }
  }, [location]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby booths');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      trackMapInteraction('location_requested', {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Failed to get current location');
    }
  };

  const fetchNearbyBooths = async () => {
    if (!location) return;

    try {
      setLoading(true);
      const token = await getToken();
      apiClient.setAuthToken(token!);

      const response = await apiClient.getNearbyBooths(
        location.coords.latitude,
        location.coords.longitude
      );

      setBooths(response.places || []);
      
      trackMapInteraction('booths_loaded', {
        count: response.places?.length || 0,
        boothnow_count: response.boothnow_count || 0,
      });
    } catch (error) {
      console.error('Fetch booths error:', error);
      Alert.alert('Error', 'Failed to load nearby booths');
    } finally {
      setLoading(false);
    }
  };

  const handleBoothPress = (booth: Booth) => {
    setSelectedBooth(booth);
    trackBoothView(booth.id, booth.partner, { lat: booth.lat, lng: booth.lng });
  };

  const handleReserveBooth = () => {
    if (!selectedBooth) return;

    if (!selectedBooth.boothnow_enabled) {
      Alert.alert(
        'Booth Not Available',
        'This 7-Eleven location doesn\'t have a BoothNow workspace yet. We\'re expanding quickly!'
      );
      return;
    }

    if (!selectedBooth.availability) {
      Alert.alert('Booth Occupied', 'This booth is currently in use. Please try another location.');
      return;
    }

    navigation.navigate('BoothDetails', { booth: selectedBooth });
  };

  const filteredBooths = booths.filter(booth => {
    switch (filter) {
      case 'available':
        return booth.availability;
      case 'boothnow':
        return booth.boothnow_enabled;
      default:
        return true;
    }
  });

  const getMarkerColor = (booth: Booth) => {
    if (!booth.boothnow_enabled) return '#FF6B6B';
    if (!booth.availability) return '#FFA500';
    return '#4ECDC4';
  };

  if (!location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Booth</Text>
        <TouchableOpacity onPress={fetchNearbyBooths} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({booths.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'available' && styles.filterButtonActive]}
          onPress={() => setFilter('available')}
        >
          <Text style={[styles.filterText, filter === 'available' && styles.filterTextActive]}>
            Available ({booths.filter(b => b.availability).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'boothnow' && styles.filterButtonActive]}
          onPress={() => setFilter('boothnow')}
        >
          <Text style={[styles.filterText, filter === 'boothnow' && styles.filterTextActive]}>
            BoothNow ({booths.filter(b => b.boothnow_enabled).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {filteredBooths.map((booth) => (
          <Marker
            key={booth.id}
            coordinate={{ latitude: booth.lat, longitude: booth.lng }}
            onPress={() => handleBoothPress(booth)}
          >
            <View style={[styles.marker, { backgroundColor: getMarkerColor(booth) }]}>
              <Text style={styles.markerText}>
                {booth.boothnow_enabled ? '🎯' : '🏪'}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Selected Booth Card */}
      {selectedBooth && (
        <View style={styles.boothCard}>
          <View style={styles.boothInfo}>
            <Text style={styles.boothPartner}>{selectedBooth.partner}</Text>
            <Text style={styles.boothAddress}>{selectedBooth.address}</Text>
            <View style={styles.boothStatus}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getMarkerColor(selectedBooth) }
              ]} />
              <Text style={styles.statusText}>
                {!selectedBooth.boothnow_enabled 
                  ? 'BoothNow not available' 
                  : selectedBooth.availability 
                    ? 'Available now' 
                    : 'Currently occupied'
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.reserveButton,
              (!selectedBooth.boothnow_enabled || !selectedBooth.availability) && styles.reserveButtonDisabled
            ]}
            onPress={handleReserveBooth}
            disabled={!selectedBooth.boothnow_enabled || !selectedBooth.availability}
          >
            <Text style={[
              styles.reserveButtonText,
              (!selectedBooth.boothnow_enabled || !selectedBooth.availability) && styles.reserveButtonTextDisabled
            ]}>
              {!selectedBooth.boothnow_enabled 
                ? 'Coming Soon' 
                : selectedBooth.availability 
                  ? 'Reserve Now' 
                  : 'Occupied'
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading booths...</Text>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerText: {
    fontSize: 16,
  },
  boothCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  boothInfo: {
    flex: 1,
  },
  boothPartner: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  boothAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  boothStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666666',
  },
  reserveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  reserveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reserveButtonTextDisabled: {
    color: '#999999',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});
