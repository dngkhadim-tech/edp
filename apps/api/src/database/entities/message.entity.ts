import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  @Index()
  conversationId: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ name: 'receiver_id' })
  receiverId: string;

  @Column({ nullable: true, type: 'text' })
  content?: string;

  @Column({ type: 'jsonb', nullable: true })
  media?: object[];

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
