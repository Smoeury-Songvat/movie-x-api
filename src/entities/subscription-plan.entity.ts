import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';

export enum PlanType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum VideoQuality {
  SD = 'SD', // 720p
  HD = 'HD', // 1080p
  UHD_4K = '4K_UHD', // 4K + HDR
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: PlanType, unique: true })
  type!: PlanType;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'billing_cycle', default: 'monthly', length: 20 })
  billingCycle!: string;

  @Column({ type: 'enum', enum: VideoQuality })
  quality!: VideoQuality;

  @Column({ name: 'max_devices' })
  maxDevices!: number;

  @Column({ name: 'full_library_access', default: false })
  fullLibraryAccess!: boolean;

  @Column({ name: 'download_allowed', default: false })
  downloadAllowed!: boolean;

  @Column({ name: 'ads_enabled', default: true })
  adsEnabled!: boolean;

  @Column({ name: 'priority_streaming', default: false })
  priorityStreaming!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => UserSubscription, (us) => us.plan)
  userSubscriptions!: UserSubscription[];
}
