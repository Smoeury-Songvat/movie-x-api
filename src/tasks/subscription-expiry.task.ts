import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  UserSubscription,
  SubscriptionStatus,
} from '../entities/user-subscription.entity';
import { SubscriptionService } from '../subscription/services/subscription.service';

@Injectable()
export class SubscriptionExpiryTask {
  private readonly logger = new Logger(SubscriptionExpiryTask.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubRepo: Repository<UserSubscription>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Runs every day at midnight (00:00).
   * Marks subscriptions as INACTIVE if their nextBillingDate has passed
   * and autoRenew is disabled.
   *
   * In production you would also trigger automatic renewal here
   * by calling the payment gateway for users with autoRenew=true.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'subscription-expiry-check',
    timeZone: 'UTC',
  })
  async handleSubscriptionExpiry(): Promise<void> {
    this.logger.log('⏰ Running subscription expiry check...');
    const startTime = Date.now();

    try {
      // 1. Expire non-renewing overdue subscriptions
      const expiredCount =
        await this.subscriptionService.expireOverdueSubscriptions();

      // 2. Find active subscriptions that are overdue but have autoRenew=true
      const autoRenewDue = await this.userSubRepo.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: LessThan(new Date()),
          autoRenew: true,
        },
        relations: ['plan', 'user'],
        take: 100, // process in batches of 100
      });

      let renewalAttempts = 0;
      let renewalSuccesses = 0;

      for (const sub of autoRenewDue) {
        renewalAttempts++;
        try {
          // In production: call payment gateway to charge the stored card.
          // Here we simulate success and advance billing date by 30 days.
          const nextDate = new Date(sub.nextBillingDate);
          nextDate.setDate(nextDate.getDate() + 30);

          await this.userSubRepo.update(sub.id, {
            nextBillingDate: nextDate,
            status: SubscriptionStatus.ACTIVE,
          });

          renewalSuccesses++;
          this.logger.debug(
            `Auto-renewed subscription ${sub.id} for user ${sub.userId}`,
          );
        } catch (err) {
          // Payment failed — suspend the subscription
          await this.userSubRepo.update(sub.id, {
            status: SubscriptionStatus.SUSPENDED,
          });
          this.logger.warn(
            `Auto-renewal failed for subscription ${sub.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }

      const elapsed = Date.now() - startTime;
      this.logger.log(
        `✅ Expiry check complete in ${elapsed}ms — ` +
          `expired: ${expiredCount}, ` +
          `auto-renewed: ${renewalSuccesses}/${renewalAttempts}`,
      );
    } catch (err) {
      this.logger.error(
        `Subscription expiry cron failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }
}
