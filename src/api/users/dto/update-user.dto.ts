import { BooleanFieldOptional } from '@/decorators/field.decorators';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'Indicates if the user is active',
    required: false,
    type: Boolean,
  })
  @BooleanFieldOptional()
  isActive?: boolean;
}
