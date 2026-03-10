import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenreController } from './controllers/genre.controller';
import { GenreService } from './services/genre.service';
import { Genre } from '../entities/genre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Genre])],
  controllers: [GenreController],
  providers: [GenreService],
  exports: [GenreService],
})
export class GenreModule {}