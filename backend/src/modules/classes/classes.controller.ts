import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Classes')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new class' })
  @ApiResponse({ status: 201, description: 'Class created' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'academicYear', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('academicYear') academicYear?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    const take = limit || 50;
    const skip = page ? (page - 1) * take : 0;
    return this.classesService.findAll({ skip, take, academicYear, isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID with students' })
  @ApiResponse({ status: 200, description: 'Class found' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update class' })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate class' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get students in class' })
  getStudents(@Param('id') id: string) {
    return this.classesService.getStudents(id);
  }
}
