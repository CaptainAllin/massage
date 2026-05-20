import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class TherapistsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: any) {
    const therapist = await this.prisma.therapist.create({
      data: {
        ...data,
        businessId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'THERAPIST_CREATED',
        entityType: 'Therapist',
        entityId: therapist.id,
      },
    });

    return therapist;
  }

  async findAll(businessId: string) {
    return this.prisma.therapist.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, businessId: string) {
    const therapist = await this.prisma.therapist.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!therapist) {
      throw new NotFoundException(`Therapist with ID ${id} not found`);
    }

    return therapist;
  }

  async update(id: string, businessId: string, userId: string, data: any) {
    await this.findById(id, businessId);

    const therapist = await this.prisma.therapist.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'THERAPIST_UPDATED',
        entityType: 'Therapist',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return therapist;
  }
}
