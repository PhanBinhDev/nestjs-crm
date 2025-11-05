import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class ImportExamScheduleDto {
  @ApiProperty({
    example: '2025-08-22',
    description: 'Ngày thi (DD/MM/YYYY format)',
  })
  @IsDateString()
  examDate: string;

  @ApiProperty({
    example: 1,
    description: 'Ca thi',
  })
  @IsInt()
  examSession: number;

  @ApiProperty({
    example: 'P',
    description: 'Tòa nhà',
    required: false,
  })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiProperty({
    example: 'TVB',
    description: 'Campus',
    required: false,
  })
  @IsOptional()
  @IsString()
  campus?: string;

  @ApiProperty({
    example: 'P302',
    description: 'Phòng thi',
    required: false,
  })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiProperty({
    example: 'MOB2041',
    description: 'Mã môn',
    required: false,
  })
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiProperty({
    example: '301',
    description: 'Mã ca thi',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionCode?: string;

  @ApiProperty({
    example: 'Bảo vệ Dự án',
    description: 'Loại thi',
    required: false,
  })
  @IsOptional()
  @IsString()
  examType?: string;

  @ApiProperty({
    example: 'MD20301',
    description: 'Lớp',
    required: false,
  })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiProperty({
    example: 'hungnq',
    description: 'Giảng viên',
    required: false,
  })
  @IsOptional()
  @IsString()
  lecturer?: string;

  @ApiProperty({
    example: 'CNTT',
    description: 'Bộ môn',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    example: 'hungnq',
    description: 'Giám thị 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  examiner1?: string;

  @ApiProperty({
    example: 'sondt32',
    description: 'Giám thị 2',
    required: false,
  })
  @IsOptional()
  @IsString()
  examiner2?: string;
}

export class ImportExamSchedulesResponseDto {
  @ApiProperty({
    example: 10,
    description: 'Số lượng lịch thi được import thành công',
  })
  successCount: number;

  @ApiProperty({
    example: 2,
    description: 'Số lượng lịch thi import thất bại',
  })
  failureCount: number;

  @ApiProperty({
    example: [
      {
        row: 3,
        error: 'Ngày thi không hợp lệ',
      },
    ],
    description: 'Danh sách lỗi chi tiết',
  })
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export class ImportExamSchedulesFromUrlDto {
  @ApiProperty({
    example:
      'https://docs.google.com/spreadsheets/d/192UtoRvF0uO-PYjaTIRUk5EkJCMbJTSAG5pM-V2O_tU/export?format=xlsx',
    description: 'Google Sheets URL (phải ở định dạng export: /export?format=xlsx)',
  })
  @IsString()
  url: string;
}

