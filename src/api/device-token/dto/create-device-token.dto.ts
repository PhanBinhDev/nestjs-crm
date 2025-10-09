import { ArrayField } from '@/decorators/field.decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class CreateDeviceTokenDto {
  @ArrayField(() => String, {
    description: 'Danh sách các token của thiết bị',
    example: ['token1', 'token2'],
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  tokens: string[];

  @ApiPropertyOptional({
    description: 'Thông tin về thiết bị',
    type: String,
    example: 'Web',
  })
  deviceInfo?: string;
}
