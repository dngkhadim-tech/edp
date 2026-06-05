import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import {
  Settings, Trophy, CalendarDays, HelpCircle, LogOut,
  ChevronRight, LayoutGrid, Film, Bookmark, Star,
} from 'lucide-react-native';
import { formatNumber, getInitials, gradeLabel } from '../../src/lib/utils';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 4) / 3;

const GRADE_STYLES: Record<string, { bg: string; color: string }> = {
  BRONZE:   { bg: '#FEF3C7', color: '#92400E' },
  SILVER:   { bg: '#F1F5F9', color: '#475569' },
  GOLD:     { bg: '#FEF9C3', color: '#A16207' },
  PLATINUM: { bg: '#F0F9FF', color: '#0369A1' },
  DIAMOND:  { bg: '#FAF5FF', color: '#7C3AED' },
};

const MENU_ITEMS = [
  { label: 'Programme de fidélité', icon: Trophy },
  { label: 'Mes réservations',      icon: CalendarDays },
  { label: 'Paramètres',            icon: Settings },
  { label: 'Aide & Support',        icon: HelpCircle },
] as const;

type Tab = 'posts' | 'reels' | 'saved';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  if (!user) return null;

  const gradeStyle = GRADE_STYLES[user.loyaltyGrade] ?? GRADE_STYLES.BRONZE;
  const placeholderCount = Math.max(user.postsCount, 6);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsBtn} accessibilityLabel="Paramètres">
            <Settings size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Identity block */}
        <View style={styles.identity}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatar, user.isVerified && styles.avatarVerified]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, user.isVerified && styles.avatarVerified]}>
              <Text style={styles.avatarInitials}>{getInitials(user.firstName, user.lastName)}</Text>
            </View>
          )}

          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.username}>@{user.username}</Text>

          {/* Loyalty badge */}
          <View style={[styles.loyaltyBadge, { backgroundColor: gradeStyle.bg }]}>
            <Star size={12} color={gradeStyle.color} strokeWidth={1.5} />
            <Text style={[styles.loyaltyText, { color: gradeStyle.color }]}>
              {gradeLabel(user.loyaltyGrade)} · {formatNumber(user.loyaltyPoints)} pts
            </Text>
          </View>

          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(user.postsCount)}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <View style={[styles.stat, styles.statMiddle]}>
            <Text style={styles.statValue}>{formatNumber(user.followersCount)}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(user.followingCount)}</Text>
            <Text style={styles.statLabel}>Abonnements</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([
            { key: 'posts' as Tab,  Icon: LayoutGrid, label: 'Publications' },
            { key: 'reels' as Tab,  Icon: Film,       label: 'Reels' },
            { key: 'saved' as Tab,  Icon: Bookmark,   label: 'Sauvegardés' },
          ]).map(({ key, Icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              accessibilityLabel={label}
            >
              <Icon size={22} color={activeTab === key ? colors.primary : colors.muted} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Post grid */}
        <View style={styles.grid}>
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <View key={i} style={styles.cell} />
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map(({ label, icon: Icon }) => (
            <TouchableOpacity key={label} style={styles.menuItem}>
              <Icon size={18} color={colors.muted} strokeWidth={1.5} />
              <Text style={styles.menuLabel}>{label}</Text>
              <ChevronRight size={18} color={colors.muted} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
            <LogOut size={18} color={colors.destructive} strokeWidth={1.5} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 12 },
  settingsBtn: { padding: 4 },

  identity: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatarVerified: { borderWidth: 2, borderColor: colors.primary },
  avatarFallback: { backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: fonts.heading.bold, fontSize: 24, color: colors.primary },

  name: { fontFamily: fonts.heading.bold, fontSize: 18, color: colors.foreground, marginBottom: 2 },
  username: { fontFamily: fonts.body.regular, fontSize: 12, color: colors.muted, marginBottom: 8 },

  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  loyaltyText: { fontFamily: fonts.body.medium, fontSize: 11 },

  bio: {
    fontFamily: fonts.body.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },

  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  editBtnText: { fontFamily: fonts.body.medium, fontSize: 13, color: colors.foreground },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontFamily: fonts.heading.bold, fontSize: 20, color: colors.foreground },
  statLabel: { fontFamily: fonts.body.regular, fontSize: 11, color: colors.muted, marginTop: 2 },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderColor: colors.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },

  menu: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
  },
  menuLabel: { flex: 1, fontFamily: fonts.body.regular, fontSize: 15, color: colors.foreground },
  logoutItem: { marginTop: 8, backgroundColor: '#FEF2F2' },
  logoutText: { flex: 1, fontFamily: fonts.body.regular, fontSize: 15, color: colors.destructive },
});
