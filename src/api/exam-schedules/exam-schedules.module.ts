import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSchedule } from './entities/exam-schedule.entity';
import { ExamSchedulesService } from './exam-schedules.service';
import { ExamSchedulesController } from './exam-schedules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamSchedule])],
  controllers: [ExamSchedulesController],
  providers: [ExamSchedulesService],
  exports: [ExamSchedulesService],
})
export class ExamSchedulesModule {}

