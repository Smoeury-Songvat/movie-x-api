import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User, UserStatus } from '../../entities/user.entity';
import { OtpService, OtpPurpose } from './otp.service';
import { MailService } from '../../mail/mail.service';
import {
  SignUpDto,
  VerifyOtpDto,
  SignInDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── SIGN UP ────────────────────────────────────────────────────────────────

  async signUp(dto: SignUpDto): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.status === UserStatus.UNVERIFIED) {
        // Resend OTP for unverified account
        await this.issueAndSendOtp(
          existing,
          OtpPurpose.EMAIL_VERIFICATION,
        );
        return { message: 'Account exists but is unverified. A new OTP has been sent.' };
      }
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      status: UserStatus.UNVERIFIED,
    });
    await this.userRepo.save(user);

    await this.issueAndSendOtp(user, OtpPurpose.EMAIL_VERIFICATION);

    return { message: 'Account created. Please check your email for the OTP.' };
  }

  // ─── VERIFY OTP (ACCOUNT ACTIVATION) ────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const user = await this.findUserByEmailOrThrow(dto.email);

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already verified');
    }

    await this.otpService.verifyOtp(
      dto.email,
      dto.otp,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    await this.userRepo.update(user.id, { status: UserStatus.ACTIVE });

    // Fire-and-forget welcome email
    this.mailService
      .sendWelcome(user.name, user.email)
      .catch((e) => this.logger.warn(`Welcome email failed: ${e.message}`));

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  // ─── RESEND OTP ──────────────────────────────────────────────────────────────

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.findUserByEmailOrThrow(email);
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Account is already verified');
    }
    await this.issueAndSendOtp(user, OtpPurpose.EMAIL_VERIFICATION);
    return { message: 'A new OTP has been sent to your email.' };
  }

  // ─── SIGN IN ─────────────────────────────────────────────────────────────────

  async signIn(
    dto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Constant-time comparison — always hash even if user not found
    const fakeHash =
      '$2b$12$fakehashfakehashfakehashfakehashfakehashfakehash';
    const passwordMatch = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? fakeHash,
    );

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.UNVERIFIED) {
      throw new UnauthorizedException(
        'Please verify your email before signing in',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ─── REFRESH TOKENS ──────────────────────────────────────────────────────────

  async refreshTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─── SIGN OUT ────────────────────────────────────────────────────────────────

  async signOut(userId: string): Promise<{ message: string }> {
    await this.userRepo.update(userId, { refreshToken: undefined });
    return { message: 'Signed out successfully' };
  }

  // ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Always return the same message — don't reveal if email exists
    const genericMsg =
      'If that email is registered, you will receive a reset code shortly.';

    if (!user || user.status === UserStatus.UNVERIFIED) return { message: genericMsg };

    await this.issueAndSendOtp(user, OtpPurpose.PASSWORD_RESET);
    return { message: genericMsg };
  }

  // ─── RESET PASSWORD ──────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.findUserByEmailOrThrow(dto.email);

    await this.otpService.verifyOtp(
      dto.email,
      dto.otp,
      OtpPurpose.PASSWORD_RESET,
    );

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.userRepo.update(user.id, {
      passwordHash,
      refreshToken: undefined, // invalidate all sessions
    });

    return { message: 'Password has been reset. Please sign in again.' };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private async issueAndSendOtp(user: User, purpose: OtpPurpose): Promise<void> {
    const otp = await this.otpService.createOtp(user.email, purpose);

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await this.mailService.sendOtpVerification(user.name, user.email, otp);
    } else {
      await this.mailService.sendPasswordReset(user.name, user.email, otp);
    }
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.userRepo.update(userId, { refreshToken: hash });
  }

  private async findUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  sanitizeUser(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshToken, otpCode, resetPasswordToken, ...safe } = user as any;
    return safe;
  }
}
