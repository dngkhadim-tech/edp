# DIAGNOSTIC VEYA — Rapport exhaustif
> Généré le 2026-06-26. Aucune modification de fichier n'a été effectuée.

---

## 0. RÉSUMÉ EXÉCUTIF

L'application souffre de **4 problèmes structurels** qui expliquent tous les symptômes décrits :

1. L'algorithme du feed filtre les posts de **plus de 7 jours** — les posts ne "disparaissent" pas, ils sont exclus par une requête SQL.
2. La clé `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` est **vide** en production (non configurée dans Railway), ce qui casse la carte et la section Découvrir.
3. La section "Découvrir" charge les restaurants **Google Places** centrés sur Paris par défaut (coordonnées hardcodées `{ lat: 48.8566, lng: 2.3522 }`).
4. Plusieurs boutons n'ont **aucun handler** (décoratifs) ou appellent des **endpoints backend inexistants**.

---

## 1. STACK & ARCHITECTURE

### Langages & frameworks

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 16.2.7, React 19, TypeScript, Tailwind CSS, Shadcn/Radix UI |
| État client | Zustand (auth), TanStack React Query (data-fetching) |
| Backend | NestJS 10, TypeScript, REST + WebSocket (Socket.io) |
| ORM | TypeORM 0.3 |
| Base de données | PostgreSQL 16 (extensions : uuid-ossp, earthdistance, cube, pg_trgm) |
| Cache | Redis via cache-manager-redis-yet |
| Stockage médias | **Supabase Storage** (bucket `edp-media`) — pas AWS S3 malgré ce qu'indique le README |
| Auth | JWT (access 7j / refresh 30j), OAuth Google/Facebook/Apple |
| Paiements | Stripe |
| Notifications push | Firebase Cloud Messaging (optionnel) |
| Email | Nodemailer/SMTP (Resend) |
| Monorepo | pnpm workspaces + Turborepo |

### Arborescence importante

```
veya/
├── apps/
│   ├── api/                         # NestJS — port 4000
│   │   └── src/
│   │       ├── main.ts              # Bootstrap : CORS, versioning, pipes
│   │       ├── app.module.ts        # Module racine — Redis, scheduler, events
│   │       ├── config/
│   │       │   └── database.config.ts
│   │       ├── database/
│   │       │   ├── entities/        # 9 entités TypeORM
│   │       │   ├── migrations/      # 001-initial-schema.ts
│   │       │   └── seeds/seed.ts    # 2 users + 5 établissements Paris/Lyon/Nice
│   │       └── modules/             # 19 modules NestJS
│   └── web/                         # Next.js — port 3000
│       └── src/
│           ├── app/
│           │   ├── (auth)/          # login, register, forgot-password, reset-password, verify-email, callback
│           │   ├── (main)/          # feed, explore, reels, map, place/[placeId], post/[id], post/new, profile/[username],
│           │   │                    # messages, messages/[userId], notifications, loyalty, reservations, settings, search
│           │   ├── (establishment)/ # dashboard
│           │   ├── admin/           # dashboard admin
│           │   └── api/             # Routes Next.js server-side
│           │       └── places/
│           │           ├── nearby/route.ts     # proxy → Google Places API (New) searchNearby
│           │           └── [placeId]/route.ts  # proxy → Google Places API (New) place detail
│           ├── components/
│           ├── lib/api.ts           # Axios instance + interceptors JWT auto-refresh
│           └── store/auth.store.ts  # Zustand persist
└── packages/shared/                 # Types partagés (enums, interfaces)
```

### Scripts de démarrage & boot en prod

```bash
# API (Railway)
npm run start  →  node dist/main   # port = env PORT (défaut 4000)

# Web (Railway)
npm run build  →  next build
npm run start  →  next start       # port 3000
```

**Boot API** :
1. Connexion PostgreSQL (parse manuelle de `DATABASE_URL` pour ignorer `sslmode`)
2. Connexion Redis (`REDIS_URL`) → si Redis indisponible → **crash au démarrage**
3. `synchronize: false` en prod, `migrationsRun: false` → schéma géré manuellement
4. Cors : uniquement `APP_URL` autorisé en prod
5. Global prefix `/api`, versioning URI `/v1` → routes `/api/v1/...`

Aucun fichier `railway.toml` ou `Procfile` trouvé → Railway auto-détecte depuis `package.json`.

### Variables d'environnement

#### API (apps/api/.env)

| Variable | Requis | Note |
|----------|--------|------|
| `NODE_ENV` | oui | doit être `production` en prod |
| `DATABASE_URL` | **critique** | PostgreSQL URL complète |
| `REDIS_URL` | **critique** | crash au boot si absent |
| `JWT_SECRET` | **critique** | |
| `JWT_EXPIRES_IN` | oui | ex: `7d` |
| `JWT_REFRESH_SECRET` | **critique** | |
| `JWT_REFRESH_EXPIRES_IN` | oui | ex: `30d` |
| `PORT` | non | défaut `4000` |
| `APP_URL` | **critique** | URL exacte du front Railway (CORS) |
| `API_URL` | non | usage interne |
| `SUPABASE_URL` | **critique** | ⚠️ ABSENT du .env.example — tout upload échoue si vide |
| `SUPABASE_SERVICE_KEY` | **critique** | ⚠️ ABSENT du .env.example |
| `GOOGLE_CLIENT_ID` | opt | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | opt | OAuth Google |
| `FACEBOOK_APP_ID` | opt | OAuth Facebook |
| `FACEBOOK_APP_SECRET` | opt | OAuth Facebook |
| `APPLE_CLIENT_ID` | opt | OAuth Apple |
| `APPLE_TEAM_ID` | opt | |
| `APPLE_KEY_ID` | opt | |
| `APPLE_PRIVATE_KEY` | opt | |
| `STRIPE_SECRET_KEY` | opt | paiements premium |
| `STRIPE_WEBHOOK_SECRET` | opt | |
| `STRIPE_PREMIUM_PRICE_ID` | opt | |
| `FIREBASE_PROJECT_ID` | opt | notifications push |
| `FIREBASE_PRIVATE_KEY` | opt | |
| `FIREBASE_CLIENT_EMAIL` | opt | |
| `SMTP_HOST` | opt | email vérification + reset mdp |
| `SMTP_PORT` | opt | |
| `SMTP_USER` | opt | |
| `SMTP_PASS` | opt | |
| `SMTP_FROM` | opt | |
| `GOOGLE_MAPS_API_KEY` | **critique** | lu côté serveur Next.js pour Places API |

