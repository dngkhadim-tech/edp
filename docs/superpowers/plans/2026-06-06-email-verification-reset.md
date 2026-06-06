# Email Verification & Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter la vérification email (accès immédiat + bannière) et le reset de mot de passe via nodemailer/SMTP.

**Architecture:** Nouveau `EmailModule` NestJS encapsulant nodemailer + 4 nouvelles colonnes nullable sur `users` + 4 endpoints auth + 3 pages Next.js + 1 bannière dans le layout principal.

**Tech Stack:** NestJS 10, nodemailer 6 (déjà installé), crypto (Node built-in), TypeORM, Next.js 16, Zustand, Supabase MCP (migration SQL)

---

## File Map

**Créer :**
- `apps/api/src/modules/email/email.module.ts`
- `apps/api/src/modules/email/email.service.ts`
- `apps/api/src/modules/email/email.service.spec.ts`
- `apps/api/src/modules/email/templates/verification.template.ts`
- `apps/api/src/modules/email/templates/password-reset.template.ts`
- `apps/api/src/modules/auth/dto/verify-email.dto.ts`
- `apps/api/src/modules/auth/dto/resend-verification.dto.ts`
- `apps/api/src/modules/auth/dto/forgot-password.dto.ts`
- `apps/api/src/modules/auth/dto/reset-password.dto.ts`
- `apps/web/src/app/(auth)/verify-email/page.tsx`
- `apps/web/src/app/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/(auth)/reset-password/page.tsx`
- `apps/web/src/components/auth/EmailVerificationBanner.tsx`

**Modifier :**
- `apps/api/src/database/entities/user.entity.ts` — 4 colonnes nullable
- `apps/api/src/modules/auth/auth.service.ts` — register + 4 handlers
- `apps/api/src/modules/auth/auth.service.spec.ts` — tests des nouveaux handlers
- `apps/api/src/modules/auth/auth.controller.ts` — 4 endpoints
- `apps/api/src/modules/auth/auth.module.ts` — import EmailModule
- `apps/api/src/app.module.ts` — import EmailModule
- `packages/shared/src/types/user.types.ts` — ajouter `emailVerified`
- `apps/web/src/app/(main)/layout.tsx` — bannière

---

## Task 1 : Migration DB — 4 colonnes sur `users`

**Files:**
- Modify: `apps/api/src/database/entities/user.entity.ts`

- [ ] **Étape 1 : Appliquer la migration SQL sur Supabase via MCP**

Via l'outil MCP Supabase `execute_sql` sur le projet `neprpfuszewhkrgrkzcv` :

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMPTZ;
```

Vérifier : `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name LIKE '%token%';`
Attendu : 4 lignes retournées.

- [ ] **Étape 2 : Ajouter les colonnes à UserEntity**

Dans `apps/api/src/database/entities/user.entity.ts`, ajouter après le champ `emailVerified` (ligne ~95) :

```typescript
  @Exclude()
  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'verification_token_expiry', nullable: true, type: 'timestamptz' })
  verificationTokenExpiry?: Date;

  @Exclude()
  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expiry', nullable: true, type: 'timestamptz' })
  passwordResetExpiry?: Date;
```

Note : `@Exclude()` sur les tokens pour ne jamais les sérialiser dans les réponses API.

- [ ] **Étape 3 : Ajouter `emailVerified` au type partagé**

Dans `packages/shared/src/types/user.types.ts`, ajouter dans l'interface `User` après `isActive` :

```typescript
  emailVerified: boolean;
```

- [ ] **Étape 4 : Vérifier la compilation TypeScript**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/shared build
pnpm --filter @edp/api tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Étape 5 : Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/api/src/database/entities/user.entity.ts packages/shared/src/types/user.types.ts
git commit -m "feat(db): add email verification and password reset token columns"
```

---

## Task 2 : EmailModule — service + templates

**Files:**
- Create: `apps/api/src/modules/email/templates/verification.template.ts`
- Create: `apps/api/src/modules/email/templates/password-reset.template.ts`
- Create: `apps/api/src/modules/email/email.service.ts`
- Create: `apps/api/src/modules/email/email.service.spec.ts`
- Create: `apps/api/src/modules/email/email.module.ts`

- [ ] **Étape 1 : Créer le template de vérification**

Créer `apps/api/src/modules/email/templates/verification.template.ts` :

