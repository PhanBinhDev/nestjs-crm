import { UserResDto } from '@/api/users/dto/user.res.dto';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FilesResponseDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  url: string;

  @ApiProperty()
  @Expose()
  originalName: string;

  @ApiProperty()
  @Expose()
  mimeType: string;

  @ApiProperty()
  @Expose()
  size: number;

  @ApiProperty()
  @Expose()
  fileName: string;

  @ApiProperty()
  @Expose()
  destination: string;

  @ApiProperty()
  @Expose()
  uploadedBy?: string;

  @ApiProperty({ type: UserResDto })
  @Expose()
  uploader: UserResDto;
}
