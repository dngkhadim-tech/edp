import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { PostEntity } from '../../database/entities/post.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(EstablishmentEntity)
    private readonly estRepo: Repository<EstablishmentEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  async globalSearch(q: string, limit = 10) {
    const [users, establishments, posts] = await Promise.all([
      this.searchUsers(q, limit),
      this.searchEstablishments(q, limit),
      this.searchPosts(q, limit),
    ]);
    return { users, establishments, posts };
  }

  async searchUsers(q: string, limit = 20) {
    return this.userRepo
      .createQueryBuilder('u')
      .where('u.username ILIKE :q OR u.first_name ILIKE :q OR u.last_name ILIKE :q', {
        q: `%${q}%`,
      })
      .andWhere('u.is_active = true')
      .select(['u.id', 'u.username', 'u.firstName', 'u.lastName', 'u.avatar', 'u.isVerified'])
      .limit(limit)
      .getMany();
  }

  async searchEstablishments(q: string, limit = 20) {
    return this.estRepo
      .createQueryBuilder('e')
      .where('e.name ILIKE :q OR e.city ILIKE :q OR e.description ILIKE :q', {
        q: `%${q}%`,
      })
      .andWhere('e.is_active = true')
      .limit(limit)
      .getMany();
  }

  async searchPosts(q: string, limit = 20) {
    return this.postRepo
      .createQueryBuilder('p')
      .where('p.caption ILIKE :q OR :tag = ANY(p.hashtags)', {
        q: `%${q}%`,
        tag: q.replace('#', ''),
      })
      .orderBy('p.likes_count', 'DESC')
      .limit(limit)
      .getMany();
  }
}
