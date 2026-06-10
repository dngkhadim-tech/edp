import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationType } from '../../database/entities/notification.entity';
import { UserEntity } from '../../database/entities/user.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private firebaseInitialized = false;

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifRepo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        !admin.apps.length
      ) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        this.firebaseInitialized = true;
      }
    } catch {}
  }

  async create(data: {
    userId: string;
    actorId?: string;
    type: NotificationType;
    message: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<NotificationEntity> {
    const notif = this.notifRepo.create(data);
    const saved = await this.notifRepo.save(notif);
    await this.sendPush(data.userId, data.message);
    return saved;
  }

  async getForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.notifRepo.findAndCount({
      where: { userId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  private async sendPush(userId: string, message: string): Promise<void> {
    if (!this.firebaseInitialized) return;
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.fcmToken) return;
      await admin.messaging().send({
        token: user.fcmToken,
        notification: { title: 'VEYA', body: message },
        data: { userId },
      });
    } catch {}
  }
}
