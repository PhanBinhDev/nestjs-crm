import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import {
  BooleanField,
  ClassField,
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

  @ApiProperty({ description: 'Total reaction count' })
  @Expose()
  totalReactions: number;

  @ApiProperty({ description: 'Reaction counts by type' })
  @Expose()
  reactionCounts: Record<string, number>;

  @ApiProperty({ description: 'Reaction summary with users' })
  @Expose()
  reactionSummary: Record<string, ReactionSummaryDto>;

  @ApiPropertyOptional({ description: 'Current user reaction type' })
  @Expose()
  currentUserReaction?: string;

  @BooleanField({ description: 'Whether current user has reacted' })
  @Expose()
  hasUserReacted: boolean;

  @ClassField(() => ActivityCommentResDto, { each: true })
  @Expose()
  @Type(() => ActivityCommentResDto)
  replies?: ActivityCommentResDto[];
}
