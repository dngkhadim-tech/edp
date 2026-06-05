import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadows } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface Establishment {
  id: string;
  slug: string;
  name: string;
  banner?: string | null;
  type: string;
  averageRating: number;
  city: string;
  country: string;
  reviewsCount?: number;
  isOpen?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  BAR: 'Bar',
  CAFE: 'Café',
  TOURIST_SPOT: 'Tourisme',
  EXPERIENCE: 'Expérience',
};

interface Props { establishment: Establishment }

export function EstablishmentCard({ establishment: est }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/establishment/${est.slug}` as any)}
      activeOpacity={0.9}
    >
      <View style={styles.photo}>
        {est.banner ? (
          <Image source={est.banner} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]}>
            <Text style={styles.photoInitial}>{est.name?.[0]}</Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[est.type] ?? est.type}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{est.name}</Text>
        <View style={styles.row}>
          <Star size={13} color={colors.accent} fill={colors.accent} />
          <Text style={styles.rating}>{Number(est.averageRating).toFixed(1)}</Text>
          {est.reviewsCount != null && (
            <Text style={styles.reviewCount}>({est.reviewsCount})</Text>
          )}
        </View>
        <View style={styles.row}>
          <MapPin size={11} color={colors.muted} />
          <Text style={styles.city} numberOfLines={1}>{est.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface,
  },
  photoPlaceholder: {
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: { fontFamily: fonts.heading.black, fontSize: 28, color: `${colors.primary}50` },
  typeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  typeBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: fonts.body.medium },
  content: { padding: spacing.sm + 2, gap: 3 },
  name: { fontFamily: fonts.heading.bold, fontSize: 14, color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontFamily: fonts.heading.semibold, fontSize: 12, color: colors.accent },
  reviewCount: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted },
  city: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted, flex: 1 },
});
