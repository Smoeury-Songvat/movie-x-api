import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DownloadedMovie } from './downloaded-movie.entity';
import { UserSubscription } from './user-subscription.entity';
import { PaymentMethod } from './payment-method.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  UNVERIFIED = 'unverified',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'profile_picture_url', nullable: true })
  profilePictureUrl!: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.UNVERIFIED })
  status!: UserStatus;

  // OTP verification
  @Column({ name: 'otp_code', nullable: true, length: 6 })
  otpCode!: string;

  @Column({ name: 'otp_expires_at', nullable: true, type: 'timestamptz' })
  otpExpiresAt!: Date;

  @Column({ name: 'otp_verified', default: false })
  otpVerified!: boolean;

  // Password reset
  @Column({ name: 'reset_password_token', nullable: true })
  resetPasswordToken!: string;

  @Column({
    name: 'reset_password_expires_at',
    nullable: true,
    type: 'timestamptz',
  })
  resetPasswordExpiresAt!: Date;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => DownloadedMovie, (dm) => dm.user)
  downloadedMovies!: DownloadedMovie[];

  @OneToOne(() => UserSubscription, (sub) => sub.user, { nullable: true })
  subscription!: UserSubscription;

  @OneToMany(() => PaymentMethod, (pm) => pm.user)
  paymentMethods!: PaymentMethod[];
}
