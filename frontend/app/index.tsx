import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Index() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="heart-multiple" size={80} color="#FF6B9D" />
        <Text style={styles.title}>Memory Makers</Text>
        <Text style={styles.subtitle}>Create memories together with your partner</Text>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="account-heart" size={32} color="#FFA7C4" />
            <Text style={styles.featureText}>Connect with your partner</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="format-list-checks" size={32} color="#FFA7C4" />
            <Text style={styles.featureText}>Create bucket list together</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="camera" size={32} color="#FFA7C4" />
            <Text style={styles.featureText}>Complete with Polaroid photos</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={login}>
          <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B8B8D1',
    textAlign: 'center',
    marginBottom: 48,
  },
  features: {
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
