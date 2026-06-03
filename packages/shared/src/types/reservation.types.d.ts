export declare enum ReservationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
    NO_SHOW = "NO_SHOW"
}
export declare enum ReservationType {
    RESTAURANT = "RESTAURANT",
    HOTEL = "HOTEL"
}
export interface RestaurantReservation {
    date: string;
    time: string;
    partySize: number;
    specialRequests?: string;
}
export interface HotelReservation {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    roomTypeId: string;
    roomsCount: number;
    specialRequests?: string;
}
export interface Reservation {
    id: string;
    userId: string;
    establishmentId: string;
    type: ReservationType;
    status: ReservationStatus;
    details: RestaurantReservation | HotelReservation;
    totalAmount?: number;
    currency?: string;
    paymentIntentId?: string;
    loyaltyPointsEarned: number;
    createdAt: Date;
    updatedAt: Date;
}
