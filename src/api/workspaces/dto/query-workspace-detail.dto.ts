import { BooleanFieldOptional } from '@/decorators/field.decorators';

export class QueryWorkspaceDetailDto {
  @BooleanFieldOptional({
    description: 'Bao gồm cài đặt hiển thị của workspace',
  })
  includeViewSettings?: boolean;

  @BooleanFieldOptional({
    description: 'Bao gồm thành viên của workspace',
  })
  includeMembers?: boolean;
}
