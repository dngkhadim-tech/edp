import React from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import { Settings, Trophy, LogOut, ChevronRight } from 'lucide-react-native';
import { formatNumber, getInitials } from '../../src/lib/utils';
import { gradeLabel } from '../../src/lib/utils';

const GRADE_COLORS: Record<string, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#C9A84C',
  PLATINUM: '#67E8F9',
  DIAMOND: '#93C5FD',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  if (!user) return null;

  const gradeColor = GRADE_COLORS[user.loyaltyGrade] || '#888';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsBtn}>
            <Settings size={22} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{getInitials(user.firstName, user.lastName)}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.username}>@{user.username}</Text>

          <View style={styles.gradeRow}>
            <Trophy size={14} color={gradeColor} />
            <Text style={[styles.grade, { color: gradeColor }]}>
              {gradeLabel(user.loyaltyGrade)} • {formatNumber(user.loyaltyPoints)} pts
            </Text>
          </View>

          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(user.postsCount)}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{formatNumber(user.followersCount)}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatNumber(user.followingCount)}</Text>
            <Text style={styles.statLabel}>Abonnements</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {[
            { label: 'Programme de fidélité', icon: '🏆' },
            { label: 'Mes réservations', icon: '📅' },
            { label: 'Paramètres', icon: '⚙️' },
            { label: 'Aide & Support', icon: '💬' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color="#555" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuItem, styles.logoutBtn]} onPress={logout}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold',
    PLATINUM: 'Platinum', DIAMOND: 'Diamond',
  };
  return map[grade] || grade;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  settingsBtn: { padding: 4 },
  profileSection: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#C9A84C20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#C9A84C', fontSize: 32, fontWeight: '700' },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 2 },
  username: { color: '#888', fontSize: 13, marginBottom: 8 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  grade: { fontSize: 13, fontWeight: '600' },
  bio: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1A1A1A',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1A1A1A' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  menu: { paddingHorizontal: 16, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  menuIcon: { fontSize: 18, width: 24 },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15 },
  logoutBtn: { marginTop: 8, backgroundColor: '#EF444410' },
  logoutText: { color: '#EF4444', fontSize: 15, flex: 1 },
});
