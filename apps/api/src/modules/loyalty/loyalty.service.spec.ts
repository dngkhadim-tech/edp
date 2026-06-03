import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyTransactionEntity } from '../../database/entities/loyalty-transaction.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { LoyaltyActionType, LoyaltyGrade } from '@edp/shared';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  const mockTxRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
  };

  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: getRepositoryToken(LoyaltyTransactionEntity), useValue: mockTxRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    jest.clearAllMocks();
  });

  describe('addPoints', () => {
    it('should add points and upgrade grade when threshold reached', async () => {
      const user = { id: '1', loyaltyPoints: 450, loyaltyGrade: LoyaltyGrade.BRONZE };
      mockTxRepo.create.mockReturnValue({});
      mockTxRepo.save.mockResolvedValue({});
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.addPoints('1', LoyaltyActionType.RESERVATION, 'ref1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('1', expect.objectContaining({
        loyaltyPoints: 500,
        loyaltyGrade: LoyaltyGrade.SILVER,
      }));
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('loyalty.grade_changed', expect.any(Object));
    });

    it('should not emit grade_changed if grade stays same', async () => {
      const user = { id: '1', loyaltyPoints: 100, loyaltyGrade: LoyaltyGrade.BRONZE };
      mockTxRepo.create.mockReturnValue({});
      mockTxRepo.save.mockResolvedValue({});
      mockUserRepo.findOne.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.addPoints('1', LoyaltyActionType.PHOTO_POST, 'ref1');

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
