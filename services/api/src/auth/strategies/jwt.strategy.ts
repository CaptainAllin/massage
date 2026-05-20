import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { clerkClient } from '@clerk/backend';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        // For Clerk tokens, we verify them directly with Clerk
        try {
          const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          if (!token) {
            return done(new UnauthorizedException('No token provided'), null);
          }

          // Verify Clerk session token
          await clerkClient.verifyToken(token, {
            secretKey: configService.get('CLERK_SECRET_KEY'),
          });

          // Return a dummy secret as we've already verified the token
          done(null, 'clerk-verified');
        } catch (error) {
          done(new UnauthorizedException('Invalid token'), null);
        }
      },
    });
  }

  async validate(payload: any) {
    // Extract user ID from Clerk token (sub claim)
    const clerkUserId = payload.sub;

    if (!clerkUserId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Find user in our database by Clerk ID
    const user = await this.prisma.user.findUnique({
      where: { authProviderId: clerkUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user object for request context
    return {
      id: user.id,
      authProviderId: user.authProviderId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
