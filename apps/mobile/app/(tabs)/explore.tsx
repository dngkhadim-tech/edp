import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { Search, Star, MapPin } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

function EstCard({ item }: { item: any }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/establishment/${item.slug}`)}
    >
      <View style={styles.cardImage}>
        {item.banner ? (
          <Image source={{ uri: item.banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={styles.cardInitial}>{item.name?.[0]}</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardRow}>
          <MapPin size={12} color="#888" />
          <Text style={styles.cardCity}>{item.city}</Text>
        </View>
        <View style={styles.cardRow}>
          <Star size={12} color="#C9A84C" fill="#C9A84C" />
          <Text style={styles.cardRating}>{Number(item.averageRating).toFixed(1)}</Text>
          <Text style={styles.cardReviews}>({item.reviewsCount} avis)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('');
  const [query, setQuery] = useState({ q: '', type: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['mobile-establishments', query],
    queryFn: () => api.get('/establishments/search', { params: query }).then((r) => r.data),
  });

  const TYPES = [
    { value: '', label: 'Tous' },
    { value: 'RESTAURANT', label: 'Restaurants' },
    { value: 'HOTEL', label: 'Hôtels' },
    { value: 'BAR', label: 'Bars' },
    { value: 'TOURIST_SPOT', label: 'Tourisme' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery({ q: search, type: activeType })}
          placeholder="Restaurant, hôtel, ville..."
          placeholderTextColor="#555"
          returnKeyType="search"
        />
      </View>

      <View style={styles.types}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            onPress={() => { setActiveType(t.value); setQuery({ q: search, type: t.value }); }}
            style={[styles.typeBtn, activeType === t.value && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, activeType === t.value && styles.typeTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EstCard item={item} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Aucun résultat</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', height: 44, fontSize: 15 },
  types: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1A1A1A' },
  typeBtnActive: { backgroundColor: '#C9A84C20', borderWidth: 1, borderColor: '#C9A84C' },
  typeText: { color: '#888', fontSize: 13, fontWeight: '500' },
  typeTextActive: { color: '#C9A84C' },
  card: { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 12, overflow: 'hidden' },
  cardImage: { width: 90, height: 90, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  cardInitial: { fontSize: 32, fontWeight: '700', color: '#C9A84C40' },
  cardBody: { flex: 1, padding: 12, gap: 4 },
  cardName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardCity: { color: '#888', fontSize: 12 },
  cardRating: { color: '#C9A84C', fontSize: 12, fontWeight: '600' },
  cardReviews: { color: '#666', fontSize: 11 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
