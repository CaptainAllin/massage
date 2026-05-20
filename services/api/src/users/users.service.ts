import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { User } from '@massage/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as User;
  }

  async findByAuthProviderId(authProviderId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { authProviderId },
    });

    return user as User | null;
  }

  async updateProfile(id: string, data: Partial<User>) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: id,
        action: 'USER_PROFILE_UPDATED',
        entityType: 'User',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return user;
  }
}
