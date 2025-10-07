import {
  BooleanFieldOptional,
  ClassFieldOptional,
  StringField,
} from '@/decorators/field.decorators';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CreateChecklistItemDto {
  @StringField()
  content: string;

  @BooleanFieldOptional()
  isDone?: boolean;
}

export class CreateChecklistDto {
  @StringField()
  name: string;

  @ClassFieldOptional(() => CreateChecklistItemDto, {
    isArray: true,
    description: 'Danh sách công việc trong checklist',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items?: CreateChecklistItemDto[];
}
