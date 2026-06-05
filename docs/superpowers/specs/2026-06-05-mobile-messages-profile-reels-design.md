# EDP Mobile — Messages · Profil · Reels Design Spec (P4)

**Date :** 2026-06-05
**Périmètre :** Messages (liste conversations), Profil utilisateur, Reels (nettoyage)
**Référence design system :** `docs/superpowers/specs/2026-06-04-edp-design.md`
**Tokens :** `src/constants/theme.ts` + `src/constants/fonts.ts`
**Approche :** A — Fidèle à la spec web, thème light pour Messages et Profil, Reels reste dark

---

## 1. Messages — `app/(tabs)/messages.tsx`

### 1.1 Structure

```
SafeAreaView (bg: colors.background)
  Header (px 16, py 14, borderBottom colors.border)
    Text "Messages" (fonts.heading.bold 20, colors.foreground)
    TouchableOpacity "Nouveau" (couleur colors.primary, fonts.body.medium 13)

  FlatList conversations
    ConversationItem (px 16, py 12, borderBottom colors.border)
      Avatar 48px
      Corps (flex 1)
        Ligne haute : Nom (fonts.heading.semibold 14, colors.foreground) + Timestamp (fonts.body.regular 11, colors.muted)
        Ligne basse : Aperçu message (fonts.body.regular 12, colors.muted, numberOfLines 1)
      Indicateur non-lu (optionnel) : cercle 8px, bg colors.primary

  ListEmptyComponent
    Text centré (fonts.body.regular 14, colors.muted, marginTop 60)
    "Aucune conversation"
```

### 1.2 Avatar

