import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, SearchX } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { EstablishmentCard, type Establishment } from '../../src/components/establishment/EstablishmentCard';
import { CategoryPills, type PillOption } from '../../src/components/feed/CategoryPills';
import { colors, spacing, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

const TYPES: PillOption[] = [
  { value: '', label: 'Tout' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'BAR', label: 'Bar' },
  { value: 'HOTEL', label: 'Hôtel' },
  { value: 'CAFE', label: 'Café' },
  { value: 'TOURIST_SPOT', label: 'À visiter' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['mobile-establishments', debouncedSearch, type],
    queryFn: () =>
      api.get('/establishments/search', { params: { q: debouncedSearch, type, limit: 20 } })
        .then((r) => r.data),
  });

  const items: Establishment[] = data?.data ?? [];

  const renderItem = useCallback(({ item }: { item: Establishment }) => (
    <View style={styles.cardWrap}>
      <EstablishmentCard establishment={item} />
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Découvrir</Text>
        <TouchableOpacity accessibilityLabel="Filtres avancés" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <SlidersHorizontal size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Restaurants, bars, hôtels..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      <CategoryPills options={TYPES} value={type} onChange={setType} />

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeleton} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <SearchX size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>
            {debouncedSearch ? `Aucun résultat pour «${debouncedSearch}»` : 'Aucun établissement'}
          </Text>
          <Text style={styles.emptySubtitle}>Essayez un autre mot-clé ou changez les filtres</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.heading.bold, fontSize: 18, color: colors.foreground },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: 15,
    color: colors.foreground,
  },
  row: { paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.md },
  cardWrap: { flex: 1 },
  listContent: { paddingTop: spacing.sm, paddingBottom: 80 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.md },
  skeleton: { width: '47%', aspectRatio: 3 / 4, backgroundColor: colors.surface, borderRadius: radius.card },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontFamily: fonts.heading.semibold, fontSize: 16, color: colors.foreground, textAlign: 'center' },
  emptySubtitle: { fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted, textAlign: 'center' },
});
