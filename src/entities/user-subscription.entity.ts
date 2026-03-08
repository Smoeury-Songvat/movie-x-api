import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'plan_id' })
  planId!: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status!: SubscriptionStatus;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'next_billing_date', type: 'timestamptz' })
  nextBillingDate!: Date;

  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamptz' })
  cancelledAt!: Date;

  @Column({ name: 'auto_renew', default: true })
  autoRenew!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.subscription)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.userSubscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan!: SubscriptionPlan;
}
