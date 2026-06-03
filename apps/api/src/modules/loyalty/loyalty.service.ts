import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyTransactionEntity } from '../../database/entities/loyalty-transaction.entity';
import { UserEntity } from '../../database/entities/user.entity';
import {
  LoyaltyActionType, LOYALTY_POINTS, LOYALTY_THRESHOLDS, LoyaltyGrade,
} from '@edp/shared';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyTransactionEntity)
    private readonly txRepo: Repository<LoyaltyTransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async addPoints(
    userId: string,
    action: LoyaltyActionType,
    referenceId?: string,
  ): Promise<void> {
    const points = LOYALTY_POINTS[action];
    if (!points) return;

    const tx = this.txRepo.create({
      userId,
      action,
      points,
      referenceId,
      description: this.getDescription(action),
    });
    await this.txRepo.save(tx);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const newPoints = user.loyaltyPoints + points;
    const newGrade = this.calculateGrade(newPoints);
    const gradeChanged = newGrade !== user.loyaltyGrade;

    await this.userRepo.update(userId, {
      loyaltyPoints: newPoints,
      loyaltyGrade: newGrade,
    });

    if (gradeChanged) {
      this.eventEmitter.emit('loyalty.grade_changed', { userId, newGrade });
    }
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getLeaderboard(limit = 20) {
    return this.userRepo.find({
      order: { loyaltyPoints: 'DESC' },
      take: limit,
      select: ['id', 'username', 'firstName', 'lastName', 'avatar', 'loyaltyPoints', 'loyaltyGrade'],
    });
  }

  private calculateGrade(points: number): LoyaltyGrade {
    if (points >= LOYALTY_THRESHOLDS[LoyaltyGrade.DIAMOND]) return LoyaltyGrade.DIAMOND;
    if (points >= LOYALTY_THRESHOLDS[LoyaltyGrade.PLATINUM]) return LoyaltyGrade.PLATINUM;
    if (points >= LOYALTY_THRESHOLDS[LoyaltyGrade.GOLD]) return LoyaltyGrade.GOLD;
    if (points >= LOYALTY_THRESHOLDS[LoyaltyGrade.SILVER]) return LoyaltyGrade.SILVER;
    return LoyaltyGrade.BRONZE;
  }

  private getDescription(action: LoyaltyActionType): string {
    const descriptions: Record<LoyaltyActionType, string> = {
      [LoyaltyActionType.RESERVATION]: 'Réservation effectuée',
      [LoyaltyActionType.REVIEW]: 'Avis publié',
      [LoyaltyActionType.PHOTO_POST]: 'Photo publiée',
      [LoyaltyActionType.VIDEO_POST]: 'Vidéo publiée',
      [LoyaltyActionType.SHARE]: 'Contenu partagé',
      [LoyaltyActionType.INVITE]: 'Ami invité',
      [LoyaltyActionType.DAILY_LOGIN]: 'Connexion quotidienne',
      [LoyaltyActionType.PROFILE_COMPLETE]: 'Profil complété',
    };
    return descriptions[action] || 'Action effectuée';
  }
}
