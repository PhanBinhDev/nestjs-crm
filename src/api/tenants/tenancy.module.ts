import { Global, Module, Scope } from '@nestjs/common';
import { Request } from 'express';
import { TENANCY_CONNECTION } from './tenancy.symbols';
import { getTenantConnection } from './tenancy.utils';

const connectionFactory = {
  provide: TENANCY_CONNECTION,
  scope: Scope.REQUEST,
  useFactory: async (request: Request) => {
    const { tenantId } = request;

    if (tenantId) {
      const connection = await getTenantConnection(tenantId);

      const queryRunner = connection.createQueryRunner();

      await queryRunner.connect();

      return queryRunner.manager;
    }

    return null;
  },
  inject: [Request],
};

@Global()
@Module({
  providers: [connectionFactory],
  exports: [TENANCY_CONNECTION],
})
export class TenancyModule {}
