import { UserResDto } from '@/api/users/dto/user.res.dto';
import { AuditResDto } from '@/common/dto/audit.res.dto';
import { WrapperType } from '@/common/types/types';
import { AssigneeRole, AssignmentStatus } from '@/database/enum/activity.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ActivityResDto } from './activity.res.dto';

export class ActivityAssigneeResDto extends AuditResDto {
  @ApiProperty({ example: 'Hoạt động ABC' })
  @Expose()
  @Type(() => ActivityResDto)
  activity: ActivityResDto;

  @ApiProperty({ example: 'Người được gán hoạt động' })
  @Expose()
  @Type(() => UserResDto)
  user: WrapperType<UserResDto>;

  @ApiProperty({
    enum: AssignmentStatus,
    example: AssignmentStatus.PENDING,
  })
  @Expose()
  status: AssignmentStatus;

  @ApiProperty({ enum: AssigneeRole, example: AssigneeRole.COLLABORATOR })
  @Expose()
  role: AssigneeRole;

  @ApiProperty()
  @Expose()
  assignedAt: Date;

  @ApiProperty()
  @Expose()
  note?: string;
}
