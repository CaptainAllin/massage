import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class TreatmentNotesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, data: {
    appointmentId: string;
    clientId: string;
    therapistId: string;
    subjectiveFindings?: string;
    objectiveFindings?: string;
    assessment?: string;
    plan?: string;
    areasWorked?: string[];
    techniques?: string[];
    sessionDuration?: number;
    followUpDate?: Date;
  }) {
    const note = await this.prisma.treatmentNote.create({
      data: {
        businessId,
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        therapistId: data.therapistId,
        subjectiveFindings: data.subjectiveFindings,
        objectiveFindings: data.objectiveFindings,
        assessment: data.assessment,
        plan: data.plan,
        areasWorked: data.areasWorked || [],
        techniques: data.techniques || [],
        sessionDuration: data.sessionDuration,
        followUpDate: data.followUpDate,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        therapist: {
          select: {
            id: true,
            userId: true,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        appointment: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'TREATMENT_NOTE_CREATED',
        entityType: 'TreatmentNote',
        entityId: note.id,
        metadata: { clientId: data.clientId, appointmentId: data.appointmentId },
      },
    });

    return note;
  }

  async findAll(businessId: string, filters?: {
    clientId?: string;
    therapistId?: string;
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

    if (filters?.therapistId) {
      where.therapistId = filters.therapistId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [notes, total] = await Promise.all([
      this.prisma.treatmentNote.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          therapist: {
            select: {
              id: true,
              userId: true,
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          appointment: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
            },
          },
          bodyMaps: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.treatmentNote.count({ where }),
    ]);

    return {
      data: notes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, businessId: string) {
    const note = await this.prisma.treatmentNote.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
        appointment: true,
        bodyMaps: true,
      },
    });

    if (!note) {
      throw new NotFoundException(`Treatment note with ID ${id} not found`);
    }

    return note;
  }

  async update(id: string, businessId: string, userId: string, data: {
    subjectiveFindings?: string;
    objectiveFindings?: string;
    assessment?: string;
    plan?: string;
    areasWorked?: string[];
    techniques?: string[];
    sessionDuration?: number;
    followUpDate?: Date;
  }) {
    await this.findById(id, businessId);

    const note = await this.prisma.treatmentNote.update({
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
        therapist: {
          select: {
            id: true,
            userId: true,
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        bodyMaps: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'TREATMENT_NOTE_UPDATED',
        entityType: 'TreatmentNote',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return note;
  }

  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    const note = await this.prisma.treatmentNote.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'TREATMENT_NOTE_DELETED',
        entityType: 'TreatmentNote',
        entityId: id,
      },
    });

    return note;
  }
}
