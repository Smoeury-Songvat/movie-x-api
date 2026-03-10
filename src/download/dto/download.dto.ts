import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DownloadStatus } from '../../entities/downloaded-movie.entity';
import { StreamQuality } from '../../entities/movie-quality-source.entity';

export class InitiateDownloadDto {
  @ApiProperty({ description: 'Movie UUID to download' })
  @IsUUID('4')
  movieId!: string;

  @ApiProperty({ enum: StreamQuality, description: 'Desired download quality' })
  @IsEnum(StreamQuality)
  quality!: StreamQuality;
}

export class UpdateDownloadStatusDto {
  @ApiProperty({ enum: DownloadStatus })
  @IsEnum(DownloadStatus)
  status!: DownloadStatus;

  @ApiPropertyOptional({ description: 'Progress 0–100' })
  @IsOptional()
  progressPercent?: number;

  @ApiPropertyOptional({ description: 'Client-side file path' })
  @IsOptional()
  @IsString()
  localFilePath?: string;
}