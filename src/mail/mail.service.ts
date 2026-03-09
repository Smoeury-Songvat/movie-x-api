import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendOtpVerification(
    name: string,
    email: string,
    otp: string,
  ): Promise<void> {
    await this.send(email, 'Verify Your Email', 'otp-verification', {
      name,
      otp,
      expiryMinutes: 10,
      appName: 'MovieApp',
    });
  }

  async sendPasswordReset(
    name: string,
    email: string,
    otp: string,
  ): Promise<void> {
    await this.send(email, 'Reset Your Password', 'password-reset', {
      name,
      otp,
      expiryMinutes: 10,
      appName: 'MovieApp',
    });
  }

  async sendWelcome(name: string, email: string): Promise<void> {
    await this.send(email, 'Welcome to MovieApp 🎬', 'welcome', {
      name,
      appName: 'MovieApp',
    });
  }

  private async send(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,   // resolves to src/mail/templates/<template>.hbs
        context,
      });
      this.logger.log(`Email "${subject}" sent to ${to}`);
    } catch (err) {
      // Log but don't expose SMTP errors to API callers
      this.logger.error(`Failed to send email to ${to}: ${err instanceof Error ? err.message : String(err)}`);
      throw new Error('Email delivery failed. Please try again.');
    }
  }
}
