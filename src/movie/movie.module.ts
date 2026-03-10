import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieController } from './controllers/movie.controller';
import { MovieService } from './services/movie.service';
import { Movie } from '../entities/movie.entity';
import { Genre } from '../entities/genre.entity';
import { Actor } from '../entities/actor.entity';
import { UserSubscription } from '../entities/user-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Genre, Actor, UserSubscription])],
  controllers: [MovieController],
  providers: [MovieService],
  exports: [MovieService],
})
export class MovieModule {}
