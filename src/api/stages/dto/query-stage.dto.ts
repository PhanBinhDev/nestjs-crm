import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { Uuid } from '@/common/types/common.type';
import { StageGroup } from '@/database/enum/stage.enum';
import {
  BooleanFieldOptional,
  EnumFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';

export class QueryStageDto extends PageOptionsDto {
  @EnumFieldOptional(() => StageGroup, {
    description: 'Lọc stage theo nhóm',
    example: StageGroup.ACTIVE,
  })
  stageGroup?: StageGroup;

  @BooleanFieldOptional({
    description: 'Lọc stage theo built-in hay không',
    example: true,
  })
  isBuiltIn?: boolean;

  @UUIDField({
    description: 'Lọc stage theo ID của workspace',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  workspaceId: Uuid;
}
