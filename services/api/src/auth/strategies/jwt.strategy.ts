import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        try {
          const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          if (!token) {
            return done(new UnauthorizedException('No token provided'), null);
          }

          // Verify Supabase token
          await this.supabase.verifyToken(token);

          // Return dummy secret (token already verified)
          done(null, 'supabase-verified');
        } catch (error) {
          done(new UnauthorizedException('Invalid token'), null);
        }
      },
    });
  }

  async validate(payload: any) {
    // Extract user ID from Supabase token (sub claim)
    const supabaseUserId = payload.sub;

    if (!supabaseUserId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Find user in database by Supabase auth ID
    const user = await this.prisma.user.findUnique({
      where: { authUserId: supabaseUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user for request context
    return {
      id: user.id,
      authUserId: user.authUserId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
