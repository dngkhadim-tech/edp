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
