import {
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class CreateTenantDto {
  @StringField({
    description: 'Mã cơ sở',
    example: 'hanoi',
  })
  code: string;

  @StringField({
    description: 'Tên cơ sở',
    example: 'Cơ sở Hà Nội',
  })
  name: string;

  @StringFieldOptional({
    description: 'Địa chỉ cơ sở',
    example: '123 Đường Láng, Hà Nội',
  })
  address?: string;
}
