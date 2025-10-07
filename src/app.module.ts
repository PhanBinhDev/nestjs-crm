import { MiddlewareConsumer, Module } from '@nestjs/common';
import { BackgroundModule } from './background/background.module';
import { UserMiddleware } from './common/middleware/user.middleware';
import generateModulesSet from './utils/modules-set';

@Module({
  imports: [...generateModulesSet(), BackgroundModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('*');
  }
}
