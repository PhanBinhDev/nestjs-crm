import { BooleanFieldOptional } from '@/decorators/field.decorators';

export class QueryWorkspaceDetailDto {
  @BooleanFieldOptional({
    description: 'Bao gồm thành viên của workspace',
  })
  includeMembers?: boolean;
}
