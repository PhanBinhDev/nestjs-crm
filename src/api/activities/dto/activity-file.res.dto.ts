import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ActivityFileResDto {
  @ApiProperty()
  @Expose()
  @Transform(({ obj }) => obj.file?.url || obj.url)
  url: string;
}
