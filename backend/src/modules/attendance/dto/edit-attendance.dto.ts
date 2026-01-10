import { IsNotEmpty, IsString, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceRecordDto } from './submit-attendance.dto';

export class EditAttendanceDto {
  @ApiProperty({ example: 'teacher-123:class-456:2024-01-15:MORNING:EDIT:1705316400000' })
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

  @ApiProperty({ example: 'Parent confirmed late arrival' })
  @IsString()
  @IsNotEmpty()
  editReason: string;

  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  clientCreatedAt: string;
}
