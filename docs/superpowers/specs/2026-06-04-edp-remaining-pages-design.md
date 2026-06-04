# EDP — Pages Restantes : Spec Design

**Date :** 2026-06-04
**Design system :** Social-first Warm (identique à la spec précédente)
**Référence tokens :** `docs/superpowers/specs/2026-06-04-edp-design.md`
**Périmètre :** Explore, Post/New, Notifications, Messages, Reservations, Loyalty, Search, Settings, Auth (Login/Register)

---

## Tokens de référence (rappel)

```
--color-primary:    #E11D48  (rose)
--color-accent:     #A16207  (or)
--color-success:    #16A34A
--color-background: #FFFFFF
--color-surface:    #F9FAFB
--color-foreground: #111827
--color-muted:      #6B7280
--color-border:     #E5E7EB

font-heading: Outfit 600/700/800
font-sans:    DM Sans 400/500/700

radius-card: 16px | radius-button: 12px | radius-pill: 999px
spacing: multiples de 8px
```

---

## 1. Page Explore (`/explore`)

### Layout

```
Header sticky (56px)
  "Découvrir" (Outfit 700 18px) + icône filtre droite

SearchBar
  Input avec icône Search, fond surface, radius 12px, placeholder "Restaurants, bars, hôtels..."

Filtres type (pills horizontaux, scrollable)
  Tout | Restaurant | Bar | Hôtel | À proximité

Grille d'établissements
  Mobile: 2 colonnes | Desktop: 3-4 colonnes
  EstablishmentCard (voir section 1.1)
```

### 1.1 EstablishmentCard

```
┌─────────────────────────┐
│   PHOTO HERO (ratio 4:3) │
│   [Badge type pill]      │
└─────────────────────────┘
  Nom (Outfit 700 15px)
  ⭐ 4.8 · (342 avis) · 2km
  Paris · Ouvert
```

- Photo : ratio `4:3`, `object-fit: cover`, radius top `16px`
- Badge type : pill `bg-primary/10 text-primary` en bas-gauche de la photo
- Étoiles : SVG or `#A16207`
- Distance/ville : DM Sans 12px `text-muted`
- Card entière cliquable → `/establishment/[slug]`
- Hover web : scale(1.02) + shadow-card-hover

### 1.2 SearchBar

- Input height `44px`, fond `bg-surface`, border `border-border`, icône `Search` 16px à gauche
- On focus : `ring-2 ring-primary`
- Debounce 300ms sur la saisie → refetch

### 1.3 Empty state

- Icône SearchX (Lucide) 48px `text-muted`
- "Aucun résultat pour «{query}»"
- "Essayez un autre mot-clé ou changez les filtres"

---

## 2. Page Post/New (`/post/new`)

### Flow en 3 étapes

```
Étape 1 — Sélection média
Étape 2 — Détails
Étape 3 — Confirmation
```

### Étape 1 — Sélection média

```
Header : "← Nouvelle publication"

Zone dropzone (plein-écran moins header)
  Icône ImagePlus (48px, text-muted)
  "Glissez une photo ou vidéo ici"
  [Choisir depuis la galerie] (bouton primary outline)

Sélecteur type (pills en bas de zone)
  [Publication] [Reel] [Story]
```

- Drag-and-drop : border dashed `border-2 border-dashed border-border` → `border-primary` au drag-over
- Preview immédiate après sélection : image pleine zone avec bouton ×

### Étape 2 — Détails

```
Preview miniature (ratio 1:1, 120px) à gauche

Textarea caption
  Placeholder "Décrivez votre expérience..."
  max 2200 chars, compteur bas-droit

Input localisation
  Icône MapPin, autocomplete d'établissements

Hashtags
  Input avec suggestions, pills #hashtag suppressibles

[Publier] bouton primary pleine largeur
```

- Textarea : min-height 120px, resize none, fond surface
- Hashtag pills : `bg-primary/10 text-primary`, × pour supprimer

### Étape 3 — Confirmation

- Spinner centré + "Publication en cours..."
- Succès : check vert + "Publié ! Voir votre post →"
- Erreur : toast destructive + bouton "Réessayer"

---

## 3. Page Notifications (`/notifications`)

### Structure

