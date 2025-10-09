import { Uuid } from '@/common/types/common.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceTokenDto } from './dto/create-device-token.dto';
import { DeviceTokenEntity } from './entities/device-tokens.entity';

@Injectable()
export class DeviceTokensService {
  constructor(
    @InjectRepository(DeviceTokenEntity)
    private readonly deviceTokenRepository: Repository<DeviceTokenEntity>,
  ) {}

  async saveDeviceToken(
    createDeviceTokenDto: CreateDeviceTokenDto,
    userId: Uuid,
  ) {
    const { tokens, deviceInfo } = createDeviceTokenDto;

    const record = await this.deviceTokenRepository.findOne({
      where: { userId, deviceInfo },
    });

    if (record) {
      const updatedTokens = Array.from(new Set([...record.tokens, ...tokens]));
      record.tokens = updatedTokens;
      await this.deviceTokenRepository.save(record);
      return record;
    } else {
      const newRecord = this.deviceTokenRepository.create({
        userId,
        tokens,
        deviceInfo,
      });
      await this.deviceTokenRepository.save(newRecord);
      return newRecord;
    }
  }

  async findAllByUserId(userId: Uuid): Promise<string[]> {
    const deviceTokens = await this.deviceTokenRepository.find({
      where: { userId },
    });
    return deviceTokens.map((token) => token.tokens).flat();
  }

  async removeToken(userId: Uuid, token: string) {
    const deviceTokenRecords = await this.deviceTokenRepository.find({
      where: { userId },
    });

    for (const record of deviceTokenRecords) {
      if (record.tokens.includes(token)) {
        record.tokens = record.tokens.filter((t) => t !== token);
        await this.deviceTokenRepository.save(record);
      }
    }
  }
}
