import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../../database/entities/post.entity';
import { PostType, LoyaltyActionType, PaginationQuery } from '@edp/shared';
import { CreatePostDto } from './dto/create-post.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(authorId: string, authorType: 'USER' | 'ESTABLISHMENT', dto: CreatePostDto & { media?: { url: string; type: string }[]; expiresAt?: Date }): Promise<PostEntity> {
    const post = this.postRepo.create({ ...dto, authorId, authorType });
    const saved = (await this.postRepo.save(post)) as unknown as PostEntity;

    const action =
      dto.type === PostType.VIDEO || dto.type === PostType.REEL
        ? LoyaltyActionType.VIDEO_POST
        : LoyaltyActionType.PHOTO_POST;
    if (authorType === 'USER') {
      await this.loyaltyService.addPoints(authorId, action, saved.id);
    }
    return saved;
  }

  async findById(id: string): Promise<PostEntity> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author', 'establishment'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async getUserPosts(userId: string, query: PaginationQuery & { type?: PostType }) {
    const { page = 1, limit = 20, type } = query;
    const [data, total] = await this.postRepo.findAndCount({
      where: type
        ? { authorId: userId, authorType: 'USER', type }
        : { authorId: userId, authorType: 'USER' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getEstablishmentPosts(establishmentId: string, query: PaginationQuery & { type?: PostType }) {
    const { page = 1, limit = 20, type } = query;
    const [data, total] = await this.postRepo.findAndCount({
      where: type ? { establishmentId, type } : { establishmentId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.findById(id);
    if (post.authorId !== userId) throw new ForbiddenException();
    await this.postRepo.softDelete(id);
  }

  async incrementViews(id: string): Promise<void> {
    await this.postRepo.increment({ id }, 'viewsCount', 1);
  }

  async flagPost(id: string): Promise<void> {
    await this.postRepo.update(id, { isFlagged: true });
  }

  async getByHashtag(hashtag: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.postRepo
      .createQueryBuilder('p')
      .where('p.hashtags ? :hashtag', { hashtag })
      .orderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getActiveStories() {
    return this.postRepo
      .createQueryBuilder('p')
      .where('p.type = :type', { type: PostType.STORY })
      .andWhere('p.expires_at > NOW()')
      .orderBy('p.created_at', 'DESC')
      .getMany();
  }

  async getTrending(query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const [data, total] = await this.postRepo
      .createQueryBuilder('p')
      .where('p.created_at > :oneDayAgo', { oneDayAgo })
      .orderBy('(p.likes_count + p.comments_count * 2 + p.shares_count * 3)', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
