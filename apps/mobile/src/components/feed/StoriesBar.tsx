import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus } from 'lucide-react-native';

export function StoriesBar() {
  const { data } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get('/posts/stories').then((r) => r.data),
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity style={styles.storyItem}>
        <View style={[styles.storyRing, styles.addRing]}>
          <View style={styles.addInner}>
            <Plus size={24} color="#C9A84C" />
          </View>
        </View>
        <Text style={styles.name}>Votre story</Text>
      </TouchableOpacity>

      {data?.map((story: any) => {
        const author = story.author;
        return (
          <TouchableOpacity key={story.id} style={styles.storyItem}>
            <View style={styles.storyRing}>
              {author?.avatar ? (
                <Image source={{ uri: author.avatar }} style={styles.storyAvatar} />
              ) : (
                <View style={[styles.storyAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{author?.firstName?.[0]}</Text>
                </View>
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>{author?.firstName}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0A0A0A', borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  content: { padding: 12, gap: 12 },
  storyItem: { alignItems: 'center', gap: 4, width: 64 },
  storyRing: {
    padding: 2,
    borderRadius: 33,
    background: 'linear-gradient(135deg, #C9A84C, #E2C97E)',
    borderWidth: 2,
    borderColor: '#C9A84C',
  },
  addRing: { borderStyle: 'dashed', borderColor: '#C9A84C30' },
  storyAvatar: { width: 56, height: 56, borderRadius: 28 },
  addInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C9A84C15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: { backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#C9A84C', fontWeight: '700', fontSize: 18 },
  name: { color: '#888', fontSize: 10, textAlign: 'center' },
});
