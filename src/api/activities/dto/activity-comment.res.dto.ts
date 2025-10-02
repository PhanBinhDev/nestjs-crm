import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class UserInfoDto {
  @ApiProperty()
  @Expose()
  id: Uuid;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;
}

export class ActivityCommentResDto extends AuditResDto {
  @ApiProperty()
  @Expose()
  activityId: Uuid;

  @ApiPropertyOptional()
  @Expose()
  parentCommentId?: Uuid;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty()
  @Expose()
  isEdited: boolean;

  @ApiPropertyOptional()
  @Expose()
  editedAt?: Date;

  @ApiPropertyOptional()
  @Expose()
  reactions?: Record<string, number>;

  @ApiProperty({ description: 'Số lượng tym' })
  @Expose()
  get tymCount(): number {
    return this.reactions?.tym || 0;
  }

  @ApiProperty({ type: UserInfoDto })
  @Expose()
  @Type(() => UserInfoDto)
  user: UserInfoDto;

  //   @ApiPropertyOptional({ type: [ActivityCommentResDto] })
  //   @Expose()
  //   @Type(() => ActivityCommentResDto)
  //   replies?: ActivityCommentResDto[];
}
