import {
  Injectable,
  BadRequestException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../../entities/user.entity';
import { PaymentMethod, CardType } from '../../entities/payment-method.entity';
import { SubscriptionService } from '../../subscription/services/subscription.service';
import { CheckoutDto, CheckoutResponseDto } from '../dto/billing.dto';

// ─── Simulated test card numbers (Stripe-style) ───────────────────────────────
const DECLINED_CARDS = new Set([
  '4000000000000002', // generic decline
  '4000000000009995', // insufficient funds
  '4000000000000069', // expired card
]);

const CARD_TYPE_PREFIXES: Array<{ prefix: RegExp; type: CardType }> = [
  { prefix: /^4/, type: CardType.VISA },
  { prefix: /^5[1-5]/, type: CardType.MASTERCARD },
  { prefix: /^3[47]/, type: CardType.AMEX },
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ─── CHECKOUT ────────────────────────────────────────────────────────────────

  async checkout(user: User, dto: CheckoutDto): Promise<CheckoutResponseDto> {
    // 1. Validate expiry
    this.assertCardNotExpired(dto.expiryMonth, dto.expiryYear);

    // 2. Simulate payment gateway
    const transactionId = await this.simulatePayment(dto.cardNumber, dto.cvv);

    // 3. Fetch plan details
    const plan = await this.subscriptionService.getPlanByType(dto.planType);

    // 4. Calculate next billing date (+30 days)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // 5. Activate subscription
    await this.subscriptionService.activateSubscription(
      user,
      dto.planType,
      nextBillingDate,
    );

    // 6. Store payment method (tokenized — only last 4 digits)
    await this.savePaymentMethod(user.id, dto);

    this.logger.log(
      `Checkout success: user=${user.id}, plan=${dto.planType}, txn=${transactionId}`,
    );

    return {
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      transactionId,
      plan: plan.name,
      nextBillingDate,
      amount: Number(plan.price),
    };
  }

  // ─── PAYMENT HISTORY ─────────────────────────────────────────────────────────

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async removePaymentMethod(
    userId: string,
    methodId: string,
  ): Promise<{ message: string }> {
    const method = await this.paymentMethodRepo.findOne({
      where: { id: methodId, userId },
    });
    if (!method) {
      throw new BadRequestException('Payment method not found');
    }
    await this.paymentMethodRepo.remove(method);
    return { message: 'Payment method removed' };
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

  /**
   * Simulates a payment gateway.
   * In production, replace with Stripe / PayPal SDK call.
   */
  private async simulatePayment(
    cardNumber: string,
    _cvv: string,
  ): Promise<string> {
    // Simulate ~100ms network latency
    await this.delay(100);

    if (DECLINED_CARDS.has(cardNumber)) {
      throw new UnprocessableEntityException(
        'Your card was declined. Please use a different payment method.',
      );
    }

    // Return a fake transaction ID
    return `TXN_${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)}`;
  }

  private assertCardNotExpired(month: number, year: number): void {
    const now = new Date();
    const cardExpiry = new Date(year, month, 1); // 1st of the expiry month
    if (cardExpiry <= now) {
      throw new BadRequestException('Your card has expired');
    }
  }

  private async savePaymentMethod(
    userId: string,
    dto: CheckoutDto,
  ): Promise<void> {
    const lastFour = dto.cardNumber.slice(-4);
    const cardType = this.detectCardType(dto.cardNumber);

    // Set all others to non-default, then save new as default
    await this.paymentMethodRepo.update({ userId }, { isDefault: false });

    const method = this.paymentMethodRepo.create({
      userId,
      cardType,
      nameOnCard: dto.nameOnCard,
      lastFourDigits: lastFour,
      expiryMonth: dto.expiryMonth,
      expiryYear: dto.expiryYear,
      isDefault: true,
      gatewayToken: `tok_simulated_${uuidv4().slice(0, 8)}`,
    });

    await this.paymentMethodRepo.save(method);
  }

  private detectCardType(cardNumber: string): CardType {
    for (const { prefix, type } of CARD_TYPE_PREFIXES) {
      if (prefix.test(cardNumber)) return type;
    }
    return CardType.OTHER;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
