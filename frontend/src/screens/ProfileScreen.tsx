import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '../services/api';
import { User } from '../services/supabase';

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await user?.getToken();
      apiClient.setAuthToken(token!);
      
      const response = await apiClient.getUserProfile();
      setProfile(response.user);
      setFormData({
        first_name: response.user?.first_name || '',
        last_name: response.user?.last_name || '',
        phone_number: response.user?.phone_number || '',
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const token = await user?.getToken();
      apiClient.setAuthToken(token!);
      
      await apiClient.updateUserProfile(formData);
      await fetchProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Text style={styles.editButtonText}>
              {editing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile?.first_name?.[0] || user?.firstName?.[0] || 'U'}
            </Text>
          </View>
          
          {editing ? (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.first_name}
                  onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                  placeholder="Enter first name"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.last_name}
                  onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                  placeholder="Enter last name"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <Text style={styles.nameText}>
                {profile?.first_name || user?.firstName} {profile?.last_name || user?.lastName}
              </Text>
              <Text style={styles.emailText}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
              {profile?.phone_number && (
                <Text style={styles.phoneText}>{profile.phone_number}</Text>
              )}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Hours Used</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>€0</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>Favorite Partner</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.preferencesContainer}>
          <Text style={styles.preferencesTitle}>Preferences</Text>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Notifications</Text>
            <TouchableOpacity style={styles.toggle}>
              <Text style={styles.toggleText}>On</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Auto-extend sessions</Text>
            <TouchableOpacity style={styles.toggle}>
              <Text style={styles.toggleText}>Off</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Default duration</Text>
            <Text style={styles.preferenceValue}>1 hour</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileContainer: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#666666',
  },
  statsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  preferencesContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666666',
  },
  toggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  signOutButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
