import { PrismaClient, UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.local' },
    update: {},
    create: {
      email: 'admin@school.local',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create principal user
  const principalPassword = await bcrypt.hash('principal123', 10);
  const principal = await prisma.user.upsert({
    where: { email: 'principal@school.local' },
    update: {},
    create: {
      email: 'principal@school.local',
      passwordHash: principalPassword,
      firstName: 'School',
      lastName: 'Principal',
      role: UserRole.PRINCIPAL,
    },
  });
  console.log('✅ Principal user created:', principal.email);

  // Create teacher users and profiles
  const teacherData = [
    { firstName: 'John', lastName: 'Smith', employeeId: 'EMP001' },
    { firstName: 'Sarah', lastName: 'Johnson', employeeId: 'EMP002' },
    { firstName: 'Michael', lastName: 'Williams', employeeId: 'EMP003' },
  ];

  const teachers = [];
  for (const data of teacherData) {
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const email = `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@school.local`;
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: teacherPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.TEACHER,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { employeeId: data.employeeId },
      update: {},
      create: {
        userId: user.id,
        employeeId: data.employeeId,
        phone: '+1234567890',
        qualification: 'B.Ed',
      },
    });

    teachers.push(teacher);
    console.log('✅ Teacher created:', email);
  }

  // Create classes
  const classData = [
    { name: 'Class 5', section: 'A', grade: '5' },
    { name: 'Class 5', section: 'B', grade: '5' },
    { name: 'Class 6', section: 'A', grade: '6' },
    { name: 'Class 6', section: 'B', grade: '6' },
  ];

  const classes = [];
  for (const data of classData) {
    const classEntity = await prisma.class.upsert({
      where: {
        name_section_academicYear: {
          name: data.name,
          section: data.section,
          academicYear: '2024-2025',
        },
      },
      update: {},
      create: {
        name: data.name,
        section: data.section,
        grade: data.grade,
        academicYear: '2024-2025',
      },
    });
    classes.push(classEntity);
    console.log('✅ Class created:', `${data.name}-${data.section}`);
  }

  // Assign teachers to classes
  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId: {
        teacherId: teachers[0].id,
        classId: classes[0].id,
      },
    },
    update: {},
    create: {
      teacherId: teachers[0].id,
      classId: classes[0].id,
      isPrimary: true,
    },
  });

  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId: {
        teacherId: teachers[0].id,
        classId: classes[1].id,
      },
    },
    update: {},
    create: {
      teacherId: teachers[0].id,
      classId: classes[1].id,
      isPrimary: false,
    },
  });

  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId: {
        teacherId: teachers[1].id,
        classId: classes[2].id,
      },
    },
    update: {},
    create: {
      teacherId: teachers[1].id,
      classId: classes[2].id,
      isPrimary: true,
    },
  });

  await prisma.teacherClassAssignment.upsert({
    where: {
      teacherId_classId: {
        teacherId: teachers[2].id,
        classId: classes[3].id,
      },
    },
    update: {},
    create: {
      teacherId: teachers[2].id,
      classId: classes[3].id,
      isPrimary: true,
    },
  });

  console.log('✅ Teacher assignments created');

  // Create sample students
  const studentNames = [
    { firstName: 'Alice', lastName: 'Anderson', gender: Gender.FEMALE },
    { firstName: 'Bob', lastName: 'Brown', gender: Gender.MALE },
    { firstName: 'Carol', lastName: 'Chen', gender: Gender.FEMALE },
    { firstName: 'David', lastName: 'Davis', gender: Gender.MALE },
    { firstName: 'Emma', lastName: 'Evans', gender: Gender.FEMALE },
    { firstName: 'Frank', lastName: 'Foster', gender: Gender.MALE },
    { firstName: 'Grace', lastName: 'Green', gender: Gender.FEMALE },
    { firstName: 'Henry', lastName: 'Harris', gender: Gender.MALE },
    { firstName: 'Ivy', lastName: 'Irwin', gender: Gender.FEMALE },
    { firstName: 'Jack', lastName: 'Johnson', gender: Gender.MALE },
  ];

  let studentCount = 1;
  for (const classEntity of classes) {
    for (const nameData of studentNames) {
      const admissionNo = `2024${String(studentCount).padStart(4, '0')}`;
      
      await prisma.student.upsert({
        where: { admissionNo },
        update: {},
        create: {
          admissionNo,
          firstName: nameData.firstName,
          lastName: nameData.lastName,
          dateOfBirth: new Date('2012-01-15'),
          gender: nameData.gender,
          classId: classEntity.id,
          guardians: [
            {
              name: `${nameData.lastName} Parent`,
              relationship: 'FATHER',
              phone: '+1234567890',
              email: `${nameData.lastName.toLowerCase()}@email.com`,
              isPrimary: true,
            },
          ],
        },
      });
      studentCount++;
    }
    console.log('✅ Students created for:', `${classEntity.name}-${classEntity.section}`);
  }

  // Create system settings
  await prisma.systemSetting.upsert({
    where: { key: 'school_name' },
    update: {},
    create: {
      key: 'school_name',
      value: 'Demo School',
      description: 'Name of the school',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'academic_year' },
    update: {},
    create: {
      key: 'academic_year',
      value: '2024-2025',
      description: 'Current academic year',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'attendance_edit_window_minutes' },
    update: {},
    create: {
      key: 'attendance_edit_window_minutes',
      value: 120,
      description: 'Minutes allowed to edit attendance after submission',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'chronic_absentee_threshold' },
    update: {},
    create: {
      key: 'chronic_absentee_threshold',
      value: 80,
      description: 'Attendance percentage threshold for chronic absentee alert',
    },
  });

  console.log('✅ System settings created');

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   Admin:     admin@school.local / admin123');
  console.log('   Principal: principal@school.local / principal123');
  console.log('   Teacher:   john.smith@school.local / teacher123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
