import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BodyMapsService } from '../body-maps.service';
import { PrismaService } from '@/common/prisma/prisma.service';

describe('BodyMapsService', () => {
  let service: BodyMapsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    bodyMap: {
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
        BodyMapsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BodyMapsService>(BodyMapsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a body map', async () => {
      const businessId = 'business-123';
      const userId = 'user-123';
      const bodyMapData = {
        clientId: 'client-123',
        view: 'front',
        regions: [
          { name: 'shoulder', coordinates: 'path-data', painLevel: 5 },
        ],
        notes: 'Test notes',
      };

      const mockBodyMap = {
        id: 'bodymap-123',
        ...bodyMapData,
        businessId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.bodyMap.create.mockResolvedValue(mockBodyMap);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.create(businessId, userId, bodyMapData);

      expect(result).toEqual(mockBodyMap);
      expect(mockPrismaService.bodyMap.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          businessId,
          clientId: bodyMapData.clientId,
          view: bodyMapData.view,
          regions: bodyMapData.regions,
        }),
        include: expect.any(Object),
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'BODY_MAP_CREATED',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated body maps', async () => {
      const businessId = 'business-123';
      const mockBodyMaps = [
        { id: 'map-1', clientId: 'client-1', view: 'front' },
        { id: 'map-2', clientId: 'client-2', view: 'back' },
      ];

      mockPrismaService.bodyMap.findMany.mockResolvedValue(mockBodyMaps);
      mockPrismaService.bodyMap.count.mockResolvedValue(2);

      const result = await service.findAll(businessId);

      expect(result.data).toEqual(mockBodyMaps);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by view when provided', async () => {
      const businessId = 'business-123';
      const view = 'front';

      mockPrismaService.bodyMap.findMany.mockResolvedValue([]);
      mockPrismaService.bodyMap.count.mockResolvedValue(0);

      await service.findAll(businessId, { view });

      expect(mockPrismaService.bodyMap.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            view,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('should return a body map by id', async () => {
      const bodyMapId = 'map-123';
      const businessId = 'business-123';
      const mockBodyMap = { id: bodyMapId, businessId };

      mockPrismaService.bodyMap.findFirst.mockResolvedValue(mockBodyMap);

      const result = await service.findById(bodyMapId, businessId);

      expect(result).toEqual(mockBodyMap);
    });

    it('should throw NotFoundException if body map not found', async () => {
      mockPrismaService.bodyMap.findFirst.mockResolvedValue(null);

      await expect(service.findById('map-123', 'business-123')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update a body map', async () => {
      const bodyMapId = 'map-123';
      const businessId = 'business-123';
      const userId = 'user-123';
      const updateData = {
        regions: [{ name: 'neck', coordinates: 'new-path', painLevel: 7 }],
      };

      const mockBodyMap = { id: bodyMapId, businessId };
      const mockUpdatedBodyMap = { ...mockBodyMap, ...updateData };

      mockPrismaService.bodyMap.findFirst.mockResolvedValue(mockBodyMap);
      mockPrismaService.bodyMap.update.mockResolvedValue(mockUpdatedBodyMap);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.update(bodyMapId, businessId, userId, updateData);

      expect(result).toEqual(mockUpdatedBodyMap);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'BODY_MAP_UPDATED',
        }),
      });
    });
  });
});
