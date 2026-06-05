# EDP Mobile — Foundation & Auth Design Spec

**Date :** 2026-06-05
**Périmètre :** P1 Foundation + P2 Auth (Login, Register)
**Plateforme :** React Native / Expo (expo-router)
**Référence design system :** `docs/superpowers/specs/2026-06-04-edp-design.md`

---

## Décisions clés

| Décision | Choix |
|---|---|
| Thème | Light uniquement (MVP) — fond blanc `#FFFFFF`, primary rose `#E11D48` |
| Polices | Outfit (headings) + DM Sans (body) via `@expo-google-fonts` |
| Architecture tokens | Fichier centralisé `src/constants/theme.ts` |
| Auth layout | Hero gradient rose en haut + formulaire blanc en bas |

---

## 1. P1 — Foundation

### 1.1 Design tokens — `src/constants/theme.ts`

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
};

export const radius = {
  card:   16,
  button: 12,
  pill:   999,
  sm:     8,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
};
```

### 1.2 Polices — `src/constants/fonts.ts`

```ts
export const fonts = {
  heading: {
    regular: 'Outfit_600SemiBold',
    bold:    'Outfit_700Bold',
    black:   'Outfit_800ExtraBold',
  },
  body: {
    regular: 'DMSans_400Regular',
    medium:  'DMSans_500Medium',
    bold:    'DMSans_700Bold',
  },
};
```

Packages à installer :
```bash
pnpm add @expo-google-fonts/outfit @expo-google-fonts/dm-sans expo-linear-gradient
```

### 1.3 Root layout — `app/_layout.tsx`

- Charger `Outfit_600SemiBold`, `Outfit_700Bold`, `Outfit_800ExtraBold`, `DMSans_400Regular`, `DMSans_500Medium`, `DMSans_700Bold`
- Supprimer `@expo-google-fonts/inter`
- `<StatusBar style="dark" />` (texte sombre sur fond clair)
- `contentStyle: { backgroundColor: colors.background }`

### 1.4 Bottom navigation — `app/(tabs)/_layout.tsx`

**Structure :** 5 onglets dans cet ordre. `messages` est **retiré** de la bottom nav (accessible depuis le profil / notifications).

| Position | Nom route | Icône Lucide | Label |
|---|---|---|---|
| 1 | `feed` | `Home` | Accueil |
| 2 | `explore` | `Compass` | Découvrir |
| 3 | *(bouton modal)* | `Plus` custom | — |
| 4 | `reels` | `Film` | Reels |
| 5 | `profile` | `User` | Profil |

Le bouton central n'est pas un vrai onglet : son `tabBarButton` intercepte le tap et appelle `router.push('/post/new')` plutôt que de changer d'écran. La route `messages` reste dans `app/(tabs)/` mais sans entrée dans la tab bar (accessible via lien depuis le profil).

**Styles tab bar :**
```ts
tabBarStyle: {
  backgroundColor: colors.background,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  height: 64,
  paddingBottom: 8,
}
tabBarActiveTintColor:   colors.primary   // #E11D48
tabBarInactiveTintColor: '#9CA3AF'
tabBarShowLabel: true
tabBarLabelStyle: { fontFamily: fonts.body.regular, fontSize: 10 }
```

**Bouton central (+) :**
```tsx
tabBarIcon: () => (
  <View style={{
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  }}>
    <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
  </View>
)
```
- `tabBarLabel: () => null` pour l'onglet central
- Le tap sur + navigue vers `/post/new` (modal Stack screen)

**Safe area :** `paddingBottom: insets.bottom` via `useSafeAreaInsets()`.

### 1.5 `app.json`

- `userInterfaceStyle`: `"light"`
- `splash.backgroundColor`: `"#FFFFFF"`
- `android.adaptiveIcon.backgroundColor`: `"#FFFFFF"`

---

## 2. P2 — Auth

### 2.1 Layout auth — `app/(auth)/_layout.tsx`

Stack sans header, `backgroundColor: colors.background`.

### 2.2 Login — `app/(auth)/login.tsx`

**Structure :**
```
SafeAreaView (flex:1, backgroundColor: white)
  KeyboardAvoidingView (behavior: 'padding' iOS / 'height' Android)
    ScrollView
      Hero (LinearGradient, height: 220)
        Logo "EDP" (Outfit 800, 48px, #E11D48)
        Tagline "Eat · Drink · Pose" (DM Sans 400, 14px, #BE123C)
      Formulaire (padding 24px, gap 16)
        TextInput Email
        TextInput Mot de passe (secureTextEntry + toggle Eye/EyeOff)
        Lien "Mot de passe oublié ?" (aligné droite, text-primary)
        TouchableOpacity [Se connecter] (bg primary, h:48, rounded 12)
        Séparateur "ou" (ligne + texte centré)
        TouchableOpacity [Continuer avec Google] (outline)
        TouchableOpacity [Continuer avec Facebook] (outline)
        Row "Pas encore de compte ? S'inscrire →" (texte muted + link primary)
```

**Hero gradient :**
```ts
colors: ['#FFE4E6', '#FECDD3']
start: { x: 0, y: 0 }
end:   { x: 1, y: 1 }
```

**Input style :**
```ts
backgroundColor: colors.surface,
borderWidth: 1, borderColor: colors.border,
borderRadius: radius.button,
paddingHorizontal: 14, paddingVertical: 13,
fontFamily: fonts.body.regular, fontSize: 15, color: colors.foreground
```

**Bouton primaire :**
```ts
backgroundColor: colors.primary,
borderRadius: radius.button,
height: 48, alignItems: 'center', justifyContent: 'center'
```
Loading : `ActivityIndicator color="#FFFFFF"` à la place du texte.

**Erreur :** `Alert.alert('Connexion échouée', message)`.

**OAuth :** boutons outline `borderColor: colors.border`, texte `colors.foreground`. Tappent sur `${API_URL}/auth/google` et `${API_URL}/auth/facebook` via `WebBrowser.openAuthSessionAsync` (`expo-web-browser`, déjà dans les deps Expo).

### 2.3 Register — `app/(auth)/register.tsx`

**Étape 1 — Type de compte :**
```
Hero (LinearGradient identique, height: 180)
  "Créer un compte" (Outfit 700, 22px)
  "Quel type de compte ?" (DM Sans 400, 14px, muted)

Row de 2 TypeCards
  Card Utilisateur | Card Établissement
  border 2px border-border → border-primary si sélectionnée
  bg white → bg primary/5 si sélectionnée
  Icône (User / Building2, 24px) + Titre + Description

Bouton [Continuer →] (primary, pleine largeur)
```

**Étape 2 — Informations :**
```
Hero réduit (height: 120, même gradient)
  "Créer un compte"

Formulaire
  Row [Prénom] [Nom]
  Input @Username (@ prefix à gauche)
  Input Email
  Input Mot de passe + toggle show/hide
    4 barres de force (gris→rouge→orange→jaune→vert)
  Row [← Retour (outline)] [Créer mon compte (primary)]
```

**Barres de force mdp :**
```ts
const STRENGTH_COLORS = {
  0: colors.border,
  1: colors.destructive,   // rouge
  2: '#F97316',            // orange
  3: '#EAB308',            // jaune
  4: colors.success,       // vert
};
```
Score : +1 si longueur ≥ 8, +1 si majuscule, +1 si chiffre, +1 si caractère spécial.

**Validation :** react-hook-form + zod (mêmes schémas que web). Erreurs affichées sous chaque input (DM Sans 12px, `colors.destructive`).

---

## 3. Checklist pré-livraison

- [ ] Aucune couleur hex codée en dur dans les composants (uniquement `colors.*`)
- [ ] Police Outfit sur tous les titres/headings
- [ ] Police DM Sans sur tous les textes body/labels
- [ ] Safe area respectée sur iOS (bottom nav, header, formulaires)
- [ ] `KeyboardAvoidingView` sur tous les écrans avec formulaire
- [ ] Boutons avec `accessibilityLabel` sur les actions icône-only
- [ ] `ActivityIndicator` pendant les requêtes réseau
- [ ] Erreurs réseau via `Alert.alert` (natif)
- [ ] `LinearGradient` importé depuis `expo-linear-gradient` (à installer)
