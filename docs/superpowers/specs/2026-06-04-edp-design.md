# EDP – Design Spec : Feed · Fiche Établissement · Profil

**Date :** 2026-06-04
**Approche retenue :** B — Social-first Warm
**Périmètre :** Feed, Fiche Établissement, Profil Utilisateur
**Plateforme prioritaire :** Web (Next.js 15) + Mobile (React Native / Expo)
**Mode :** Light uniquement (MVP)

---

## 1. Design Tokens

### 1.1 Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `--color-primary` | `#E11D48` | CTA, likes, actions principales |
| `--color-primary-hover` | `#BE123C` | États hover/pressed |
| `--color-accent` | `#A16207` | Badges premium, étoiles, notes |
| `--color-accent-light` | `#FEF9C3` | Background badges avis, fidélité |
| `--color-background` | `#FFFFFF` | Fond principal |
| `--color-surface` | `#F9FAFB` | Cards, sections secondaires |
| `--color-foreground` | `#111827` | Texte principal |
| `--color-muted` | `#6B7280` | Texte secondaire, méta |
| `--color-border` | `#E5E7EB` | Séparateurs, contours |
| `--color-destructive` | `#DC2626` | Suppression, erreurs |
| `--color-success` | `#16A34A` | Établissement ouvert, confirmations |

### 1.2 Typographie

| Rôle | Police | Poids | Taille | Line-height |
|---|---|---|---|---|
| Hero / Nom établissement | Outfit | 800 | 32–40px | 1.1 |
| Titres sections | Outfit | 700 | 20–24px | 1.2 |
| Labels / Navigation | Outfit | 600 | 14px | 1.3 |
| Body / Descriptions | DM Sans | 400 | 15–16px | 1.6 |
| Méta (date, distance) | DM Sans | 400 | 12–13px | 1.4 |
| Prix (menu, stats) | DM Sans | 500 | 14–16px | 1.4 (tabular-nums) |

