import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { SelectQueryBuilder } from 'typeorm';

export async function paginate<T>(
  builder: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  options?: Partial<{
    skipCount: boolean;
    takeAll: boolean;
  }>,
): Promise<[T[], OffsetPaginationDto]> {
  let count = -1;

  // Get total count BEFORE applying skip/take
  if (!options?.skipCount) {
    count = await builder.getCount();
  }

  // Apply pagination AFTER getting count
  if (!options?.takeAll) {
    builder.skip(pageOptionsDto.offset).take(pageOptionsDto.limit);
  }

  const entities: T[] = await builder.getMany();

  const metaDto = new OffsetPaginationDto(count, pageOptionsDto);

  return [entities, metaDto];
}
