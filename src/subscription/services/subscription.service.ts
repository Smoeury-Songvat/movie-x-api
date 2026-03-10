import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { SubscriptionPlan, PlanType } from '../../entities/subscription-plan.entity';
import { UserSubscription, SubscriptionStatus } from '../../entities/user-subscription.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private readonly userSubRepo: Repository<UserSubscription>,
  ) {}

  // ─── LIST ALL PLANS ──────────────────────────────────────────────────────────

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan #${id} not found`);
    return plan;
  }

  async getPlanByType(type: PlanType): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { type, isActive: true } });
    if (!plan) throw new NotFoundException(`Plan "${type}" not found or inactive`);
    return plan;
  }

  // ─── USER SUBSCRIPTION ───────────────────────────────────────────────────────

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    return this.userSubRepo.findOne({
      where: { userId },
      relations: ['plan'],
    });
  }

  async getActiveSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.userSubRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    if (!sub) {
      throw new NotFoundException('No active subscription found');
    }
    return sub;
  }

  // ─── DOWNLOAD ACCESS CHECK ───────────────────────────────────────────────────

  /**
   * Returns true only if the user has an active Standard or Premium subscription.
   * Basic plan does NOT allow downloads.
   */
  async canUserDownload(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    plan?: PlanType;
  }> {
    const subscription = await this.userSubRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    if (!subscription.plan.downloadAllowed) {
      return {
        allowed: false,
        reason: `Your ${subscription.plan.name} plan does not include downloads. Upgrade to Standard or Premium.`,
        plan: subscription.plan.type,
      };
    }

    return { allowed: true, plan: subscription.plan.type };
  }

  /**
   * Asserts download access — throws ForbiddenException if not allowed.
   */
  async assertDownloadAccess(userId: string): Promise<UserSubscription> {
    const result = await this.canUserDownload(userId);
    if (!result.allowed) {
      throw new ForbiddenException(result.reason);
    }
    return this.getActiveSubscription(userId);
  }

  // ─── SUBSCRIPTION UPSERT (called by BillingService after payment) ────────────

  async activateSubscription(
    user: User,
    planType: PlanType,
    nextBillingDate: Date,
  ): Promise<UserSubscription> {
    const plan = await this.getPlanByType(planType);

    let sub = await this.userSubRepo.findOne({ where: { userId: user.id } });

    if (sub) {
      // Existing subscription — update plan and reactivate
      sub.planId = plan.id;
      sub.status = SubscriptionStatus.ACTIVE;
      sub.startedAt = new Date();
      sub.nextBillingDate = nextBillingDate;
      sub.cancelledAt = new Date(0);
      sub.autoRenew = true;
    } else {
      sub = this.userSubRepo.create({
        userId: user.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        nextBillingDate,
        autoRenew: true,
      });
    }

    return this.userSubRepo.save(sub);
  }

  // ─── CANCEL SUBSCRIPTION ─────────────────────────────────────────────────────

  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getActiveSubscription(userId);
    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelledAt = new Date();
    sub.autoRenew = false;
    return this.userSubRepo.save(sub);
  }

  // ─── CRON: expire overdue subscriptions ──────────────────────────────────────

  async expireOverdueSubscriptions(): Promise<number> {
    const result = await this.userSubRepo
      .createQueryBuilder()
      .update(UserSubscription)
      .set({ status: SubscriptionStatus.INACTIVE })
      .where('status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('next_billing_date < :now', { now: new Date() })
      .andWhere('auto_renew = false')
      .execute();

    this.logger.log(
      `Expired ${result.affected} overdue subscription(s)`,
    );
    return result.affected ?? 0;
  }
}
