import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DocumentsModule } from './api/documents/documents.module';
import { UserMiddleware } from './common/middleware/user.middleware';
import generateModulesSet from './utils/modules-set';

@Module({
  imports: [...generateModulesSet(), DocumentsModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('*');
  }
}
