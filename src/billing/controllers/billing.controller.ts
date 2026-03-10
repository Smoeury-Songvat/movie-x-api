import {
  Controller, Post, Get, Delete, Body, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import { CheckoutDto } from '../dto/billing.dto';
import { JwtAuthGuard } from '../../auth/middlewares/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── POST /billing/checkout ──────────────────────────────────────────────────
  @Post('checkout')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // prevent payment spam
  @ApiOperation({
    summary: 'Simulate payment and activate subscription',
    description: `
      **Test card numbers:**
      - \`4242424242424242\` → Success (Visa)
      - \`5105105105105100\` → Success (Mastercard)
      - \`4000000000000002\` → Declined
      - \`4000000000009995\` → Insufficient funds
      - \`4000000000000069\` → Expired card
    `,
  })
  @ApiResponse({ status: 201, description: 'Payment successful, subscription activated' })
  @ApiResponse({ status: 422, description: 'Card declined' })
  checkout(
    @CurrentUser() user: User,
    @Body() dto: CheckoutDto,
  ) {
    return this.billingService.checkout(user, dto);
  }

  // ─── GET /billing/payment-methods ────────────────────────────────────────────
  @Get('payment-methods')
  @ApiOperation({ summary: 'List saved payment methods' })
  getPaymentMethods(@CurrentUser() user: User) {
    return this.billingService.getPaymentMethods(user.id);
  }

  // ─── DELETE /billing/payment-methods/:id ─────────────────────────────────────
  @Delete('payment-methods/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a saved payment method' })
  removePaymentMethod(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.billingService.removePaymentMethod(user.id, id);
  }
}
