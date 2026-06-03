import { LoyaltyGrade } from './user.types';
export declare enum LoyaltyActionType {
    RESERVATION = "RESERVATION",
    REVIEW = "REVIEW",
    PHOTO_POST = "PHOTO_POST",
    VIDEO_POST = "VIDEO_POST",
    SHARE = "SHARE",
    INVITE = "INVITE",
    DAILY_LOGIN = "DAILY_LOGIN",
    PROFILE_COMPLETE = "PROFILE_COMPLETE"
}
export declare const LOYALTY_POINTS: Record<LoyaltyActionType, number>;
export declare const LOYALTY_THRESHOLDS: Record<LoyaltyGrade, number>;
export interface LoyaltyTransaction {
    id: string;
    userId: string;
    action: LoyaltyActionType;
    points: number;
    referenceId?: string;
    description: string;
    createdAt: Date;
}
