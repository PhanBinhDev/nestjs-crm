import { DataSourceOptions } from 'typeorm';
import { publicConfig } from './public-orm.config';

export const tenantConfig: DataSourceOptions = {
  ...publicConfig,
  entities: [__dirname + '/../../api/tenant/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../database/migrations/tenant/*{.ts,.js}'],
};
