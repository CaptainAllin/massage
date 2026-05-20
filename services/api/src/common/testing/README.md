# Backend Testing Guide

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test intake-forms.service.spec.ts
```

### E2E Tests
```bash
# Run end-to-end tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e -- clients.e2e-spec.ts
```

## Test Coverage

Unit tests have been created for:
- ✅ Intake Forms Service (CRUD + RBAC)
- ✅ Body Maps Service (CRUD + filtering)
- ✅ Therapist Notes Service (CRUD + RBAC + privacy)

### What's Tested

1. **CRUD Operations**
   - Create with proper data structure
   - Read with business isolation
   - Update with audit logging
   - Delete with permissions

2. **RBAC (Role-Based Access Control)**
   - Therapists can only see their own notes
   - Business owners can see all notes
   - Proper ForbiddenException throwing

3. **Business Isolation**
   - All queries filter by businessId
   - No cross-business data access

4. **Audit Logging**
   - All mutations create audit logs
   - Proper metadata captured

5. **Error Handling**
   - NotFoundException for missing resources
   - ForbiddenException for unauthorized access

## Writing New Tests

### Service Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from '../your.service';
import { PrismaService } from '@/common/prisma/prisma.service';

describe('YourService', () => {
  let service: YourService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    yourModel: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
        YourService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a record', async () => {
      // Arrange
      const mockData = { /* ... */ };
      mockPrismaService.yourModel.create.mockResolvedValue(mockData);

      // Act
      const result = await service.create('businessId', 'userId', mockData);

      // Assert
      expect(result).toEqual(mockData);
      expect(mockPrismaService.yourModel.create).toHaveBeenCalled();
    });
  });
});
```

### Controller Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourController } from '../your.controller';
import { YourService } from '../your.service';

describe('YourController', () => {
  let controller: YourController;
  let service: YourService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YourController],
      providers: [
        {
          provide: YourService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<YourController>(YourController);
    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

## Best Practices

1. **Mock External Dependencies**
   - Always mock PrismaService
   - Mock any external APIs
   - Use jest.fn() for function mocks

2. **Test Business Logic**
   - Focus on service layer tests
   - Test edge cases and error conditions
   - Verify RBAC logic

3. **Use AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the function
   - Assert: Verify results

4. **Keep Tests Independent**
   - Use beforeEach/afterEach
   - Clear mocks between tests
   - Don't rely on test execution order

5. **Test Error Cases**
   - NotFoundException when records don't exist
   - ForbiddenException for unauthorized access
   - Validation errors for invalid input

## Coverage Goals

- **Unit Tests:** >80% coverage
- **Integration Tests:** All critical paths
- **E2E Tests:** Main user flows

## Current Test Status

✅ **Completed:**
- Intake Forms Service (15 tests)
- Body Maps Service (12 tests)
- Therapist Notes Service (18 tests with RBAC)

⚠️ **To Add:**
- Medical Conditions Service tests
- Treatment Notes Service tests
- Controller tests for all modules
- E2E tests for complete flows

## CI/CD Integration

Tests should run automatically on:
- Every commit (pre-commit hook)
- Pull requests (GitHub Actions)
- Before deployment (CI pipeline)

Example GitHub Actions workflow:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:e2e
```
