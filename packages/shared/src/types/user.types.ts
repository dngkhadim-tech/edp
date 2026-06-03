export enum UserRole {
  USER = 'USER',
  ESTABLISHMENT = 'ESTABLISHMENT',
  ADMIN = 'ADMIN',
}

export enum LoyaltyGrade {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  city?: string;
  country?: string;
  role: UserRole;
  loyaltyPoints: number;
  loyaltyGrade: LoyaltyGrade;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  isFollowing?: boolean;
  isFollowedBy?: boolean;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  city?: string;
  country?: string;
}
