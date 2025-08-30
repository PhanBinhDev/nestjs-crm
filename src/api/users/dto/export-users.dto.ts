import { ApiProperty } from '@nestjs/swagger';

export class ExportUserDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  name: string;

  @ApiProperty({ example: 'john_doe', description: 'Username' })
  username?: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: '0123456789', description: 'Phone number' })
  phone: string;

  @ApiProperty({ example: 'GV', description: 'User role in the system' })
  role: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Date of birth (YYYY-MM-DD format)',
  })
  dateOfBirth?: string;

  @ApiProperty({
    example: 'Computer Science',
    description: 'User major/field of study',
  })
  major?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar image URL',
  })
  avatar?: string;
}
