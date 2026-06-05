import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Star, MapPin, Navigation, Bookmark, MoreHorizontal,
} from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';
import { formatNumber } from '../../src/lib/utils';

const { width: W } = Dimensions.get('window');
const HERO_HEIGHT = W * (3 / 4);

type Tab = 'about' | 'reviews' | 'menu';

export default function EstablishmentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('about');

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', slug],
    queryFn: () => api.get(`/establishments/${slug}`).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', est?.id],
    queryFn: () => api.get(`/reviews/establishment/${est.id}?limit=3`).then((r) => r.data),
    enabled: !!est?.id,
  });

  if (isLoading || !est) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const avgRating: number = est.avgRating ?? est.averageRating ?? 0;
  const reviewsCount: number = est.reviewsCount ?? reviews?.meta?.total ?? 0;
  const isOpen: boolean = est.isOpen ?? false;

  const openMaps = () => {
    const query = encodeURIComponent(`${est.name} ${est.city ?? ''}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'about', label: 'À propos' },
    { key: 'reviews', label: 'Avis' },
    { key: 'menu', label: 'Menu' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Hero 4:3 */}
        <View style={styles.hero}>
          {est.banner ? (
            <Image source={est.banner} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPH]}>
              <Text style={styles.heroPHText}>{est.name?.[0]}</Text>
            </View>
          )}
          <View style={[styles.heroOverlay, { paddingTop: insets.top + spacing.sm }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn} accessibilityLabel="Retour">
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.heroRight}>
              <TouchableOpacity style={styles.heroBtn} accessibilityLabel="Sauvegarder">
                <Bookmark size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBtn} accessibilityLabel="Plus d'options">
                <MoreHorizontal size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Identity */}
        <View style={styles.identity}>
          <Text style={styles.name}>{est.name}</Text>

          {avgRating > 0 && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} color={colors.accent} fill={s <= Math.round(avgRating) ? colors.accent : 'none'} />
              ))}
              <Text style={styles.ratingVal}>{avgRating.toFixed(1)}</Text>
              {reviewsCount > 0 && (
                <Text style={styles.ratingCount}>({formatNumber(reviewsCount)} avis)</Text>
              )}
            </View>
          )}

          <View style={styles.metaRow}>
            {est.type && <Text style={styles.metaText}>{est.type}</Text>}
            {est.city && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={colors.muted} />
                <Text style={styles.metaText}>{est.city}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              {isOpen ? (
                <>
                  <View style={styles.openDot} />
                  <Text style={[styles.metaText, { color: colors.success }]}>
                    Ouvert{est.closingTime ? ` · Ferme à ${est.closingTime}` : ''}
                  </Text>
                </>
              ) : (
                <Text style={[styles.metaText, { color: colors.destructive }]}>Fermé</Text>
              )}
            </View>
          </View>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.ctaPrimary} accessibilityLabel="Réserver">
              <Text style={styles.ctaPrimaryText}>Réserver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaOutline} onPress={openMaps} accessibilityLabel="Itinéraire">
              <Navigation size={16} color={colors.foreground} />
              <Text style={styles.ctaOutlineText}>Itinéraire</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {tab === 'about' && (
            <View style={styles.section}>
              {est.description ? (
                <Text style={styles.description}>{est.description}</Text>
              ) : (
                <Text style={styles.emptyText}>Aucune description disponible.</Text>
              )}
            </View>
          )}

          {tab === 'reviews' && (
            <View style={styles.section}>
              {reviews?.data?.length > 0 ? (
                reviews.data.map((r: any) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>{r.user?.firstName} {r.user?.lastName}</Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} color={colors.accent} fill={s <= r.rating ? colors.accent : 'none'} />
                        ))}
                      </View>
                    </View>
                    {r.comment && <Text style={styles.reviewText} numberOfLines={3}>{r.comment}</Text>}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Aucun avis pour le moment.</Text>
              )}
            </View>
          )}

          {tab === 'menu' && (
            <View style={styles.section}>
              {est.menu?.length > 0 ? (
                est.menu.map((section: any) => (
                  <View key={section.name} style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>{section.name}</Text>
                    {section.items?.map((item: any) => (
                      <View key={item.name} style={styles.menuItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          {item.description && <Text style={styles.menuItemDesc} numberOfLines={1}>{item.description}</Text>}
                        </View>
                        {item.price && <Text style={styles.menuItemPrice}>{item.price}€</Text>}
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Menu non disponible.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hero: { width: W, height: HERO_HEIGHT, backgroundColor: colors.surface },
  heroPH: { backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
  heroPHText: { fontFamily: fonts.heading.black, fontSize: 64, color: `${colors.primary}40` },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  heroBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroRight: { flexDirection: 'row', gap: spacing.sm },
  identity: { padding: spacing.md, gap: spacing.sm },
  name: { fontFamily: fonts.heading.black, fontSize: 24, color: colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { fontFamily: fonts.heading.bold, fontSize: 13, color: colors.foreground, marginLeft: 4 },
  ratingCount: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted },
  openDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  ctaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  ctaPrimary: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: radius.button, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaPrimaryText: { fontFamily: fonts.heading.bold, fontSize: 15, color: '#FFFFFF' },
  ctaOutline: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.button, height: 48,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.sm,
  },
  ctaOutlineText: { fontFamily: fonts.heading.bold, fontSize: 15, color: colors.foreground },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1, paddingVertical: spacing.sm + 4,
    alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.muted },
  tabTextActive: { color: colors.primary },
  tabContent: { minHeight: 200 },
  section: { padding: spacing.md, gap: spacing.md },
  description: { fontFamily: fonts.body.regular, fontSize: 14, color: colors.foreground, lineHeight: 22 },
  emptyText: { fontFamily: fonts.body.regular, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: spacing.xl },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.md, gap: spacing.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthor: { fontFamily: fonts.heading.semibold, fontSize: 13, color: colors.foreground },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted, lineHeight: 18 },
  menuSection: { gap: spacing.sm },
  menuSectionTitle: { fontFamily: fonts.heading.bold, fontSize: 15, color: colors.foreground },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  menuItemName: { fontFamily: fonts.body.medium, fontSize: 14, color: colors.foreground },
  menuItemDesc: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  menuItemPrice: { fontFamily: fonts.heading.semibold, fontSize: 14, color: colors.foreground },
});
