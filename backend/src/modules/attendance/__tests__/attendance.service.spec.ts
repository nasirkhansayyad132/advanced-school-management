import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../attendance.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TeachersService } from '../../teachers/teachers.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const createMockPrismaService = () => ({
    attendanceEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    attendanceSnapshot: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    attendanceSessionSummary: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  const mockTeachersService = {
    findByUserId: jest.fn(),
    getAssignedClasses: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();
    mockPrismaService.$transaction.mockImplementation((callback: (tx: typeof mockPrismaService) => Promise<unknown>) => callback(mockPrismaService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TeachersService,
          useValue: mockTeachersService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);

    jest.clearAllMocks();
  });

  describe('submitAttendance', () => {
    const mockTeacher = {
      id: 'teacher-1',
      userId: 'user-1',
      classAssignments: [{ classId: 'class-1' }],
    };

    const validSubmitDto = {
      idempotencyKey: 'test-key-123',
      classId: 'class-1',
      date: '2024-01-15',
      session: 'MORNING',
      records: [
        { studentId: 'student-1', status: 'PRESENT' },
        { studentId: 'student-2', status: 'ABSENT' },
      ],
      clientCreatedAt: '2024-01-15T08:00:00Z',
    };

    it('should successfully submit attendance for assigned class', async () => {
      mockTeachersService.findByUserId.mockResolvedValue(mockTeacher);
      mockPrismaService.attendanceEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.attendanceSessionSummary.findUnique.mockResolvedValue(null);
      mockPrismaService.attendanceEvent.create.mockResolvedValue({
        id: 'event-1',
        createdAt: new Date(),
      });
      mockPrismaService.attendanceSnapshot.upsert.mockResolvedValue({});
      mockPrismaService.attendanceSessionSummary.upsert.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.submitAttendance('user-1', 'TEACHER' as any, validSubmitDto);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('event-1');
    });

    it('should return existing event for idempotent submission', async () => {
      const existingEvent = {
        id: 'existing-event-1',
        createdAt: new Date(),
      };
      mockPrismaService.attendanceEvent.findUnique.mockResolvedValue(existingEvent);

      const result = await service.submitAttendance('user-1', 'TEACHER' as any, validSubmitDto);

      expect(result.success).toBe(true);
      expect(result.eventId).toBe('existing-event-1');
      expect((result as { message?: string }).message).toBe('Already processed');
    });

    it('should throw NotFoundException if teacher profile not found', async () => {
      mockTeachersService.findByUserId.mockResolvedValue(null);
      mockPrismaService.attendanceEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAttendance('user-1', 'TEACHER' as any, validSubmitDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher not assigned to class', async () => {
      const teacherWithDifferentClass = {
        ...mockTeacher,
        classAssignments: [{ classId: 'different-class' }],
      };
      mockTeachersService.findByUserId.mockResolvedValue(teacherWithDifferentClass);
      mockPrismaService.attendanceEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAttendance('user-1', 'TEACHER' as any, validSubmitDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if session is locked', async () => {
      mockTeachersService.findByUserId.mockResolvedValue(mockTeacher);
      mockPrismaService.attendanceEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.attendanceSessionSummary.findUnique.mockResolvedValue({
        isLocked: true,
      });

      await expect(
        service.submitAttendance('user-1', 'TEACHER' as any, validSubmitDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to submit for any class', async () => {
      const teacherWithDifferentClass = {
        ...mockTeacher,
        classAssignments: [{ classId: 'different-class' }],
      };
      mockTeachersService.findByUserId.mockResolvedValue(teacherWithDifferentClass);
      mockPrismaService.attendanceEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.attendanceSessionSummary.findUnique.mockResolvedValue(null);
      mockPrismaService.attendanceEvent.create.mockResolvedValue({
        id: 'event-1',
        createdAt: new Date(),
      });
      mockPrismaService.attendanceSnapshot.upsert.mockResolvedValue({});
      mockPrismaService.attendanceSessionSummary.upsert.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.submitAttendance('user-1', 'ADMIN' as any, validSubmitDto);

      expect(result.success).toBe(true);
    });
  });

  describe('lockSession', () => {
    const lockDto = {
      classId: 'class-1',
      date: '2024-01-15',
      session: 'MORNING',
      reason: 'End of day lock',
    };

    it('should successfully lock an unlocked session', async () => {
      mockPrismaService.attendanceSessionSummary.findUnique.mockResolvedValue({
        isLocked: false,
      });
      mockPrismaService.attendanceSessionSummary.update.mockResolvedValue({});
      mockPrismaService.attendanceSnapshot.updateMany.mockResolvedValue({});
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.lockSession('user-1', lockDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Session locked');
    });

    it('should throw NotFoundException if session not found', async () => {
      mockPrismaService.attendanceSessionSummary.findUnique.mockResolvedValue(null);

      await expect(service.lockSession('user-1', lockDto)).rejects.toThrow(NotFoundException);
    });
  });
});
