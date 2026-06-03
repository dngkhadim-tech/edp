export declare enum EstablishmentType {
    RESTAURANT = "RESTAURANT",
    HOTEL = "HOTEL",
    BAR = "BAR",
    CAFE = "CAFE",
    TOURIST_SPOT = "TOURIST_SPOT",
    EXPERIENCE = "EXPERIENCE"
}
export declare enum PriceRange {
    BUDGET = "BUDGET",
    MODERATE = "MODERATE",
    EXPENSIVE = "EXPENSIVE",
    LUXURY = "LUXURY"
}
export interface OpeningHours {
    day: number;
    open: string;
    close: string;
    isClosed: boolean;
}
export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    category: string;
    image?: string;
    isAvailable: boolean;
}
export interface RoomType {
    id: string;
    name: string;
    description?: string;
    pricePerNight: number;
    currency: string;
    capacity: number;
    amenities: string[];
    images: string[];
}
export interface Establishment {
    id: string;
    userId: string;
    name: string;
    slug: string;
    type: EstablishmentType;
    description?: string;
    logo?: string;
    banner?: string;
    address: string;
    city: string;
    country: string;
    zipCode?: string;
    latitude: number;
    longitude: number;
    phone?: string;
    email?: string;
    website?: string;
    priceRange?: PriceRange;
    cuisine?: string[];
    amenities?: string[];
    openingHours?: OpeningHours[];
    menuItems?: MenuItem[];
    roomTypes?: RoomType[];
    averageRating: number;
    reviewsCount: number;
    followersCount: number;
    isVerified: boolean;
    isPremium: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