**Import Google Fonts :**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@600;700;800&display=swap');
```

**Tailwind config :**
```js
fontFamily: {
  heading: ['Outfit', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
}
```

### 1.3 Spacing & Radius

- **Grille de base :** 8px — tous les espacements sont multiples de 8 (8, 16, 24, 32, 48, 64)
- **Radius cards :** `16px`
- **Radius boutons :** `12px`
- **Radius pills / badges :** `999px`
- **Bottom nav height :** `64px` + safe area iOS (`padding-bottom: env(safe-area-inset-bottom)`)
- **Header height :** `56px`

### 1.4 Ombres

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
--shadow-card-hover: 0 4px 8px rgba(0,0,0,0.10), 0 12px 24px rgba(0,0,0,0.08);
--shadow-modal: 0 20px 60px rgba(0,0,0,0.20);
```

### 1.5 Animations

| Cas | Durée | Easing |
|---|---|---|
| Micro-interactions (like, press) | 150ms | ease-out |
| Transitions composants (tabs, accordion) | 200ms | ease-out |
| Transitions écran / modal | 300ms | ease-out |
| Entrée listes (stagger) | 30–50ms par item | ease-out |
| Spring mobile (Reanimated) | damping 15, stiffness 200 | spring |

- Hover cards web : `scale(1.01)` + ombre renforcée
- Press mobile : `scale(0.97)` + `opacity 0.88`, spring physics
- `prefers-reduced-motion` : désactiver toutes les animations non-essentielles

### 1.6 Icônes

- **Librairie :** Lucide React (web) / `@expo/vector-icons` Lucide (mobile)
- **Taille standard :** 20px (nav), 24px (actions), 16px (inline)
- **Stroke width :** 1.5px uniforme
- **Aucun emoji comme icône structurelle** (exception : bio utilisateur libre)

---

## 2. Feed

### 2.1 Structure

```
Header sticky (56px)
  Logo EDP (gauche) + Notifications + Recherche (droite)

Pills catégories (scroll horizontal, sans scrollbar visible)
  Tout | Restaurant | Bar | Hôtel | À proximité

Liste verticale infinie
  PostCard (ratio 4:5, pleine largeur)
  Row Reels (scroll horizontal snap, cards 9:16 ~120px de large)
  PostCard
  ...

Bottom nav (64px + safe area)
  Accueil | Découvrir | [+] | Reels | Profil
```

### 2.2 PostCard

- **Photo :** ratio 4:5, `object-fit: cover`, coins supérieurs radius 16px
- **Badge établissement :** bas-gauche, fond `rgba(255,255,255,0.85)` + blur 8px, texte `#111827`, Outfit 600 13px, radius 999px, padding 4px 10px
- **Gradient overlay :** `linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)` sur la photo — lisibilité du badge uniquement
- **Contenu sous photo :** Avatar (32px) + nom + timestamp · Description (2 lignes max, `line-clamp-2`) · Actions
- **Actions :** Heart (SVG Lucide), Comment, Bookmark, Share — espacement 20px entre icônes — Heart animé scale 1.3→1.0 (250ms spring) en rouge `#E11D48` quand liké

### 2.3 Row Reels

- Cards ratio 9:16, largeur `~120px`, gap `8px`
- Scroll horizontal avec `scroll-snap-type: x mandatory`
- Indicateur durée bas-droite : fond `rgba(0,0,0,0.55)`, texte blanc DM Sans 11px
- Icône play `▶` centre, taille 28px, fond `rgba(0,0,0,0.45)`

### 2.4 Pills catégories

- Fond repos : `#F3F4F6`, texte `#374151`, radius `999px`, padding `8px 16px`
- Actif : fond `#E11D48`, texte `#FFFFFF`
- Transition actif/repos : 150ms ease-out
- Scroll horizontal : `overflow-x: auto; scrollbar-width: none` (web) / `showsHorizontalScrollIndicator={false}` (mobile)
- Padding horizontal conteneur : 16px gauche/droite

### 2.5 Performance feed

- Virtualiser la liste avec `react-window` (web) / `FlashList` d'Expo (mobile) — obligatoire dès 50+ items
- Lazy load des images : `loading="lazy"` (web) / `<Image>` Expo avec `contentFit="cover"` (mobile)
- Skeleton shimmer pendant le chargement initial (3 PostCards placeholder)
- Pagination cursor-based côté API — pas de offset/limit

### 2.6 Bottom Navigation

| Position | Icône | Label | Route |
|---|---|---|---|
| 1 | Home (Lucide) | Accueil | `/feed` |
| 2 | Search (Lucide) | Découvrir | `/explore` |
| 3 | Plus (custom, 56px, fond `#E11D48`) | — | `/post/new` |
| 4 | Film (Lucide) | Reels | `/reels` |
| 5 | User (Lucide) | Profil | `/profile` |

- Actif : `#E11D48` | Inactif : `#9CA3AF`
- Labels DM Sans 10px sous les icônes (sauf bouton central)
- Bouton central légèrement surélevé (`margin-top: -12px`), shadow `0 4px 12px rgba(225,29,72,0.4)`

### 2.7 Navigation desktop (≥1024px — web uniquement)

- Bottom nav remplacé par une **sidebar gauche** (largeur 240px, sticky)
- Même 5 items + logo EDP en haut + lien Paramètres en bas
- Contenu principal : `margin-left: 240px`
- Breakpoint intermédiaire 768–1023px : sidebar condensée icônes seules (64px de large), labels en tooltip

---

## 3. Fiche Établissement

### 3.1 Structure

```
Header transparent → blanc opaque au scroll (seuil 80px, transition 200ms)
  ← Retour | Titre établissement (apparaît au scroll) | ⋯ + Bookmark

Hero galerie (100vw, ratio 16:9 web / 4:3 mobile)
  Swipe horizontal, dots pagination, bouton "+N photos" bas-droite

Bloc identité
  Nom (Outfit 800, 28px)
  Étoiles SVG (#A16207) + note + nb avis + distance
  Catégorie + ville
  Badge ouvert/fermé (point pulsant si ouvert)

CTA primaire "Réserver" (fond #E11D48) + "Itinéraire" (outline)

Tabs sticky : À propos | Menu | Avis | Photos

Contenu tab actif :
  À propos : description + chips infos (horaires, wifi, parking...)
  Menu : accordéon par catégorie + prix tabular-nums
  Avis : 3 avis affichés + carte + "Voir tous les avis"
  Photos : grille 3 colonnes

Carte Google Maps (hauteur fixe 200px, tap → app maps)
```

### 3.2 Galerie hero

- Swipe horizontal natif (mobile) / carrousel flèches (web)
- Dots pagination : actif `#E11D48`, inactif `rgba(255,255,255,0.6)`
- Bouton `+N photos` : fond `rgba(0,0,0,0.6)`, texte blanc, radius 8px, bas-droite avec margin 12px

### 3.3 Header adaptatif

- État 0 (top) : fond transparent, icônes blanches
- État scroll (≥80px) : fond blanc, ombres `--shadow-card`, icônes `#111827`, titre établissement fade-in
- Transition : `background 200ms ease-out, box-shadow 200ms ease-out`

### 3.4 Badge ouvert/fermé

- Ouvert : texte `#16A34A`, point SVG pulsant (animation `ping` Tailwind), "Ouvert · Ferme à 23h"
- Fermé : texte `#DC2626`, "Fermé · Ouvre demain à 12h"

### 3.5 CTA

- **Réserver** : fond `#E11D48`, texte blanc, Outfit 600, radius 12px, height 48px, flex-1 (mobile) / min-width 160px (web)
- **Itinéraire** : outline `#E5E7EB`, texte `#374151`, mêmes dimensions

### 3.6 Tabs sticky

- Se collent à `top: 56px` (hauteur header) au scroll
- Indicateur actif : barre `3px solid #E11D48` en bas du tab
- Fond blanc, border-bottom `1px solid #E5E7EB`

### 3.7 Menu accordion

- Section fermée : nom catégorie + fourchette prix alignée à droite + chevron Lucide
- Section ouverte : liste items (nom + description muted + prix), expand 200ms ease-out
- Prix : `tabular-nums`, DM Sans 500

### 3.8 Section avis

- Card avis : Avatar 40px + nom + étoiles SVG + date muted + texte avis (3 lignes, `line-clamp-3`)
- 3 avis affichés, bouton "Voir les X avis →" primary text color

---

## 4. Profil Utilisateur

### 4.1 Structure

```
Header sticky
  ← Retour | @username | ⋯

Bloc identité (padding 16px)
  Avatar (72px, border 2px #E11D48 si vérifié) + Nom (Outfit 700 18px) + @handle + ville
  Stats : Posts | Abonnés | Abonnements (Outfit 700, labels DM Sans 12px muted)
  Boutons : "Modifier profil" (propre) OU "Suivre" + "Message" (tiers)
  Badge fidélité : pill #FEF9C3 / #A16207, icône étoile SVG

Bio (DM Sans 400 14px, 2 lignes max)

Tabs icônes : Grid (posts) | Film (reels) | Bookmark (sauvegardés)

Grille posts : 3 colonnes, gap 2px, ratio 1:1
```

### 4.2 Avatar

- Taille 72px, `border-radius: 50%`
- Border `2px solid #E11D48` si compte vérifié
- Fallback : initiales (2 lettres) sur fond `#FEF2F2`, texte `#E11D48`, Outfit 700

### 4.3 Stats

- Chiffres : Outfit 700 20px `#111827`
- Labels : DM Sans 400 12px `#6B7280`
- Tap "Abonnés" / "Abonnements" → modal bottom-sheet liste

### 4.4 Boutons

- **Profil propre :** "Modifier profil" — outline `#E5E7EB`, texte `#374151`, radius 12px, full-width
- **Profil tiers :** "Suivre" (fond `#E11D48`, radius 12px) + "Message" (outline, radius 12px), côte à côte 50/50
- Post-follow : bouton "Suivre" → outline `#E11D48` + texte `#E11D48` + icône check, transition 150ms

### 4.5 Badge fidélité

| Grade | Points | Style |
|---|---|---|
| Bronze | 0 | pill `#FEF3C7` / `#92400E` |
| Silver | 500 | pill `#F1F5F9` / `#475569` |
| Gold | 2 000 | pill `#FEF9C3` / `#A16207` |
| Platinum | 10 000 | pill `#F0F9FF` / `#0369A1` |
| Diamond | 50 000 | pill `#FAF5FF` / `#7C3AED` |

### 4.6 Grille posts

- 3 colonnes, gap `2px`, ratio 1:1 (`aspect-ratio: 1`)
- Reels : icône ▶ bas-gauche (fond semi-transparent) + durée bas-droite
- Tap → modal plein-écran avec le post complet (swipe bas pour fermer)

### 4.7 Tabs grille

- Icônes Lucide uniquement (pas de texte), taille 22px
- Actif : `#E11D48` | Inactif : `#9CA3AF`
- `aria-label` obligatoire sur chaque tab (accessibilité)

---

## 5. Checklist pré-livraison

### Accessibilité (CRITICAL)
- [ ] Contraste texte ≥ 4.5:1 (primary text sur background)
- [ ] `aria-label` sur tous les boutons icône-only (bottom nav, tabs grille, actions feed)
- [ ] Focus rings visibles (outline `2px solid #E11D48`, offset 2px)
- [ ] Ordre de focus tab correspond à l'ordre visuel
- [ ] `prefers-reduced-motion` : toutes les animations désactivées

### Touch & Interaction
- [ ] Touch targets ≥ 44×44px sur tous les éléments interactifs
- [ ] Feedback visuel < 150ms sur chaque tap
- [ ] Safe areas iOS respectées (header, bottom nav, CTA Réserver)
- [ ] Aucun scroll horizontal involontaire

### Icônes & Assets
- [ ] Zéro emoji utilisé comme icône structurelle
- [ ] Toutes les icônes proviennent de Lucide (stroke 1.5px uniforme)
- [ ] Étoiles de notation en SVG couleur `#A16207`

### Responsive (web)
- [ ] Testé à 375px, 768px, 1024px, 1440px
- [ ] Bottom nav → sidebar/top nav à partir de 1024px
- [ ] Grille posts : 3 col mobile → 4 col tablet → 5 col desktop

### Tokens
- [ ] Aucune valeur hex codée en dur dans les composants (uniquement tokens CSS/Tailwind)
- [ ] `tabular-nums` sur tous les prix et statistiques
