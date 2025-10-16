import { Uuid } from '@/common/types/common.type';
import {
  BooleanFieldOptional,
  ClassFieldOptional,
  StringFieldOptional,
  UUIDField,
} from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class UpdateChecklistItemDto {
  @UUIDField()
  id: Uuid;

  @StringFieldOptional()
  content?: string;

  @BooleanFieldOptional()
  isDone?: boolean;
}

export class UpdateChecklistDto {
  @StringFieldOptional()
  name?: string;

  @ClassFieldOptional(() => UpdateChecklistItemDto, {
    isArray: true,
    description: 'Danh sách công việc trong checklist',
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateChecklistItemDto)
  items?: UpdateChecklistItemDto[];
}