```typescript
export function verificationTemplate(firstName: string, link: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;padding:40px 32px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:32px;font-weight:900;color:#E11D48;letter-spacing:-1px">EDP</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px">Salut ${firstName} !</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
      Vérifie ton adresse email pour activer ton compte EDP et accéder à toutes les fonctionnalités.
    </p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${link}" style="background:#E11D48;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
        Vérifier mon email
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">
      Ce lien expire dans 24 heures. Si tu n'as pas créé de compte, ignore cet email.
    </p>
  </div>
</body>
</html>`;
}
```

- [ ] **Étape 2 : Créer le template de reset**

Créer `apps/api/src/modules/email/templates/password-reset.template.ts` :

```typescript
export function passwordResetTemplate(firstName: string, link: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;padding:40px 32px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:32px;font-weight:900;color:#E11D48;letter-spacing:-1px">EDP</span>
    </div>
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px">Réinitialisation du mot de passe</h1>
    <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px">
      Salut ${firstName}, tu as demandé à réinitialiser ton mot de passe EDP. Clique ci-dessous.
    </p>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${link}" style="background:#E11D48;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">
      Ce lien expire dans 1 heure. Si tu n'as pas demandé cette réinitialisation, ignore cet email.
    </p>
  </div>
</body>
</html>`;
}
```

- [ ] **Étape 3 : Écrire le test EmailService (doit échouer)**

Créer `apps/api/src/modules/email/email.service.spec.ts` :

```typescript
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
jest.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: mockSendMail }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((_key: string, def?: string) => def ?? ''),
          },
        },
      ],
    }).compile();
    service = module.get<EmailService>(EmailService);
    jest.clearAllMocks();
  });

  it('envoie un email de vérification', async () => {
    await service.sendVerificationEmail({ email: 'u@test.com', firstName: 'Test' }, 'rawtoken');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@test.com',
        subject: expect.stringContaining('Vérifie'),
        html: expect.stringContaining('rawtoken'),
      }),
    );
  });

  it('envoie un email de reset', async () => {
    await service.sendPasswordResetEmail({ email: 'u@test.com', firstName: 'Test' }, 'resettoken');
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u@test.com',
        subject: expect.stringContaining('mot de passe'),
        html: expect.stringContaining('resettoken'),
      }),
    );
  });
});
```

- [ ] **Étape 4 : Vérifier que le test échoue**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/api test -- --testPathPattern="email.service.spec" --no-coverage
```

Attendu : FAIL — `EmailService` n'existe pas encore.

- [ ] **Étape 5 : Créer EmailService**

Créer `apps/api/src/modules/email/email.service.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { verificationTemplate } from './templates/verification.template';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM', 'noreply@edp.app');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.resend.com'),
      port: Number(config.get<string>('SMTP_PORT', '587')),
      auth: {
        user: config.get<string>('SMTP_USER', 'resend'),
        pass: config.get<string>('SMTP_PASS', ''),
      },
    });
  }

  async sendVerificationEmail(
    user: { email: string; firstName: string },
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/auth/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: this.from,
      to: user.email,
      subject: 'Vérifie ton adresse email — EDP',
      html: verificationTemplate(user.firstName, link),
    });
  }

  async sendPasswordResetEmail(
    user: { email: string; firstName: string },
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/auth/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.from,
      to: user.email,
      subject: 'Réinitialise ton mot de passe — EDP',
      html: passwordResetTemplate(user.firstName, link),
    });
  }
}
```

- [ ] **Étape 6 : Créer EmailModule**

Créer `apps/api/src/modules/email/email.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

- [ ] **Étape 7 : Vérifier que les tests passent**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/api test -- --testPathPattern="email.service.spec" --no-coverage
```

Attendu : PASS — 2 tests.

- [ ] **Étape 8 : Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/api/src/modules/email/
git commit -m "feat(email): add EmailModule with nodemailer and HTML templates"
```

---

## Task 3 : DTOs auth

**Files:**
- Create: `apps/api/src/modules/auth/dto/verify-email.dto.ts`
- Create: `apps/api/src/modules/auth/dto/resend-verification.dto.ts`
- Create: `apps/api/src/modules/auth/dto/forgot-password.dto.ts`
- Create: `apps/api/src/modules/auth/dto/reset-password.dto.ts`

- [ ] **Étape 1 : Créer les 4 DTOs**

`apps/api/src/modules/auth/dto/verify-email.dto.ts` :
```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

`apps/api/src/modules/auth/dto/resend-verification.dto.ts` :
```typescript
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}
```

`apps/api/src/modules/auth/dto/forgot-password.dto.ts` :
```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

