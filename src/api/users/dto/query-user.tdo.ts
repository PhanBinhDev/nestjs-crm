import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { UserRole } from '@/database/enum/user.enum';
import { TransformToArray } from '@/utils/transform.util';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class QueryUserDto extends PageOptionsDto {
  @ApiPropertyOptional({
    enum: UserRole,
    isArray: true,
    description: 'Filter by multiple roles',
    example: [UserRole.TM, UserRole.CNBM],
  })
  @IsOptional()
  @TransformToArray()
  @IsEnum(UserRole, { each: true })
  role?: UserRole[];

  @ApiPropertyOptional({
    type: Boolean,
    isArray: true,
    description: 'Filter by active status (supports multiple values)',
    example: [true, false],
  })
  @IsOptional()
  @TransformToArray()
  @IsBoolean({ each: true })
  isActive?: boolean[];
}
