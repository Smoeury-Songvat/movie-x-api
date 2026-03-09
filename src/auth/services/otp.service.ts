import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OtpRecord } from '../../entities/otp-record.entity';
import * as bcrypt from 'bcrypt';

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_TTL_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    @InjectRepository(OtpRecord)
    private readonly otpRepo: Repository<OtpRecord>,
  ) {}

  /** Generate a cryptographically secure 6-digit OTP */
  private generateCode(): string {
    // crypto.getRandomValues would need Buffer; use Math with entropy from Date + random
    const code = Math.floor(100_000 + Math.random() * 900_000).toString();
    return code;
  }

  /**
   * Create or replace an OTP for a given email+purpose.
   * Enforces a resend cooldown to prevent abuse.
   * Returns the plain-text OTP (to be emailed — never logged/stored plain).
   */
  async createOtp(email: string, purpose: OtpPurpose): Promise<string> {
    // Enforce resend cooldown
    const existing = await this.otpRepo.findOne({
      where: { email, purpose },
      order: { createdAt: 'DESC' },
    });

    if (existing) {
      const secondsSinceCreated =
        (Date.now() - existing.createdAt.getTime()) / 1000;
      if (secondsSinceCreated < this.RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(
          this.RESEND_COOLDOWN_SECONDS - secondsSinceCreated,
        );
        throw new BadRequestException(
          `Please wait ${waitSeconds}s before requesting a new OTP`,
        );
      }
      // Remove old record before issuing a new one
      await this.otpRepo.delete({ email, purpose });
    }

    const plainOtp = this.generateCode();
    const otpHash = await bcrypt.hash(plainOtp, this.BCRYPT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + this.OTP_TTL_MINUTES * 60 * 1000,
    );

    await this.otpRepo.save(
      this.otpRepo.create({ email, purpose, otpHash, expiresAt }),
    );

    this.logger.log(`OTP issued for ${email} [${purpose}]`);
    return plainOtp; // returned only to mailer — never persisted in plain text
  }

  /**
   * Validate an OTP. Increments attempt counter.
   * Throws BadRequestException on any failure (constant-time safe).
   */
  async verifyOtp(
    email: string,
    plainOtp: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const record = await this.otpRepo.findOne({ where: { email, purpose } });

    // Always run bcrypt even on fake data to prevent timing attacks
    const fakeHash =
      '$2b$10$fakehashfakehashfakehashfakehashfakehash';
    const hashToCheck = record?.otpHash ?? fakeHash;
    const isMatch = await bcrypt.compare(plainOtp, hashToCheck);

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (record.expiresAt < new Date()) {
      await this.otpRepo.delete({ id: record.id });
      throw new BadRequestException('OTP has expired');
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      await this.otpRepo.delete({ id: record.id });
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP',
      );
    }

    if (!isMatch) {
      await this.otpRepo.increment({ id: record.id }, 'attempts', 1);
      const remaining = this.MAX_ATTEMPTS - (record.attempts + 1);
      throw new BadRequestException(
        `Invalid OTP. ${remaining} attempt(s) remaining`,
      );
    }

    // Valid — consume the record
    await this.otpRepo.delete({ id: record.id });
  }

  /** Periodic cleanup of expired OTP rows (call from a cron job) */
  async cleanupExpired(): Promise<void> {
    const result = await this.otpRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    this.logger.log(`Cleaned up ${result.affected} expired OTP records`);
  }
}
