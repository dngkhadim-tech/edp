import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface Reel {
  id: string;
  thumbnail?: string;
  duration?: string;
}

interface Props {
  reels: Reel[];
}

const CARD_WIDTH = 100;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

export function ReelsRow({ reels }: Props) {
  const router = useRouter();
  if (reels.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Reels</Text>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/reels')}
            accessibilityLabel="Voir le reel"
            activeOpacity={0.85}
          >
            {item.thumbnail ? (
              <Image source={item.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
            )}
            <View style={styles.overlay} />
            <View style={styles.playBtn}>
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            {item.duration && (
              <Text style={styles.duration}>{item.duration}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: spacing.md },
  title: {
    fontFamily: fonts.heading.bold,
    fontSize: 16,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  placeholder: { backgroundColor: colors.surface },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.body.regular,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