- Taille : 48×48px, borderRadius 24
- Si `avatar` URL : `<Image>` expo-image, contentFit="cover"
- Fallback initiales : fond `colors.surface` (#F9FAFB), texte `colors.primary` (#E11D48), `fonts.heading.bold` 16px
- **Pas** de fond doré (#C9A84C20) — utiliser colors.surface uniquement

### 1.3 Badge non-lu

- Présent si `item.unread_count && item.unread_count > 0`
- Cercle 8×8px, borderRadius 4, bg `colors.primary`
- Aligné verticalement centré, `flexShrink: 0`
- Le nom passe en `fonts.heading.bold` (au lieu de semibold) si non-lu

### 1.4 Navigation

- `router.push` vers `/chat/${item.sender_id}` (conserve la route existante)

### 1.5 Props interface

```ts
interface Conversation {
  conversation_id: string;
  sender_id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  content: string;
  created_at: string;
  unread_count?: number;
}
```

---

## 2. Profil — `app/(tabs)/profile.tsx`

### 2.1 Structure

```
SafeAreaView (bg: colors.background)
  ScrollView
    Header (px 16, py 12, flexDirection row, justifyContent flex-end)
      TouchableOpacity Settings icon (22px, colors.muted)

    Bloc identité (alignItems center, px 24, pb 20)
      Avatar 72px + bordure rose si vérifié
      Nom (fonts.heading.bold 18, colors.foreground, mb 2)
      @username (fonts.body.regular 12, colors.muted, mb 8)
      Badge fidélité (pill)
      Bio (fonts.body.regular 13, colors.muted, textAlign center, mb 12)
      Bouton "Modifier profil"

    Stats row (flexDirection row, borderTop/Bottom colors.border)
      3 cellules : Publications | Abonnés | Abonnements

    Tabs (flexDirection row, borderBottom colors.border)
      3 onglets icônes : Grid2x2 | Film | Bookmark

    Grille posts (3 colonnes)
```

### 2.2 Avatar

- Taille : 72×72px, borderRadius 36
- Bordure `2px solid colors.primary` si `user.isVerified === true`, sinon aucune bordure
- Fallback initiales : fond `#FEF2F2`, texte `colors.primary`, `fonts.heading.bold` 24px
- `marginBottom 12`

### 2.3 Badge fidélité

| Grade | Fond | Texte |
|---|---|---|
| BRONZE | `#FEF3C7` | `#92400E` |
| SILVER | `#F1F5F9` | `#475569` |
| GOLD | `#FEF9C3` | `#A16207` |
| PLATINUM | `#F0F9FF` | `#0369A1` |
| DIAMOND | `#FAF5FF` | `#7C3AED` |

- Shape : pill (borderRadius 999), padding 4px 12px
- Icône étoile Lucide 12px (même couleur que le texte), gap 4px
- `fonts.body.medium` 11px, `marginBottom 10`

### 2.4 Bouton "Modifier profil"

- Outline : borderWidth 1, borderColor colors.border
- borderRadius radius.button (12)
- padding 10px, alignSelf stretch, marginHorizontal 0
- `fonts.body.medium` 13px, color `colors.foreground` (#374151)
- Pas de fond coloré (outline uniquement)

### 2.5 Stats row

- `flexDirection row`, `borderTopWidth 1`, `borderBottomWidth 1`, `borderColor colors.border`
- `marginBottom 0` (collé à la zone identité)
- Chaque cellule : `flex 1`, `alignItems center`, `paddingVertical 14`
- Séparateurs verticaux sur cellules 1 et 2 : `borderLeftWidth 1` / `borderRightWidth 1`, `borderColor colors.border`
- Valeur : `fonts.heading.bold` 20px, `colors.foreground`
- Label : `fonts.body.regular` 11px, `colors.muted`, `marginTop 2`
- Tap "Abonnés" / "Abonnements" → pas de navigation pour MVP (pas de bottom-sheet)

### 2.6 Tabs grille

- `flexDirection row`, `borderBottomWidth 1`, `borderColor colors.border`
- 3 tabs égaux (`flex 1`), `paddingVertical 12`, `alignItems center`
- Icônes Lucide : `Grid2x2` (posts) | `Film` (reels) | `Bookmark` (sauvegardés)
- Actif : `colors.primary` (#E11D48) + `borderBottomWidth 2`, `borderColor colors.primary`
- Inactif : `colors.muted` (#9CA3AF)
- Taille icône : 22px
- État local `activeTab: 'posts' | 'reels' | 'saved'`, défaut `'posts'`

### 2.7 Grille posts

- `flexDirection row`, `flexWrap wrap`
- Chaque cellule : width `(SCREEN_WIDTH - 4) / 3`, aspectRatio 1, `gap 2`
- Fond placeholder : `colors.surface` (#F9FAFB) pour cellules vides
- Pour le MVP : afficher des placeholders si pas de données
- Icône ▶ (Play, 14px, blanc) sur les reels, bas-gauche, fond `rgba(0,0,0,0.45)`, borderRadius 4, padding 2px 4px

### 2.8 Déplacer gradeLabel vers utils

La fonction `gradeLabel` est actuellement dupliquée dans `profile.tsx` (et déclarée en double via export local). La déplacer dans `src/lib/utils.ts` :

```ts
export function gradeLabel(grade: string): string {
  const map: Record<string, string> = {
    BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold',
    PLATINUM: 'Platinum', DIAMOND: 'Diamond',
  };
  return map[grade] || grade;
}
```

Puis importer depuis `../../src/lib/utils` dans `profile.tsx`. Supprimer la déclaration locale.

### 2.9 Menu de navigation

Remplacer les 4 items actuels avec emojis par des `TouchableOpacity` avec icônes Lucide :
- `Trophy` → Programme de fidélité
- `CalendarDays` → Mes réservations
- `Settings` → Paramètres
- `HelpCircle` → Aide & Support

Chaque item : fond `colors.surface`, borderRadius radius.card, padding 16, gap 12, `ChevronRight` 18px `colors.muted`

---

## 3. Reels — `app/(tabs)/reels.tsx`

### 3.1 Ce qui reste inchangé

L'écran Reels reste dark (#000 fond) — c'est correct pour un écran vidéo immersif. Aucun changement de thème.

### 3.2 Nettoyage TypeScript

Remplacer `item: any` et `isActive: boolean` par des types stricts :

```ts
interface ReelMedia {
  url: string;
  type: 'video' | 'image';
}

interface ReelAuthor {
  username: string;
  avatar?: string;
}

interface Reel {
  id: string;
  media?: ReelMedia[];
  caption?: string;
  hashtags?: string[];
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  author?: ReelAuthor;
}
```

### 3.3 Couleur hashtags

Changer `#C9A84C` (doré de l'ancien thème) → `colors.primary` (#E11D48) pour les hashtags.

### 3.4 Aucune autre modification

- Structure visuelle conservée
- Logique vidéo (shouldPlay, isLooping) conservée
- Pagination infinie conservée

---

## 4. Fichiers modifiés

| Action | Fichier |
|---|---|
| Modify | `apps/mobile/app/(tabs)/messages.tsx` |
| Modify | `apps/mobile/app/(tabs)/profile.tsx` |
| Modify | `apps/mobile/app/(tabs)/reels.tsx` |

Aucun nouveau composant partagé — tout reste co-localisé dans les fichiers de tab.
