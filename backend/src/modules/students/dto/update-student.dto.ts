import { IsString, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';
import { GuardianDto } from './create-student.dto';

export class UpdateStudentDto {
  @ApiProperty({ example: 'Alice', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Smith', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '2012-05-15', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ enum: Gender, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: 'class-uuid', required: false })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiProperty({ example: 'O+', required: false })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ type: [GuardianDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  @IsOptional()
  guardians?: GuardianDto[];

  @ApiProperty({ example: 'None', required: false })
  @IsString()
  @IsOptional()
  medicalInfo?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
