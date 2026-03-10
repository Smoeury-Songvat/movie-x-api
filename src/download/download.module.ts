import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadController } from './controllers/download.controller';
import { DownloadService } from './services/download.service';
import { DownloadedMovie } from '../entities/downloaded-movie.entity';
import { Movie } from '../entities/movie.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DownloadedMovie, Movie]),
    SubscriptionModule,
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
