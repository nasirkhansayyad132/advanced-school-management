import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignClassDto {
  @ApiProperty({ example: 'class-uuid' })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
