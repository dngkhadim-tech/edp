import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserEntity } from '../../database/entities/user.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';

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

  const mockLoyaltyService = {
    addPoints: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      mockLoyaltyService.addPoints.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'new@edp.app',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@edp.app',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user with valid credentials', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockUserRepo.update.mockResolvedValue(undefined);

      const result = await service.validateUser('test@edp.app', 'password123');
      expect(result).toBeDefined();
      expect(result.email).toBe('test@edp.app');
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.validateUser('test@edp.app', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('notfound@edp.app', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return tokens on login', async () => {
      const result = await service.login(mockUser as any);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBeDefined();
    });
  });
});
