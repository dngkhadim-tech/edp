# Mobile Foundation & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer l'app mobile EDP du thème dark/or vers le design system light/rose (spec), ajouter les polices Outfit+DM Sans, refaire la bottom nav spec-conforme, et réécrire les écrans Auth (Login hero gradient + Register 2-étapes).

**Architecture:** Les tokens sont centralisés dans `src/constants/theme.ts` et `src/constants/fonts.ts`. Tous les écrans importent ces constantes — aucune couleur hex en dur dans les composants. La bottom nav intercepte le bouton central pour ouvrir `/post/new` en modal plutôt qu'en tab.

**Tech Stack:** React Native 0.74, Expo 51, expo-router 3.5, expo-linear-gradient, @expo-google-fonts/outfit, @expo-google-fonts/dm-sans, TypeScript 5.5

---

## File Map

| Action | Fichier | Rôle |
|---|---|---|
| Create | `apps/mobile/src/constants/theme.ts` | Couleurs, spacing, radius, ombres |
| Create | `apps/mobile/src/constants/fonts.ts` | Familles et poids typographiques |
| Modify | `apps/mobile/app.json` | Light mode, splash blanc |
| Modify | `apps/mobile/app/_layout.tsx` | Polices Outfit+DM Sans, StatusBar dark, fond blanc |
| Modify | `apps/mobile/app/(tabs)/_layout.tsx` | Bottom nav spec : rose, labels, + modal, sans messages |
| Modify | `apps/mobile/app/(auth)/_layout.tsx` | Fond blanc |
| Modify | `apps/mobile/app/(auth)/login.tsx` | Hero gradient + formulaire light/rose |
| Modify | `apps/mobile/app/(auth)/register.tsx` | 2 étapes : type selection + formulaire + barres force |

---

## Task 1 : Installer les packages et créer les tokens

**Files:**
- Modify: `apps/mobile/package.json` (via pnpm add)
- Create: `apps/mobile/src/constants/theme.ts`
- Create: `apps/mobile/src/constants/fonts.ts`

- [ ] **Step 1 : Installer les packages**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && pnpm add @expo-google-fonts/outfit @expo-google-fonts/dm-sans expo-linear-gradient
```

Expected : packages ajoutés, pas d'erreur.

- [ ] **Step 2 : Créer `src/constants/theme.ts`**

```ts
export const colors = {
  primary:      '#E11D48',
  primaryHover: '#BE123C',
  accent:       '#A16207',
  accentLight:  '#FEF9C3',
  background:   '#FFFFFF',
  surface:      '#F9FAFB',
  foreground:   '#111827',
  muted:        '#6B7280',
  border:       '#E5E7EB',
  success:      '#16A34A',
  destructive:  '#DC2626',
  card:         '#FFFFFF',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  card:   16,
  button: 12,
  pill:   999,
  sm:     8,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
```

- [ ] **Step 3 : Créer `src/constants/fonts.ts`**

```ts
export const fonts = {
  heading: {
    semibold: 'Outfit_600SemiBold',
    bold:     'Outfit_700Bold',
    black:    'Outfit_800ExtraBold',
  },
  body: {
    regular: 'DMSans_400Regular',
    medium:  'DMSans_500Medium',
    bold:    'DMSans_700Bold',
  },
} as const;
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i error | head -10
```

Expected : aucune erreur liée aux nouveaux fichiers.

- [ ] **Step 5 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/src/constants/ apps/mobile/package.json apps/mobile/pnpm-lock.yaml 2>/dev/null; git add apps/mobile/src/constants/; git commit -m "feat(mobile): add design tokens and install Outfit+DM Sans+LinearGradient"
```

---

## Task 2 : app.json + Root layout (polices, StatusBar, fond blanc)

**Files:**
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1 : Mettre à jour `app.json`**

Remplacer les champs suivants dans `apps/mobile/app.json` :
```json
"userInterfaceStyle": "light",
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#FFFFFF"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#FFFFFF"
  },
  "package": "com.edp.app",
  "versionCode": 1,
  "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION"]
}
```

- [ ] **Step 2 : Réécrire `app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { colors } from '../src/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i error | head -10
```

Expected : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app.json apps/mobile/app/_layout.tsx && git commit -m "feat(mobile): light theme — Outfit+DM Sans fonts, white background, dark StatusBar"
```

---

## Task 3 : Bottom navigation spec-conforme

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1 : Réécrire `app/(tabs)/_layout.tsx`**

```tsx
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Compass, Film, User, Plus } from 'lucide-react-native';
import { colors, radius } from '../../src/constants/theme';
import { fonts } from '../../src/constants/fonts';

