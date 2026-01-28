import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Index() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session token and redirect
        await login(data.session_token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', data.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session token and redirect
        await login(data.session_token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Registration Failed', data.detail || 'Could not create account');
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (authMode === 'choice') {
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setAuthMode('login')}>
            <MaterialCommunityIcons name="email" size={24} color="#FF6B9D" />
            <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton} onPress={() => setAuthMode('register')}>
            <Text style={styles.textButtonText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => setAuthMode('choice')}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.formContent}>
          <MaterialCommunityIcons name="heart-multiple" size={60} color="#FF6B9D" />
          <Text style={styles.formTitle}>
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.formSubtitle}>
            {authMode === 'login' ? 'Sign in to continue' : 'Join Memory Makers'}
          </Text>

          {authMode === 'register' && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={authMode === 'login' ? handleEmailLogin : handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons 
                  name={authMode === 'login' ? 'login' : 'account-plus'} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={styles.buttonText}>
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.textButton} 
            onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.textButtonText}>
              {authMode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
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
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3D2F57',
  },
  dividerText: {
    color: '#B8B8D1',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2D1F47',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FF6B9D',
    fontSize: 18,
    fontWeight: '600',
  },
  textButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#B8B8D1',
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    padding: 8,
    zIndex: 10,
  },
  formContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#B8B8D1',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#2D1F47',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
});
