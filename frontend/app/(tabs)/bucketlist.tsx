import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface BucketItem {
  item_id: string;
  title: string;
  category: string;
  created_by: string;
  created_at: string;
  completed: boolean;
  shared_with: string[];
}

const CATEGORIES = [
  { name: 'Travel', icon: 'airplane', color: '#FF6B9D' },
  { name: 'Food', icon: 'food', color: '#FFA500' },
  { name: 'Adventure', icon: 'hiking', color: '#4CAF50' },
  { name: 'Entertainment', icon: 'movie', color: '#9C27B0' },
  { name: 'Learning', icon: 'book-open-variant', color: '#2196F3' },
  { name: 'Other', icon: 'star', color: '#FF9800' },
];

export default function BucketListScreen() {
  const { user, sessionToken } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Travel');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bucketlist`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/bucketlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.user_id}`,
        },
        body: JSON.stringify({
          title: newTitle,
          category: selectedCategory,
        }),
      });

      if (response.ok) {
        setNewTitle('');
        setSelectedCategory('Travel');
        setModalVisible(false);
        loadItems();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/bucketlist/${itemId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${user?.user_id}`,
                },
              });

              if (response.ok) {
                loadItems();
              }
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.name === category)?.color || '#FF9800';
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.name === category)?.icon || 'star';
  };

  if (!user?.partner_id) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-heart" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>Connect with Partner First</Text>
          <Text style={styles.emptySubtitle}>You need to connect with your partner to start creating bucket list items</Text>
          <TouchableOpacity 
            style={styles.goHomeButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="format-list-checks" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Bucket List Items Yet</Text>
          <Text style={styles.emptySubtitle}>Start adding memories you want to create together!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.item_id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => router.push(`/complete-item?itemId=${item.item_id}`)}
              onLongPress={() => handleDeleteItem(item.item_id)}
            >
              <View style={styles.itemHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                  <MaterialCommunityIcons 
                    name={getCategoryIcon(item.category) as any} 
                    size={20} 
                    color={getCategoryColor(item.category)} 
                  />
                  <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                    {item.category}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.itemFooter}>
                <MaterialCommunityIcons name="camera" size={20} color="#8E8E93" />
                <Text style={styles.itemHint}>Tap to complete with photo</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bucket List Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="What do you want to do together?"
              placeholderTextColor="#666"
              multiline
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.name && { backgroundColor: cat.color + '30', borderColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <MaterialCommunityIcons name={cat.icon as any} size={24} color={cat.color} />
                  <Text style={[styles.categoryButtonText, selectedCategory === cat.name && { color: cat.color }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.addButton, submitting && styles.buttonDisabled]}
              onPress={handleAddItem}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Add to Bucket List</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0E2E',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: '#2D1F47',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D2F57',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemHint: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  goHomeButton: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2D1F47',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1A0E2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3D2F57',
    minHeight: 80,
  },
  categoriesScroll: {
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#1A0E2E',
    borderWidth: 2,
    borderColor: '#3D2F57',
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8B8D1',
  },
  addButton: {
    backgroundColor: '#FF6B9D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
