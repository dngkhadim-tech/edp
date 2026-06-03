export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum ReservationType {
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
}

export interface RestaurantReservation {
  date: string; // ISO date
  time: string; // "19:30"
  partySize: number;
  specialRequests?: string;
}

export interface HotelReservation {
  checkIn: string; // ISO date
  checkOut: string; // ISO date
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
