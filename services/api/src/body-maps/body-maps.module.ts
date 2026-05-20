import { Module } from '@nestjs/common';
import { BodyMapsController } from './body-maps.controller';
import { BodyMapsService } from './body-maps.service';

@Module({
  controllers: [BodyMapsController],
  providers: [BodyMapsService],
  exports: [BodyMapsService],
})
export class BodyMapsModule {}
