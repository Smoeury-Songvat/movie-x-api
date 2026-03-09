import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { JwtStrategy } from './middlewares/jwt.strategy';
import { JwtRefreshStrategy } from './middlewares/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module';
import { User } from '../entities/user.entity';
import { OtpRecord } from '../entities/otp-record.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Access token default — refresh token uses its own secret in strategy
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as any,
        },
      }),
    }),
    TypeOrmModule.forFeature([User, OtpRecord]),
    MailModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
