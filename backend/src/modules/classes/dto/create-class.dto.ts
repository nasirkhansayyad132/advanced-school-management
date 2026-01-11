import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({ example: 'Class 5' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A', required: false })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty({ example: '5' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ example: '2024-2025' })
  @IsString()
  @IsNotEmpty()
  academicYear: string;
}
