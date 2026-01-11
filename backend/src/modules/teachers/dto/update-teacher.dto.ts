import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTeacherDto {
  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'M.Ed', required: false })
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  dateOfJoining?: string;
}
