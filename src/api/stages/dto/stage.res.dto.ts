import { AuditResDto } from '@/common/dto/audit.res.dto';
import { Uuid } from '@/common/types/common.type';
import { StageGroup } from '@/database/enum/stage.enum';
import {
  BooleanField,
  EnumField,
  NumberField,
  StringField,
} from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';

export class StageResDto extends AuditResDto {
  @StringField({ description: 'Tên stage' })
  @Expose()
  title: string;

  @NumberField({ description: 'Vị trí của stage trong danh sách' })
  @Expose()
  position: number;

  @StringField({ description: 'Mã màu của stage' })
  @Expose()
  color: string;

  @EnumField(() => StageGroup, { description: 'Nhóm của stage' })
  @Expose()
  stageGroup: StageGroup;

  @NumberField({ description: 'Vị trí của nhóm trong danh sách' })
  @Expose()
  groupPosition: number;

  @StringField({ description: 'ID của workspace mà stage thuộc về' })
  @Expose()
  workspaceId: Uuid;

  @BooleanField({ description: 'Stage có phải là built-in hay không' })
  @Expose()
  isBuiltIn: boolean;

  @BooleanField({
    description: 'Stage có phải là trạng thái hoàn thành hay không',
  })
  @Expose()
  isCompleted: boolean;

  @StringField({ description: 'Người cập nhật' })
  @Expose()
  updatedBy: string;
}
