import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationEntity } from '../../database/entities/reservation.entity';
import { ReservationStatus, LoyaltyActionType, PaginationQuery } from '@edp/shared';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../database/entities/notification.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepo: Repository<ReservationEntity>,
    private readonly loyaltyService: LoyaltyService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateReservationDto): Promise<ReservationEntity> {
    const reservation = this.reservationRepo.create({ ...dto, userId });
    return (await this.reservationRepo.save(reservation)) as unknown as ReservationEntity;
  }

  async confirm(id: string, establishmentUserId: string): Promise<ReservationEntity> {
    const reservation = await this.findById(id);
    await this.reservationRepo.update(id, { status: ReservationStatus.CONFIRMED });
    await this.loyaltyService.addPoints(
      reservation.userId,
      LoyaltyActionType.RESERVATION,
      id,
    );
    await this.notificationsService.create({
      userId: reservation.userId,
      type: NotificationType.RESERVATION_CONFIRMED,
      message: 'Votre réservation a été confirmée',
      referenceId: id,
      referenceType: 'reservation',
    });
    return this.findById(id);
  }

  async cancel(id: string, userId: string): Promise<ReservationEntity> {
    const reservation = await this.findById(id);
    if (reservation.userId !== userId) throw new ForbiddenException();
    await this.reservationRepo.update(id, { status: ReservationStatus.CANCELLED });
    await this.notificationsService.create({
      userId,
      type: NotificationType.RESERVATION_CANCELLED,
      message: 'Votre réservation a été annulée',
      referenceId: id,
      referenceType: 'reservation',
    });
    return this.findById(id);
  }

  async findById(id: string): Promise<ReservationEntity> {
    const res = await this.reservationRepo.findOne({
      where: { id },
      relations: ['user', 'establishment'],
    });
    if (!res) throw new NotFoundException('Reservation not found');
    return res;
  }

  async getUserReservations(userId: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.reservationRepo.findAndCount({
      where: { userId },
      relations: ['establishment'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getEstablishmentReservations(establishmentId: string, query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.reservationRepo.findAndCount({
      where: { establishmentId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
