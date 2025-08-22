import { Uuid } from '@/common/types/common.type';
import { SemesterStatus } from '@/database/enum/semeter.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { SemesterEntity } from '../entities/semester.entity';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SemesterTypeInfo {
  type: 'Spring' | 'Summer' | 'Fall';
  order: number;
  typicalStart: number; // month
  typicalEnd: number; // month
  minDuration: number; // days
  maxDuration: number; // days
}

@Injectable()
export class SemesterValidationService {
  private readonly SEMESTER_TYPES: Record<string, SemesterTypeInfo> = {
    Spring: {
      type: 'Spring',
      order: 0,
      typicalStart: 1,
      typicalEnd: 5,
      minDuration: 90,
      maxDuration: 150,
    },
    Summer: {
      type: 'Summer',
      order: 1,
      typicalStart: 6,
      typicalEnd: 8,
      minDuration: 60,
      maxDuration: 90,
    },
    Fall: {
      type: 'Fall',
      order: 2,
      typicalStart: 9,
      typicalEnd: 12,
      minDuration: 90,
      maxDuration: 150,
    },
  };

  private readonly MIN_GAP_DAYS = 3;
  private readonly MAX_GAP_DAYS = 30;

  constructor(
    @InjectRepository(SemesterEntity)
    private readonly semesterRepo: Repository<SemesterEntity>,
  ) {}

  async validateSemesterCreation(
    dto: CreateSemesterDto,
  ): Promise<ValidationResult> {
    const existingSemesters = await this.getAllSemesters();
    return this.validateSemesterData(dto, existingSemesters);
  }

  async validateSemesterUpdate(
    id: Uuid,
    dto: UpdateSemesterDto,
  ): Promise<ValidationResult> {
    const existingSemesters = await this.getAllSemesters();
    const filteredSemesters = existingSemesters.filter((s) => s.id !== id);
    return this.validateSemesterData(dto, filteredSemesters, id);
  }

  private async getAllSemesters(): Promise<SemesterEntity[]> {
    return await this.semesterRepo.find({
      order: { startDate: 'ASC' },
    });
  }

