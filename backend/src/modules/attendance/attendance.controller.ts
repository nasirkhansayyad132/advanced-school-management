import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { EditAttendanceDto } from './dto/edit-attendance.dto';
import { LockSessionDto } from './dto/lock-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, SessionType } from '@prisma/client';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':classId/:date/:session')
  @ApiOperation({ summary: 'Get attendance state for a class session' })
  @ApiResponse({ status: 200, description: 'Attendance state' })
  getAttendanceState(
    @Param('classId') classId: string,
    @Param('date') date: string,
    @Param('session') session: SessionType,
  ) {
    return this.attendanceService.getAttendanceState(classId, date, session);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Submit or sync attendance (idempotent)' })
  @ApiHeader({ name: 'X-Idempotency-Key', required: true })
  @ApiResponse({ status: 200, description: 'Attendance synced' })
  @ApiResponse({ status: 403, description: 'Not authorized or session locked' })
  submitAttendance(@Req() req: any, @Body() dto: SubmitAttendanceDto) {
    return this.attendanceService.submitAttendance(req.user.id, req.user.role, dto);
  }

  @Post('edit')
  @ApiOperation({ summary: 'Edit attendance (within edit window)' })
  @ApiResponse({ status: 200, description: 'Attendance edited' })
  @ApiResponse({ status: 403, description: 'Edit window expired or session locked' })
  editAttendance(@Req() req: any, @Body() dto: EditAttendanceDto) {
    return this.attendanceService.editAttendance(req.user.id, req.user.role, dto);
  }

  @Post('lock')
  @Roles(UserRole.PRINCIPAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Lock attendance session (Principal only)' })
  @ApiResponse({ status: 200, description: 'Session locked' })
  lockSession(@Req() req: any, @Body() dto: LockSessionDto) {
    return this.attendanceService.lockSession(req.user.id, dto);
  }

  @Post('unlock')
  @Roles(UserRole.PRINCIPAL, UserRole.ADMIN)
  @ApiOperation({ summary: 'Unlock attendance session (Principal only)' })
  @ApiResponse({ status: 200, description: 'Session unlocked' })
  unlockSession(@Req() req: any, @Body() dto: LockSessionDto) {
    return this.attendanceService.unlockSession(req.user.id, dto);
  }
}
