import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserRole } from '@massage/types';

@Injectable()
export class TherapistNotesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, userId: string, therapistId: string, data: {
    clientId: string;
    content: string;
    isPinned?: boolean;
  }) {
    const note = await this.prisma.therapistNote.create({
      data: {
        businessId,
        clientId: data.clientId,
        therapistId,
        content: data.content,
        isPinned: data.isPinned || false,
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
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'THERAPIST_NOTE_CREATED',
        entityType: 'TherapistNote',
        entityId: note.id,
        metadata: { clientId: data.clientId },
      },
    });

    return note;
  }

  async findAll(
    businessId: string,
    userRole: UserRole,
    therapistId: string | null,
    filters?: {
      clientId?: string;
      isPinned?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      businessId,
    };

    // RBAC: Therapists can only see their own notes
    // BUSINESS_OWNER can see all notes in their business
    if (userRole === UserRole.THERAPIST && therapistId) {
      where.therapistId = therapistId;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.isPinned !== undefined) {
      where.isPinned = filters.isPinned;
    }

    const [notes, total] = await Promise.all([
      this.prisma.therapistNote.findMany({
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
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned notes first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.therapistNote.count({ where }),
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

  async findById(id: string, businessId: string, userRole: UserRole, therapistId: string | null) {
    const note = await this.prisma.therapistNote.findFirst({
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
      },
    });

    if (!note) {
      throw new NotFoundException(`Therapist note with ID ${id} not found`);
    }

    // RBAC: Therapists can only access their own notes
    if (userRole === UserRole.THERAPIST && note.therapistId !== therapistId) {
      throw new ForbiddenException('You can only access your own notes');
    }

    return note;
  }

  async update(
    id: string,
    businessId: string,
    userId: string,
    userRole: UserRole,
    therapistId: string | null,
    data: {
      content?: string;
      isPinned?: boolean;
    }
  ) {
    const existingNote = await this.findById(id, businessId, userRole, therapistId);

    // RBAC: Therapists can only update their own notes
    if (userRole === UserRole.THERAPIST && existingNote.therapistId !== therapistId) {
      throw new ForbiddenException('You can only update your own notes');
    }

    const note = await this.prisma.therapistNote.update({
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
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'THERAPIST_NOTE_UPDATED',
        entityType: 'TherapistNote',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return note;
  }

  async togglePin(
    id: string,
    businessId: string,
    userId: string,
    userRole: UserRole,
    therapistId: string | null
  ) {
    const note = await this.findById(id, businessId, userRole, therapistId);

    return this.update(id, businessId, userId, userRole, therapistId, {
      isPinned: !note.isPinned,
    });
  }

  async delete(
    id: string,
    businessId: string,
    userId: string,
    userRole: UserRole,
    therapistId: string | null
  ) {
    const existingNote = await this.findById(id, businessId, userRole, therapistId);

    // RBAC: Therapists can only delete their own notes
    if (userRole === UserRole.THERAPIST && existingNote.therapistId !== therapistId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    const note = await this.prisma.therapistNote.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'THERAPIST_NOTE_DELETED',
        entityType: 'TherapistNote',
        entityId: id,
      },
    });

    return note;
  }
}
