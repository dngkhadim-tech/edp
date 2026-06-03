import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { EstablishmentType, PriceRange } from '@edp/shared';
import { UserEntity } from './user.entity';

@Entity('establishments')
export class EstablishmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: EstablishmentType })
  type: EstablishmentType;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  banner?: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({ name: 'zip_code', nullable: true })
  zipCode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({
    type: 'enum',
    enum: PriceRange,
    nullable: true,
    name: 'price_range',
  })
  priceRange?: PriceRange;

  @Column({ type: 'jsonb', nullable: true })
  cuisine?: string[];

  @Column({ type: 'jsonb', nullable: true })
  amenities?: string[];

  @Column({ name: 'opening_hours', type: 'jsonb', nullable: true })
  openingHours?: object[];

  @Column({ name: 'menu_items', type: 'jsonb', nullable: true })
  menuItems?: object[];

  @Column({ name: 'room_types', type: 'jsonb', nullable: true })
  roomTypes?: object[];

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  averageRating: number;

  @Column({ name: 'reviews_count', default: 0 })
  reviewsCount: number;

  @Column({ name: 'followers_count', default: 0 })
  followersCount: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
