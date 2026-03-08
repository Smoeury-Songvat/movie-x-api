import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
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
    // ─── Global Config ────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── PostgreSQL via TypeORM ───────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'movieapp'),
        entities: [
          User,
          SubscriptionPlan,
          UserSubscription,
          PaymentMethod,
          Movie,
          MovieQualitySource,
          Genre,
          Actor,
          DownloadedMovie,
        ],
        migrations: ['dist/migrations/*.js'],
        // ⚠️  Set synchronize: false in production — use migrations instead
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
  ],
})
export class AppModule {}