```
Header sticky
  "Notifications" (Outfit 700 18px)
  Bouton "Tout marquer lu" (text-primary, à droite)

Tabs
  [Toutes] [Non lues]

Liste de notifications (virtualisée)
  NotifItem (voir 3.1)
```

### 3.1 NotifItem

```
[Avatar 40px] [Contenu] [Temps] [Point non-lu]
```

| Type | Icône | Texte |
|---|---|---|
| like | Heart rose | **@user** a aimé votre publication |
| comment | MessageCircle | **@user** a commenté : "..." |
| follow | UserPlus | **@user** vous suit maintenant |
| reservation | Calendar | Réservation confirmée chez **Le Meurice** |
| review | Star | **@user** a laissé un avis sur **votre resto** |
| loyalty | Trophy | Vous avez atteint le grade **Gold** ! |

- Point non-lu : `w-2 h-2 rounded-full bg-primary` à droite
- Item non-lu : fond `bg-primary/5`
- Tap → navigue vers l'action correspondante

---

## 4. Messages (`/messages`)

### 4.1 Liste des conversations (`/messages`)

Page manquante à créer :

```
Header sticky : "Messages"
Bouton "Nouveau message" (+ icon, primary, top-right)

SearchBar conversations
  Input "Rechercher..."

Liste conversations
  ConversationItem (voir 4.2)
```

### 4.2 ConversationItem

```
[Avatar 48px] [Nom + dernier message] [Temps + badge non-lu]
```

- Avatar 48px avec `ring-2 ring-green-400` si en ligne
- Nom : Outfit 600 15px
- Dernier message : DM Sans 400 13px `text-muted`, `line-clamp-1`
- Badge non-lu : pill `bg-primary text-white` taille 18px

### 4.3 Page conversation (`/messages/[userId]`)

```
Header sticky (56px)
  ← | [Avatar 36px] Nom | ⋯

Messages scrollables
  Message envoyé : bulle droite, fond primary, texte blanc, radius 16px 4px 16px 16px
  Message reçu : bulle gauche, fond surface, texte foreground, radius 4px 16px 16px 16px

Input zone (fixe en bas)
  [Input] [Bouton Envoyer (primary)]
```

- Bulles : max-width 75%, padding 10px 14px
- Timestamp : DM Sans 11px `text-muted` sous chaque groupe de messages
- Input : fond surface, height 44px, radius 999px

---

## 5. Page Réservations (`/reservations`)

### Structure

```
Header : "Mes réservations"

Tabs
  [À venir] [Passées] [Annulées]

Liste de réservations
  ReservationCard (voir 5.1)

Empty state si aucune
```

### 5.1 ReservationCard

```
┌──────────────────────────────────┐
│ [Logo 48px] Nom établissement    │
│            Catégorie · Ville     │
├──────────────────────────────────┤
│ 📅 Lundi 10 juin 2024 · 20h00   │
│ 👥 2 personnes                   │
│ [Badge statut]                   │
├──────────────────────────────────┤
│ [Annuler]              [Détails] │
└──────────────────────────────────┘
```

- Badge statut :
  - `PENDING` → `bg-yellow-50 text-yellow-700` "En attente"
  - `CONFIRMED` → `bg-green-50 text-green-700` "Confirmée"
  - `CANCELLED` → `bg-red-50 text-red-700` "Annulée"
- Bouton Annuler : outline destructive, uniquement sur statut PENDING/CONFIRMED
- Confirmation avant annulation : dialog "Confirmer l'annulation ?"

---

## 6. Page Fidélité (`/loyalty`)

### Structure

```
Header : "Programme de fidélité"

Carte grade actuel (hero card)
  Dégradé couleur selon grade
  Grade name + points + barre progression

Section "Prochains avantages"
  Points manquants pour grade suivant

Historique des points
  LoyaltyHistoryItem (date + action + points)

Classement
  Podium top 3 + liste rang utilisateur
```

### 6.1 Hero card grade

| Grade | Gradient | Texte |
|---|---|---|
| BRONZE | `from-amber-100 to-amber-200` | `text-amber-800` |
| SILVER | `from-slate-100 to-slate-200` | `text-slate-600` |
| GOLD | `from-yellow-50 to-amber-100` | `text-amber-700` |
| PLATINUM | `from-sky-50 to-sky-100` | `text-sky-700` |
| DIAMOND | `from-violet-50 to-purple-100` | `text-violet-700` |

