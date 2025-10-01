import { DateField, UUIDField } from '@/decorators/field.decorators';
import { Expose } from 'class-transformer';
import { Uuid } from '../types/common.type';

export class AuditResDto {
  @UUIDField()
  @Expose()
  id: Uuid;

  @DateField()
  @Expose()
  createdAt: Date;

  @DateField()
  @Expose()
  updatedAt: Date;

  @UUIDField()
  @Expose()
  createdBy: Uuid;
}
