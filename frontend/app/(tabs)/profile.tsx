import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialCommunityIcons name="account" size={64} color="#B8B8D1" />
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Friend Code</Text>
        <View style={styles.codeCard}>
          <MaterialCommunityIcons name="qrcode" size={32} color="#FF6B9D" />
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{user.friend_code}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <View style={styles.statusCard}>
          {user.partner_id ? (
            <>
              <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
              <Text style={styles.statusText}>Connected with partner</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="account-off" size={48} color="#FF9800" />
              <Text style={styles.statusText}>No partner connected yet</Text>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.buttonText}>Connect Partner</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="heart-multiple" size={24} color="#FF6B9D" />
            <Text style={styles.infoText}>Memory Makers v1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={24} color="#2196F3" />
            <Text style={styles.infoText}>Create memories together</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for couples</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0E2E',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#2D1F47',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FF6B9D',
  },
  avatarPlaceholder: {
    backgroundColor: '#1A0E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#B8B8D1',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  codeCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
  codeContainer: {
    backgroundColor: '#1A0E2E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  codeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B9D',
    letterSpacing: 4,
  },
  statusCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
