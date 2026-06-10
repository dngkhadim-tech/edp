import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, User, Building2 } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { colors, spacing, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

type AccountType = 'user' | 'establishment';

function getPasswordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_COLORS: Record<number, string> = {
  0: colors.border,
  1: colors.destructive,
  2: '#F97316',
  3: '#EAB308',
  4: colors.success,
};

function StrengthBars({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
      {[1, 2, 3, 4].map((lvl) => (
        <View
          key={lvl}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: strength >= lvl ? STRENGTH_COLORS[strength] : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '',
  });

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.username || !form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit avoir au moins 8 caractères');
      return;
    }
    try {
      await registerUser({ ...form, isEstablishment: accountType === 'establishment' });
      router.replace('/(tabs)/feed');
    } catch {
      Alert.alert('Erreur', "Erreur lors de l'inscription");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={['#FFE4E6', '#FECDD3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, step === 2 && styles.heroSmall]}
        >
          <Text style={styles.logo}>VEYA</Text>
          <Text style={styles.heroTitle}>
            {step === 1 ? 'Créer un compte' : 'Vos informations'}
          </Text>
        </LinearGradient>

        <View style={styles.form}>
          {step === 1 ? (
            <>
              <Text style={styles.question}>Quel type de compte ?</Text>
              <View style={styles.typeRow}>
                {(['user', 'establishment'] as AccountType[]).map((type) => {
                  const selected = accountType === type;
                  const Icon = type === 'user' ? User : Building2;
                  const label = type === 'user' ? 'Utilisateur' : 'Établissement';
                  const desc = type === 'user'
                    ? 'Explorez et partagez'
                    : 'Gérez votre espace';
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setAccountType(type)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      style={[styles.typeCard, selected && styles.typeCardActive]}
                    >
                      <View style={[styles.typeIcon, selected && styles.typeIconActive]}>
                        <Icon size={22} color={selected ? colors.primary : colors.muted} />
                      </View>
                      <Text style={[styles.typeLabel, selected && styles.typeLabelActive]}>
                        {label}
                      </Text>
                      <Text style={styles.typeDesc}>{desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
                <Text style={styles.primaryBtnText}>Continuer →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.nameRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    value={form.firstName}
                    onChangeText={(v) => setForm({ ...form, firstName: v })}
                    placeholder="Jean"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    value={form.lastName}
                    onChangeText={(v) => setForm({ ...form, lastName: v })}
                    placeholder="Dupont"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nom d'utilisateur</Text>
                <View style={styles.usernameRow}>
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={form.username}
                    onChangeText={(v) => setForm({ ...form, username: v.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="jean_dupont"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => setForm({ ...form, email: v })}
                  placeholder="jean@exemple.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={form.password}
                    onChangeText={(v) => setForm({ ...form, password: v })}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass((v) => !v)}
                    accessibilityLabel={showPass ? 'Masquer' : 'Afficher le mot de passe'}
                    style={styles.eyeBtn}
                  >
                    {showPass
                      ? <EyeOff size={18} color={colors.muted} />
                      : <Eye size={18} color={colors.muted} />}
                  </TouchableOpacity>
                </View>
                {form.password.length > 0 && <StrengthBars password={form.password} />}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { flex: 1 }]}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.outlineBtnText}>← Retour</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }, isLoading && styles.btnDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.primaryBtnText}>Créer mon compte</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  hero: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroSmall: { height: 120 },
  logo: {
    fontSize: 40,
    fontFamily: fonts.heading.black,
    color: colors.primary,
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: 15,
    fontFamily: fonts.body.medium,
    color: colors.primaryHover,
  },
  form: { flex: 1, padding: spacing.lg, gap: spacing.md },
  question: {
    fontSize: 16,
    fontFamily: fonts.heading.semibold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: spacing.md },
  typeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1F2',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconActive: { backgroundColor: '#FFE4E6' },
  typeLabel: {
    fontFamily: fonts.heading.semibold,
    fontSize: 13,
    color: colors.foreground,
  },
  typeLabelActive: { color: colors.primary },
  typeDesc: {
    fontFamily: fonts.body.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  field:   { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: fonts.body.medium,
    color: colors.foreground,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontFamily: fonts.body.regular,
    fontSize: 15,
    color: colors.foreground,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  atSign: {
    fontFamily: fonts.body.regular,
    fontSize: 15,
    color: colors.muted,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeBtn: { padding: 10 },
  btnRow: { flexDirection: 'row', gap: spacing.md },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.heading.bold,
    fontSize: 15,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontFamily: fonts.body.medium,
    fontSize: 14,
    color: colors.foreground,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontFamily: fonts.body.regular,
    fontSize: 14,
    color: colors.muted,
  },
  link: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.primary,
  },
});
