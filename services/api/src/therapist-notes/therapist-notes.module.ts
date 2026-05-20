import { Module } from '@nestjs/common';
import { TherapistNotesController } from './therapist-notes.controller';
import { TherapistNotesService } from './therapist-notes.service';

@Module({
  controllers: [TherapistNotesController],
  providers: [TherapistNotesService],
  exports: [TherapistNotesService],
})
export class TherapistNotesModule {}
