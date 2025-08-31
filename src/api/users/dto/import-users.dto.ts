import { UserRole } from '@/database/enum/user.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
} from 'class-validator';

export class ImportUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username (optional, will be auto-generated if not provided)',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email (must be unique)',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '0123456789',
    description: 'Phone number',
  })
  @IsString()
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.GV,
    description: 'User role in the system',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Date of birth (YYYY-MM-DD format)',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'User major/field of study',
    required: false,
  })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ImportUsersResponseDto {
  @ApiProperty({
    example: 10,
    description: 'Number of users successfully imported',
  })
  successCount: number;

  @ApiProperty({
    example: 2,
    description: 'Number of users that failed to import',
  })
  failureCount: number;

  @ApiProperty({
    example: [
      {
        row: 3,
        email: 'duplicate@example.com',
        error: 'Email already exists in the system',
      },
    ],
    description: 'Detailed list of import errors',
  })
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export class ImportUsersFromUrlDto {
  @ApiProperty({
    example: 'https://docs.google.com/spreadsheets/d/192UtoRvF0uO-PYjaTIRUk5EkJCMbJTSAG5pM-V2O_tU/export?format=xlsx',
    description: 'Google Sheets URL (must be converted to export format)',
  })
  @IsString()
  @IsUrl()
  url: string;
}
