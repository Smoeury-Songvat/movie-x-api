import {
  IsString, IsOptional, IsUUID, IsArray, IsEnum,
  IsNumber, IsDateString, IsBoolean, Min, Max,
  MaxLength, IsUrl,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MovieAccessLevel, RatingSource } from '../../entities/movie.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateMovieDto {
  @ApiProperty({ example: 'Inception' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  trailerUrl?: string;

  @ApiPropertyOptional({ example: '2010-07-16' })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds', example: 8880 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 8.8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  ratingScore?: number;

  @ApiPropertyOptional({ enum: RatingSource })
  @IsOptional()
  @IsEnum(RatingSource)
  ratingSource?: RatingSource;

  @ApiPropertyOptional({ enum: MovieAccessLevel })
  @IsOptional()
  @IsEnum(MovieAccessLevel)
  accessLevel?: MovieAccessLevel;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Array of genre UUIDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  genreIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Array of actor UUIDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  actorIds?: string[];
}

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}

export class MovieFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title (partial match)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by genre UUID' })
  @IsOptional()
  @IsUUID('4')
  genreId?: string;

  @ApiPropertyOptional({ description: 'Filter by genre slug (e.g. action)' })
  @IsOptional()
  @IsString()
  genreSlug?: string;

  @ApiPropertyOptional({ enum: MovieAccessLevel })
  @IsOptional()
  @IsEnum(MovieAccessLevel)
  accessLevel?: MovieAccessLevel;

  @ApiPropertyOptional({ description: 'Only published movies', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  publishedOnly?: boolean = true;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['title', 'releaseDate', 'ratingScore', 'viewCount', 'createdAt'] })
  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'releaseDate' | 'ratingScore' | 'viewCount' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
