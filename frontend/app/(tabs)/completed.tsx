import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CompletedItem {
  completed_id: string;
  item_id: string;
  title: string;
  category: string;
  photo_base64: string;
  notes?: string;
  completed_at: string;
  completed_by: string;
}

export default function CompletedScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<CompletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CompletedItem | null>(null);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/completed`, {
        headers: {
          Authorization: `Bearer ${user?.user_id}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading completed items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
          <MaterialCommunityIcons name="camera-off" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Completed Memories Yet</Text>
          <Text style={styles.emptySubtitle}>Complete bucket list items with photos to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.completed_id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.polaroidCard}
              onPress={() => setSelectedItem(item)}
            >
              <View style={styles.polaroidInner}>
                <Image
                  source={{ uri: item.photo_base64 }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <View style={styles.polaroidCaption}>
                  <Text style={styles.captionTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.captionDate}>{formatDate(item.completed_at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={selectedItem !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalClose}
            onPress={() => setSelectedItem(null)}
          >
            <MaterialCommunityIcons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedItem && (
              <View style={styles.modalPolaroid}>
                <Image
                  source={{ uri: selectedItem.photo_base64 }}
                  style={styles.modalPhoto}
                  resizeMode="contain"
                />
                <View style={styles.modalCaption}>
                  <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                  <View style={styles.modalMeta}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#8E8E93" />
                    <Text style={styles.modalDate}>{formatDate(selectedItem.completed_at)}</Text>
                  </View>
                  {selectedItem.notes && (
                    <View style={styles.notesContainer}>
                      <MaterialCommunityIcons name="note-text" size={16} color="#FF6B9D" />
                      <Text style={styles.notesText}>{selectedItem.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
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
    padding: 8,
  },
  polaroidCard: {
    flex: 1,
    margin: 8,
    maxWidth: '46%',
  },
  polaroidInner: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    paddingBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 12,
  },
  polaroidCaption: {
    alignItems: 'center',
  },
  captionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A0E2E',
    textAlign: 'center',
    marginBottom: 4,
  },
  captionDate: {
    fontSize: 11,
    color: '#666',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalPolaroid: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalPhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  modalCaption: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A0E2E',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF5F8',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
