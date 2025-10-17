import { BooleanFieldOptional } from '@/decorators/field.decorators';
import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {
  @BooleanFieldOptional({
    description: 'Xoá avatar của workspace nếu có',
    example: true,
  })
  removeAvatar?: boolean;
}
