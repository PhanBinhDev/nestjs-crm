import { ActivityEntity } from '@/api/activities/entities/activity.entity';
import { ResponseDto } from '@/common/dto/response/response.dto';
import { Controller, Get, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { OverdueCheckService } from '../service/overdue-check.service';

@ApiTags('Background Jobs')
@Controller('background')
export class BackgroundController {
  private readonly logger = new Logger(BackgroundController.name);

  constructor(
    private readonly overdueCheckService: OverdueCheckService,
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for background service' })
  async healthCheck(): Promise<ResponseDto<any>> {
    try {
      const result = await this.overdueCheckService.healthCheck();
      return new ResponseDto({
        data: result,
        message:
          result.status === 'healthy'
            ? 'Service is healthy'
            : 'Service has issues',
      });
    } catch (error) {
      this.logger.error('Health check error:', error);
      return new ResponseDto({
        data: { status: 'unhealthy', error: error.message },
        message: 'Health check failed',
      });
    }
  }

  @Get('debug-activities')
  @ApiOperation({ summary: 'Debug activities data' })
  async debugActivities(): Promise<ResponseDto<any>> {
    try {
      // Kiểm tra connection
      await this.activityRepo.query('SELECT 1 as test');

      // Đếm tổng số activities
      const totalCount = await this.activityRepo.count();

      // Lấy vài activities mẫu
      const sampleActivities = await this.activityRepo.find({
        take: 5,
        select: ['id', 'name', 'status', 'endTime', 'createdAt'],
      });

      // Kiểm tra activities có endTime
      const activitiesWithEndTime = await this.activityRepo.count({
        where: {
          endTime: Not(null),
        },
      });

      return new ResponseDto({
        data: {
          totalCount,
          activitiesWithEndTime,
          sampleActivities,
          databaseConnection: 'OK',
        },
        message: 'Debug info retrieved successfully',
      });
    } catch (error) {
      this.logger.error('Debug activities error:', error);
      return new ResponseDto({
        data: { error: error.message },
        message: 'Debug failed',
      });
    }
  }

  @Post('check-overdue')
  @ApiOperation({ summary: 'Manual overdue check' })
  async checkOverdue(): Promise<ResponseDto<any>> {
    try {
      const result = await this.overdueCheckService.manualOverdueCheck();

      return new ResponseDto({
        data: result,
        message: result.error
          ? `Error occurred: ${result.error}`
          : `Checked and updated ${result.updatedCount} overdue activities`,
      });
    } catch (error) {
      this.logger.error('Manual check error:', error);
      return new ResponseDto({
        data: { error: error.message },
        message: 'Manual check failed',
      });
    }
  }

  @Post('test-simple-query')
  @ApiOperation({ summary: 'Test simple database query' })
  async testSimpleQuery(): Promise<ResponseDto<any>> {
    try {
      // Test basic query
      const result = await this.activityRepo.query(
        'SELECT COUNT(*) as count FROM activities',
      );

      return new ResponseDto({
        data: { queryResult: result },
        message: 'Simple query executed successfully',
      });
    } catch (error) {
      this.logger.error('Simple query error:', error);
      return new ResponseDto({
        data: { error: error.message },
        message: 'Simple query failed',
      });
    }
  }
}
