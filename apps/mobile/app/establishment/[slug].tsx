import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, MapPin, Phone, Globe, Heart, BookOpen, Users } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function EstablishmentScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'menu'>('about');

  const { data: est, isLoading } = useQuery({
    queryKey: ['establishment', slug],
    queryFn: () => api.get(`/establishments/${slug}`).then((r) => {
      setFollowing(r.data.isFollowing);
      return r.data;
    }),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', est?.id],
    queryFn: () => api.get(`/reviews/establishment/${est.id}`).then((r) => r.data),
    enabled: !!est?.id,
  });

  const handleFollow = async () => {
    setFollowing(!following);
    if (following) await api.delete(`/follows/establishments/${est.id}`).catch(() => {});
    else await api.post(`/follows/establishments/${est.id}`).catch(() => {});
  };

  const handleReservation = () => {
    Alert.alert(
      'Réserver',
      `Choisissez votre type de réservation chez ${est?.name}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Restaurant', onPress: () => router.push({ pathname: '/reservation', params: { estId: est.id, type: 'RESTAURANT' } }) },
      ]
    );
  };

  if (isLoading || !est) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#C9A84C" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: 240, backgroundColor: '#1A1A1A' }}>
          {est.banner ? (
            <Image source={{ uri: est.banner }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.bannerPlaceholder]}>
              <Text style={styles.bannerLetter}>{est.name?.[0]}</Text>
            </View>
          )}
          <View style={styles.bannerOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            {est.logo && (
              <Image source={{ uri: est.logo }} style={styles.logo} />
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{est.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="#888" />
                <Text style={styles.location}>{est.city}, {est.country}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatBox label="Note" value={`⭐ ${Number(est.averageRating).toFixed(1)}`} />
            <View style={styles.statDivider} />
            <StatBox label="Avis" value={String(est.reviewsCount)} />
            <View style={styles.statDivider} />
            <StatBox label="Abonnés" value={String(est.followersCount)} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, following && styles.actionBtnActive]}
              onPress={handleFollow}
            >
              <Heart size={16} color={following ? '#C9A84C' : '#fff'} fill={following ? '#C9A84C' : 'none'} />
              <Text style={[styles.actionText, following && { color: '#C9A84C' }]}>
                {following ? 'Suivi' : 'Suivre'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reserveBtn} onPress={handleReservation}>
              <BookOpen size={16} color="#0A0A0A" />
              <Text style={styles.reserveText}>Réserver</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(['about', 'reviews', 'menu'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'about' ? 'À propos' : tab === 'reviews' ? `Avis (${est.reviewsCount})` : 'Menu'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'about' && (
            <View style={styles.section}>
              {est.description && <Text style={styles.description}>{est.description}</Text>}
              {est.phone && (
                <View style={styles.infoRow}>
                  <Phone size={14} color="#C9A84C" />
                  <Text style={styles.infoText}>{est.phone}</Text>
                </View>
              )}
              {est.website && (
                <View style={styles.infoRow}>
                  <Globe size={14} color="#C9A84C" />
                  <Text style={styles.infoText} numberOfLines={1}>{est.website}</Text>
                </View>
              )}
              {est.amenities?.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Équipements</Text>
                  <View style={styles.tags}>
                    {est.amenities.map((a: string) => (
                      <View key={a} style={styles.tag}><Text style={styles.tagText}>{a}</Text></View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.section}>
              {reviews?.data?.map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{r.user?.firstName} {r.user?.lastName}</Text>
                    <Text style={styles.reviewRating}>{'⭐'.repeat(r.rating)}</Text>
                  </View>
                  {r.title && <Text style={styles.reviewTitle}>{r.title}</Text>}
                  <Text style={styles.reviewContent}>{r.content}</Text>
                </View>
              ))}
              {!reviews?.data?.length && (
                <Text style={styles.empty}>Aucun avis pour l'instant</Text>
              )}
            </View>
          )}

          {activeTab === 'menu' && (
            <View style={styles.section}>
              {est.menuItems?.length > 0 ? est.menuItems.map((item: any) => (
                <View key={item.id} style={styles.menuItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    {item.description && <Text style={styles.menuItemDesc}>{item.description}</Text>}
                  </View>
                  <Text style={styles.menuItemPrice}>{item.price}€</Text>
                </View>
              )) : (
                <Text style={styles.empty}>Menu non disponible</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  bannerPlaceholder: { backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  bannerLetter: { fontSize: 72, fontWeight: '800', color: '#C9A84C20' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logo: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#1A1A1A' },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { color: '#888', fontSize: 13 },
  statsRow: { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statLabel: { color: '#666', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#2A2A2A' },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, padding: 12 },
  actionBtnActive: { borderColor: '#C9A84C', backgroundColor: '#C9A84C15' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  reserveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C9A84C', borderRadius: 10, padding: 12 },
  reserveText: { color: '#0A0A0A', fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#C9A84C20' },
  tabText: { color: '#666', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#C9A84C', fontWeight: '600' },
  section: { gap: 12 },
  description: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: '#ddd', fontSize: 13, flex: 1 },
  sectionTitle: { color: '#fff', fontWeight: '600', fontSize: 14, marginTop: 8, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { color: '#aaa', fontSize: 12 },
  reviewCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, gap: 6 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUser: { color: '#fff', fontWeight: '600', fontSize: 13 },
  reviewRating: { fontSize: 12 },
  reviewTitle: { color: '#C9A84C', fontWeight: '600', fontSize: 13 },
  reviewContent: { color: '#aaa', fontSize: 13, lineHeight: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 12, padding: 14, gap: 12 },
  menuItemName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  menuItemDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  menuItemPrice: { color: '#C9A84C', fontWeight: '700', fontSize: 16 },
  empty: { color: '#555', textAlign: 'center', marginTop: 24 },
});
