import { IsString, IsEnum, IsOptional, IsEmail, IsUrl } from 'class-validator';
import { EstablishmentType, PriceRange } from '@edp/shared';

export class CreateEstablishmentDto {
  @IsString()
  name: string;

  @IsEnum(EstablishmentType)
  type: EstablishmentType;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsEnum(PriceRange)
  priceRange?: PriceRange;
}
