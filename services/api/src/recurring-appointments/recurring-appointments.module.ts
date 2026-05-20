import { Module } from '@nestjs/common';
import { RecurringAppointmentsController } from './recurring-appointments.controller';
import { RecurringAppointmentsService } from './recurring-appointments.service';

@Module({
  controllers: [RecurringAppointmentsController],
  providers: [RecurringAppointmentsService],
  exports: [RecurringAppointmentsService],
})
export class RecurringAppointmentsModule {}