  private validateSemesterData(
    dto: CreateSemesterDto | UpdateSemesterDto,
    existingSemesters: SemesterEntity[],
    updateId?: Uuid,
  ): ValidationResult {
    const errors: string[] = [];

    try {
      this.validateBasicInfo(dto, errors);
      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      this.validateSemesterType(dto.name, errors);
      this.validateTimeOverlap(dto, existingSemesters, errors);
      this.validateUniqueSemesterPerYear(dto, existingSemesters, errors);
      this.validateSemesterSequence(dto, existingSemesters, errors);
      this.validateSemesterTiming(dto, errors);
      this.validateGapBetweenSemesters(dto, existingSemesters, errors);
      this.validateStatusConsistency(dto, errors);
      this.validateCurrentSemesterUniqueness(dto, existingSemesters, errors);
    } catch (error) {
      errors.push(error.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateBasicInfo(
    dto: CreateSemesterDto | UpdateSemesterDto,
    errors: string[],
  ): void {
    if (!dto.name?.trim()) {
      errors.push('Tên học kỳ không được để trống');
    }
    if (!dto.startDate || !dto.endDate) {
      errors.push('Ngày bắt đầu và ngày kết thúc không được để trống');
      return;
    }
    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      errors.push('Ngày bắt đầu phải trước ngày kết thúc');
    }
    if (!dto.year) {
      errors.push('Năm học không được để trống');
    }
    const startYear = new Date(dto.startDate).getFullYear();
    if (dto.year && dto.year !== startYear) {
      errors.push(
        `Năm trong tên kỳ học (${dto.year}) phải khớp với năm bắt đầu (${startYear})`,
      );
    }
  }

  private extractSemesterType(semesterName: string): SemesterTypeInfo | null {
    const name = semesterName.toLowerCase();
    for (const [key, info] of Object.entries(this.SEMESTER_TYPES)) {
      if (name.includes(key.toLowerCase())) {
        return info;
      }
    }
    return null;
  }

  private validateSemesterType(semesterName: string, errors: string[]): void {
    const semesterType = this.extractSemesterType(semesterName);
    if (!semesterType) {
      errors.push(
        'Tên học kỳ phải chứa một trong các từ khóa: Spring, Summer, Fall',
      );
    }
  }

  private validateTimeOverlap(
    dto: CreateSemesterDto | UpdateSemesterDto,
    existingSemesters: SemesterEntity[],
    errors: string[],
  ): void {
    const newStart = new Date(dto.startDate);
    const newEnd = new Date(dto.endDate);
    const conflicts = existingSemesters.filter((existing) => {
      const existingStart = new Date(existing.startDate);
      const existingEnd = new Date(existing.endDate);
      return newStart <= existingEnd && existingStart <= newEnd;
    });
    if (conflicts.length > 0) {
      errors.push(
        `Kỳ học bị trùng thời gian với: ${conflicts.map((c) => c.name).join(', ')}`,
      );
    }
  }

  private validateUniqueSemesterPerYear(
    dto: CreateSemesterDto | UpdateSemesterDto,
    existingSemesters: SemesterEntity[],
    errors: string[],
  ): void {
    const newType = this.extractSemesterType(dto.name);
    if (!newType) return;
    const newYear = dto.year || new Date(dto.startDate).getFullYear();
    const conflictSemester = existingSemesters.find((existing) => {
      const existingType = this.extractSemesterType(existing.name);
      return existingType?.type === newType.type && existing.year === newYear;
    });
    if (conflictSemester) {
      errors.push(
        `Năm ${newYear} đã có ${newType.type}: "${conflictSemester.name}". Mỗi năm chỉ được có 1 kỳ ${newType.type}.`,
      );
    }
  }

  private validateSemesterSequence(
    dto: CreateSemesterDto | UpdateSemesterDto,
    existingSemesters: SemesterEntity[],
    errors: string[],
  ): void {
    const newType = this.extractSemesterType(dto.name);
    if (!newType) return;
    const newYear = dto.year || new Date(dto.startDate).getFullYear();
    const newStart = new Date(dto.startDate);
    const sameYearSemesters = existingSemesters.filter(
      (s) => s.year === newYear,
    );
    sameYearSemesters.forEach((existing) => {
      const existingType = this.extractSemesterType(existing.name);
      if (!existingType) return;
      const existingStart = new Date(existing.startDate);
      if (newType.order < existingType.order && newStart > existingStart) {
        errors.push(
          `${newType.type} phải bắt đầu trước ${existingType.type} trong cùng năm. Hiện tại ${newType.type} bắt đầu sau ${existingType.type}.`,
        );
      }
      if (newType.order > existingType.order && newStart < existingStart) {
        errors.push(
          `${newType.type} phải bắt đầu sau ${existingType.type} trong cùng năm. Hiện tại ${newType.type} bắt đầu trước ${existingType.type}.`,
        );
      }
    });
  }

  private validateSemesterTiming(
    dto: CreateSemesterDto | UpdateSemesterDto,
    errors: string[],
  ): void {
    const semesterType = this.extractSemesterType(dto.name);
    if (!semesterType) return;
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const durationDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (durationDays < semesterType.minDuration) {
      errors.push(
        `${semesterType.type} quá ngắn (${Math.round(durationDays)} ngày). Tối thiểu ${semesterType.minDuration} ngày.`,
      );
    }
    if (durationDays > semesterType.maxDuration) {
      errors.push(
        `${semesterType.type} quá dài (${Math.round(durationDays)} ngày). Tối đa ${semesterType.maxDuration} ngày.`,
      );
    }
    const startMonth = startDate.getMonth() + 1;
    if (
      startMonth < semesterType.typicalStart ||
      startMonth > semesterType.typicalEnd
    ) {
      errors.push(
        `${semesterType.type} thường bắt đầu vào tháng ${semesterType.typicalStart}-${semesterType.typicalEnd}, nhưng kỳ này bắt đầu tháng ${startMonth}`,
      );
    }
  }

  private validateGapBetweenSemesters(
    dto: CreateSemesterDto | UpdateSemesterDto,
    existingSemesters: SemesterEntity[],
    errors: string[],
  ): void {
    const newStart = new Date(dto.startDate);
    const newEnd = new Date(dto.endDate);
    existingSemesters.forEach((existing) => {
      const existingStart = new Date(existing.startDate);
      const existingEnd = new Date(existing.endDate);
      let gap: number;
      if (newStart > existingEnd) {
        gap =
          (newStart.getTime() - existingEnd.getTime()) / (1000 * 60 * 60 * 24);
      } else if (existingStart > newEnd) {
        gap =
          (existingStart.getTime() - newEnd.getTime()) / (1000 * 60 * 60 * 24);
      } else {
        return;
      }
      if (gap < this.MIN_GAP_DAYS) {
        errors.push(
          `Cần có ít nhất ${this.MIN_GAP_DAYS} ngày nghỉ giữa các kỳ học. Hiện tại chỉ có ${Math.round(gap)} ngày với kỳ "${existing.name}".`,
        );
      }
    });
  }

  private validateStatusConsistency(
    dto: CreateSemesterDto | UpdateSemesterDto,
    errors: string[],
  ): void {
    if (!dto.status) return;
    const now = new Date();
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const autoStatus = this.getAutoStatus(start, end, now);
    if (dto.status !== autoStatus) {
      errors.push(
        `Trạng thái không khớp với thời gian. Đề xuất status: ${autoStatus}`,
      );
    }
  }

  private getAutoStatus(start: Date, end: Date, now: Date): SemesterStatus {
    if (now < start) return SemesterStatus.UPCOMING;
    if (now >= start && now <= end) return SemesterStatus.ONGOING;
    return SemesterStatus.COMPLETED;
  }

  private validateCurrentSemesterUniqueness(
    dto: CreateSemesterDto | UpdateSemesterDto,
    existingSemesters: SemesterEntity[],
    errors: string[],
  ): void {
    if (dto.status !== SemesterStatus.ONGOING) return;
    const otherOngoingSemesters = existingSemesters.filter(
      (s) => s.status === SemesterStatus.ONGOING,
    );
    if (otherOngoingSemesters.length > 0) {
      errors.push(
        `Đã có kỳ học ONGOING: "${otherOngoingSemesters[0].name}". Chỉ được có 1 kỳ học ONGOING tại một thời điểm.`,
      );
    }
  }
}
