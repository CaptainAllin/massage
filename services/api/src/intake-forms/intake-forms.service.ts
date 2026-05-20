import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class IntakeFormsService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: {
    clientId: string;
    templateId?: string;
    formData: any;
  }) {
    const intakeForm = await this.prisma.intakeForm.create({
      data: {
        businessId,
        clientId: data.clientId,
        templateId: data.templateId,
        formData: data.formData,
      },
      include: {
        client: true,
        template: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'INTAKE_FORM_SUBMITTED',
        entityType: 'IntakeForm',
        entityId: intakeForm.id,
        metadata: { clientId: data.clientId },
      },
    });

    return intakeForm;
  }

  async findAll(businessId: string, filters?: {
    clientId?: string;
    templateId?: string;
    startDate?: Date;
    endDate?: Date;
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

    if (filters?.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.submittedAt = {};
      if (filters.startDate) {
        where.submittedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.submittedAt.lte = filters.endDate;
      }
    }

    const [intakeForms, total] = await Promise.all([
      this.prisma.intakeForm.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.intakeForm.count({ where }),
    ]);

    return {
      data: intakeForms,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, businessId: string) {
    const intakeForm = await this.prisma.intakeForm.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        client: true,
        template: true,
      },
    });

    if (!intakeForm) {
      throw new NotFoundException(`Intake form with ID ${id} not found`);
    }

    return intakeForm;
  }

  async update(id: string, businessId: string, userId: string, data: {
    formData?: any;
  }) {
    await this.findById(id, businessId);

    const intakeForm = await this.prisma.intakeForm.update({
      where: { id },
      data: {
        formData: data.formData,
      },
      include: {
        client: true,
        template: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'INTAKE_FORM_UPDATED',
        entityType: 'IntakeForm',
        entityId: id,
      },
    });

    return intakeForm;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    const intakeForm = await this.prisma.intakeForm.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'INTAKE_FORM_DELETED',
        entityType: 'IntakeForm',
        entityId: id,
      },
    });

    return intakeForm;
  }
}
