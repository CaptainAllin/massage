import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserRole } from '@massage/types';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: any) {
    const client = await this.prisma.client.create({
      data: {
        ...data,
        businessId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'CLIENT_CREATED',
        entityType: 'Client',
        entityId: client.id,
      },
    });

    return client;
  }

  async findAll(businessId: string, filters?: any) {
    return this.prisma.client.findMany({
      where: {
        businessId,
        isActive: filters?.isActive !== undefined ? filters.isActive : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, businessId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: string, businessId: string, userId: string, data: any) {
    await this.findById(id, businessId);

    const client = await this.prisma.client.update({
      where: { id },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'CLIENT_UPDATED',
        entityType: 'Client',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return client;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    const client = await this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'CLIENT_DELETED',
        entityType: 'Client',
        entityId: id,
      },
    });

    return client;
  }
}
