import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IntakeFormsService } from '../intake-forms.service';
import { PrismaService } from '@/common/prisma/prisma.service';

describe('IntakeFormsService', () => {
  let service: IntakeFormsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    intakeForm: {
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
        IntakeFormsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IntakeFormsService>(IntakeFormsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an intake form', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const formData = {
        clientId: 'client-123',
        templateId: 'template-123',
        formData: { question1: 'answer1' },
      };

      const mockIntakeForm = {
        id: 'form-123',
        ...formData,
        businessId,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.intakeForm.create.mockResolvedValue(mockIntakeForm);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.create(businessId, userId, formData);

      expect(result).toEqual(mockIntakeForm);
      expect(mockPrismaService.intakeForm.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessId,
          clientId: formData.clientId,
          templateId: formData.templateId,
          formData: formData.formData,
        }),
        include: expect.any(Object),
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          businessId,
          action: 'INTAKE_FORM_SUBMITTED',
          entityType: 'IntakeForm',
          entityId: mockIntakeForm.id,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated intake forms', async () => {
      const businessId = 'business-123';
      const mockForms = [
        { id: 'form-1', clientId: 'client-1' },
        { id: 'form-2', clientId: 'client-2' },
      ];

      mockPrismaService.intakeForm.findMany.mockResolvedValue(mockForms);
      mockPrismaService.intakeForm.count.mockResolvedValue(2);

      const result = await service.findAll(businessId, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockForms);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by clientId when provided', async () => {
      const businessId = 'business-123';
      const clientId = 'client-123';

      mockPrismaService.intakeForm.findMany.mockResolvedValue([]);
      mockPrismaService.intakeForm.count.mockResolvedValue(0);

      await service.findAll(businessId, { clientId });

      expect(mockPrismaService.intakeForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            clientId,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('should return an intake form by id', async () => {
      const formId = 'form-123';
      const businessId = 'business-123';
      const mockForm = { id: formId, businessId };

      mockPrismaService.intakeForm.findFirst.mockResolvedValue(mockForm);

      const result = await service.findById(formId, businessId);

      expect(result).toEqual(mockForm);
      expect(mockPrismaService.intakeForm.findFirst).toHaveBeenCalledWith({
        where: { id: formId, businessId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if form not found', async () => {
      const formId = 'form-123';
      const businessId = 'business-123';

      mockPrismaService.intakeForm.findFirst.mockResolvedValue(null);

      await expect(service.findById(formId, businessId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update an intake form', async () => {
      const formId = 'form-123';
      const businessId = 'business-123';
      const userId = 'user-123';
      const updateData = { formData: { question1: 'new answer' } };

      const mockForm = { id: formId, businessId };
      const mockUpdatedForm = { ...mockForm, ...updateData };

      mockPrismaService.intakeForm.findFirst.mockResolvedValue(mockForm);
      mockPrismaService.intakeForm.update.mockResolvedValue(mockUpdatedForm);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.update(formId, businessId, userId, updateData);

      expect(result).toEqual(mockUpdatedForm);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'INTAKE_FORM_UPDATED',
        }),
      });
    });
  });

  describe('delete', () => {
    it('should delete an intake form', async () => {
      const formId = 'form-123';
      const businessId = 'business-123';
      const userId = 'user-123';

      const mockForm = { id: formId, businessId };

      mockPrismaService.intakeForm.findFirst.mockResolvedValue(mockForm);
      mockPrismaService.intakeForm.delete.mockResolvedValue(mockForm);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.delete(formId, businessId, userId);

      expect(result).toEqual(mockForm);
      expect(mockPrismaService.intakeForm.delete).toHaveBeenCalledWith({
        where: { id: formId },
      });
    });
  });
});
