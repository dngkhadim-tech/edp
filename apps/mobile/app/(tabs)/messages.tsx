import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getInitials, timeAgo } from '../../src/lib/utils';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

interface Conversation {
  conversation_id: string;
  sender_id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  content: string;
  created_at: string;
  unread_count?: number;
}

export default function MessagesScreen() {
  const router = useRouter();

  const { data } = useQuery<Conversation[]>({
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
        renderItem={({ item }) => {
          const hasUnread = item.unread_count != null && item.unread_count > 0;
          return (
            <TouchableOpacity
              style={styles.conv}
              onPress={() => router.push(`/chat/${item.sender_id}`)}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {getInitials(item.first_name, item.last_name)}
                  </Text>
                </View>
              )}

              <View style={styles.convBody}>
                <View style={styles.convHeader}>
                  <Text style={[styles.convName, hasUnread && styles.convNameUnread]}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.convTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text style={styles.convPreview} numberOfLines={1}>
                  {item.content}
                </Text>
              </View>

              {hasUnread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune conversation</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.heading.bold, fontSize: 20, color: colors.foreground },
  conv: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading.bold, fontSize: 16, color: colors.primary },
  convBody: { flex: 1, minWidth: 0 },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  convName: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.foreground },
  convNameUnread: { fontFamily: fonts.heading.bold },
  convTime: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted },
  convPreview: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  empty: {
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 60,
  },
});
