export interface Review {
    id: string;
    userId: string;
    establishmentId: string;
    reservationId?: string;
    rating: number;
    title?: string;
    content: string;
    media: string[];
    categories: ReviewCategory[];
    isVerified: boolean;
    isFlagged: boolean;
    helpfulCount: number;
    isHelpful?: boolean;
    response?: EstablishmentResponse;
    createdAt: Date;
    updatedAt: Date;
}
export interface ReviewCategory {
    name: string;
    rating: number;
}
export interface EstablishmentResponse {
    content: string;
    respondedAt: Date;
}
export interface CreateReviewDto {
    establishmentId: string;
    reservationId?: string;
    rating: number;
    title?: string;
    content: string;
    media?: string[];
    categories?: ReviewCategory[];
}
