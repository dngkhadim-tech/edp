import { IsEnum, IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export enum ReservationType {
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
}

export class CreateReservationDto {
  @IsString()
  establishmentId: string;

  @IsEnum(ReservationType)
  type: ReservationType;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @IsNumber()
  partySize?: number;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
