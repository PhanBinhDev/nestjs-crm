import { BooleanFieldOptional } from '@/decorators/field.decorators';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
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
export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyễn Văn A',
    description: 'Full name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Username',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'Date of birth',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'Computer Science',
    description: 'Major/Department',
  })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}
