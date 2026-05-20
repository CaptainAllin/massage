import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class IntakeFormTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: {
    name: string;
    description?: string;
    fields: any[];
    isDefault?: boolean;
  }) {
    // If setting as default, unset other default templates
    if (data.isDefault) {
      await this.prisma.intakeFormTemplate.updateMany({
        where: {
          businessId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await this.prisma.intakeFormTemplate.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        fields: data.fields,
        isDefault: data.isDefault || false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'INTAKE_FORM_TEMPLATE_CREATED',
        entityType: 'IntakeFormTemplate',
        entityId: template.id,
      },
    });

    return template;
  }

  async findAll(businessId: string, filters?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      businessId,
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [templates, total] = await Promise.all([
      this.prisma.intakeFormTemplate.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.intakeFormTemplate.count({ where }),
    ]);

    return {
      data: templates,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, businessId: string) {
    const template = await this.prisma.intakeFormTemplate.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!template) {
      throw new NotFoundException(`Intake form template with ID ${id} not found`);
    }

    return template;
  }

  async update(id: string, businessId: string, userId: string, data: {
    name?: string;
    description?: string;
    fields?: any[];
    isActive?: boolean;
    isDefault?: boolean;
  }) {
    await this.findById(id, businessId);

    // If setting as default, unset other default templates
    if (data.isDefault) {
      await this.prisma.intakeFormTemplate.updateMany({
        where: {
          businessId,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await this.prisma.intakeFormTemplate.update({
      where: { id },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'INTAKE_FORM_TEMPLATE_UPDATED',
        entityType: 'IntakeFormTemplate',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return template;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    // Check if template is in use
    const usageCount = await this.prisma.intakeForm.count({
      where: { templateId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete template. It is currently used by ${usageCount} intake form(s).`
      );
    }

    const template = await this.prisma.intakeFormTemplate.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'INTAKE_FORM_TEMPLATE_DELETED',
        entityType: 'IntakeFormTemplate',
        entityId: id,
      },
    });

    return template;
  }
}