`apps/api/src/modules/auth/dto/reset-password.dto.ts` :
```typescript
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

- [ ] **Étape 2 : Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/api/src/modules/auth/dto/
git commit -m "feat(auth): add DTOs for email verification and password reset"
```

---

## Task 4 : AuthService — 4 nouveaux handlers + register modifié

**Files:**
- Modify: `apps/api/src/modules/auth/auth.service.ts`
- Modify: `apps/api/src/modules/auth/auth.service.spec.ts`

- [ ] **Étape 1 : Écrire les tests (doivent échouer)**

Dans `apps/api/src/modules/auth/auth.service.spec.ts`, ajouter les imports et les nouveaux blocs de test. Remplacer le fichier existant par :

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { UserEntity } from '../../database/entities/user.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { EmailService } from '../email/email.service';

const mockUser = {
  id: 'test-uuid',
  email: 'test@edp.app',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  password: bcrypt.hashSync('password123', 12),
  role: 'USER',
  isActive: true,
  loyaltyGrade: 'BRONZE',
  emailVerified: false,
};

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  const mockLoyaltyService = { addPoints: jest.fn() };
  const mockEmailService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('crée un user et envoie un email de vérification', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue({ ...mockUser });
      mockUserRepo.save.mockResolvedValue({ ...mockUser });
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.register({
        email: 'new@edp.app',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      });

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          verificationToken: expect.any(String),
          verificationTokenExpiry: expect.any(Date),
        }),
      );
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('vérifie le token et met emailVerified à true', async () => {
      const rawToken = 'test-raw-token';
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
      const futureDate = new Date(Date.now() + 60000);

      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        verificationToken: hashed,
        verificationTokenExpiry: futureDate,
      });
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.verifyEmail(rawToken);

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ emailVerified: true, verificationToken: null }),
      );
    });

    it('rejette un token expiré', async () => {
      const rawToken = 'expired-token';
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
      const pastDate = new Date(Date.now() - 60000);

      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        verificationToken: hashed,
        verificationTokenExpiry: pastDate,
      });

      await expect(service.verifyEmail(rawToken)).rejects.toThrow(BadRequestException);
    });

    it('rejette un token inexistant', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('unknown')).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('génère un token reset et envoie un email', async () => {
      mockUserRepo.findOne.mockResolvedValue({ ...mockUser });
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.forgotPassword('test@edp.app');

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpiry: expect.any(Date),
        }),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('ne fait rien si le user n\'existe pas (pas d\'énumération)', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await service.forgotPassword('ghost@edp.app');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('met à jour le mot de passe et expire le token', async () => {
      const rawToken = 'reset-token';
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
      const futureDate = new Date(Date.now() + 3600000);

      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        passwordResetToken: hashed,
        passwordResetExpiry: futureDate,
      });
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.resetPassword(rawToken, 'newpassword123');

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          password: expect.any(String),
          passwordResetToken: null,
          passwordResetExpiry: null,
        }),
      );
    });

    it('rejette un token expiré', async () => {
      const rawToken = 'expired-reset';
      const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

      mockUserRepo.findOne.mockResolvedValue({
        ...mockUser,
        passwordResetToken: hashed,
        passwordResetExpiry: new Date(Date.now() - 1000),
      });

      await expect(service.resetPassword(rawToken, 'pass')).rejects.toThrow(BadRequestException);
    });
  });
});
```

- [ ] **Étape 2 : Vérifier que les tests échouent**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/api test -- --testPathPattern="auth.service.spec" --no-coverage
```

Attendu : FAIL — `EmailService` pas encore dans le module de test / méthodes manquantes.

- [ ] **Étape 3 : Modifier AuthService**

Dans `apps/api/src/modules/auth/auth.service.ts`, appliquer ces changements :

**Ajouter les imports en haut :**
```typescript
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
```

**Ajouter `EmailService` dans le constructeur :**
```typescript
constructor(
  @InjectRepository(UserEntity)
  private readonly userRepo: Repository<UserEntity>,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly loyaltyService: LoyaltyService,
  private readonly emailService: EmailService,   // ← ajouter
) {}
```

**Modifier `register` — ajouter après `await this.loyaltyService.addPoints(...)` :**
```typescript
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.userRepo.update(user.id, {
      verificationToken: hashedToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    void this.emailService.sendVerificationEmail(
      { email: user.email, firstName: user.firstName },
      rawToken,
    );
```