function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel="Nouvelle publication"
      accessibilityRole="button"
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: fonts.body.regular,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarLabel: 'Découvrir',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          tabBarLabel: 'Reels',
          tabBarIcon: ({ color, size }) => <Film color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={1.5} />,
        }}
      />
      {/* Bouton central — intercepte le tap, pas de screen rendu */}
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
          tabBarButton: () => <PlusButton onPress={() => router.push('/post/new')} />,
          tabBarLabel: () => null,
        }}
      />
    </Tabs>
  );
}
```

Note : `messages` reste dans `(tabs)/` pour ne pas casser les imports, mais `href: null` le masque. Le bouton + est inséré à la 3ème position via l'ordre de déclaration des `Tabs.Screen`. Si l'ordre visuel est incorrect dans expo-router, ajuster en réordonnant les `Tabs.Screen` pour que messages apparaisse en 3ème.

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i error | head -10
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(tabs\)/_layout.tsx && git commit -m "feat(mobile): bottom nav — rose primary, labels, elevated + button, safe area"
```

---

## Task 4 : Auth layout

**Files:**
- Modify: `apps/mobile/app/(auth)/_layout.tsx`

- [ ] **Step 1 : Mettre à jour `app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { colors } from '../../src/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i error | head -10
```

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(auth\)/_layout.tsx && git commit -m "feat(mobile/auth): white background layout"
```

---

## Task 5 : Écran Login — hero gradient + formulaire

**Files:**
- Modify: `apps/mobile/app/(auth)/login.tsx`

- [ ] **Step 1 : Réécrire `app/(auth)/login.tsx`**

```tsx
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
  eyeBtn: {
    padding: 10,
  },
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
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i error | head -10
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(auth\)/login.tsx && git commit -m "feat(mobile/auth): redesign login — hero gradient, light theme, Outfit+DM Sans"
```

---

## Task 6 : Écran Register — 2 étapes + barres de force

**Files:**
- Modify: `apps/mobile/app/(auth)/register.tsx`

- [ ] **Step 1 : Réécrire `app/(auth)/register.tsx`**

```tsx
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
          <Text style={styles.logo}>EDP</Text>
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
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
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
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={form.password}
                    onChangeText={(v) => setForm({ ...form, password: v })}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass((v) => !v)}
                    accessibilityLabel={showPass ? 'Masquer' : 'Afficher'}
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
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /Users/khadimdiongue/edp/apps/mobile && npx tsc --noEmit 2>&1 | grep -i error | head -10
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/mobile/app/\(auth\)/register.tsx && git commit -m "feat(mobile/auth): redesign register — 2-step flow, type cards, strength bars"
```

---

## Self-Review

### Couverture spec

| Requirement spec | Task |
|---|---|
| Tokens centralisés `theme.ts` (couleurs, spacing, radius, ombres) | Task 1 |
| Fichier `fonts.ts` (Outfit + DM Sans) | Task 1 |
| Packages `@expo-google-fonts/outfit`, `@expo-google-fonts/dm-sans`, `expo-linear-gradient` | Task 1 |
| `app.json` : light mode, splash blanc | Task 2 |
| Root layout : Outfit+DM Sans chargées, StatusBar dark, fond blanc | Task 2 |
| Bottom nav : rose `#E11D48`, labels 10px DM Sans, safe area | Task 3 |
| Bouton central (+) surélevé, ombre rose, `router.push('/post/new')` | Task 3 |
| Messages retiré de la tab bar (`href: null`) | Task 3 |
| Auth layout fond blanc | Task 4 |
| Login hero LinearGradient `['#FFE4E6', '#FECDD3']` | Task 5 |
| Login logo EDP Outfit 800 48px `colors.primary` | Task 5 |
| Login password toggle Eye/EyeOff + AccessibilityLabel | Task 5 |
| Login bouton primaire `colors.primary` h-48 | Task 5 |
| Login séparateur ou + Google + Facebook outline | Task 5 |
| Register hero gradient (height 200 étape 1, 120 étape 2) | Task 6 |
| Register étape 1 : TypeCards avec border-primary si sélectionnée | Task 6 |
| Register étape 2 : formulaire complet + toggle mdp | Task 6 |
| Barres de force 4 niveaux (gris→rouge→orange→jaune→vert) | Task 6 |
| Aucune couleur hex en dur dans les composants | Tasks 2-6 |
| `AccessibilityLabel` sur boutons icône-only | Tasks 5-6 |

### Scan placeholders : aucun TBD/TODO trouvé.

### Cohérence des types :
- `colors`, `spacing`, `radius` importés de `theme.ts` dans Tasks 2-6
- `fonts` importé de `fonts.ts` dans Tasks 2-6
- `AccountType = 'user' | 'establishment'` défini et utilisé dans Task 6
- `getPasswordStrength(pw: string): number` défini avant usage dans Task 6
- `STRENGTH_COLORS: Record<number, string>` clés 0-4, `getPasswordStrength` retourne 0-4
