import React, { useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, Dimensions, TouchableOpacity, Text,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react-native';
import { formatNumber } from '../../src/lib/utils';
import { colors } from '../../src/constants/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReelMedia {
  url: string;
  type: 'video' | 'image';
}

interface ReelAuthor {
  username: string;
  avatar?: string;
}

interface Reel {
  id: string;
  media?: ReelMedia[];
  caption?: string;
  hashtags?: string[];
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  author?: ReelAuthor;
}

interface ReelItemProps {
  item: Reel;
  isActive: boolean;
}

function ReelItem({ item, isActive }: ReelItemProps) {
  const videoRef = useRef<Video>(null);
  const [liked, setLiked] = useState(item.isLiked);
  const [likesCount, setLikesCount] = useState(item.likesCount);

  const handleLike = async () => {
    setLiked((prev) => !prev);
    setLikesCount((c) => liked ? c - 1 : c + 1);
    await api.post(`/posts/${item.id}/like`).catch(() => {});
  };

  return (
    <View style={[styles.reelContainer, { height: SCREEN_HEIGHT }]}>
      {item.media?.[0]?.url && (
        <Video
          ref={videoRef}
          source={{ uri: item.media[0].url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={false}
        />
      )}
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={handleLike} style={styles.action}>
            <Heart size={28} color={liked ? '#EF4444' : '#fff'} fill={liked ? '#EF4444' : 'none'} />
            <Text style={styles.actionText}>{formatNumber(likesCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <MessageCircle size={28} color="#fff" />
            <Text style={styles.actionText}>{formatNumber(item.commentsCount)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action}>
            <Share2 size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomInfo}>
          <Text style={styles.username}>@{item.author?.username}</Text>
          {item.caption ? (
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          ) : null}
          {item.hashtags && item.hashtags.length > 0 ? (
            <Text style={styles.hashtags}>
              {item.hashtags.map((t) => `#${t}`).join(' ')}
            </Text>
          ) : null}
          <View style={styles.musicRow}>
            <Music2 size={12} color="#ccc" />
            <Text style={styles.music}>EDP Original Audio</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

interface ReelsPage {
  data: Reel[];
  meta: { page: number; totalPages: number };
}

export default function ReelsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data } = useInfiniteQuery<ReelsPage>({
    queryKey: ['reels'],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/feed/reels?page=${pageParam}&limit=5`).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });

  const reels = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  reelContainer: { width: SCREEN_WIDTH, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  sidebar: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
  },
  action: { alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomInfo: { flex: 1, justifyContent: 'flex-end', paddingRight: 60 },
  username: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  hashtags: { color: colors.primary, fontSize: 12, marginBottom: 4 },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  music: { color: '#ccc', fontSize: 12 },
});
