import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new teacher with user account' })
  @ApiResponse({ status: 201, description: 'Teacher created' })
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    const take = limit || 20;
    const skip = page ? (page - 1) * take : 0;
    return this.teachersService.findAll({ skip, take, search });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiResponse({ status: 200, description: 'Teacher found' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update teacher' })
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate teacher' })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  @Post(':id/assignments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign teacher to class' })
  assignClass(@Param('id') id: string, @Body() assignClassDto: AssignClassDto) {
    return this.teachersService.assignClass(id, assignClassDto);
  }

  @Delete(':id/assignments/:classId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove teacher from class' })
  removeAssignment(@Param('id') id: string, @Param('classId') classId: string) {
    return this.teachersService.removeClassAssignment(id, classId);
  }

  @Get(':id/classes')
  @ApiOperation({ summary: 'Get assigned classes for teacher' })
  getAssignedClasses(@Param('id') id: string) {
    return this.teachersService.getAssignedClasses(id);
  }
}
