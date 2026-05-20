import { Module } from '@nestjs/common';
import { TherapistAvailabilityController } from './therapist-availability.controller';
import { TherapistAvailabilityService } from './therapist-availability.service';

@Module({
  controllers: [TherapistAvailabilityController],
  providers: [TherapistAvailabilityService],
  exports: [TherapistAvailabilityService],
})
export class TherapistAvailabilityModule {}
