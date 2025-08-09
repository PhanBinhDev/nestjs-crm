import { UserRole } from '@/database/enum/user.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsPhoneNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'john_doe',
    required: false,
  })
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '1234567890',
  })
  @IsString()
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    example: '1990-01-01',
    required: false,
  })
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.GV })
  @IsEnum(UserRole)
  role: UserRole;
}
