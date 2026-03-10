import {
  IsEnum, IsString, IsNotEmpty, MaxLength,
  Matches, IsInt, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '../../entities/subscription-plan.entity';

export class CheckoutDto {
  @ApiProperty({ enum: PlanType, example: PlanType.STANDARD })
  @IsEnum(PlanType)
  planType!: PlanType;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nameOnCard!: string;

  @ApiProperty({ description: 'Card number (test: 4242424242424242)', example: '4242424242424242' })
  @IsString()
  @Matches(/^\d{13,19}$/, { message: 'Card number must be 13–19 digits' })
  cardNumber!: string;

  @ApiProperty({ example: 12, description: 'Expiry month (1–12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  expiryMonth!: number;

  @ApiProperty({ example: 2027, description: 'Expiry year (4 digits)' })
  @IsInt()
  @Min(new Date().getFullYear())
  @Max(new Date().getFullYear() + 20)
  expiryYear!: number;

  @ApiProperty({ example: '123', description: '3–4 digit CVV' })
  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits' })
  cvv!: string;
}

export class CheckoutResponseDto {
  success!: boolean;
  message!: string;
  transactionId!: string;
  plan!: string;
  nextBillingDate!: Date;
  amount!: number;
}
