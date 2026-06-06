# S3 Uploads + Email Verification & Password Reset

**Date:** 2026-06-06  
**Scope:** Configuration AWS S3 + EmailModule NestJS (Resend) + vérification email + reset password  
**Stack:** NestJS 10, Next.js 16, Resend SDK, AWS S3 SDK (déjà en place)

---

## 1. S3 — Configuration Railway uniquement (pas de code)

Le `MediaService` est complet et fonctionnel. Le `PostsController` l'utilise via multer. Aucun code à modifier.

**Variables à ajouter dans Railway (production environment) :**

```
AWS_ACCESS_KEY_ID=<clé IAM>
AWS_SECRET_ACCESS_KEY=<secret IAM>
AWS_REGION=eu-west-1
AWS_S3_BUCKET=edp-media
```

**Prérequis AWS :**
1. Créer le bucket `edp-media` en région `eu-west-1`
2. Bucket policy : public read sur `arn:aws:s3:::edp-media/*`
3. Créer un IAM user `edp-app` avec policy `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject` sur ce bucket

---

## 2. EmailModule (API NestJS)

### 2.1 Structure

```
apps/api/src/modules/email/
  email.module.ts
  email.service.ts
  templates/
    verification.template.ts
    password-reset.template.ts
```

### 2.2 EmailService

Wrapping du SDK Resend. Deux méthodes publiques :

```typescript
sendVerificationEmail(user: { email: string; firstName: string }, token: string): Promise<void>
sendPasswordResetEmail(user: { email: string; firstName: string }, token: string): Promise<void>
```

- Injecté uniquement dans `AuthModule`
- L'email de vérification pointe vers `${APP_URL}/auth/verify-email?token=xxx`
- L'email de reset pointe vers `${APP_URL}/auth/reset-password?token=xxx`
- Templates HTML inline, responsives, couleur primaire `#E11D48`

### 2.3 Variables d'environnement requises

```
RESEND_API_KEY=re_xxx
SMTP_FROM=noreply@edp.app
```

---

## 3. Schéma DB — Nouvelles colonnes sur `users`

Migration SQL à appliquer sur Supabase (idempotente) :

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;
```

Colonnes ajoutées à `UserEntity` avec `@Column({ nullable: true })`.

---

## 4. Endpoints Auth

### Nouveaux endpoints dans `AuthController`

| Méthode | Endpoint | Corps | Comportement |
|---------|----------|-------|-------------|
| POST | `/auth/verify-email` | `{ token: string }` | Valide le token, `emailVerified: true`, expire le token |
| POST | `/auth/resend-verification` | `{ email: string }` | Renvoie l'email si le dernier envoi date de > 5 min |
| POST | `/auth/forgot-password` | `{ email: string }` | Envoie le lien reset (token valide 1h). Toujours 200 (pas d'énumération) |
| POST | `/auth/reset-password` | `{ token: string; password: string }` | Valide le token, hash le nouveau mot de passe, expire le token |

### Flow register (modification `AuthService.register`)

Après `userRepo.save()` :
1. Générer un token `crypto.randomBytes(32).toString('hex')`
2. Stocker le hash SHA-256 du token sur l'entité (`verificationToken`)
3. `verificationTokenExpiry` = now + 24h
4. Appeler `emailService.sendVerificationEmail()` de façon non-bloquante (`void`)
5. Retourner les JWT immédiatement (accès immédiat)

Les tokens OAuth (Google, Facebook) passent directement `emailVerified: true` — comportement inchangé.

---

## 5. Frontend Next.js

### 5.1 Nouvelles pages auth

Toutes dans `apps/web/src/app/(auth)/` :

**`/auth/verify-email/page.tsx`**
- Lit `?token` depuis les searchParams
- Appelle `POST /auth/verify-email` au montage
- Succès → message de confirmation + redirect `/feed` après 2s
- Erreur → message "Lien invalide ou expiré" + bouton "Renvoyer un email"

**`/auth/forgot-password/page.tsx`**
- Formulaire email
- Appelle `POST /auth/forgot-password`
- Affiche toujours "Si un compte existe, un email a été envoyé" (pas d'énumération)

**`/auth/reset-password/page.tsx`**
- Lit `?token` depuis les searchParams
- Formulaire nouveau mot de passe + confirmation
- Appelle `POST /auth/reset-password`
- Succès → redirect `/login`

**Logo sur toutes ces pages :**
```tsx
<Image src="/edplogo.png" alt="EDP" width={128} height={64} priority />
```

### 5.2 Bannière vérification email

Dans `apps/web/src/app/(main)/layout.tsx` :
- Si `user.emailVerified === false` → bandeau sticky en haut
- Style : fond `bg-rose-50 border-b border-rose-200`, texte `text-rose-700`
- Contenu : "Vérifie ton adresse email pour profiter de toutes les fonctionnalités." + bouton "Renvoyer"
- Le bouton appelle `POST /auth/resend-verification` avec l'email de l'utilisateur connecté
- La bannière disparaît quand `user.emailVerified === true`

### 5.3 Pages login/register

Non modifiées dans ce sprint. Elles conservent le texte "EDP" Outfit/primary existant.

---

## 6. Décisions

- **Pas de blocage à l'inscription** — accès immédiat + bannière (UX moins friction)
- **Tokens hashés en DB** — on stocke le SHA-256, jamais le token brut
- **Pas d'énumération** — forgot-password retourne toujours 200 qu'un compte existe ou non
- **OAuth bypass** — les users Google/Facebook ont `emailVerified: true` dès la création
- **Rate limiting resend** — 1 renvoi autorisé par 5 minutes (contrôlé via `verificationTokenExpiry`)

---

## 7. Fichiers à créer / modifier

**Créer :**
- `apps/api/src/modules/email/email.module.ts`
- `apps/api/src/modules/email/email.service.ts`
- `apps/api/src/modules/email/templates/verification.template.ts`
- `apps/api/src/modules/email/templates/password-reset.template.ts`
- `apps/web/src/app/(auth)/verify-email/page.tsx`
- `apps/web/src/app/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/(auth)/reset-password/page.tsx`

**Modifier :**
- `apps/api/src/database/entities/user.entity.ts` — 4 nouvelles colonnes nullable
- `apps/api/src/modules/auth/auth.service.ts` — flow register + 4 nouveaux handlers
- `apps/api/src/modules/auth/auth.controller.ts` — 4 nouveaux endpoints
- `apps/api/src/modules/auth/auth.module.ts` — import EmailModule
- `apps/api/src/app.module.ts` — import EmailModule
- `apps/web/src/app/(main)/layout.tsx` — bannière conditionnelle

**Supabase :**
- Migration SQL (4 colonnes nullable sur `users`)

**Railway secrets à ajouter :**
- `RESEND_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
