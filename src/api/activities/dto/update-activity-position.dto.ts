import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateActivityPositionDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  position: number;

  @ApiProperty({ example: 'stage-1' })
  @IsOptional()
  @IsString()
  stageId?: string;
}
