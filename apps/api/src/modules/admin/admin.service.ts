import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { EstablishmentEntity } from '../../database/entities/establishment.entity';
import { ReviewEntity } from '../../database/entities/review.entity';
import { ReservationEntity } from '../../database/entities/reservation.entity';
import { PostEntity } from '../../database/entities/post.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(EstablishmentEntity)
    private readonly estRepo: Repository<EstablishmentEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepo: Repository<ReviewEntity>,
    @InjectRepository(ReservationEntity)
    private readonly reservationRepo: Repository<ReservationEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalEstablishments,
      totalReviews,
      totalReservations,
      totalPosts,
      newUsersToday,
      newEstablishmentsToday,
    ] = await Promise.all([
      this.userRepo.count(),
      this.estRepo.count(),
      this.reviewRepo.count(),
      this.reservationRepo.count(),
      this.postRepo.count(),
      this.userRepo.count({ where: this.todayFilter() as any }),
      this.estRepo.count({ where: this.todayFilter() as any }),
    ]);

    return {
      totalUsers,
      totalEstablishments,
      totalReviews,
      totalReservations,
      totalPosts,
      newUsersToday,
      newEstablishmentsToday,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const qb = this.userRepo.createQueryBuilder('u');
    if (search) {
      qb.where('u.email ILIKE :s OR u.username ILIKE :s', { s: `%${search}%` });
    }
    const [data, total] = await qb
      .orderBy('u.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async toggleUserActive(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return;
    await this.userRepo.update(id, { isActive: !user.isActive });
  }

  async verifyEstablishment(id: string): Promise<void> {
    await this.estRepo.update(id, { isVerified: true });
  }

  async getFlaggedReviews(page = 1, limit = 20) {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { isFlagged: true },
      relations: ['user', 'establishment'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async deleteReview(id: string): Promise<void> {
    await this.reviewRepo.delete(id);
  }

  async getGrowthData(days = 30) {
    const result = await this.userRepo.query(
      `SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at > NOW() - INTERVAL '${days} days'
       GROUP BY date ORDER BY date ASC`,
    );
    return result;
  }

  private todayFilter() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: today } };
  }
}
