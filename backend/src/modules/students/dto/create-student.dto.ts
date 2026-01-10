import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';

export class GuardianDto {
  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'FATHER', enum: ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Engineer', required: false })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;
}

export class CreateStudentDto {
  @ApiProperty({ example: '2024001' })
  @IsString()
  @IsNotEmpty()
  admissionNo: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '2012-05-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.FEMALE })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ example: 'class-uuid' })
  @IsString()
  @IsNotEmpty()
  classId: string;

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
}
