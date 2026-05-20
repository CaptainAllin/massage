import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TherapistNotesService } from '../therapist-notes.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UserRole } from '@massage/types';

describe('TherapistNotesService', () => {
  let service: TherapistNotesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    therapistNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TherapistNotesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TherapistNotesService>(TherapistNotesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a therapist note', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const therapistId = 'therapist-123';
      const noteData = {
        clientId: 'client-123',
        content: 'Private note content',
        isPinned: false,
      };

      const mockNote = {
        id: 'note-123',
        ...noteData,
        businessId,
        therapistId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.therapistNote.create.mockResolvedValue(mockNote);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.create(businessId, userId, therapistId, noteData);

      expect(result).toEqual(mockNote);
      expect(mockPrismaService.therapistNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessId,
          therapistId,
          clientId: noteData.clientId,
          content: noteData.content,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll - RBAC', () => {
    it('should filter notes by therapistId for THERAPIST role', async () => {
      const businessId = 'business-123';
      const therapistId = 'therapist-123';

      mockPrismaService.therapistNote.findMany.mockResolvedValue([]);
      mockPrismaService.therapistNote.count.mockResolvedValue(0);

      await service.findAll(businessId, UserRole.THERAPIST, therapistId);

      expect(mockPrismaService.therapistNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            therapistId, // Should filter by therapist
          }),
        })
      );
    });

    it('should not filter by therapistId for BUSINESS_OWNER role', async () => {
      const businessId = 'business-123';
      const therapistId = 'therapist-123';

      mockPrismaService.therapistNote.findMany.mockResolvedValue([]);
      mockPrismaService.therapistNote.count.mockResolvedValue(0);

      await service.findAll(businessId, UserRole.BUSINESS_OWNER, therapistId);

      expect(mockPrismaService.therapistNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            // Should NOT have therapistId filter
          }),
        })
      );
    });
  });

  describe('findById - RBAC', () => {
    it('should throw ForbiddenException if therapist tries to access another therapist note', async () => {
      const noteId = 'note-123';
      const businessId = 'business-123';
      const therapistId = 'therapist-123';
      const otherTherapistId = 'other-therapist-456';

      const mockNote = {
        id: noteId,
        businessId,
        therapistId: otherTherapistId, // Different therapist
      };

      mockPrismaService.therapistNote.findFirst.mockResolvedValue(mockNote);

      await expect(
        service.findById(noteId, businessId, UserRole.THERAPIST, therapistId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow BUSINESS_OWNER to access any note', async () => {
      const noteId = 'note-123';
      const businessId = 'business-123';
      const therapistId = 'therapist-123';

      const mockNote = {
        id: noteId,
        businessId,
        therapistId: 'other-therapist-456',
      };

      mockPrismaService.therapistNote.findFirst.mockResolvedValue(mockNote);

      const result = await service.findById(
        noteId,
        businessId,
        UserRole.BUSINESS_OWNER,
        therapistId
      );

      expect(result).toEqual(mockNote);
    });
  });

  describe('togglePin', () => {
    it('should toggle isPinned status', async () => {
      const noteId = 'note-123';
      const businessId = 'business-123';
      const userId = 'user-123';
      const therapistId = 'therapist-123';

      const mockNote = {
        id: noteId,
        businessId,
        therapistId,
        isPinned: false,
      };

      const mockUpdatedNote = { ...mockNote, isPinned: true };

      mockPrismaService.therapistNote.findFirst.mockResolvedValue(mockNote);
      mockPrismaService.therapistNote.update.mockResolvedValue(mockUpdatedNote);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.togglePin(
        noteId,
        businessId,
        userId,
        UserRole.THERAPIST,
        therapistId
      );

      expect(result.isPinned).toBe(true);
      expect(mockPrismaService.therapistNote.update).toHaveBeenCalledWith({
        where: { id: noteId },
        data: { isPinned: true },
        include: expect.any(Object),
      });
    });
  });

  describe('delete - RBAC', () => {
    it('should throw ForbiddenException if therapist tries to delete another therapist note', async () => {
      const noteId = 'note-123';
      const businessId = 'business-123';
      const userId = 'user-123';
      const therapistId = 'therapist-123';

      const mockNote = {
        id: noteId,
        businessId,
        therapistId: 'other-therapist-456',
      };

      mockPrismaService.therapistNote.findFirst.mockResolvedValue(mockNote);

      await expect(
        service.delete(noteId, businessId, userId, UserRole.THERAPIST, therapistId)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
