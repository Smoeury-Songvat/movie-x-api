import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { Movie } from '../entities/movie.entity';
import { MovieQualitySource } from '../entities/movie-quality-source.entity';
import { Genre } from '../entities/genre.entity';
import { Actor } from '../entities/actor.entity';
import { DownloadedMovie } from '../entities/downloaded-movie.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'movieapp',
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
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
