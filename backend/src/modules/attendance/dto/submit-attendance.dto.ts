import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EarlyLeaveDto {
  @ApiProperty({ example: '11:30' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({ example: 'Medical appointment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AttendanceRecordDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 'PRESENT', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'] })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ type: EarlyLeaveDto, required: false })
  @ValidateNested()
  @Type(() => EarlyLeaveDto)
  @IsOptional()
  earlyLeave?: EarlyLeaveDto;

  @ApiProperty({ example: 'Student arrived from doctor', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitAttendanceDto {
  @ApiProperty({ example: 'teacher-123:class-456:2024-01-15:MORNING:SUBMIT:1705312800000' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ example: 'class-uuid' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'] })
  @IsString()
  @IsNotEmpty()
  session: string;

  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  clientCreatedAt: string;
}
