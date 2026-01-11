import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createTeacherDto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if employee ID exists
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: { employeeId: createTeacherDto.employeeId },
    });
    if (existingTeacher) {
      throw new ConflictException('Employee ID already exists');
    }

    const passwordHash = await bcrypt.hash(createTeacherDto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createTeacherDto.email.toLowerCase(),
          passwordHash,
          firstName: createTeacherDto.firstName,
          lastName: createTeacherDto.lastName,
          role: UserRole.TEACHER,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: createTeacherDto.employeeId,
          phone: createTeacherDto.phone,
          address: createTeacherDto.address,
          qualification: createTeacherDto.qualification,
          dateOfJoining: createTeacherDto.dateOfJoining ? new Date(createTeacherDto.dateOfJoining) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      return teacher;
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const { skip, take, search } = params;

    const where: Prisma.TeacherWhereInput = {};
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        skip,
        take,
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
          classAssignments: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  section: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 20)) + 1 : 1,
        limit: take || 20,
        totalPages: Math.ceil(total / (take || 20)),
      },
    };
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        classAssignments: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async findByUserId(userId: string) {
    return this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        classAssignments: {
          include: {
            class: true,
          },
        },
      },
    });
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update user if needed
      if (updateTeacherDto.firstName || updateTeacherDto.lastName) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: {
            firstName: updateTeacherDto.firstName,
            lastName: updateTeacherDto.lastName,
          },
        });
      }

      // Update teacher
      return tx.teacher.update({
        where: { id },
        data: {
          phone: updateTeacherDto.phone,
          address: updateTeacherDto.address,
          qualification: updateTeacherDto.qualification,
          dateOfJoining: updateTeacherDto.dateOfJoining ? new Date(updateTeacherDto.dateOfJoining) : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Soft delete by deactivating user
    return this.prisma.user.update({
      where: { id: teacher.userId },
      data: { isActive: false },
    });
  }

  async assignClass(teacherId: string, assignClassDto: AssignClassDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const classEntity = await this.prisma.class.findUnique({ where: { id: assignClassDto.classId } });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Check if assignment exists
    const existing = await this.prisma.teacherClassAssignment.findUnique({
      where: {
        teacherId_classId: {
          teacherId,
          classId: assignClassDto.classId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Teacher already assigned to this class');
    }

    return this.prisma.teacherClassAssignment.create({
      data: {
        teacherId,
        classId: assignClassDto.classId,
        isPrimary: assignClassDto.isPrimary || false,
      },
      include: {
        class: true,
      },
    });
  }

  async removeClassAssignment(teacherId: string, classId: string) {
    const assignment = await this.prisma.teacherClassAssignment.findUnique({
      where: {
        teacherId_classId: {
          teacherId,
          classId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.prisma.teacherClassAssignment.delete({
      where: { id: assignment.id },
    });
  }

  async getAssignedClasses(teacherId: string) {
    const assignments = await this.prisma.teacherClassAssignment.findMany({
      where: { teacherId },
      include: {
        class: {
          include: {
            students: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
    });

    return assignments.map((a) => ({
      ...a.class,
      studentCount: a.class.students.length,
      isPrimary: a.isPrimary,
    }));
  }
}
