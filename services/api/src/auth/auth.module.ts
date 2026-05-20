import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ClerkWebhookController } from './webhooks/clerk-webhook.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [ClerkWebhookController],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
