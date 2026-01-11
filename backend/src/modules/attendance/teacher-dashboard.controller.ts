import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Teacher Dashboard')
@Controller('teacher')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeacherDashboardController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get teacher dashboard with classes and session status' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  getDashboard(@Req() req: any, @Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getTeacherDashboard(req.user.id, targetDate);
  }

  @Get('classes/:classId/students')
  @ApiOperation({ summary: 'Get students for a class (for attendance taking)' })
  @ApiResponse({ status: 200, description: 'Student list' })
  getClassStudents(@Param('classId') classId: string) {
    return this.attendanceService.getClassStudents(classId);
  }
}
