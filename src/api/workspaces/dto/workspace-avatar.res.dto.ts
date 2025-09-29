import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WorkspaceAvatarResDto {
  @ApiProperty({
    description: 'UID của file đính kèm',
    type: String,
  })
  @Expose()
  uid: string;

  @ApiProperty({
    description: 'Tên của file',
    type: String,
  })
  @Expose()
  name: string;
}
