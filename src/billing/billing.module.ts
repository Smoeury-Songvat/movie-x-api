import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './controllers/billing.controller';
import { BillingService } from './services/billing.service';
import { PaymentMethod } from '../entities/payment-method.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod]),
    SubscriptionModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
