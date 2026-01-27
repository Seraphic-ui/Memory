import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const { user, refreshUser, sessionToken } = useAuth();
  const [friendCode, setFriendCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnectFriend = async () => {
    if (!friendCode || friendCode.length !== 5) {
      Alert.alert('Invalid Code', 'Please enter a valid 5-character friend code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/connect-friend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ friend_code: friendCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success!', 'Connected with your partner successfully!');
        await refreshUser();
        setFriendCode('');
        router.push('/(tabs)/bucketlist');
      } else {
        Alert.alert('Error', data.detail || 'Failed to connect');
      }
    } catch (error) {
      console.error('Error connecting friend:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {user.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialCommunityIcons name="account" size={48} color="#B8B8D1" />
          </View>
        )}
        <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
      </View>

      <View style={styles.codeCard}>
        <MaterialCommunityIcons name="qrcode" size={48} color="#FF6B9D" />
        <Text style={styles.codeLabel}>Your Friend Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{user.friend_code}</Text>
        </View>
        <Text style={styles.codeHint}>Share this code with your partner</Text>
      </View>

      {!user.partner_id ? (
        <View style={styles.connectCard}>
          <MaterialCommunityIcons name="account-heart" size={48} color="#FFA7C4" />
          <Text style={styles.connectTitle}>Connect with Partner</Text>
          <Text style={styles.connectSubtitle}>Enter your partner's friend code</Text>
          
          <TextInput
            style={styles.input}
            value={friendCode}
            onChangeText={(text) => setFriendCode(text.toUpperCase())}
            placeholder="Enter 5-character code"
            placeholderTextColor="#666"
            maxLength={5}
            autoCapitalize="characters"
          />

          <TouchableOpacity 
            style={[styles.connectButton, loading && styles.buttonDisabled]} 
            onPress={handleConnectFriend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="link" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.connectedCard}>
          <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
          <Text style={styles.connectedTitle}>Partner Connected!</Text>
          <Text style={styles.connectedSubtitle}>You can now create bucket list items together</Text>
          
          <TouchableOpacity 
            style={styles.goButton}
            onPress={() => router.push('/(tabs)/bucketlist')}
          >
            <Text style={styles.buttonText}>Go to Bucket List</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0E2E',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#2D1F47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  codeCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
  codeLabel: {
    fontSize: 16,
    color: '#B8B8D1',
    marginTop: 12,
    marginBottom: 8,
  },
  codeContainer: {
    backgroundColor: '#1A0E2E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B9D',
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 14,
    color: '#8E8E93',
  },
  connectCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  connectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  connectSubtitle: {
    fontSize: 14,
    color: '#B8B8D1',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#1A0E2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  connectedCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  connectedSubtitle: {
    fontSize: 14,
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 24,
  },
  goButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
});
