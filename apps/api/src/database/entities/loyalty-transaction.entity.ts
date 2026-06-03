import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { LoyaltyActionType } from '@edp/shared';
import { UserEntity } from './user.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'enum', enum: LoyaltyActionType })
  action: LoyaltyActionType;

  @Column()
  points: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
