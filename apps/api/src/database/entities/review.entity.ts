import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { EstablishmentEntity } from './establishment.entity';

@Entity('reviews')
export class ReviewEntity {
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

  @Column({ name: 'reservation_id', nullable: true })
  reservationId?: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: '[]' })
  media: string[];

  @Column({ type: 'jsonb', default: '[]' })
  categories: object[];

  @Column({ name: 'helpful_count', default: 0 })
  helpfulCount: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_flagged', default: false })
  isFlagged: boolean;

  @Column({ name: 'establishment_response', type: 'jsonb', nullable: true })
  establishmentResponse?: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
