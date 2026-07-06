import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { PostEntity } from '../../database/entities/post.entity';
import { FollowEntity } from '../../database/entities/follow.entity';

describe('FeedService', () => {
  let service: FeedService;
  let qb: any;

  const mockPostRepo = { createQueryBuilder: jest.fn() };
  const mockFollowRepo = { find: jest.fn() };

  const createQbMock = () => {
    const builder: any = {};
    ['leftJoinAndSelect', 'where', 'andWhere', 'addSelect', 'orderBy', 'addOrderBy', 'skip', 'take'].forEach((m) => {
      builder[m] = jest.fn().mockReturnValue(builder);
    });
    builder.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    return builder;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getRepositoryToken(PostEntity), useValue: mockPostRepo },
        { provide: getRepositoryToken(FollowEntity), useValue: mockFollowRepo },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    jest.clearAllMocks();
    qb = createQbMock();
    mockPostRepo.createQueryBuilder.mockReturnValue(qb);
    mockFollowRepo.find.mockResolvedValue([{ followingId: 'u2' }]);
  });

  describe('getPersonalizedFeed', () => {
    it('keeps posts up to ~30 days old, not just 7', async () => {
      await service.getPersonalizedFeed('u1', {});

      const ageCall = qb.andWhere.mock.calls.find(([sql]: [string]) => /^p\.created_at > :\w+$/.test(sql));
      expect(ageCall).toBeDefined();
      const thresholdDate = Object.values(ageCall![1])[0] as Date;
      const daysAgo = (Date.now() - thresholdDate.getTime()) / (24 * 3600 * 1000);
      expect(daysAgo).toBeGreaterThan(20);
      expect(daysAgo).toBeLessThan(31);
    });

    it('lets brand-new posts (0 views) from non-followed authors surface', async () => {
      await service.getPersonalizedFeed('u1', {});

      const followCall = qb.andWhere.mock.calls.find(([sql]: [string]) => sql.includes('author_id IN'));
      expect(followCall).toBeDefined();
      const [sql, params] = followCall!;
      expect(sql).toMatch(/created_at/);
      const recentThresholdKey = Object.keys(params).find((k) => /recent|boost|new/i.test(k));
      expect(recentThresholdKey).toBeDefined();
    });
  });

  describe('getExploreFeed', () => {
    it('does not exclude posts with 0 views', async () => {
      await service.getExploreFeed({});

      const allCalls = [...qb.where.mock.calls, ...qb.andWhere.mock.calls];
      const blocksZeroViews = allCalls.some(([sql]: [string]) => /views_count\s*>\s*0/.test(sql));
      expect(blocksZeroViews).toBe(false);
    });
  });
});
