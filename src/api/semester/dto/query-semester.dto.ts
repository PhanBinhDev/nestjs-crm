import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { SemesterStatus } from '@/database/enum/semeter.enum';
import { TransformToArray } from '@/utils/transform.util';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class QuerySemesterDto extends PageOptionsDto {
  @ApiPropertyOptional({
    enum: SemesterStatus,
    isArray: true,
    description: 'Lọc theo nhiều trạng thái',
    example: [SemesterStatus.UPCOMING, SemesterStatus.COMPLETED],
  })
  @IsOptional()
  @TransformToArray()
  @IsEnum(SemesterStatus, { each: true })
  status?: SemesterStatus[];
}
