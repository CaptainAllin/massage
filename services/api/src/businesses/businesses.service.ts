import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Business, UserRole } from '@massage/types';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: Partial<Business>) {
    // Check if user already owns a business
    const existingBusiness = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (existingBusiness) {
      throw new ForbiddenException('User already owns a business');
    }

    const business = await this.prisma.business.create({
      data: {
        ...data,
        ownerId,
      } as any,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: ownerId,
        businessId: business.id,
        action: 'BUSINESS_CREATED',
        entityType: 'Business',
        entityId: business.id,
      },
    });

    return business;
  }

  async findAll(userId: string, userRole: UserRole) {
    // Super admins can see all businesses
    if (userRole === UserRole.SUPER_ADMIN) {
      return this.prisma.business.findMany({
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    // Business owners see their own business
    if (userRole === UserRole.BUSINESS_OWNER) {
      return this.prisma.business.findMany({
        where: { ownerId: userId },
      });
    }

    // Other roles see businesses they're associated with
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        therapist: {
          include: {
            business: true,
          },
        },
      },
    });

    if (user?.therapist) {
      return [user.therapist.business];
    }

    return [];
  }

  async findById(id: string, userId: string, userRole: UserRole) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    // Check access permissions
    if (userRole !== UserRole.SUPER_ADMIN && business.ownerId !== userId) {
      // Check if user is associated with this business
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          therapist: true,
        },
      });

      if (!user?.therapist || user.therapist.businessId !== id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return business;
  }

  async update(id: string, userId: string, userRole: UserRole, data: Partial<Business>) {
    // Check if user has permission to update
    const business = await this.findById(id, userId, userRole);

    if (userRole !== UserRole.SUPER_ADMIN && business.ownerId !== userId) {
      throw new ForbiddenException('Only the business owner can update business information');
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: data as any,
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId: id,
        action: 'BUSINESS_UPDATED',
        entityType: 'Business',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  }
}
