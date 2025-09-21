import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantEntity } from './entities/tenants.entity';

@Injectable()
export class TenantsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createTenant(
    tenantDto: CreateTenantDto,
    userId: Uuid,
  ): Promise<TenantEntity> {
    const user = await this.dataSource
      .getRepository(UserEntity)
      .findOne({ where: { id: userId } });

    const tenant = new TenantEntity();
    tenant.name = tenantDto.name;
    const schemaName = `tenant_${tenant.id}`;
    tenant.schemaName = schemaName;
    tenant.address = tenantDto.address;
    tenant.owner = user;
    // save schemaName
    await this.dataSource.getRepository(TenantEntity).save(tenant);
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    await this.runMigrations(schemaName);

    return tenant;
  }

  private async runMigrations(schemaName: string) {
    const tenantConfig = {
      ...this.dataSource.options,
      schema: schemaName,
    };

    const tenantDataSource = new DataSource(tenantConfig);
    await tenantDataSource.initialize();
    await tenantDataSource.runMigrations();
    await tenantDataSource.destroy();
  }
}
