import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from '../../database/entities/follow.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(EstablishmentEntity)
    private readonly estRepo: Repository<EstablishmentEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async followUser(followerId: string, followingId: string): Promise<void> {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId, followingType: 'USER' },
    });
    if (existing) throw new ConflictException('Already following');

    await this.followRepo.save(
      this.followRepo.create({ followerId, followingId, followingType: 'USER' }),
    );
    await this.userRepo.increment({ id: followerId }, 'followingCount', 1);
    await this.userRepo.increment({ id: followingId }, 'followersCount', 1);
    this.notificationsService.create({
      userId: followingId,
      actorId: followerId,
      type: NotificationType.FOLLOW,
      message: 'a commencé à vous suivre',
      referenceId: followerId,
      referenceType: 'user',
    }).catch(() => {});
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const result = await this.followRepo.delete({ followerId, followingId, followingType: 'USER' });
    if (result.affected) {
      await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);
      await this.userRepo.decrement({ id: followingId }, 'followersCount', 1);
    }
  }

  async followEstablishment(followerId: string, establishmentId: string): Promise<void> {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId: establishmentId, followingType: 'ESTABLISHMENT' },
    });
    if (existing) throw new ConflictException('Already following');

    await this.followRepo.save(
      this.followRepo.create({ followerId, followingId: establishmentId, followingType: 'ESTABLISHMENT' }),
    );
    await this.userRepo.increment({ id: followerId }, 'followingCount', 1);
    await this.estRepo.increment({ id: establishmentId }, 'followersCount', 1);
  }

  async unfollowEstablishment(followerId: string, establishmentId: string): Promise<void> {
    const result = await this.followRepo.delete({
      followerId,
      followingId: establishmentId,
      followingType: 'ESTABLISHMENT',
    });
    if (result.affected) {
      await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);
      await this.estRepo.decrement({ id: establishmentId }, 'followersCount', 1);
    }
  }
}
