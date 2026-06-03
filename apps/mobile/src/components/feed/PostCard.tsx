import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react-native';
import { api } from '../../lib/api';
import { formatNumber, timeAgo } from '../../lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props { post: any }

export function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const author = post.author || post.establishment;
  const authorName = author
    ? (`${author.firstName || ''} ${author.lastName || ''}`.trim() || author.name)
    : 'Unknown';

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount((c: number) => liked ? c - 1 : c + 1);
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked(liked);
      setLikesCount((c: number) => liked ? c + 1 : c - 1);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {author?.avatar ? (
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{authorName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            {post.location && <Text style={styles.location}>📍 {post.location}</Text>}
          </View>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {post.media?.[0] && post.media[0].type !== 'video' && (
        <Image
          source={{ uri: post.media[0].url }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Heart
              size={24}
              color={liked ? '#EF4444' : '#fff'}
              fill={liked ? '#EF4444' : 'none'}
            />
            <Text style={styles.actionCount}>{formatNumber(likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MessageCircle size={24} color="#fff" />
            <Text style={styles.actionCount}>{formatNumber(post.commentsCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Share2 size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Bookmark size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {post.caption && (
          <Text style={styles.caption}>
            <Text style={styles.bold}>{authorName} </Text>
            {post.caption}
          </Text>
        )}
        {post.hashtags?.length > 0 && (
          <Text style={styles.hashtags}>{post.hashtags.map((t: string) => `#${t}`).join(' ')}</Text>
        )}
        <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0A0A0A', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: '#C9A84C30', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#C9A84C', fontWeight: '700' },
  authorName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  location: { color: '#888', fontSize: 11, marginTop: 1 },
  media: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#1A1A1A' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: '#fff', fontSize: 13, fontWeight: '600' },
  content: { paddingHorizontal: 12, paddingBottom: 12 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: '700' },
  hashtags: { color: '#C9A84C', fontSize: 12, marginTop: 4 },
  time: { color: '#666', fontSize: 11, marginTop: 4 },
});
