import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getInitials, timeAgo } from '../../src/lib/utils';

export default function MessagesScreen() {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages').then((r) => r.data),
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={data || []}
        keyExtractor={(item) => item.conversation_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conv}
            onPress={() => router.push(`/chat/${item.sender_id}`)}
          >
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>
                  {getInitials(item.first_name, item.last_name)}
                </Text>
              </View>
            )}
            <View style={styles.convBody}>
              <View style={styles.convHeader}>
                <Text style={styles.convName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.convTime}>{timeAgo(item.created_at)}</Text>
              </View>
              <Text style={styles.convPreview} numberOfLines={1}>{item.content}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune conversation</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  conv: { flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { backgroundColor: '#C9A84C20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#C9A84C', fontWeight: '700', fontSize: 16 },
  convBody: { flex: 1, justifyContent: 'center' },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  convTime: { color: '#666', fontSize: 12 },
  convPreview: { color: '#888', fontSize: 13 },
  empty: { color: '#555', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
