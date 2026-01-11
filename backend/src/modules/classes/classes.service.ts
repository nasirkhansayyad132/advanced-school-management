import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto) {
    // Check for duplicate
    const existing = await this.prisma.class.findFirst({
      where: {
        name: createClassDto.name,
        section: createClassDto.section,
        academicYear: createClassDto.academicYear,
      },
    });

    if (existing) {
      throw new ConflictException('Class with this name, section, and academic year already exists');
    }

    return this.prisma.class.create({
      data: {
        name: createClassDto.name,
        section: createClassDto.section,
        grade: createClassDto.grade,
        academicYear: createClassDto.academicYear,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    academicYear?: string;
    isActive?: boolean;
  }) {
    const { skip, take, academicYear, isActive } = params;

    const where: Prisma.ClassWhereInput = {};
    if (academicYear) where.academicYear = academicYear;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        skip,
        take,
        where,
        include: {
          _count: {
            select: { students: true },
          },
          teacherAssignments: {
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
            },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }, { section: 'asc' }],
      }),
      this.prisma.class.count({ where }),
    ]);

    const data = classes.map((c) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      grade: c.grade,
      academicYear: c.academicYear,
      isActive: c.isActive,
      studentCount: c._count.students,
      teachers: c.teacherAssignments.map((ta) => ({
        id: ta.teacher.id,
        name: `${ta.teacher.user.firstName} ${ta.teacher.user.lastName}`,
        isPrimary: ta.isPrimary,
      })),
      createdAt: c.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 20)) + 1 : 1,
        limit: take || 20,
        totalPages: Math.ceil(total / (take || 20)),
      },
    };
  }

  async findOne(id: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
      include: {
        students: {
          where: { isActive: true },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
        teacherAssignments: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return classEntity;
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    const classEntity = await this.prisma.class.findUnique({ where: { id } });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.class.update({
      where: { id },
      data: updateClassDto,
    });
  }

  async remove(id: string) {
    const classEntity = await this.prisma.class.findUnique({ where: { id } });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.class.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStudents(classId: string) {
    const classEntity = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.student.findMany({
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
        guardians: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }
}
