import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClassDto {
  @ApiProperty({ example: 'Class 5', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'A', required: false })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty({ example: '5', required: false })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
