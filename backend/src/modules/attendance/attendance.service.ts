import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TeachersService } from '../teachers/teachers.service';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { EditAttendanceDto } from './dto/edit-attendance.dto';
import { LockSessionDto } from './dto/lock-session.dto';
import { SessionType, AttendanceStatus, AttendanceEventType, SessionStatus, UserRole } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teachersService: TeachersService,
  ) {}

  async getTeacherDashboard(userId: string, date: string) {
    const teacher = await this.teachersService.findByUserId(userId);
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const assignedClasses = await this.teachersService.getAssignedClasses(teacher.id);

    const classesWithStatus = await Promise.all(
      assignedClasses.map(async (classInfo) => {
        const morningSummary = await this.prisma.attendanceSessionSummary.findUnique({
          where: {
            classId_sessionType_date: {
              classId: classInfo.id,
              sessionType: SessionType.MORNING,
              date: targetDate,
            },
          },
        });

        const afternoonSummary = await this.prisma.attendanceSessionSummary.findUnique({
          where: {
            classId_sessionType_date: {
              classId: classInfo.id,
              sessionType: SessionType.AFTERNOON,
              date: targetDate,
            },
          },
        });

        return {
          id: classInfo.id,
          name: classInfo.name,
          section: classInfo.section,
          studentCount: classInfo.studentCount,
          isPrimary: classInfo.isPrimary,
          morning: morningSummary ? {
            status: morningSummary.status,
            submittedAt: morningSummary.submittedAt,
            presentCount: morningSummary.presentCount,
            absentCount: morningSummary.absentCount,
            isLocked: morningSummary.isLocked,
          } : {
            status: SessionStatus.NOT_STARTED,
            submittedAt: null,
            presentCount: 0,
            absentCount: 0,
            isLocked: false,
          },
          afternoon: afternoonSummary ? {
            status: afternoonSummary.status,
            submittedAt: afternoonSummary.submittedAt,
            presentCount: afternoonSummary.presentCount,
            absentCount: afternoonSummary.absentCount,
            isLocked: afternoonSummary.isLocked,
          } : {
            status: SessionStatus.NOT_STARTED,
            submittedAt: null,
            presentCount: 0,
            absentCount: 0,
            isLocked: false,
          },
        };
      }),
    );

    return {
      date,
      teacherId: teacher.id,
      classes: classesWithStatus,
    };
  }

  async getClassStudents(classId: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    const students = await this.prisma.student.findMany({
      where: {
        classId,
        isActive: true,
      },
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        gender: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return {
      classId,
      className: classEntity.name,
      section: classEntity.section,
      students,
      cachedAt: new Date().toISOString(),
    };
  }

  async getAttendanceState(classId: string, date: string, session: SessionType) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const summary = await this.prisma.attendanceSessionSummary.findUnique({
      where: {
        classId_sessionType_date: {
          classId,
          sessionType: session,
          date: targetDate,
        },
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const records = await this.prisma.attendanceSnapshot.findMany({
      where: {
        classId,
        sessionType: session,
        date: targetDate,
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });

    // Calculate edit window
    let canEdit = false;
    let editWindowEndsAt = null;
    
    if (summary?.submittedAt) {
      const editWindowMinutes = 120; // Default 2 hours, could be from settings
      const windowEnd = new Date(summary.submittedAt);
      windowEnd.setMinutes(windowEnd.getMinutes() + editWindowMinutes);
      canEdit = new Date() < windowEnd && !summary.isLocked;
      editWindowEndsAt = windowEnd.toISOString();
    }

    return {
      classId,
      date,
      session,
      status: summary?.status || SessionStatus.NOT_STARTED,
      isLocked: summary?.isLocked || false,
      submittedAt: summary?.submittedAt,
      submittedBy: summary?.submittedBy ? {
        id: summary.submittedBy.id,
        name: `${summary.submittedBy.firstName} ${summary.submittedBy.lastName}`,
      } : null,
      records: records.map((r) => ({
        studentId: r.studentId,
        studentName: `${r.student.firstName} ${r.student.lastName}`,
        admissionNo: r.student.admissionNo,
        status: r.status,
        earlyLeave: r.earlyLeaveTime ? {
          time: r.earlyLeaveTime,
          reason: r.earlyLeaveReason,
        } : null,
        notes: r.notes,
      })),
      canEdit,
      editWindowEndsAt,
    };
  }

  async submitAttendance(userId: string, userRole: UserRole, dto: SubmitAttendanceDto) {
    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);

    // Check idempotency
    const existingEvent = await this.prisma.attendanceEvent.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existingEvent) {
      return {
        success: true,
        eventId: existingEvent.id,
        syncedAt: existingEvent.createdAt,
        message: 'Already processed',
      };
    }

    // Get teacher
    const teacher = await this.teachersService.findByUserId(userId);
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    // Validate assignment
    const isAssigned = teacher.classAssignments.some((a) => a.classId === dto.classId);
    if (!isAssigned && userRole !== UserRole.ADMIN && userRole !== UserRole.PRINCIPAL) {
      throw new ForbiddenException('Not assigned to this class');
    }

    // Check if session is locked
    const existingSummary = await this.prisma.attendanceSessionSummary.findUnique({
      where: {
        classId_sessionType_date: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
      },
    });

    if (existingSummary?.isLocked) {
      throw new ForbiddenException('Session is locked');
    }

    // Process in transaction
    return this.prisma.$transaction(async (tx) => {
      // Create event
      const event = await tx.attendanceEvent.create({
        data: {
          idempotencyKey: dto.idempotencyKey,
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
          teacherId: teacher.id,
          eventType: AttendanceEventType.SUBMIT,
          payload: JSON.parse(JSON.stringify(dto)),
          clientCreatedAt: new Date(dto.clientCreatedAt),
        },
      });

      // Upsert attendance snapshots
      for (const record of dto.records) {
        await tx.attendanceSnapshot.upsert({
          where: {
            classId_sessionType_date_studentId: {
              classId: dto.classId,
              sessionType: dto.session as SessionType,
              date: targetDate,
              studentId: record.studentId,
            },
          },
          create: {
            classId: dto.classId,
            sessionType: dto.session as SessionType,
            date: targetDate,
            studentId: record.studentId,
            status: record.status as AttendanceStatus,
            earlyLeaveTime: record.earlyLeave?.time ? new Date(`1970-01-01T${record.earlyLeave.time}`) : null,
            earlyLeaveReason: record.earlyLeave?.reason,
            notes: record.notes,
            submittedById: userId,
            submittedAt: new Date(),
          },
          update: {
            status: record.status as AttendanceStatus,
            earlyLeaveTime: record.earlyLeave?.time ? new Date(`1970-01-01T${record.earlyLeave.time}`) : null,
            earlyLeaveReason: record.earlyLeave?.reason,
            notes: record.notes,
            lastEditedById: userId,
            lastEditedAt: new Date(),
          },
        });
      }

      // Calculate and update summary
      const statusCounts = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        sick: 0,
      };

      for (const record of dto.records) {
        const status = record.status.toLowerCase() as keyof typeof statusCounts;
        if (status in statusCounts) {
          statusCounts[status]++;
        }
      }

      await tx.attendanceSessionSummary.upsert({
        where: {
          classId_sessionType_date: {
            classId: dto.classId,
            sessionType: dto.session as SessionType,
            date: targetDate,
          },
        },
        create: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
          totalStudents: dto.records.length,
          presentCount: statusCounts.present + statusCounts.late, // Late counts as present
          absentCount: statusCounts.absent,
          lateCount: statusCounts.late,
          excusedCount: statusCounts.excused,
          sickCount: statusCounts.sick,
          status: SessionStatus.SYNCED,
          submittedById: userId,
          submittedAt: new Date(),
        },
        update: {
          totalStudents: dto.records.length,
          presentCount: statusCounts.present + statusCounts.late,
          absentCount: statusCounts.absent,
          lateCount: statusCounts.late,
          excusedCount: statusCounts.excused,
          sickCount: statusCounts.sick,
          status: SessionStatus.SYNCED,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: 'ATTENDANCE',
          entityId: dto.classId,
          action: 'SUBMIT',
          userId,
          afterData: JSON.parse(JSON.stringify(dto)),
        },
      });

      return {
        success: true,
        eventId: event.id,
        syncedAt: event.createdAt,
      };
    });
  }

  async editAttendance(userId: string, userRole: UserRole, dto: EditAttendanceDto) {
    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if session exists
    const summary = await this.prisma.attendanceSessionSummary.findUnique({
      where: {
        classId_sessionType_date: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
      },
    });

    if (!summary) {
      throw new NotFoundException('Attendance session not found');
    }

    // Check if locked
    if (summary.isLocked && userRole !== UserRole.PRINCIPAL && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Session is locked');
    }

    // Check edit window (skip for Principal/Admin)
    if (userRole !== UserRole.PRINCIPAL && userRole !== UserRole.ADMIN) {
      const editWindowMinutes = 120;
      const windowEnd = new Date(summary.submittedAt!);
      windowEnd.setMinutes(windowEnd.getMinutes() + editWindowMinutes);
      
      if (new Date() > windowEnd) {
        throw new ForbiddenException('Edit window has expired');
      }
    }

    // Get teacher
    const teacher = await this.teachersService.findByUserId(userId);
    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create event
      const event = await tx.attendanceEvent.create({
        data: {
          idempotencyKey: dto.idempotencyKey,
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
          teacherId: teacher.id,
          eventType: AttendanceEventType.EDIT,
          payload: JSON.parse(JSON.stringify({ ...dto, editReason: dto.editReason })),
          clientCreatedAt: new Date(dto.clientCreatedAt),
        },
      });

      // Update records
      for (const record of dto.records) {
        // Get previous state for audit
        const previousState = await tx.attendanceSnapshot.findUnique({
          where: {
            classId_sessionType_date_studentId: {
              classId: dto.classId,
              sessionType: dto.session as SessionType,
              date: targetDate,
              studentId: record.studentId,
            },
          },
        });

        await tx.attendanceSnapshot.update({
          where: {
            classId_sessionType_date_studentId: {
              classId: dto.classId,
              sessionType: dto.session as SessionType,
              date: targetDate,
              studentId: record.studentId,
            },
          },
          data: {
            status: record.status as AttendanceStatus,
            earlyLeaveTime: record.earlyLeave?.time ? new Date(`1970-01-01T${record.earlyLeave.time}`) : null,
            earlyLeaveReason: record.earlyLeave?.reason,
            notes: record.notes,
            lastEditedById: userId,
            lastEditedAt: new Date(),
          },
        });

        // Audit log for each change
        await tx.auditLog.create({
          data: {
            entityType: 'ATTENDANCE_RECORD',
            entityId: record.studentId,
            action: 'EDIT',
            userId,
            beforeData: previousState ? JSON.parse(JSON.stringify(previousState)) : null,
            afterData: JSON.parse(JSON.stringify(record)),
            reason: dto.editReason,
          },
        });
      }

      // Recalculate summary
      const allRecords = await tx.attendanceSnapshot.findMany({
        where: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
      });

      const statusCounts = {
        present: allRecords.filter((r) => r.status === 'PRESENT').length,
        absent: allRecords.filter((r) => r.status === 'ABSENT').length,
        late: allRecords.filter((r) => r.status === 'LATE').length,
        excused: allRecords.filter((r) => r.status === 'EXCUSED').length,
        sick: allRecords.filter((r) => r.status === 'SICK').length,
      };

      await tx.attendanceSessionSummary.update({
        where: {
          classId_sessionType_date: {
            classId: dto.classId,
            sessionType: dto.session as SessionType,
            date: targetDate,
          },
        },
        data: {
          presentCount: statusCounts.present + statusCounts.late,
          absentCount: statusCounts.absent,
          lateCount: statusCounts.late,
          excusedCount: statusCounts.excused,
          sickCount: statusCounts.sick,
        },
      });

      return {
        success: true,
        eventId: event.id,
        editedAt: event.createdAt,
      };
    });
  }

  async lockSession(userId: string, dto: LockSessionDto) {
    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);

    const summary = await this.prisma.attendanceSessionSummary.findUnique({
      where: {
        classId_sessionType_date: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
      },
    });

    if (!summary) {
      throw new NotFoundException('Attendance session not found');
    }

    if (summary.isLocked) {
      throw new ConflictException('Session is already locked');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.attendanceSessionSummary.update({
        where: {
          classId_sessionType_date: {
            classId: dto.classId,
            sessionType: dto.session as SessionType,
            date: targetDate,
          },
        },
        data: {
          isLocked: true,
          lockedById: userId,
          lockedAt: new Date(),
          status: SessionStatus.LOCKED,
        },
      });

      // Lock all snapshots
      await tx.attendanceSnapshot.updateMany({
        where: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
        data: {
          isLocked: true,
          lockedById: userId,
          lockedAt: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          entityType: 'ATTENDANCE_SESSION',
          entityId: dto.classId,
          action: 'LOCK',
          userId,
          afterData: { session: dto.session, date: dto.date, reason: dto.reason },
          reason: dto.reason,
        },
      });

      return { success: true, message: 'Session locked' };
    });
  }

  async unlockSession(userId: string, dto: LockSessionDto) {
    const targetDate = new Date(dto.date);
    targetDate.setHours(0, 0, 0, 0);

    const summary = await this.prisma.attendanceSessionSummary.findUnique({
      where: {
        classId_sessionType_date: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
      },
    });

    if (!summary) {
      throw new NotFoundException('Attendance session not found');
    }

    if (!summary.isLocked) {
      throw new ConflictException('Session is not locked');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.attendanceSessionSummary.update({
        where: {
          classId_sessionType_date: {
            classId: dto.classId,
            sessionType: dto.session as SessionType,
            date: targetDate,
          },
        },
        data: {
          isLocked: false,
          lockedById: null,
          lockedAt: null,
          status: SessionStatus.SYNCED,
        },
      });

      // Unlock all snapshots
      await tx.attendanceSnapshot.updateMany({
        where: {
          classId: dto.classId,
          sessionType: dto.session as SessionType,
          date: targetDate,
        },
        data: {
          isLocked: false,
          lockedById: null,
          lockedAt: null,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          entityType: 'ATTENDANCE_SESSION',
          entityId: dto.classId,
          action: 'UNLOCK',
          userId,
          afterData: { session: dto.session, date: dto.date, reason: dto.reason },
          reason: dto.reason,
        },
      });

      return { success: true, message: 'Session unlocked' };
    });
  }
}
