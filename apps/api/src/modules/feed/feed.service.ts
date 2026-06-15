import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../../database/entities/post.entity';
import { FollowEntity } from '../../database/entities/follow.entity';
import { PostType, PaginationQuery, FEED_ALGORITHM_WEIGHTS } from '@edp/shared';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  async getPersonalizedFeed(userId: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;

    const follows = await this.followRepo.find({ where: { followerId: userId } });
    const followingIds = follows.map((f) => f.followingId);

    const qb = this.postRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoinAndSelect('p.establishment', 'establishment')
      .where('p.type NOT IN (:...excludedTypes)', {
        excludedTypes: [PostType.STORY],
      });

    // When user follows people, prioritize their content; otherwise show everything
    if (followingIds.length > 0) {
      qb.andWhere(
        '(p.author_id IN (:...ids) OR p.establishment_id IN (:...ids))',
        { ids: followingIds },
      );
    }

    const scoreExpr = `(
      ${FEED_ALGORITHM_WEIGHTS.engagement} * (p.likes_count + p.comments_count * 2 + p.shares_count * 3) +
      ${FEED_ALGORITHM_WEIGHTS.recency} / (1.0 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400.0)
    )`;

    const [data, total] = await qb
      .orderBy(scoreExpr, 'DESC')
      .addOrderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getExploreFeed(query: PaginationQuery & { type?: PostType }) {
    const { page = 1, limit = 20, type } = query;

    const qb = this.postRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .leftJoinAndSelect('p.establishment', 'establishment')
      .where('p.type NOT IN (:...excludedTypes)', { excludedTypes: [PostType.STORY] });

    if (type) qb.andWhere('p.type = :type', { type });

    const [data, total] = await qb
      .orderBy('p.likes_count', 'DESC')
      .addOrderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getReelsFeed(query: PaginationQuery) {
    const { page = 1, limit = 10 } = query;
    const [data, total] = await this.postRepo.findAndCount({
      where: { type: PostType.REEL },
      order: { viewsCount: 'DESC', createdAt: 'DESC' },
      relations: ['author'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
