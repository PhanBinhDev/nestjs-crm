import { DEFAULT_PAGE_LIMIT, Order } from '@/constants/app.constant';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from '@/decorators/field.decorators';

export class PageOptionsDto {
  @StringFieldOptional()
  afterCursor?: string;

  @StringFieldOptional()
  beforeCursor?: string;

  @NumberFieldOptional({
    min: 1,
    default: DEFAULT_PAGE_LIMIT,
    int: true,
  })
  readonly limit?: number = DEFAULT_PAGE_LIMIT;

  @StringFieldOptional()
  readonly q?: string;

  @StringFieldOptional()
  readonly sortBy?: string;

  @EnumFieldOptional(() => Order, { default: Order.ASC })
  readonly order?: Order = Order.ASC;
}
