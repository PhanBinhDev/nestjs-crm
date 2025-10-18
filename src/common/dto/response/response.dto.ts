import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseDto<TData> {
  @ApiProperty({ type: [Object] })
  @Expose()
  readonly data: TData;

  @ApiProperty()
  @Expose()
  statusCode: number;

  @ApiProperty()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  timestamp: Date;

  @ApiPropertyOptional()
  @Expose()
  metadata: Record<string, any>;

  constructor({
    data,
    statusCode = 200,
    message = 'Success',
    metadata = {},
  }: {
    data: TData;
    statusCode?: number;
    message?: string;
    metadata?: Record<string, any>;
  }) {
    this.data = data;
    this.statusCode = statusCode;
    this.message = message;
    this.metadata = metadata;
    this.timestamp = new Date();
  }
}
