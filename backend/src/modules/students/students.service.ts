import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    // Check for duplicate admission number
    const existing = await this.prisma.student.findUnique({
      where: { admissionNo: createStudentDto.admissionNo },
    });

    if (existing) {
      throw new ConflictException('Admission number already exists');
    }

    // Verify class exists
    const classEntity = await this.prisma.class.findUnique({
      where: { id: createStudentDto.classId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.student.create({
      data: {
        admissionNo: createStudentDto.admissionNo,
        firstName: createStudentDto.firstName,
        lastName: createStudentDto.lastName,
        dateOfBirth: new Date(createStudentDto.dateOfBirth),
        gender: createStudentDto.gender,
        classId: createStudentDto.classId,
        bloodGroup: createStudentDto.bloodGroup,
        address: createStudentDto.address,
        guardians: createStudentDto.guardians ? JSON.parse(JSON.stringify(createStudentDto.guardians)) : [],
        medicalInfo: createStudentDto.medicalInfo,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    classId?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip, take, classId, search, isActive } = params;

    const where: Prisma.StudentWhereInput = {};
    if (classId) where.classId = classId;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        skip,
        take,
        where,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 20)) + 1 : 1,
        limit: take || 20,
        totalPages: Math.ceil(total / (take || 20)),
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const data: Prisma.StudentUpdateInput = {};
    
    if (updateStudentDto.firstName) data.firstName = updateStudentDto.firstName;
    if (updateStudentDto.lastName) data.lastName = updateStudentDto.lastName;
    if (updateStudentDto.dateOfBirth) data.dateOfBirth = new Date(updateStudentDto.dateOfBirth);
    if (updateStudentDto.gender) data.gender = updateStudentDto.gender;
    if (updateStudentDto.classId) {
      const classEntity = await this.prisma.class.findUnique({
        where: { id: updateStudentDto.classId },
      });
      if (!classEntity) {
        throw new NotFoundException('Class not found');
      }
      data.class = { connect: { id: updateStudentDto.classId } };
    }
    if (updateStudentDto.bloodGroup !== undefined) data.bloodGroup = updateStudentDto.bloodGroup;
    if (updateStudentDto.address !== undefined) data.address = updateStudentDto.address;
    if (updateStudentDto.guardians !== undefined) data.guardians = JSON.parse(JSON.stringify(updateStudentDto.guardians));
    if (updateStudentDto.medicalInfo !== undefined) data.medicalInfo = updateStudentDto.medicalInfo;
    if (typeof updateStudentDto.isActive === 'boolean') data.isActive = updateStudentDto.isActive;

    return this.prisma.student.update({
      where: { id },
      data,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAttendanceHistory(id: string, startDate?: string, endDate?: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const where: Prisma.AttendanceSnapshotWhereInput = {
      studentId: id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const attendance = await this.prisma.attendanceSnapshot.findMany({
      where,
      orderBy: [{ date: 'desc' }, { sessionType: 'asc' }],
      take: 100,
    });

    // Calculate summary
    const summary = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === 'PRESENT').length,
      absent: attendance.filter((a) => a.status === 'ABSENT').length,
      late: attendance.filter((a) => a.status === 'LATE').length,
      excused: attendance.filter((a) => a.status === 'EXCUSED').length,
      sick: attendance.filter((a) => a.status === 'SICK').length,
    };

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
      },
      summary,
      attendance,
    };
  }

  async search(query: string) {
    return this.prisma.student.findMany({
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { admissionNo: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
      take: 10,
    });
  }
}
