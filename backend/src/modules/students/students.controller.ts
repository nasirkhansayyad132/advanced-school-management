import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student created' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all students' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'classId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const take = limit || 20;
    const skip = page ? (page - 1) * take : 0;
    return this.studentsService.findAll({ skip, take, classId, search, isActive });
  }

  @Get('search')
  @ApiOperation({ summary: 'Quick search students' })
  @ApiQuery({ name: 'q', required: true, type: String })
  search(@Query('q') query: string) {
    return this.studentsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiResponse({ status: 200, description: 'Student found' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update student' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate student' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get student attendance history' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getAttendance(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.studentsService.getAttendanceHistory(id, startDate, endDate);
  }
}
