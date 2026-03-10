import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionExpiryTask } from './subscription-expiry.task';
import { OtpCleanupTask } from './otp-cleanup.task';
import { UserSubscription } from '../entities/user-subscription.entity';
import { OtpRecord } from '../entities/otp-record.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OtpService } from '../auth/services/otp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSubscription, OtpRecord]),
    SubscriptionModule,
  ],
  providers: [SubscriptionExpiryTask, OtpCleanupTask, OtpService],
})
export class TasksModule {}
