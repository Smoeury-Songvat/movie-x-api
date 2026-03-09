import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OtpPurpose } from '../auth/services/otp.service';

@Entity('otp_records')
@Index(['email', 'purpose'])
export class OtpRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 50 })
  purpose!: OtpPurpose;

  /** bcrypt hash of the 6-digit code — never stored plain */
  @Column({ name: 'otp_hash' })
  otpHash!: string;

  @Column({ type: 'smallint', default: 0 })
  attempts!: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
