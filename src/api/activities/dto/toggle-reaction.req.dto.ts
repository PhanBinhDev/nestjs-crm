import { ReactionType } from '@/database/enum/comments.enum';
import { EnumField } from '@/decorators/field.decorators';

export class ToggleReactionReqDto {
  @EnumField(() => ReactionType, {
    description: 'Type of reaction to toggle',
    example: ReactionType.LIKE,
  })
  type: ReactionType;
}