**Ajouter les 4 nouvelles méthodes à la fin de la classe (avant `generateTokens`) :**

```typescript
  async verifyEmail(token: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepo.findOne({ where: { verificationToken: hashedToken } });
    if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      throw new BadRequestException('Token invalide ou expiré');
    }
    await this.userRepo.update(user.id, {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || user.emailVerified) return;
    // Rate limit : 1 envoi par 5 min — si l'expiry est encore > 23h55m dans le futur, le token a été généré il y a < 5 min
    const fiveMinWindowMs = 23 * 60 * 60 * 1000 + 55 * 60 * 1000;
    if (user.verificationTokenExpiry && user.verificationTokenExpiry > new Date(Date.now() + fiveMinWindowMs)) {
      return;
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.userRepo.update(user.id, {
      verificationToken: hashedToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    void this.emailService.sendVerificationEmail({ email: user.email, firstName: user.firstName }, rawToken);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.userRepo.update(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });
    void this.emailService.sendPasswordResetEmail({ email: user.email, firstName: user.firstName }, rawToken);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepo.findOne({ where: { passwordResetToken: hashedToken } });
    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Token invalide ou expiré');
    }
    const hashed = await bcrypt.hash(password, 12);
    await this.userRepo.update(user.id, {
      password: hashed,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });
  }
```

- [ ] **Étape 4 : Vérifier que les tests passent**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/api test -- --testPathPattern="auth.service.spec" --no-coverage
```

Attendu : PASS — tous les tests.

- [ ] **Étape 5 : Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/api/src/modules/auth/auth.service.ts apps/api/src/modules/auth/auth.service.spec.ts
git commit -m "feat(auth): add email verification and password reset handlers"
```

---

## Task 5 : AuthController + AuthModule + AppModule

**Files:**
- Modify: `apps/api/src/modules/auth/auth.controller.ts`
- Modify: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Étape 1 : Ajouter les 4 endpoints dans AuthController**

Dans `apps/api/src/modules/auth/auth.controller.ts`, ajouter les imports :
```typescript
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
```

Ajouter les 4 endpoints après le bloc `facebookAuthCallback` :

```typescript
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
```

- [ ] **Étape 2 : Importer EmailModule dans AuthModule**

Dans `apps/api/src/modules/auth/auth.module.ts`, ajouter dans `imports` :

```typescript
import { EmailModule } from '../email/email.module';
// ...
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.registerAsync({ ... }),
    UsersModule,
    LoyaltyModule,
    EmailModule,   // ← ajouter
  ],
```

- [ ] **Étape 3 : Importer EmailModule dans AppModule**

Dans `apps/api/src/app.module.ts`, ajouter :

```typescript
import { EmailModule } from './modules/email/email.module';
// ...
// Dans le tableau imports de @Module, ajouter EmailModule à la liste des modules existants
```

- [ ] **Étape 4 : Vérifier la compilation et les tests**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/api tsc --noEmit
pnpm --filter @edp/api test -- --no-coverage
```

Attendu : 0 erreur TypeScript, tous les tests passent.

- [ ] **Étape 5 : Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/api/src/modules/auth/auth.controller.ts apps/api/src/modules/auth/auth.module.ts apps/api/src/app.module.ts
git commit -m "feat(auth): wire email verification and password reset endpoints"
```

---

## Task 6 : Pages frontend auth

**Files:**
- Create: `apps/web/src/app/(auth)/verify-email/page.tsx`
- Create: `apps/web/src/app/(auth)/forgot-password/page.tsx`
- Create: `apps/web/src/app/(auth)/reset-password/page.tsx`

- [ ] **Étape 1 : Créer la page verify-email**

Créer `apps/web/src/app/(auth)/verify-email/page.tsx` :

```tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setTimeout(() => router.replace('/feed'), 2000);
      })
      .catch(() => setStatus('error'));
  }, [token, router]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <p className="text-muted-foreground">Vérification en cours…</p>
      )}
      {status === 'success' && (
        <>
          <p className="font-semibold text-lg">Email vérifié !</p>
          <p className="text-muted-foreground text-sm mt-1">Redirection vers le feed…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-destructive font-semibold">Lien invalide ou expiré.</p>
          <Link href="/login" className="mt-4 block text-sm text-primary underline">
            Retour à la connexion
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <Image src="/edplogo.png" alt="EDP" width={128} height={64} priority />
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
```

- [ ] **Étape 2 : Créer la page forgot-password**

