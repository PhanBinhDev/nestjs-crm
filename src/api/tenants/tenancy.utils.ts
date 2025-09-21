import { tenantConfig } from '@/database/config/tenant-orm.config';
import { DataSource, DataSourceOptions } from 'typeorm';

const poolSize = process.env.DATABASE_MAX_CONNECTIONS
  ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
  : 100;

export const tenantConnections: {
  [schemaname: string]: DataSource;
} = {};

export async function getTenantConnection(
  tenantId: string,
): Promise<DataSource> {
  const connectionName = `tenant_${tenantId}`;

  if (tenantConnections[connectionName]) {
    const connection = tenantConnections[connectionName];
    return connection;
  } else {
    const dataSource = new DataSource({
      ...tenantConfig,
      name: connectionName,
      schema: connectionName,
      poolSize,
    } as DataSourceOptions);

    await dataSource.initialize();

    tenantConnections[connectionName] = dataSource;

    return dataSource;
  }
}
