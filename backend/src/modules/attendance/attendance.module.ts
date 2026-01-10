import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TeacherDashboardController } from './teacher-dashboard.controller';
import { TeachersModule } from '../teachers/teachers.module';

@Module({
  imports: [TeachersModule],
  controllers: [AttendanceController, TeacherDashboardController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
