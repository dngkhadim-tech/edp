import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from '../../database/entities/user.entity';
import { FollowEntity } from '../../database/entities/follow.entity';
import { PostEntity } from '../../database/entities/post.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepo = { update: jest.fn(), findOne: jest.fn() };
  const mockFollowRepo = {};
  const mockPostRepo = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: getRepositoryToken(FollowEntity), useValue: mockFollowRepo },
        { provide: getRepositoryToken(PostEntity), useValue: mockPostRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('deactivateAccount', () => {
    it('sets isActive to false so the account can no longer log in', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);

      await service.deactivateAccount('user-1');

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', { isActive: false });
    });
  });

  describe('updateProfile', () => {
    it('persists privacy and notification preferences, not just profile fields', async () => {
      mockUserRepo.update.mockResolvedValue(undefined);
      mockUserRepo.findOne.mockResolvedValue({ id: 'user-1' });

      await service.updateProfile('user-1', {
        isPrivate: true,
        notifyLikes: false,
        notifyComments: false,
        notifyFollowers: true,
        notifyReservations: true,
      });

      expect(mockUserRepo.update).toHaveBeenCalledWith('user-1', expect.objectContaining({
        isPrivate: true,
        notifyLikes: false,
        notifyComments: false,
        notifyFollowers: true,
        notifyReservations: true,
      }));
    });
  });
});
