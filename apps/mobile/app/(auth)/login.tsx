import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { colors, spacing, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    try {
      await login(email, password);
      router.replace('/(tabs)/feed');
    } catch {
      Alert.alert('Connexion échouée', 'Email ou mot de passe invalide');
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
          style={styles.hero}
        >
          <Text style={styles.logo}>EDP</Text>
          <Text style={styles.tagline}>Eat · Drink · Pose</Text>
        </LinearGradient>

        {/* Formulaire */}
        <View style={styles.form}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Bienvenue sur EDP</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vous@exemple.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                accessibilityLabel={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={styles.eyeBtn}
              >
                {showPass
                  ? <EyeOff size={18} color={colors.muted} />
                  : <Eye size={18} color={colors.muted} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.primaryBtnText}>Se connecter</Text>}
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>ou</Text>
            <View style={styles.sepLine} />
          </View>

          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>G  Continuer avec Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlineBtn, { marginTop: spacing.sm }]}>
            <Text style={styles.outlineBtnText}>f  Continuer avec Facebook</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.link}>S'inscrire →</Text>
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
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logo: {
    fontSize: 48,
    fontFamily: fonts.heading.black,
    color: colors.primary,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: colors.primaryHover,
  },
  form: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.heading.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body.regular,
    color: colors.muted,
    marginTop: -spacing.sm,
  },
  field:  { gap: 6 },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeBtn: { padding: 10 },
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
    fontSize: 16,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sepLine: { flex: 1, height: 1, backgroundColor: colors.border },
  sepText: {
    fontSize: 12,
    fontFamily: fonts.body.regular,
    color: colors.muted,
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
