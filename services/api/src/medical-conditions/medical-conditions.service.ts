import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class MedicalConditionsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: {
    clientId: string;
    name: string;
    diagnosisDate?: Date;
    status?: string;
    severity?: string;
    notes?: string;
    treatmentPlan?: string;
  }) {
    const condition = await this.prisma.medicalCondition.create({
      data: {
        businessId,
        clientId: data.clientId,
        name: data.name,
        diagnosisDate: data.diagnosisDate,
        status: data.status || 'active',
        severity: data.severity,
        notes: data.notes,
        treatmentPlan: data.treatmentPlan,
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
        action: 'MEDICAL_CONDITION_CREATED',
        entityType: 'MedicalCondition',
        entityId: condition.id,
        metadata: { clientId: data.clientId, name: data.name },
      },
    });

    return condition;
  }

  async findAll(businessId: string, filters?: {
    clientId?: string;
    status?: string;
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

    if (filters?.status) {
      where.status = filters.status;
    }

    const [conditions, total] = await Promise.all([
      this.prisma.medicalCondition.findMany({
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
        orderBy: [
          { status: 'asc' }, // Active conditions first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.medicalCondition.count({ where }),
    ]);

    return {
      data: conditions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, businessId: string) {
    const condition = await this.prisma.medicalCondition.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        client: true,
      },
    });

    if (!condition) {
      throw new NotFoundException(`Medical condition with ID ${id} not found`);
    }

    return condition;
  }

  async update(id: string, businessId: string, userId: string, data: {
    name?: string;
    diagnosisDate?: Date;
    status?: string;
    severity?: string;
    notes?: string;
    treatmentPlan?: string;
    resolvedAt?: Date;
  }) {
    await this.findById(id, businessId);

    // If status is being changed to "resolved", set resolvedAt
    if (data.status === 'resolved' && !data.resolvedAt) {
      data.resolvedAt = new Date();
    }

    const condition = await this.prisma.medicalCondition.update({
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
        action: 'MEDICAL_CONDITION_UPDATED',
        entityType: 'MedicalCondition',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return condition;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    const condition = await this.prisma.medicalCondition.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'MEDICAL_CONDITION_DELETED',
        entityType: 'MedicalCondition',
        entityId: id,
      },
    });

    return condition;
  }
}
