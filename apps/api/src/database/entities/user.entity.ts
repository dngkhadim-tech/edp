import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, LoyaltyGrade } from '@edp/shared';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ unique: true })
  username: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Exclude()
  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true, length: 500 })
  bio?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: LoyaltyGrade,
    default: LoyaltyGrade.BRONZE,
    name: 'loyalty_grade',
  })
  loyaltyGrade: LoyaltyGrade;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ name: 'followers_count', default: 0 })
  followersCount: number;

  @Column({ name: 'following_count', default: 0 })
  followingCount: number;

  @Column({ name: 'posts_count', default: 0 })
  postsCount: number;

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;

  @Column({ name: 'facebook_id', nullable: true })
  facebookId?: string;

  @Column({ name: 'apple_id', nullable: true })
  appleId?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ name: 'notify_likes', default: true })
  notifyLikes: boolean;

  @Column({ name: 'notify_comments', default: true })
  notifyComments: boolean;

  @Column({ name: 'notify_followers', default: true })
  notifyFollowers: boolean;

  @Column({ name: 'notify_reservations', default: true })
  notifyReservations: boolean;

  @Column({ name: 'is_2fa_enabled', default: false })
  is2faEnabled: boolean;

  @Exclude()
  @Column({ name: 'two_factor_secret', nullable: true })
  twoFactorSecret?: string;

  @Column({ name: 'fcm_token', nullable: true })
  fcmToken?: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({ name: 'verification_token', nullable: true })
  verificationToken?: string;

  @Column({ name: 'verification_token_expiry', nullable: true, type: 'timestamptz' })
  verificationTokenExpiry?: Date;

  @Exclude()
  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expiry', nullable: true, type: 'timestamptz' })
  passwordResetExpiry?: Date;

  @Column({ name: 'last_login_at', nullable: true, type: 'timestamp' })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
