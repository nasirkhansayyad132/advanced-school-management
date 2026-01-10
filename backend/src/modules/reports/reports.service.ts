import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionType, AttendanceStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyAbsentList(date: string, session?: SessionType, classId?: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const where: any = {
      date: targetDate,
      status: {
        in: [AttendanceStatus.ABSENT, AttendanceStatus.SICK, AttendanceStatus.EXCUSED],
      },
    };

    if (session) where.sessionType = session;
    if (classId) where.classId = classId;

    const absentRecords = await this.prisma.attendanceSnapshot.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            guardians: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
      orderBy: [
        { sessionType: 'asc' },
        { class: { name: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });

    // Group by session
    const morning = absentRecords.filter((r) => r.sessionType === SessionType.MORNING);
    const afternoon = absentRecords.filter((r) => r.sessionType === SessionType.AFTERNOON);

    const formatRecord = (r: any) => {
      const guardians = r.student.guardians as any[];
      const primaryGuardian = guardians?.find((g: any) => g.isPrimary) || guardians?.[0];
      
      return {
        id: r.student.id,
        name: `${r.student.firstName} ${r.student.lastName}`,
        admissionNo: r.student.admissionNo,
        class: `${r.class.name}${r.class.section ? '-' + r.class.section : ''}`,
        status: r.status,
        notes: r.notes,
        guardianName: primaryGuardian?.name,
        guardianPhone: primaryGuardian?.phone,
      };
    };

    return {
      date,
      morning: {
        total: morning.length,
        students: morning.map(formatRecord),
      },
      afternoon: {
        total: afternoon.length,
        students: afternoon.map(formatRecord),
      },
    };
  }

  async getMonthlyAttendance(month: string, classId?: string) {
    // Parse month (YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (classId) where.classId = classId;

    const snapshots = await this.prisma.attendanceSnapshot.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            classId: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    });

    // Group by student
    const studentMap = new Map<string, {
      student: any;
      class: any;
      records: any[];
    }>();

    for (const snap of snapshots) {
      const key = snap.studentId;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          student: snap.student,
          class: snap.class,
          records: [],
        });
      }
      studentMap.get(key)!.records.push(snap);
    }

    const results = Array.from(studentMap.values()).map((data) => {
      const totalSessions = data.records.length;
      const presentCount = data.records.filter(
        (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE,
      ).length;
      const absentCount = data.records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
      const lateCount = data.records.filter((r) => r.status === AttendanceStatus.LATE).length;
      const excusedCount = data.records.filter((r) => r.status === AttendanceStatus.EXCUSED).length;
      const sickCount = data.records.filter((r) => r.status === AttendanceStatus.SICK).length;

      const attendancePercent = totalSessions > 0 
        ? Math.round((presentCount / totalSessions) * 10000) / 100 
        : 0;

      return {
        studentId: data.student.id,
        studentName: `${data.student.firstName} ${data.student.lastName}`,
        admissionNo: data.student.admissionNo,
        class: `${data.class.name}${data.class.section ? '-' + data.class.section : ''}`,
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        sickCount,
        attendancePercent,
      };
    });

    // Sort by name
    results.sort((a, b) => a.studentName.localeCompare(b.studentName));

    // Calculate class average
    const totalStudents = results.length;
    const averageAttendance = totalStudents > 0
      ? Math.round(results.reduce((sum, r) => sum + r.attendancePercent, 0) / totalStudents * 100) / 100
      : 0;

    return {
      month,
      classId,
      summary: {
        totalStudents,
        averageAttendance,
      },
      students: results,
    };
  }

  async getChronicAbsentees(startDate: string, endDate: string, threshold?: number) {
    const thresholdPercent = threshold || 80; // Default 80%
    const start = new Date(startDate);
    const end = new Date(endDate);

    const snapshots = await this.prisma.attendanceSnapshot.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            isActive: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    });

    // Group by student
    const studentMap = new Map<string, {
      student: any;
      class: any;
      records: any[];
    }>();

    for (const snap of snapshots) {
      if (!snap.student.isActive) continue;
      
      const key = snap.studentId;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          student: snap.student,
          class: snap.class,
          records: [],
        });
      }
      studentMap.get(key)!.records.push(snap);
    }

    const chronicAbsentees = Array.from(studentMap.values())
      .map((data) => {
        const totalSessions = data.records.length;
        const presentCount = data.records.filter(
          (r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE,
        ).length;
        const attendancePercent = totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 10000) / 100
          : 0;

        return {
          studentId: data.student.id,
          studentName: `${data.student.firstName} ${data.student.lastName}`,
          admissionNo: data.student.admissionNo,
          class: `${data.class.name}${data.class.section ? '-' + data.class.section : ''}`,
          totalSessions,
          presentCount,
          absentCount: totalSessions - presentCount,
          attendancePercent,
        };
      })
      .filter((r) => r.attendancePercent < thresholdPercent)
      .sort((a, b) => a.attendancePercent - b.attendancePercent);

    return {
      startDate,
      endDate,
      threshold: thresholdPercent,
      count: chronicAbsentees.length,
      students: chronicAbsentees,
    };
  }

  async getTeacherSubmissions(startDate: string, endDate: string, teacherId?: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      eventType: 'SUBMIT',
    };

    if (teacherId) where.teacherId = teacherId;

    const events = await this.prisma.attendanceEvent.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
            section: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by teacher
    const teacherMap = new Map<string, {
      teacher: any;
      submissions: any[];
    }>();

    for (const event of events) {
      const key = event.teacherId;
      if (!teacherMap.has(key)) {
        teacherMap.set(key, {
          teacher: event.teacher,
          submissions: [],
        });
      }
      teacherMap.get(key)!.submissions.push({
        date: event.date,
        session: event.sessionType,
        class: `${event.class.name}${event.class.section ? '-' + event.class.section : ''}`,
        submittedAt: event.createdAt,
        clientCreatedAt: event.clientCreatedAt,
      });
    }

    const results = Array.from(teacherMap.values()).map((data) => ({
      teacherId: data.teacher.id,
      teacherName: `${data.teacher.user.firstName} ${data.teacher.user.lastName}`,
      totalSubmissions: data.submissions.length,
      submissions: data.submissions,
    }));

    return {
      startDate,
      endDate,
      teachers: results,
    };
  }
}
