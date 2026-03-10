import {
  Controller, Get, Delete, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { JwtAuthGuard } from '../../auth/middlewares/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ─── GET /subscriptions/plans ────────────────────────────────────────────────
  @Get('plans')
  @ApiOperation({ summary: 'List all available subscription plans' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  // ─── GET /subscriptions/plans/:id ────────────────────────────────────────────
  @Get('plans/:id')
  getPlanById(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionService.getPlanById(id);
  }

  // ─── GET /subscriptions/me ───────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionService.getUserSubscription(user.id);
  }

  // ─── GET /subscriptions/me/can-download ──────────────────────────────────────
  @Get('me/can-download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user can download movies' })
  canDownload(@CurrentUser() user: User) {
    return this.subscriptionService.canUserDownload(user.id);
  }

  // ─── DELETE /subscriptions/me ────────────────────────────────────────────────
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  cancelSubscription(@CurrentUser() user: User) {
    return this.subscriptionService.cancelSubscription(user.id);
  }
}
