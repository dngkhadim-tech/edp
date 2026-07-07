import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { PostType } from '@edp/shared';
import { UserEntity } from './user.entity';
import { EstablishmentEntity } from './establishment.entity';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ name: 'author_type', default: 'USER' })
  authorType: 'USER' | 'ESTABLISHMENT';

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: UserEntity;

  @Column({ name: 'establishment_id', nullable: true })
  establishmentId?: string;

  @ManyToOne(() => EstablishmentEntity, { nullable: true })
  @JoinColumn({ name: 'establishment_id' })
  establishment?: EstablishmentEntity;

  @Column({ type: 'enum', enum: PostType })
  type: PostType;

  @Column({ nullable: true, type: 'text' })
  caption?: string;

  @Column({ type: 'jsonb', default: '[]' })
  media: object[];

  @Column({ type: 'jsonb', default: '[]' })
  hashtags: string[];

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  latitude?: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 7 })
  longitude?: number;

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', default: 0 })
  commentsCount: number;

  @Column({ name: 'shares_count', default: 0 })
  sharesCount: number;

  @Column({ name: 'saves_count', default: 0 })
  savesCount: number;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Index()
  @Column({ name: 'expires_at', nullable: true, type: 'timestamp' })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
