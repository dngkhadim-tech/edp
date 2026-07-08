import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostEntity } from '../../database/entities/post.entity';
import { PostType } from '@edp/shared';
import { LoyaltyService } from '../loyalty/loyalty.service';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostRepo = { findAndCount: jest.fn(), update: jest.fn() };
  const mockLoyaltyService = { addPoints: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(PostEntity), useValue: mockPostRepo },
        { provide: LoyaltyService, useValue: mockLoyaltyService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    jest.clearAllMocks();
    mockPostRepo.findAndCount.mockResolvedValue([[], 0]);
  });

  describe('getUserPosts', () => {
    it('filters by post type when a type is given (e.g. REEL for the profile Reels tab)', async () => {
      await service.getUserPosts('user-1', { type: PostType.REEL });

      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ authorId: 'user-1', type: PostType.REEL }),
        }),
      );
    });

    it('does not filter by type when none is given', async () => {
      await service.getUserPosts('user-1', {});

      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: 'user-1', authorType: 'USER' },
        }),
      );
    });
  });

  describe('flagPost', () => {
    it('marks the post as flagged for moderation', async () => {
      mockPostRepo.update.mockResolvedValue(undefined);

      await service.flagPost('post-1');

      expect(mockPostRepo.update).toHaveBeenCalledWith('post-1', { isFlagged: true });
    });
  });

  describe('getEstablishmentPosts', () => {
    it('filters by post type when a type is given (e.g. REEL for the place page)', async () => {
      await service.getEstablishmentPosts('est-1', { type: PostType.REEL });

      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ establishmentId: 'est-1', type: PostType.REEL }),
        }),
      );
    });
  });
});
