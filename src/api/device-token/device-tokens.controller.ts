import { ApiAuth } from '@/decorators/http.decorators';
import { Body, Controller, Post } from '@nestjs/common';
import { DeviceTokensService } from './device-tokens.service';
import { CreateDeviceTokenDto } from './dto/create-device-token.dto';

@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @ApiAuth({
    summary: 'Lưu token thiết bị',
  })
  saveDeviceToken(@Body() createDeviceTokenDto: CreateDeviceTokenDto) {
    return this.deviceTokensService.saveDeviceToken(createDeviceTokenDto);
  }
}
