import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, SessionType } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-absent')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get daily absent list' })
  @ApiQuery({ name: 'date', required: true, type: String })
  @ApiQuery({ name: 'session', required: false, enum: SessionType })
  @ApiQuery({ name: 'classId', required: false, type: String })
  getDailyAbsent(
    @Query('date') date: string,
    @Query('session') session?: SessionType,
    @Query('classId') classId?: string,
  ) {
    return this.reportsService.getDailyAbsentList(date, session, classId);
  }

  @Get('monthly-attendance')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get monthly attendance summary' })
  @ApiQuery({ name: 'month', required: true, type: String, description: 'Format: YYYY-MM' })
  @ApiQuery({ name: 'classId', required: false, type: String })
  getMonthlyAttendance(
    @Query('month') month: string,
    @Query('classId') classId?: string,
  ) {
    return this.reportsService.getMonthlyAttendance(month, classId);
  }

  @Get('chronic-absentees')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get chronic absentee list' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Attendance % threshold (default: 80)' })
  getChronicAbsentees(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.reportsService.getChronicAbsentees(startDate, endDate, threshold);
  }

  @Get('teacher-submissions')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get teacher submission timeliness' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  getTeacherSubmissions(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.reportsService.getTeacherSubmissions(startDate, endDate, teacherId);
  }
}
