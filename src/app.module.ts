import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { MovieModule } from './movie/movie.module';
import { ActorModule } from './actor/actor.module';
import { GenreModule } from './genre/genre.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { BillingModule } from './billing/billing.module';
import { DownloadModule } from './download/download.module';
import { TasksModule } from './tasks/tasks.module';

import { User } from './entities/user.entity';
import { OtpRecord } from './entities/otp-record.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Movie } from './entities/movie.entity';
import { MovieQualitySource } from './entities/movie-quality-source.entity';
import { Genre } from './entities/genre.entity';
import { Actor } from './entities/actor.entity';
import { DownloadedMovie } from './entities/downloaded-movie.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'movieapp'),
        entities: [
          User, OtpRecord, SubscriptionPlan, UserSubscription, PaymentMethod,
          Movie, MovieQualitySource, Genre, Actor, DownloadedMovie,
        ],
        migrations: ['dist/migrations/*.js'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    MailModule, AuthModule, MovieModule, ActorModule, GenreModule,
    SubscriptionModule, BillingModule, DownloadModule, TasksModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
