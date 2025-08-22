import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemesterBlockEntity } from './entities/semester-block.entity';
import { SemesterEntity } from './entities/semester.entity';
import { SemesterController } from './semester.controller';
import { SemesterService } from './semester.service';
import { SemesterValidationService } from './validation/semester-validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([SemesterEntity, SemesterBlockEntity])],
  controllers: [SemesterController],
  providers: [SemesterService, SemesterValidationService],
  exports: [SemesterService, SemesterValidationService],
})
export class SemesterModule {}
