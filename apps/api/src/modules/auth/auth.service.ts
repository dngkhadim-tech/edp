import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { AuthTokens, UserRole } from '@edp/shared';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { LoyaltyActionType } from '@edp/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loyaltyService: LoyaltyService,
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
