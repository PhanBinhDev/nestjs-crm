import { UserResDto } from '@/api/users/dto/user.res.dto';
import { ClassField } from '@/decorators/field.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NotificationResDto {
  @ApiProperty({ type: String, example: '78a30f68-02d0-497b-bce6-f62404a9ce7b' })
  @Expose()
  id: string;

  @ApiProperty({ type: String, example: 'c05a0704-47a1-417a-8267-17ab29a151d3' })
  @Expose()
  userId: string;

  @ClassField(() => UserResDto)
  @Expose()
  user: UserResDto;

  @ClassField(() => UserResDto)
  @Expose()
  sender?: UserResDto;

  @ApiProperty({ type: String, required: false, example: '601b2262-7316-4899-9742-031a610b5b0f' })
  @Expose()
  senderId?: string;

  @ApiProperty({ type: String, example: 'Lời mời tham gia không gian làm việc' })
  @Expose()
  title: string;

  @ApiProperty({ type: String, required: false, example: 'Bạn đã được mời tham gia không gian làm việc "Quốc Anh\'s Workspace"' })
  @Expose()
  message?: string;

  @ApiProperty({ type: String, required: false, example: 'workspace' })
  @Expose()
  type?: string;

  @ApiProperty({ 
    type: Object, 
    required: false, 
    example: {
      uri: '/invite-members/23c070e36f701860b080a7cf76012d0d8065bd0b698a48045e53c95f5ffde82c',
      workspaceId: 'beea0336-3829-4eec-8577-90eb23910e50'
    }
  })
  @Expose()
  data?: any;

  @ApiProperty({ type: Boolean, example: false })
  @Expose()
  isRead: boolean;

  @ApiProperty({ type: String, required: false, example: '2025-10-22T20:14:18.405Z' })
  @Expose()
  readAt?: Date;

  @ApiProperty({ type: Boolean, example: false })
  @Expose()
  isDeleted: boolean;

  @ApiProperty({ type: String, example: '2025-10-23T01:53:33.296Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ 
    type: String, 
    required: false, 
    description: 'Trạng thái thành viên trong workspace',
    example: 'PENDING',
    enum: ['PENDING', 'ACTIVE', 'REJECT']
  })
  @Expose()
  memberStatus?: string;
}
