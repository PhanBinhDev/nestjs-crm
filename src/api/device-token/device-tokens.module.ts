import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceTokensController } from './device-tokens.controller';
import { DeviceTokensService } from './device-tokens.service';
import { DeviceTokenEntity } from './entities/device-tokens.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceTokenEntity])],
  controllers: [DeviceTokensController],
  providers: [DeviceTokensService],
  exports: [DeviceTokensService],
})
export class DeviceTokensModule {}
