import { UserResDto } from '@/api/users/dto/user.res.dto';
import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { ReactionType } from '@/database/enum/comments.enum';
import {
  BooleanField,
  BooleanFieldOptional,
  ClassField,
  ClassFieldOptional,
  EnumFieldOptional,
  StringField,
  StringFieldOptional,
  UUIDField,
  UUIDFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ReactionUserDto {
  @UUIDField()
  @Expose()
  id: string;

  @StringField()
  @Expose()
  name: string;

  @StringFieldOptional()
  @Expose()
  avatar?: string;
}

export class ReactionSummaryDto {
  @ApiProperty()
  @Expose()
  count: number;

  @ClassField(() => ReactionUserDto, { each: true })
  @Expose()
  @Type(() => ReactionUserDto)
  users: ReactionUserDto[];
}

export class ActivityCommentResDto extends AuditResDto {
  @UUIDField()
  @Expose()
  activityId: Uuid;

  @UUIDFieldOptional()
  @Expose()
  parentCommentId?: Uuid;

  @StringField()
  @Expose()
  content: string;

  @BooleanField()
  @Expose()
  isEdited: boolean;

  @ApiPropertyOptional()
  @Expose()
  editedAt?: Date;

  @ApiPropertyOptional()
  @Expose()
  reactions?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Counts of reactions by type' })
  @Expose()
  reactionCounts?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Detailed summary of reactions with user info',
  })
  @Expose()
  reactionSummary?: Record<string, ReactionSummaryDto>;

  @EnumFieldOptional(() => ReactionType, {
    description: "Current user's reaction type if any",
  })
  @Expose()
  currentUserReaction?: ReactionType;

  @BooleanFieldOptional({
    description: 'Whether current user has reacted to this comment',
  })
  @Expose()
  hasUserReacted?: boolean;

  @ApiProperty({ description: 'Total reaction count' })
  @Expose()
  get totalReactions(): number {
    if (this.reactionCounts) {
      return Object.values(this.reactionCounts).reduce(
        (sum, count) => sum + count,
        0,
      );
    }
    return 0;
  }

  @ClassField(() => UserResDto)
  @Expose()
  @Type(() => UserResDto)
  user: UserResDto;

  @ClassFieldOptional(() => ActivityCommentResDto, { each: true })
  @Expose()
  @Type(() => ActivityCommentResDto)
  replies?: ActivityCommentResDto[];
}
