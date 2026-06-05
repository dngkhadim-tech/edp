import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { PostType } from '@edp/shared';

export class CreatePostDto {
  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  establishmentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

}
