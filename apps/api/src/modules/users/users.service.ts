import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { FollowEntity } from '../../database/entities/follow.entity';
import { PostEntity } from '../../database/entities/post.entity';
import { UpdateProfileDto } from '@edp/shared';
import { PaginationQuery } from '@edp/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string, currentUserId?: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const [isFollowing, postsCount] = await Promise.all([
      currentUserId
        ? this.followRepo.findOne({
            where: { followerId: currentUserId, followingId: user.id, followingType: 'USER' },
          }).then((f) => !!f)
        : Promise.resolve(false),
      this.postRepo.count({ where: { authorId: user.id } }),
    ]);

    return { ...user, postsCount, isFollowing };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserEntity> {
    await this.userRepo.update(userId, dto);
    return this.findById(userId);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserEntity> {
    await this.userRepo.update(userId, { avatar: avatarUrl });
    return this.findById(userId);
  }

  async getFollowers(userId: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const [follows, total] = await this.followRepo.findAndCount({
      where: { followingId: userId, followingType: 'USER' },
      relations: ['follower'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data: follows.map((f) => f.follower),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(userId: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const [follows, total] = await this.followRepo.findAndCount({
      where: { followerId: userId, followingType: 'USER' },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    const users = follows.length
      ? await this.userRepo.findBy({ id: In(follows.map((f) => f.followingId)) })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));
    return {
      data: follows.map((f) => byId.get(f.followingId)).filter((u): u is UserEntity => !!u),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateFcmToken(userId: string, token: string): Promise<void> {
    await this.userRepo.update(userId, { fcmToken: token });
  }

  async deactivateAccount(userId: string): Promise<void> {
    await this.userRepo.update(userId, { isActive: false });
  }
}
