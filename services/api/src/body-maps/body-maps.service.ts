import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class BodyMapsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: {
    clientId: string;
    appointmentId?: string;
    treatmentNoteId?: string;
    view: string;
    regions: any[];
    notes?: string;
  }) {
    const bodyMap = await this.prisma.bodyMap.create({
      data: {
        businessId,
        clientId: data.clientId,
        appointmentId: data.appointmentId,
        treatmentNoteId: data.treatmentNoteId,
        view: data.view,
        regions: data.regions,
        notes: data.notes,
      },
      include: {
        client: {
          select: {
            id: true,
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
        action: 'BODY_MAP_CREATED',
        entityType: 'BodyMap',
        entityId: bodyMap.id,
        metadata: { clientId: data.clientId },
      },
    });

    return bodyMap;
  }

  async findAll(businessId: string, filters?: {
    clientId?: string;
    appointmentId?: string;
    treatmentNoteId?: string;
    view?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      businessId,
    };

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.appointmentId) {
      where.appointmentId = filters.appointmentId;
    }

    if (filters?.treatmentNoteId) {
      where.treatmentNoteId = filters.treatmentNoteId;
    }

    if (filters?.view) {
      where.view = filters.view;
    }

    const [bodyMaps, total] = await Promise.all([
      this.prisma.bodyMap.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.bodyMap.count({ where }),
    ]);

    return {
      data: bodyMaps,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, businessId: string) {
    const bodyMap = await this.prisma.bodyMap.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        client: true,
        appointment: true,
        treatmentNote: true,
      },
    });

    if (!bodyMap) {
      throw new NotFoundException(`Body map with ID ${id} not found`);
    }

    return bodyMap;
  }

  async update(id: string, businessId: string, userId: string, data: {
    view?: string;
    regions?: any[];
    notes?: string;
  }) {
    await this.findById(id, businessId);

    const bodyMap = await this.prisma.bodyMap.update({
      where: { id },
      data,
      include: {
        client: {
          select: {
            id: true,
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
        action: 'BODY_MAP_UPDATED',
        entityType: 'BodyMap',
        entityId: id,
      },
    });

    return bodyMap;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    const bodyMap = await this.prisma.bodyMap.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'BODY_MAP_DELETED',
        entityType: 'BodyMap',
        entityId: id,
      },
    });

    return bodyMap;
  }
}