#### Web (apps/web/.env / Railway)

| Variable | Requis | Note |
|----------|--------|------|
| `NEXT_PUBLIC_API_URL` | **critique** | URL de l'API Railway |
| `NEXT_PUBLIC_APP_URL` | non | |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | opt | OAuth Google front |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | **critique** | carte interactive (map page) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | opt | |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | opt | |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | opt | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | opt | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | opt | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | opt | |

**Variables manquantes / non documentées** :
- `SUPABASE_URL` et `SUPABASE_SERVICE_KEY` : **absentes du `.env.example`** mais lues dans `media.service.ts:17-18`. Si non configurées sur Railway → tous les uploads de photos/vidéos échouent.
- `GOOGLE_MAPS_API_KEY` (côté server Next.js) : présente dans `.env.example` mais vide dans `.env.local`. Lue dans `apps/web/src/app/api/places/nearby/route.ts:3` et `apps/web/src/app/api/places/[placeId]/route.ts:3`. Si vide → "À découvrir" et la fiche d'un lieu sont cassées.

---

## 2. INVENTAIRE DES BOUTONS / INTERACTIONS

### Page Login (`/login`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Afficher/masquer mdp | [login/page.tsx:55](apps/web/src/app/(auth)/login/page.tsx#L55) | `setShowPass` | toggle visibilité | ✅ |
| Connexion (submit) | [login/page.tsx:30](apps/web/src/app/(auth)/login/page.tsx#L30) | `onSubmit` → `login()` → `POST /auth/login` | connexion | ✅ |
| Mot de passe oublié | [login/page.tsx](apps/web/src/app/(auth)/login/page.tsx) | Link `/forgot-password` | navigation | ✅ |
| Google OAuth | [login/page.tsx](apps/web/src/app/(auth)/login/page.tsx) | lien `GET /api/v1/auth/google` | OAuth | ⚠️ dépend de `GOOGLE_CLIENT_ID` |
| Créer un compte | [login/page.tsx](apps/web/src/app/(auth)/login/page.tsx) | Link `/register` | navigation | ✅ |

### Page Feed (`/feed`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Tab "Pour toi" | [feed/page.tsx:174](apps/web/src/app/(main)/feed/page.tsx#L174) | `setTab('feed')` | affichage | ✅ |
| Tab "Reels" | [feed/page.tsx:184](apps/web/src/app/(main)/feed/page.tsx#L184) | `setTab('reels')` | affichage | ✅ |
| CategoryPills | [feed/page.tsx:130](apps/web/src/app/(main)/feed/page.tsx#L130) | `setCategory` | filtre | ✅ |
| Like (Reel) | [feed/page.tsx:42](apps/web/src/app/(main)/feed/page.tsx#L42) | `POST /posts/:id/like` | like | ✅ |
| Mute/démute (Reel) | [feed/page.tsx:55](apps/web/src/app/(main)/feed/page.tsx#L55) | `setMuted` | audio | ✅ |
| "Créer un Reel →" | [feed/page.tsx:90](apps/web/src/app/(main)/feed/page.tsx#L90) | Link `/post/new` | navigation | ✅ |
| "Réessayer" (erreur) | [feed/page.tsx:146](apps/web/src/app/(main)/feed/page.tsx#L146) | `refetch()` | rechargement | ✅ |

### Page Découvrir / Explore (`/explore`) — BUG MAJEUR

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| "Autour de moi" | [explore/page.tsx:89](apps/web/src/app/(main)/explore/page.tsx#L89) | `activateLocation()` → `navigator.geolocation` → `/api/places/nearby` | géolocalisation + places | ❌ Clé absente en prod |
| "Ma position" (désactiver) | [explore/page.tsx:80](apps/web/src/app/(main)/explore/page.tsx#L80) | `deactivateLocation()` | reset coords Paris | ✅ |
| Filtres (entonnoir) | [explore/page.tsx:101](apps/web/src/app/(main)/explore/page.tsx#L101) | **aucun onClick** | rien | ❌ Bouton décoratif |
| FilterPills (catégorie) | [explore/page.tsx:65](apps/web/src/app/(main)/explore/page.tsx#L65) | `setType` → requête Google Places | filtre | ✅ (si clé présente) |

### Page Carte (`/map`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Pills Tous/Restaurants/Hôtels/Bars | [map/page.tsx:91](apps/web/src/app/(main)/map/page.tsx#L91) | `setType` → `GET /establishments/nearby` | filtre | ✅ mais carte désactivée |
| Fermer fiche établissement | [map/page.tsx:111](apps/web/src/app/(main)/map/page.tsx#L111) | `setSelected(null)` | fermeture | ✅ |
| Carte Google Maps | [map/page.tsx:51](apps/web/src/app/(main)/map/page.tsx#L51) | Loader(`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) | affichage carte | ❌ clé vide → fallback texte |

### Page Profil (`/profile/[username]`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Retour | [profile/page.tsx:90](apps/web/src/app/(main)/profile/[username]/page.tsx#L90) | `router.back()` | navigation | ✅ |
| Plus d'options (⋯) | [profile/page.tsx:94](apps/web/src/app/(main)/profile/[username]/page.tsx#L94) | **aucun onClick** | rien | ❌ Décoratif |
| Compteur "abonnés" | [profile/page.tsx:116](apps/web/src/app/(main)/profile/[username]/page.tsx#L116) | **aucun onClick** | rien | ❌ Décoratif |
| Compteur "abonnements" | [profile/page.tsx:121](apps/web/src/app/(main)/profile/[username]/page.tsx#L121) | **aucun onClick** | rien | ❌ Décoratif |
| "Suivre" / "Abonné" | [profile/page.tsx:141](apps/web/src/app/(main)/profile/[username]/page.tsx#L141) | `handleFollow()` → `POST/DELETE /follows/users/:id` | follow/unfollow | ✅ |
| "Message" | [profile/page.tsx:152](apps/web/src/app/(main)/profile/[username]/page.tsx#L152) | Link `/messages/[profile.id]` | navigation | ✅ |
| "Modifier le profil" | [profile/page.tsx:131](apps/web/src/app/(main)/profile/[username]/page.tsx#L131) | Link `/settings` | navigation | ✅ |
| Tab Posts | [profile/page.tsx](apps/web/src/app/(main)/profile/[username]/page.tsx) | `setGridTab('posts')` | affichage | ✅ |
| Tab Reels | [profile/page.tsx](apps/web/src/app/(main)/profile/[username]/page.tsx) | `setGridTab('reels')` | affichage | ⚠️ affiche `posts?.data` pas les reels |
| Tab Sauvegardés | [profile/page.tsx](apps/web/src/app/(main)/profile/[username]/page.tsx) | `setGridTab('saved')` → `GET /users/me/saved` | affichage | ✅ |

### Page Nouveau Post (`/post/new`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Type Publication/Reel/Story | [post/new/page.tsx:60](apps/web/src/app/(main)/post/new/page.tsx#L60) | `setPostType` | sélection | ✅ |
| "Choisir depuis la galerie" | [post/new/page.tsx:76](apps/web/src/app/(main)/post/new/page.tsx#L76) | dropzone trigger | file picker | ✅ |
| Supprimer fichier (✕) | [post/new/page.tsx:87](apps/web/src/app/(main)/post/new/page.tsx#L87) | `removeFile()` | reset | ✅ |
| "Suivant" | [post/new/page.tsx:92](apps/web/src/app/(main)/post/new/page.tsx#L92) | `setStep('details')` | navigation | ✅ |
| Ajouter hashtag (Enter) | [post/new/page.tsx:143](apps/web/src/app/(main)/post/new/page.tsx#L143) | `addHashtag()` | ajout | ✅ |
| Supprimer hashtag | [post/new/page.tsx](apps/web/src/app/(main)/post/new/page.tsx) | `removeHashtag(tag)` | suppression | ✅ |
| "Retour" | [post/new/page.tsx:159](apps/web/src/app/(main)/post/new/page.tsx#L159) | `setStep('media')` | navigation | ✅ |
| "Publier" | [post/new/page.tsx:162](apps/web/src/app/(main)/post/new/page.tsx#L162) | `handlePublish()` → `POST /posts` + Supabase upload | publication | ❌ échoue si SUPABASE_URL vide |

### Page Détail Post (`/post/[id]`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Retour | [post/[id]/page.tsx](apps/web/src/app/(main)/post/[id]/page.tsx) | `router.back()` | navigation | ✅ |
| Like (cœur) | [post/[id]/page.tsx:68](apps/web/src/app/(main)/post/[id]/page.tsx#L68) | `handleLike()` → `POST /posts/:id/like` | like | ✅ |
| Sauvegarder | [post/[id]/page.tsx:74](apps/web/src/app/(main)/post/[id]/page.tsx#L74) | `handleSave()` → `POST/DELETE /posts/:id/save` | save | ✅ |
| Envoyer commentaire | [post/[id]/page.tsx:57](apps/web/src/app/(main)/post/[id]/page.tsx#L57) | `commentMutation` → `POST /posts/:id/comments` | commentaire | ✅ |

### Page Réservations (`/reservations`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Tabs À venir/Passées/Annulées | [reservations/page.tsx](apps/web/src/app/(main)/reservations/page.tsx) | RadixUI Tabs | filtre | ✅ |
| "Annuler" | [reservations/page.tsx:84](apps/web/src/app/(main)/reservations/page.tsx#L84) | `setDialogOpen(true)` | ouvre dialog | ✅ |
| "Confirmer l'annulation" | [reservations/page.tsx:118](apps/web/src/app/(main)/reservations/page.tsx#L118) | `onCancel(res.id)` → `PATCH /reservations/:id/cancel` | annulation | ✅ |
| "Détails" | [reservations/page.tsx:125](apps/web/src/app/(main)/reservations/page.tsx#L125) | **aucun onClick ni href** | rien | ❌ Bouton décoratif |
| "Explorer" (état vide) | [reservations/page.tsx](apps/web/src/app/(main)/reservations/page.tsx) | link `/explore` | navigation | ✅ |

### Page Paramètres (`/settings`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Changer avatar (camera) | [settings/page.tsx:57](apps/web/src/app/(main)/settings/page.tsx#L57) | `fileRef.current.click()` → `PATCH /users/me/avatar` | upload Supabase | ❌ échoue si SUPABASE vide |
| "Enregistrer les modifications" | [settings/page.tsx:79](apps/web/src/app/(main)/settings/page.tsx#L79) | `PATCH /users/me` | mise à jour profil | ✅ |
| "Changer le mot de passe" | [settings/page.tsx](apps/web/src/app/(main)/settings/page.tsx) | `router.push('/forgot-password')` | navigation | ✅ |
| Toggles notifications (4) | [settings/page.tsx](apps/web/src/app/(main)/settings/page.tsx) | `setNotifs(...)` | local state seulement | ❌ Jamais persisté en API |
| Toggle "Compte privé" | [settings/page.tsx](apps/web/src/app/(main)/settings/page.tsx) | `setPrivateAccount` | local state seulement | ❌ Jamais persisté en API |
| "Supprimer mon compte" | [settings/page.tsx:110](apps/web/src/app/(main)/settings/page.tsx#L110) | `DELETE /users/me` | suppression | ❌ Endpoint inexistant côté API |

### Page Messages (`/messages`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| "Nouveau message" (stylo) | [messages/page.tsx:42](apps/web/src/app/(main)/messages/page.tsx#L42) | **aucun onClick** | rien | ❌ Décoratif |
| Barre de recherche | [messages/page.tsx:38](apps/web/src/app/(main)/messages/page.tsx#L38) | `setSearch` | filtre local | ✅ |
| Lien conversation | [messages/page.tsx](apps/web/src/app/(main)/messages/page.tsx) | Link `/messages/[conv.userId]` | navigation | ✅ |

### Page Conversation (`/messages/[userId]`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Retour | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | Link `/messages` | navigation | ✅ |
| Appel vocal (téléphone) | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | **aucun onClick** | rien | ❌ Décoratif |
| Appel vidéo | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | **aucun onClick** | rien | ❌ Décoratif |
| Options (⋯) | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | **aucun onClick** | rien | ❌ Décoratif |
| Envoyer message | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | `sendMessage()` → `socket.emit('send_message', ...)` | envoi | ✅ |
| Appuyer Entrée | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | `sendMessage()` | envoi | ✅ |

### Page Recherche (`/search`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Recherche (saisie) | [search/page.tsx](apps/web/src/app/(main)/search/page.tsx) | `handleChange` + `handleSubmit` | search | ✅ |
| Supprimer récent | [search/page.tsx](apps/web/src/app/(main)/search/page.tsx) | `handleRemoveRecent` | localStorage | ✅ |
| "Suivre" (dans résultats) | [search/page.tsx](apps/web/src/app/(main)/search/page.tsx) | `onClick={(e) => e.preventDefault()}` | **rien — bloque la nav** | ❌ Handler vide intentionnel cassé |
| Lien profil | [search/page.tsx](apps/web/src/app/(main)/search/page.tsx) | Link `/profile/[username]` | navigation | ✅ |

### Page Fiche lieu (`/place/[placeId]`)

| Bouton | Fichier:ligne | Handler | Action | État |
|--------|--------------|---------|--------|------|
| Retour | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | `router.back()` | navigation | ✅ |
| "Réserver" | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | `setShowReservation(true)` | ouvre modal | ✅ |
| "Itinéraire" | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | lien externe Google Maps | navigation externe | ✅ |
| "Voir tout" horaires | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | `setHoursExpanded` | toggle | ✅ |
| Tabs Google / VEYA | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | `setTab` | affichage | ✅ |
| Confirmer réservation | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | `handleReserve()` → `POST /reservations` | réservation | ✅ si établissement dans VEYA |
| − / + personnes | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | `setResGuests` | counter | ✅ |

### Tableau récapitulatif — boutons cassés

| Bouton | Page | Fichier:ligne | Devrait faire | État | Cause probable |
|--------|------|--------------|---------------|------|----------------|
| "Autour de moi" | /explore | [explore/page.tsx:89](apps/web/src/app/(main)/explore/page.tsx#L89) | Géoloc + Places API | ❌ Critique | `GOOGLE_MAPS_API_KEY` vide → 500 |
| Filtres (entonnoir) | /explore | [explore/page.tsx:101](apps/web/src/app/(main)/explore/page.tsx#L101) | Ouvrir panneau filtres | ❌ Mineur | Pas d'onClick ni de state |
| Carte Google Maps | /map | [map/page.tsx:51](apps/web/src/app/(main)/map/page.tsx#L51) | Afficher carte interactive | ❌ Critique | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` vide |
| Plus d'options (⋯) profil | /profile | [profile/page.tsx:94](apps/web/src/app/(main)/profile/[username]/page.tsx#L94) | Partager/signaler | ❌ Mineur | Pas d'onClick |
| Compteur abonnés | /profile | [profile/page.tsx:116](apps/web/src/app/(main)/profile/[username]/page.tsx#L116) | Voir liste abonnés | ❌ Mineur | Pas d'onClick ni de route |
| Compteur abonnements | /profile | [profile/page.tsx:121](apps/web/src/app/(main)/profile/[username]/page.tsx#L121) | Voir liste abonnements | ❌ Mineur | Pas d'onClick ni de route |
| Tab "Reels" profil | /profile | [profile/page.tsx](apps/web/src/app/(main)/profile/[username]/page.tsx) | Afficher reels du user | ⚠️ Majeur | Affiche `posts.data` au lieu des reels |
| "Détails" réservation | /reservations | [reservations/page.tsx:125](apps/web/src/app/(main)/reservations/page.tsx#L125) | Voir détail | ❌ Mineur | Pas d'onClick ni de route |
| Toggles notifs (×4) | /settings | [settings/page.tsx](apps/web/src/app/(main)/settings/page.tsx) | Sauvegarder préférences | ❌ Majeur | Local state, jamais envoyé à l'API |
| Toggle "Compte privé" | /settings | [settings/page.tsx](apps/web/src/app/(main)/settings/page.tsx) | Compte privé | ❌ Majeur | Local state, jamais envoyé à l'API |
| "Supprimer mon compte" | /settings | [settings/page.tsx:110](apps/web/src/app/(main)/settings/page.tsx#L110) | Supprimer compte | ❌ Majeur | `DELETE /users/me` n'existe pas côté API |
| Changer avatar | /settings | [settings/page.tsx:57](apps/web/src/app/(main)/settings/page.tsx#L57) | Uploader avatar | ❌ Majeur | Supabase non configuré → "Upload failed" |
| "Publier" post | /post/new | [post/new/page.tsx:162](apps/web/src/app/(main)/post/new/page.tsx#L162) | Publier avec média | ❌ Majeur | Supabase non configuré → erreur upload |
| "Nouveau message" | /messages | [messages/page.tsx:42](apps/web/src/app/(main)/messages/page.tsx#L42) | Démarrer conversation | ❌ Mineur | Pas d'onClick |
| Appel vocal | /messages/[id] | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | Appel audio | ❌ Mineur | Décoration, pas implémenté |
| Appel vidéo | /messages/[id] | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | Appel vidéo | ❌ Mineur | Décoration, pas implémenté |
| Options conversation (⋯) | /messages/[id] | [messages/[userId]/page.tsx](apps/web/src/app/(main)/messages/[userId]/page.tsx) | Options | ❌ Mineur | Pas d'onClick |
| "Suivre" dans résultats recherche | /search | [search/page.tsx](apps/web/src/app/(main)/search/page.tsx) | Suivre un utilisateur | ❌ Majeur | `onClick={(e) => e.preventDefault()}` bloque tout |

---

## 3. LE FEED QUI "DISPARAÎT" (Bug n°2)

### D'où vient le contenu du feed ?

Le feed "Pour toi" appelle `GET /api/v1/feed` → `FeedService.getPersonalizedFeed()` → requête TypeORM sur la table `posts` (PostgreSQL).

**Les posts sont stockés durablement : OUI.** Ils sont en base PostgreSQL, persistants entre redémarrages.

### Cycle de vie d'un post

1. **Création** : `POST /api/v1/posts` avec multipart/form-data (fichier + métadonnées)
2. **Upload média** : `MediaService.uploadFile()` → Supabase Storage bucket `edp-media` → URL publique permanente
3. **Stockage BDD** : insert dans table `posts` avec `created_at = NOW()` et `expires_at = NULL` (ou `NOW() + 24h` si Story)
4. **Affichage** : `FeedService.getPersonalizedFeed()` filtre et classe les posts

### La vraie raison de la "disparition"

**Filtre temporel de 7 jours dans `feed.service.ts:27-28`** :

```typescript
// apps/api/src/modules/feed/feed.service.ts — ligne 27
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
qb.andWhere('p.created_at > :sevenDaysAgo', { sevenDaysAgo });
```

→ **Tout post de plus de 7 jours est exclu du feed "Pour toi"**. Les posts ne sont pas supprimés, ils sont toujours en base, mais la requête les ignore.

**Deuxième filtre bloquant** (ligne 32-35) : si l'utilisateur ne suit personne, la condition est :

```typescript
'(p.author_id IN (:...ids) OR p.establishment_id IN (:...ids) OR p.views_count > 1000)'
```

→ Un nouveau post non suivi doit avoir **plus de 1000 vues** pour apparaître dans le feed. Un post fraîchement créé (0 vues) par quelqu'un que l'on ne suit pas n'apparaît jamais.

**Feed Explore** (`/feed/explore`) : filtre `p.views_count > 0` — un post fraîchement créé (0 vues) n'apparaît pas non plus dans Explore.

### Résumé

| Question | Réponse |
|----------|---------|
| Posts stockés durablement ? | **OUI** — PostgreSQL |
| Pourquoi "disparaissent" après quelques jours ? | Filtre `created_at > NOW() - 7 days` dans `feed.service.ts:28` |
| Y a-t-il un cron de purge ? | **NON** — ScheduleModule chargé mais aucun `@Cron` trouvé dans le code |
| Cache TTL ? | Redis TTL = 60 secondes seulement (`apps/api/src/app.module.ts:44`) — négligeable |
| Données perdues au redéploiement Railway ? | **NON** — Railway conserve le volume PostgreSQL |

---

## 4. "AUTOUR DE MOI" + GOOGLE MAPS (Bug n°3)

### Bouton "Autour de moi" — Page `/explore`

**Code** : [explore/page.tsx:26-37](apps/web/src/app/(main)/explore/page.tsx#L26)

```typescript
function activateLocation() {
  if (!navigator.geolocation) return;
  setLocating(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setUsingRealLocation(true);
      setLocating(false);
    },
    () => setLocating(false),
    { timeout: 8000 },
  );
}
```

La géolocalisation browser est correctement implémentée. HTTPS est requis (OK sur Railway). Le problème est **en aval** :

1. Une fois les coords obtenues, la page fait `fetch('/api/places/nearby?lat=...&lng=...')`.
2. Cette Next.js route server-side lit la clé : `const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''` — [nearby/route.ts:3](apps/web/src/app/api/places/nearby/route.ts#L3)
3. Si `API_KEY === ''` → retourne `{ error: 'API key not configured', status: 500 }`.
4. TanStack Query voit un `!r.ok` → `Promise.reject(e)` → `isError = true`.
5. L'UI affiche "Impossible de charger les établissements".

### Carte — Page `/map`

**Code** : [map/page.tsx:51](apps/web/src/app/(main)/map/page.tsx#L51)

```typescript
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!apiKey || apiKey === '') { setMapError(true); return; }
```

Si la variable est vide → `mapError = true` → fallback texte "Carte non disponible. Configurez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY".

La carte utilise `@googlemaps/js-api-loader` avec `libraries: ['places']` — [map/page.tsx:53](apps/web/src/app/(main)/map/page.tsx#L53). Elle affiche les **établissements VEYA** (endpoint `/establishments/nearby`), pas les données Google Places.

### APIs Google requises

| API | Usage | Endpoint appelé |
|-----|-------|----------------|
| **Places API (New)** | Recherche à proximité | `places.googleapis.com/v1/places:searchNearby` |
| **Places API (New)** | Détail d'un lieu | `places.googleapis.com/v1/places/:id` |
| **Maps JavaScript API** | Carte interactive | chargée via `js-api-loader` |

### Checklist de causes probables

| Cause | Fichier:ligne | Gravité |
|-------|--------------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` vide en prod | [map/page.tsx:51](apps/web/src/app/(main)/map/page.tsx#L51) | **Critique** |
| `GOOGLE_MAPS_API_KEY` vide en prod (server-side) | [nearby/route.ts:3](apps/web/src/app/api/places/nearby/route.ts#L3) | **Critique** |
| Places API (New) pas activée dans Google Cloud Console | — | Probable |
| Restriction de domaine sur la clé bloquant Railway | — | À vérifier |
| Quota dépassé | — | Possible |

---

## 5. SECTION "DÉCOUVRIR" — Données Paris (Bug n°4)

### D'où viennent les restaurants/bars de Paris ?

La section "Découvrir" (`/explore`) appelle `/api/places/nearby` avec des coordonnées. La valeur **initiale** de `coords` est :

```typescript
// apps/web/src/app/(main)/explore/page.tsx — ligne 19
const PARIS = { lat: 48.8566, lng: 2.3522 };

// ligne 21
const [coords, setCoords] = useState(PARIS);
```

Au premier rendu, le composant tente également d'activer automatiquement la géolocalisation si la permission est déjà accordée :

```typescript
// ligne 23-27
useEffect(() => {
  navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
    if (result.state === 'granted') activateLocation();
  });
}, []);
```

→ Si la permission n'est **pas** déjà accordée (première visite), `coords` reste `PARIS` et la requête Google Places cherche des restaurants autour de `lat=48.8566, lng=2.3522` → Paris.

**Ce ne sont pas des données en base VEYA. Ce sont de vraies données Google Places (temps réel) centrées sur Paris.**

### Lien avec les données seedées

Le fichier `apps/api/src/database/seeds/seed.ts` insère 5 établissements fictifs (Le Grand Bistrot, Hôtel Lumière, Bar Negroni, Sushi Masaki, Villa Azur) dans la table `establishments`. Ces établissements apparaissent sur la **carte** (`/map`) via `GET /establishments/nearby`, mais **pas** dans "Découvrir" qui interroge Google Places.

**Fichier+ligne exact** : [seed.ts:26-80](apps/api/src/database/seeds/seed.ts#L26)

### Pour les retirer sans les modifier (explication seulement)

**Données Google Places (Découvrir)** : changer `const PARIS = { lat: 48.8566, lng: 2.3522 }` en page Explore pour une autre ville, ou ne pas lancer la requête tant que l'utilisateur n'a pas activé la géolocalisation (ne pas faire de fetch avec les coords par défaut).

**Établissements seedés (carte /map)** : exécuter `DELETE FROM establishments WHERE slug IN ('le-grand-bistrot', 'hotel-lumiere', 'bar-negroni', 'sushi-masaki', 'villa-azur')` en base Railway, ou ne pas relancer le seed.

---

## 6. DONNÉES & BACKEND

### Schéma de base de données

| Table | Colonnes clés | Relations |
|-------|--------------|-----------|
| `users` | id, email, username, password, role (USER/ESTABLISHMENT/ADMIN), loyalty_grade, loyalty_points, email_verified | — |
| `establishments` | id, user_id, name, slug, type, latitude, longitude, address, average_rating, is_verified, is_premium | → users |
| `posts` | id, author_id, author_type, establishment_id, type (PHOTO/VIDEO/REEL/STORY/REVIEW/PROMOTION), media (JSONB), expires_at | → users, establishments |
| `reviews` | id, user_id, establishment_id, rating, content, is_flagged | → users, establishments (UNIQUE user+establishment) |
| `reservations` | id, user_id, establishment_id, type (RESTAURANT/HOTEL), status, details (JSONB) | → users, establishments |
| `follows` | id, follower_id, following_id, following_type | → users |
| `loyalty_transactions` | id, user_id, action, points, description | → users |
| `messages` | id, conversation_id, sender_id, receiver_id, content, is_read, is_deleted | → users |
| `notifications` | id, user_id, actor_id, type, message, is_read | → users |

**Note** : la migration `001-initial-schema.ts` ne crée PAS les colonnes `verification_token`, `verification_token_expiry`, `password_reset_token`, `password_reset_expiry` dans `users`. Ces colonnes existent dans l'entité TypeORM mais seront créées uniquement si `synchronize: true` (dev) ou si une migration supplémentaire est lancée en prod. En prod (`synchronize: false`, `migrationsRun: false`), la vérification email et le reset de mot de passe crashent sur ces colonnes.

### Routes API complètes

**Auth** `@Controller('auth')`

| Méthode | Route | Fichier:ligne |
|---------|-------|--------------|
| POST | `/api/v1/auth/register` | [auth.controller.ts:22](apps/api/src/modules/auth/auth.controller.ts#L22) |
| POST | `/api/v1/auth/login` | [auth.controller.ts:29](apps/api/src/modules/auth/auth.controller.ts#L29) |
| POST | `/api/v1/auth/refresh` | [auth.controller.ts:36](apps/api/src/modules/auth/auth.controller.ts#L36) |
| GET | `/api/v1/auth/google` | [auth.controller.ts:41](apps/api/src/modules/auth/auth.controller.ts#L41) |
| GET | `/api/v1/auth/google/callback` | [auth.controller.ts:46](apps/api/src/modules/auth/auth.controller.ts#L46) |
| GET | `/api/v1/auth/facebook` | [auth.controller.ts:55](apps/api/src/modules/auth/auth.controller.ts#L55) |
| GET | `/api/v1/auth/facebook/callback` | [auth.controller.ts:60](apps/api/src/modules/auth/auth.controller.ts#L60) |
| GET | `/api/v1/auth/me` | [auth.controller.ts:69](apps/api/src/modules/auth/auth.controller.ts#L69) |
| POST | `/api/v1/auth/verify-email` | [auth.controller.ts:76](apps/api/src/modules/auth/auth.controller.ts#L76) |
| POST | `/api/v1/auth/resend-verification` | [auth.controller.ts:82](apps/api/src/modules/auth/auth.controller.ts#L82) |
| POST | `/api/v1/auth/forgot-password` | [auth.controller.ts:88](apps/api/src/modules/auth/auth.controller.ts#L88) |
| POST | `/api/v1/auth/reset-password` | [auth.controller.ts:94](apps/api/src/modules/auth/auth.controller.ts#L94) |

**Users** `@Controller('users')`

| Méthode | Route | Fichier:ligne |
|---------|-------|--------------|
| GET | `/api/v1/users/me` | [users.controller.ts:22](apps/api/src/modules/users/users.controller.ts#L22) |
| PATCH | `/api/v1/users/me` | [users.controller.ts:28](apps/api/src/modules/users/users.controller.ts#L28) |
| PATCH | `/api/v1/users/me/avatar` | [users.controller.ts:35](apps/api/src/modules/users/users.controller.ts#L35) |
| GET | `/api/v1/users/:username` | [users.controller.ts:44](apps/api/src/modules/users/users.controller.ts#L44) |
| GET | `/api/v1/users/:id/followers` | [users.controller.ts:51](apps/api/src/modules/users/users.controller.ts#L51) |
| GET | `/api/v1/users/:id/following` | [users.controller.ts:58](apps/api/src/modules/users/users.controller.ts#L58) |
| PATCH | `/api/v1/users/me/fcm-token` | [users.controller.ts:65](apps/api/src/modules/users/users.controller.ts#L65) |
| **DELETE** | **`/api/v1/users/me`** | **MANQUANT** |

**Posts** `@Controller('posts')`

| Méthode | Route | Note |
|---------|-------|------|
| POST | `/api/v1/posts` | multipart/form-data |
| GET | `/api/v1/posts/trending` | |
| GET | `/api/v1/posts/stories` | |
| GET | `/api/v1/posts/hashtag/:tag` | |
| GET | `/api/v1/posts/:id` | |
| DELETE | `/api/v1/posts/:id` | softDelete (⚠️ voir section 7) |
| POST | `/api/v1/posts/:id/view` | |
| GET | `/api/v1/posts/user/:userId` | |
| GET | `/api/v1/posts/establishment/:estId` | |
| **GET** | **`/api/v1/posts?establishmentId=...`** | **MANQUANT** — appelé par place/[placeId]/page.tsx |

**Interactions** `@Controller()` (sans préfixe)

| Méthode | Route |
|---------|-------|
| POST | `/api/v1/posts/:id/like` |
| POST | `/api/v1/posts/:id/save` |
| GET | `/api/v1/posts/:id/likes` |
| GET | `/api/v1/posts/:id/comments` |
| POST | `/api/v1/posts/:id/comments` |
| DELETE | `/api/v1/comments/:id` |
| POST | `/api/v1/comments/:id/like` |
| GET | `/api/v1/users/me/saved` |

**Establishments** `@Controller('establishments')`

| Méthode | Route |
|---------|-------|
| POST | `/api/v1/establishments` |
| GET | `/api/v1/establishments/mine` |
| GET | `/api/v1/establishments/search` |
| GET | `/api/v1/establishments/nearby` |
| GET | `/api/v1/establishments/featured` |
| GET | `/api/v1/establishments/:slug` |
| PATCH | `/api/v1/establishments/:id` |

**Feed** `@Controller('feed')`

| Méthode | Route |
|---------|-------|
| GET | `/api/v1/feed` |
| GET | `/api/v1/feed/explore` |
| GET | `/api/v1/feed/reels` |

**Autres modules** (résumé)

| Module | Routes clés |
|--------|------------|
| Reviews | POST/GET/DELETE `/reviews`, GET `/reviews/establishment/:id` |
| Reservations | POST `/reservations`, GET `/reservations/me`, PATCH `/reservations/:id/confirm`, PATCH `/reservations/:id/cancel` |
| Follows | POST/DELETE `/follows/users/:id`, POST/DELETE `/follows/establishments/:id` |
| Messages | GET `/messages`, GET `/messages/:userId`, GET `/messages/unread` |
| Notifications | GET `/notifications`, GET `/notifications/unread-count`, PATCH `/notifications/read-all` |
| Loyalty | GET `/loyalty/history`, GET `/loyalty/leaderboard` |
| Payments | POST `/payments/premium/checkout`, POST `/payments/webhook` |
| Admin | GET `/admin/dashboard`, GET/PATCH `/admin/users`, PATCH `/admin/establishments/:id/verify`, GET/DELETE `/admin/reviews/flagged/:id` |
| Media | POST `/media/presigned-url` |
| Search | GET `/search` |

### Endpoints appelés par le front mais inexistants côté API

| Appel frontend | Route | Fichier:ligne | Verdict |
|---------------|-------|--------------|---------|
| `api.delete('/users/me')` | `DELETE /api/v1/users/me` | [settings/page.tsx:110](apps/web/src/app/(main)/settings/page.tsx#L110) | **404 — manquant** |
| `api.get('/posts', { params: { establishmentId } })` | `GET /api/v1/posts?establishmentId=...` | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | **Mauvaise route** — doit être `/posts/establishment/:id` |
| `api.get('/reels', { params: { establishmentId } })` | `GET /api/v1/reels` | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | **404 — aucun controller /reels** |

### Problème CORS

```typescript
// apps/api/src/main.ts — lignes 8-12
const allowedOrigins = [
  configService.get('APP_URL', 'http://localhost:3000'),
  ...(isProd ? [] : ['http://localhost:3001']),
];
```

En production, **seule `APP_URL`** est autorisée. Si `APP_URL` sur Railway ne correspond pas exactement à l'URL du frontend (ex: avec/sans slash final, http vs https), toutes les requêtes API depuis le front sont bloquées par CORS → boutons ne réagissent pas, page blanche.

---

## 7. ERREURS & SANTÉ

### Erreurs critiques identifiées dans le code

**1. softDelete sans @DeleteDateColumn**

```typescript
// apps/api/src/modules/posts/posts.service.ts:63
await this.postRepo.softDelete(id);
```

`PostEntity` n'a pas de décorateur `@DeleteDateColumn()`. TypeORM `softDelete()` requiert cette colonne. Sans elle, TypeORM lance une erreur `"Entity does not have delete date column"`. La suppression de post crash côté API.

**2. Redis obligatoire au démarrage**

```typescript
// apps/api/src/app.module.ts:40-46
CacheModule.registerAsync({
  store: redisStore,
  url: config.get('REDIS_URL', 'redis://localhost:6379'),
})
```

Si Redis est indisponible ou que `REDIS_URL` pointe vers un service inexistant → l'API **refuse de démarrer**. Railway doit avoir une instance Redis provisionnée et la variable `REDIS_URL` configurée.

**3. SUPABASE non documenté**

`SUPABASE_URL` et `SUPABASE_SERVICE_KEY` sont lus dans [media.service.ts:17-18](apps/api/src/modules/media/media.service.ts#L17) mais **absents du `.env.example`**. Si non configurés → `supabase.storage.from('edp-media').upload(...)` retourne une erreur → tout upload de média échoue silencieusement du point de vue utilisateur (toast "Erreur de publication").

**4. Colonnes manquantes en migration**

La migration `001-initial-schema.ts` ne crée pas les colonnes suivantes qui existent dans l'entité `UserEntity` :
- `verification_token`
- `verification_token_expiry`
- `password_reset_token`
- `password_reset_expiry`

En prod (`synchronize: false`), ces colonnes n'existent pas → `POST /auth/verify-email` et `POST /auth/forgot-password` crashent avec une erreur PostgreSQL "column does not exist".

**5. postsCount non décrémenté à la suppression**

`postsCount` dans `users` est incrémenté à la création d'un post mais jamais décrémenté. En plus, `softDelete` crash (voir point 1). Ces deux bugs font que `postsCount` affiche une valeur incorrecte sur le profil.

**6. Paramètre `params` non utilisé dans ConversationPage**

```typescript
// apps/web/src/app/(main)/messages/[userId]/page.tsx:38
export default function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = params as unknown as { userId: string };
```

Next.js 15 retourne `params` comme une `Promise` — l'accès direct sans `await` ou `use(params)` peut retourner `undefined` en production. Le `as unknown as` masque l'erreur TypeScript.

**7. try/catch silencieux sur les likes/saves**

```typescript
// PinCard.tsx, PostPage.tsx, etc.
await api.post(`/posts/${post.id}/like`).catch(() => {});
```

Les erreurs réseau sur les likes sont avalées silencieusement. L'utilisateur ne voit aucun feedback en cas d'échec.

**8. OAuth callback hardcodé**

```typescript
// apps/api/src/modules/auth/auth.controller.ts:49
const appUrl = process.env.APP_URL || 'https://web-production-872e1.up.railway.app';
```

L'URL Railway est hardcodée en fallback. Si le déploiement change d'URL (nouveau service Railway), le callback OAuth ne redirigera pas vers le bon domaine.

---

## 8. SYNTHÈSE FINALE

### Top problèmes — triés par gravité

| # | Symptôme | Cause racine | Fichier:ligne | Piste de correction |
|---|----------|-------------|--------------|---------------------|
| 1 | **Carte et Découvrir totalement cassés** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` et `GOOGLE_MAPS_API_KEY` vides sur Railway | [map/page.tsx:51](apps/web/src/app/(main)/map/page.tsx#L51), [nearby/route.ts:3](apps/web/src/app/api/places/nearby/route.ts#L3) | **Configurer les deux variables dans Railway** + activer Maps JavaScript API et Places API (New) dans Google Cloud Console |
| 2 | **Toutes les publications de photo/vidéo échouent** | `SUPABASE_URL` et `SUPABASE_SERVICE_KEY` absents du .env.example et probablement non configurés sur Railway | [media.service.ts:17](apps/api/src/modules/media/media.service.ts#L17) | Créer un bucket Supabase `edp-media`, configurer les 2 variables sur Railway |
| 3 | **Le feed disparaît après 7 jours** | Filtre `created_at > NOW() - 7 days` dans l'algorithme de feed | [feed.service.ts:27](apps/api/src/modules/feed/feed.service.ts#L27) | Supprimer ou augmenter ce filtre (ex: 30 jours), ou le rendre configurable |
| 4 | **Découvrir affiche Paris par défaut** | `const PARIS = { lat: 48.8566, lng: 2.3522 }` utilisé comme coords initiales sans attendre la géoloc | [explore/page.tsx:19](apps/web/src/app/(main)/explore/page.tsx#L19) | Ne déclencher le fetch qu'après géolocalisation, ou afficher un état "Activez votre position" |
| 5 | **L'API crashe si Redis indisponible** | `CacheModule` avec `redisStore` obligatoire au démarrage | [app.module.ts:40](apps/api/src/modules/app.module.ts#L40) | S'assurer que Railway a un service Redis + `REDIS_URL` configuré, ou passer `isGlobal: false` |
| 6 | **Vérification email et reset mdp cassés en prod** | Colonnes `verification_token` etc. absentes de la migration SQL | [001-initial-schema.ts](apps/api/src/database/migrations/001-initial-schema.ts) | Créer une migration `002` qui ajoute ces colonnes, l'exécuter manuellement en prod |
| 7 | **Suppression de post crashe côté API** | `postRepo.softDelete(id)` sans `@DeleteDateColumn()` dans l'entité | [posts.service.ts:63](apps/api/src/modules/posts/posts.service.ts#L63) | Remplacer `softDelete(id)` par `delete(id)` ou ajouter `@DeleteDateColumn()` à l'entité et une migration |
| 8 | **"Supprimer mon compte" → erreur silencieuse** | Endpoint `DELETE /api/v1/users/me` absent du UsersController | [settings/page.tsx:110](apps/web/src/app/(main)/settings/page.tsx#L110) | Ajouter `@Delete('me')` dans UsersController avec la logique de suppression |
| 9 | **Toggles notifications/compte privé ne se sauvegardent pas** | Local React state jamais envoyé à l'API | [settings/page.tsx](apps/web/src/app/(main)/settings/page.tsx) | Ajouter des endpoints API pour les préférences utilisateur + appel `PATCH /users/me` |
| 10 | **"Suivre" dans la recherche bloque la navigation** | `onClick={(e) => e.preventDefault()}` sans appel API | [search/page.tsx](apps/web/src/app/(main)/search/page.tsx) | Implémenter le follow dans `UserRow` avec `POST /follows/users/:id` |
| 11 | **Onglet "Reels" profil affiche les posts** | `gridItems` pointe vers `posts?.data` même pour l'onglet reels | [profile/page.tsx](apps/web/src/app/(main)/profile/[username]/page.tsx) | Ajouter une requête séparée `GET /posts/user/:id?type=REEL` pour l'onglet Reels |
| 12 | **Posts VEYA sur fiche lieu jamais chargés** | `api.get('/posts', { params: { establishmentId } })` ne correspond à aucun endpoint | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | Corriger en `api.get('/posts/establishment/:id')` |
| 13 | **Reels VEYA sur fiche lieu → 404** | `api.get('/reels', ...)` → aucun controller `@Controller('reels')` n'existe | [place/[placeId]/page.tsx](apps/web/src/app/(main)/place/[placeId]/page.tsx) | Utiliser `GET /feed/reels?establishmentId=...` ou `GET /posts/establishment/:id?type=REEL` |
| 14 | **CORS potentiellement cassé en prod** | `APP_URL` doit correspondre exactement à l'URL Railway du front | [main.ts:8](apps/api/src/main.ts#L8) | Vérifier que `APP_URL` dans les variables Railway de l'API = URL exacte du service web |
| 15 | **Nouveau message, appels tel/vidéo, options (⋯) → rien** | Boutons décoratifs sans handler | messages, messages/[userId] | Non prioritaire — fonctionnalités pas encore implémentées |

### Informations manquantes pour être sûr à 100%

1. **Variables Railway actuelles** : connaître les valeurs réelles de `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GOOGLE_MAPS_API_KEY`, `APP_URL`, `REDIS_URL`, `NEXT_PUBLIC_API_URL` permettrait de confirmer lesquels de ces bugs sont effectifs en production.

2. **Logs Railway** (API + Web) : les logs de démarrage indiqueraient si Redis démarre correctement, si TypeORM se connecte, et quelles erreurs surviennent à chaque requête.

3. **État du schéma PostgreSQL réel** : un `\d users` en production confirmerait si les colonnes `verification_token` etc. existent (créées par synchronize en dev avant le passage en prod ?).

4. **Clé Google Maps** : savoir si une clé est configurée et quels services sont activés dans la Google Cloud Console (Maps JavaScript API, Places API New) + restrictions de domaine.

5. **Instance Redis** : confirmer qu'un service Redis est provisionné sur Railway et que `REDIS_URL` pointe vers lui.
