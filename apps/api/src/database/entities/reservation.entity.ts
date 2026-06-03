import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ReservationStatus, ReservationType } from '@edp/shared';
import { UserEntity } from './user.entity';
import { EstablishmentEntity } from './establishment.entity';

@Entity('reservations')
export class ReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'establishment_id' })
  establishmentId: string;

  @ManyToOne(() => EstablishmentEntity)
  @JoinColumn({ name: 'establishment_id' })
  establishment: EstablishmentEntity;

  @Column({ type: 'enum', enum: ReservationType })
  type: ReservationType;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'jsonb' })
  details: object;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount?: number;

  @Column({ nullable: true, default: 'EUR' })
  currency?: string;

  @Column({ name: 'payment_intent_id', nullable: true })
  paymentIntentId?: string;

  @Column({ name: 'loyalty_points_earned', default: 0 })
  loyaltyPointsEarned: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
