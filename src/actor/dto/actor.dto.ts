import {
  IsString, IsOptional, IsDateString, IsUrl, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateActorDto {
  @ApiProperty({ example: 'Leonardo DiCaprio' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiPropertyOptional({ example: '1974-11-11' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

export class UpdateActorDto extends PartialType(CreateActorDto) {}