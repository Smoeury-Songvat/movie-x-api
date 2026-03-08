import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CardType {
  MASTERCARD = 'mastercard',
  VISA = 'visa',
  AMEX = 'amex',
  OTHER = 'other',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ type: 'enum', enum: CardType, default: CardType.MASTERCARD })
  cardType!: CardType;

  @Column({ name: 'name_on_card', length: 100 })
  nameOnCard!: string;

  // Store only last 4 digits - full number handled by payment gateway (e.g. Stripe)
  @Column({ name: 'last_four_digits', length: 4 })
  lastFourDigits!: string;

  @Column({ name: 'expiry_month', type: 'smallint' })
  expiryMonth!: number;

  @Column({ name: 'expiry_year', type: 'smallint' })
  expiryYear!: number;

  // Token from payment gateway (Stripe payment_method_id, etc.)
  @Column({ name: 'gateway_token', nullable: true })
  gatewayToken!: string;

  @Column({ name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.paymentMethods)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