Créer `apps/web/src/app/(auth)/forgot-password/page.tsx` :

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/auth/forgot-password', { email }).catch(() => {});
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <Image src="/edplogo.png" alt="EDP" width={128} height={64} priority />
      {sent ? (
        <div className="text-center">
          <p className="font-semibold text-lg">Email envoyé !</p>
          <p className="text-muted-foreground text-sm mt-2">
            Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
          </p>
          <Link href="/login" className="mt-4 block text-sm text-primary underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-2xl font-heading font-bold text-center">Mot de passe oublié</h1>
          <input
            type="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
          <Link href="/login" className="text-sm text-center text-muted-foreground hover:text-foreground">
            Retour à la connexion
          </Link>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Étape 3 : Créer la page reset-password**

Créer `apps/web/src/app/(auth)/reset-password/page.tsx` :

```tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      router.replace('/login?reset=success');
    } catch {
      setError('Lien invalide ou expiré.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
      <h1 className="text-2xl font-heading font-bold text-center">Nouveau mot de passe</h1>
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <input
        type="password"
        required
        minLength={8}
        placeholder="Nouveau mot de passe (8 caractères min.)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        required
        placeholder="Confirmer le mot de passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <Image src="/edplogo.png" alt="EDP" width={128} height={64} priority />
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Étape 4 : Vérifier la compilation**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/web tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Étape 5 : Commit**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/app/\(auth\)/verify-email apps/web/src/app/\(auth\)/forgot-password apps/web/src/app/\(auth\)/reset-password
git commit -m "feat(web): add verify-email, forgot-password, reset-password pages"
```

---

## Task 7 : Bannière de vérification email

**Files:**
- Create: `apps/web/src/components/auth/EmailVerificationBanner.tsx`
- Modify: `apps/web/src/app/(main)/layout.tsx`

- [ ] **Étape 1 : Créer le composant bannière**

Créer `apps/web/src/components/auth/EmailVerificationBanner.tsx` :

```tsx
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    await api.post('/auth/resend-verification', { email: user.email }).catch(() => {});
    setSent(true);
  };

  return (
    <div className="sticky top-0 z-50 bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-center gap-3 text-sm text-rose-700">
      <span>Vérifie ton adresse email pour profiter de toutes les fonctionnalités.</span>
      {sent ? (
        <span className="font-medium">Email envoyé !</span>
      ) : (
        <button onClick={handleResend} className="font-medium underline hover:text-rose-900">
          Renvoyer
        </button>
      )}
    </div>
  );
}
```

- [ ] **Étape 2 : Intégrer la bannière dans le layout principal**

Dans `apps/web/src/app/(main)/layout.tsx`, remplacer le contenu par :

```tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <EmailVerificationBanner />
        <Sidebar />
        <main className="md:ml-16 lg:ml-60 min-h-screen pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
```

- [ ] **Étape 3 : Vérifier la compilation**

```bash
cd /Users/khadimdiongue/edp
pnpm --filter @edp/web tsc --noEmit
```

Attendu : 0 erreur.

- [ ] **Étape 4 : Commit final**

```bash
cd /Users/khadimdiongue/edp
git add apps/web/src/components/auth/EmailVerificationBanner.tsx apps/web/src/app/\(main\)/layout.tsx
git commit -m "feat(web): add email verification banner in main layout"
```

---

## Task 8 : Variables Railway + vérification déploiement

- [ ] **Étape 1 : Ajouter les vars dans Railway**

Dans le dashboard Railway → projet EDP → service API → Variables :

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<ta clé API Resend>
SMTP_FROM=noreply@edp.app
APP_URL=https://web-production-872e1.up.railway.app
```

Et pour S3 (même service API) :
```
AWS_ACCESS_KEY_ID=<clé IAM>
AWS_SECRET_ACCESS_KEY=<secret IAM>
AWS_REGION=eu-west-1
AWS_S3_BUCKET=edp-media
```

- [ ] **Étape 2 : Pousser sur main pour déclencher le déploiement**

```bash
cd /Users/khadimdiongue/edp
git push origin main
```

- [ ] **Étape 3 : Vérifier le health check post-déploiement**

```bash
curl https://api-production-be9c.up.railway.app/api/v1/health
```

Attendu : `{"status":"ok"}`

- [ ] **Étape 4 : Test de smoke — forgot-password**

```bash
curl -X POST https://api-production-be9c.up.railway.app/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"dng.khadim@gmail.com"}'
```

Attendu : `{}` (200 OK, pas d'erreur 500).
