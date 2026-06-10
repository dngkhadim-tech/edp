import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { formatNumber, timeAgo } from '../../lib/utils';
import { colors, spacing, radius } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_HEIGHT = SCREEN_WIDTH * (5 / 4);

export interface Post {
  id: string;
  media?: { url: string; type: 'image' | 'video' }[];
  caption?: string;
  hashtags?: string[];
  createdAt: string;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  isSaved: boolean;
  location?: string;
  establishment?: { slug: string; name: string };
  author?: { firstName?: string; lastName?: string; avatar?: string; username?: string; name?: string };
}

interface Props { post: Post }

export function PostCard({ post }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.isSaved);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const author = post.author;
  const authorName = author
    ? (`${author.firstName || ''} ${author.lastName || ''}`.trim() || author.name || 'VEYA')
    : 'VEYA';
  const initials = authorName.slice(0, 2).toUpperCase();
  const mediaItem = post.media?.[0];

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => next ? c + 1 : c - 1);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.3, damping: 15, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
    ]).start();
    await api.post(`/posts/${post.id}/like`).catch(() => {
      setLiked(!next);
      setLikesCount((c) => next ? c - 1 : c + 1);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => author?.username && router.push(`/profile/${author.username}` as any)}
        >
          {author?.avatar ? (
            <Image source={author.avatar} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Options" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MoreHorizontal size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Media 4:5 */}
      {mediaItem && (
        <View style={styles.mediaContainer}>
          <Image source={mediaItem.url} style={styles.media} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {post.establishment && (
            <TouchableOpacity
              style={styles.badge}
              onPress={() => router.push(`/establishment/${post.establishment!.slug}` as any)}
            >
              <MapPin size={11} color={colors.primary} />
              <Text style={styles.badgeText} numberOfLines={1}>{post.establishment.name}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={handleLike}
            accessibilityLabel={liked ? "Je n'aime plus" : "J'aime"}
            style={styles.actionItem}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Heart size={24} color={liked ? colors.primary : colors.muted} fill={liked ? colors.primary : 'none'} />
            </Animated.View>
            <Text style={styles.actionCount}>{formatNumber(likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/post/${post.id}` as any)}
            style={styles.actionItem}
            accessibilityLabel="Commentaires"
          >
            <MessageCircle size={22} color={colors.muted} />
            <Text style={styles.actionCount}>{formatNumber(post.commentsCount)}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setSaved((v) => !v)}
          accessibilityLabel={saved ? 'Retirer des sauvegardes' : 'Sauvegarder'}
        >
          <Bookmark size={20} color={saved ? colors.primary : colors.muted} fill={saved ? colors.primary : 'none'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {post.caption && (
          <Text style={styles.caption} numberOfLines={2}>
            <Text style={styles.captionAuthor}>{authorName} </Text>
            {post.caption}
          </Text>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <Text style={styles.hashtags} numberOfLines={1}>
            {post.hashtags.map((t) => `#${t}`).join(' ')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: fonts.heading.semibold, fontSize: 13, color: colors.primary },
  authorName: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.foreground },
  timestamp: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted, marginTop: 1 },
  mediaContainer: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT, backgroundColor: colors.surface, overflow: 'hidden' },
  media: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    bottom: spacing.sm + 4,
    left: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    maxWidth: 160,
  },
  badgeText: { fontFamily: fonts.heading.semibold, fontSize: 11, color: colors.foreground, flex: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontFamily: fonts.body.medium, fontSize: 13, color: colors.muted },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 4 },
  caption: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.foreground, lineHeight: 18 },
  captionAuthor: { fontFamily: fonts.heading.semibold, fontSize: 13, color: colors.foreground },
  hashtags: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.primary },
});