- Carte : radius 20px, padding 24px, shadow-card
- Icône grade : étoile SVG 32px fill couleur accent
- Barre progression : `bg-border` + `bg-primary` fill animé

### 6.2 Historique

- Item : icône action + description + `+X pts` (text-success) ou `-X pts`
- Séparé par dates (sticky date header)

### 6.3 Classement

- Top 3 : podium avec médailles 🥇🥈🥉 (icônes SVG, pas emoji)
- Liste : rang numéroté + avatar + nom + points

---

## 7. Page Search (`/search`)

### Structure

```
Header sticky
  SearchBar pleine largeur (focus auto à l'ouverture)
  ← pour fermer

Tabs résultats
  [Établissements (N)] [Utilisateurs (N)]

Résultats établissements : EstablishmentCard (même que Explore)
Résultats utilisateurs : UserRow (voir 7.1)

Recent searches (si query vide)
  Chips avec × pour supprimer
```

### 7.1 UserRow

```
[Avatar 44px] [Nom + @handle] [Bouton Suivre/Suivi]
```

- Même style que profil : ring verified, badge grade
- Bouton Suivre : identique à la page Profil

---

## 8. Page Settings (`/settings`)

### Structure

```
Header : "Paramètres"

Section "Mon profil"
  Avatar avec bouton caméra overlay (primary)
  Inputs : Prénom, Nom, Nom d'utilisateur, Bio, Ville
  [Enregistrer les modifications]

Section "Compte"
  Email (read-only)
  [Changer le mot de passe]

Section "Notifications"
  Toggles : Likes, Commentaires, Nouveaux abonnés, Réservations
  (Switch Shadcn/UI)

Section "Confidentialité"
  Toggle : Compte privé

Section "Danger"
  [Supprimer mon compte] (outline destructive)
```

- Sections séparées par `border-t border-border + pt-6`
- Input style : identique au reste du design system
- Succès enregistrement : toast "Profil mis à jour"

---

## 9. Auth — Login (`/login`)

### Layout

Desktop split 50/50 : gauche = image hero (gradient + illustration), droite = formulaire
Mobile : formulaire centré pleine hauteur

### Formulaire

```
Logo EDP (Outfit 800, 32px, text-primary, centré)
"Connectez-vous à votre compte" (DM Sans 14px, text-muted)

Input Email
Input Mot de passe (avec toggle show/hide)

[Se connecter] (primary, pleine largeur, h-12)

Séparateur "ou"

[Continuer avec Google] (outline, icône)
[Continuer avec Facebook] (outline, icône)

"Pas encore de compte ? S'inscrire →"
```

- Fond : `bg-background`
- Erreur : toast destructive ou inline sous les champs
- Loading : bouton disabled + spinner

---

## 10. Auth — Register (`/register`)

### Layout

Même split desktop que login.

### Formulaire (2 étapes)

**Étape 1 — Type de compte**

```
"Créer un compte"

[Utilisateur particulier] ← carte sélectionnable
[Établissement / Restaurant] ← carte sélectionnable

[Continuer →]
```

**Étape 2 — Informations**

```
Prénom + Nom (si particulier) / Nom de l'établissement (si pro)
Email
Mot de passe (avec indicateur force)
Confirmer mot de passe

[Créer mon compte]

"Déjà un compte ? Se connecter →"
```

- Cartes type : border `2px solid border-border` → `border-primary` si sélectionnée
- Indicateur force mot de passe : 4 barres colorées (red → orange → yellow → green)

---

## Checklist pré-livraison (commune)

- [ ] Tokens CSS uniquement (aucune valeur hex en dur)
- [ ] Tous les boutons icône-only ont un `aria-label`
- [ ] Focus rings visibles (`ring-2 ring-primary`)
- [ ] Skeleton loading sur chaque page
- [ ] Empty states avec message et action
- [ ] Mobile first, testé 375px
- [ ] `font-heading` (Outfit) sur tous les titres/labels navigation
- [ ] `font-sans` (DM Sans) sur body/descriptions
