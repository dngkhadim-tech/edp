import { LoyaltyGrade } from './user.types';

export enum LoyaltyActionType {
  RESERVATION = 'RESERVATION',
  REVIEW = 'REVIEW',
  PHOTO_POST = 'PHOTO_POST',
  VIDEO_POST = 'VIDEO_POST',
  SHARE = 'SHARE',
  INVITE = 'INVITE',
  DAILY_LOGIN = 'DAILY_LOGIN',
  PROFILE_COMPLETE = 'PROFILE_COMPLETE',
}

export const LOYALTY_POINTS: Record<LoyaltyActionType, number> = {
  [LoyaltyActionType.RESERVATION]: 50,
  [LoyaltyActionType.REVIEW]: 30,
  [LoyaltyActionType.PHOTO_POST]: 10,
  [LoyaltyActionType.VIDEO_POST]: 20,
  [LoyaltyActionType.SHARE]: 5,
  [LoyaltyActionType.INVITE]: 100,
  [LoyaltyActionType.DAILY_LOGIN]: 2,
  [LoyaltyActionType.PROFILE_COMPLETE]: 50,
};

export const LOYALTY_THRESHOLDS: Record<LoyaltyGrade, number> = {
  [LoyaltyGrade.BRONZE]: 0,
  [LoyaltyGrade.SILVER]: 500,
  [LoyaltyGrade.GOLD]: 2000,
  [LoyaltyGrade.PLATINUM]: 10000,
  [LoyaltyGrade.DIAMOND]: 50000,
};

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  action: LoyaltyActionType;
  points: number;
  referenceId?: string;
  description: string;
  createdAt: Date;
}
