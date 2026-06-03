import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('follows')
@Unique(['followerId', 'followingId', 'followingType'])
export class FollowEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'follower_id' })
  followerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'follower_id' })
  follower: UserEntity;

  @Column({ name: 'following_id' })
  followingId: string;

  @Column({ name: 'following_type', default: 'USER' })
  followingType: 'USER' | 'ESTABLISHMENT';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
