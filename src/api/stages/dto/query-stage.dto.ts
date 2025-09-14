import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { StageGroup } from '@/database/enum/stage.enum';
import {
  BooleanFieldOptional,
  EnumFieldOptional,
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
}
