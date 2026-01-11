import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockSessionDto {
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

  @ApiProperty({ example: 'End of day lock' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
