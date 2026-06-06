import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserEntity } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { AuthTokens, UserRole } from '@edp/shared';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyActionType } from '@edp/shared';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loyaltyService: LoyaltyService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      ...dto,
      password: hashed,
      role: dto.isEstablishment ? UserRole.ESTABLISHMENT : UserRole.USER,
    });
    await this.userRepo.save(user);
    await this.loyaltyService.addPoints(
      user.id,
      LoyaltyActionType.PROFILE_COMPLETE,
      user.id,
    );
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
    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.password) throw new UnauthorizedException();
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return user;
  }

  async login(user: UserEntity): Promise<AuthTokens> {
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async oauthLogin(profile: {
    provider: string;
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }): Promise<AuthTokens> {
    let user = await this.userRepo.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      const username = await this.generateUniqueUsername(
        `${profile.firstName}${profile.lastName}`.toLowerCase().replace(/\s/g, ''),
      );
      user = this.userRepo.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username,
        avatar: profile.avatar,
        emailVerified: true,
        [`${profile.provider}Id`]: profile.providerId,
      });
      await this.userRepo.save(user);
      await this.loyaltyService.addPoints(
        user.id,
        LoyaltyActionType.PROFILE_COMPLETE,
        user.id,
      );
    } else if (!user[`${profile.provider}Id`]) {
      await this.userRepo.update(user.id, {
        [`${profile.provider}Id`]: profile.providerId,
      });
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.generateTokens(user);
  }

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

  private async generateUniqueUsername(base: string): Promise<string> {
    let username = base;
    let counter = 1;
    while (await this.userRepo.findOne({ where: { username } })) {
      username = `${base}${counter++}`;
    }
    return username;
  }

  private generateTokens(user: UserEntity): AuthTokens {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
      expiresIn: 7 * 24 * 3600,
    };
  }
}
