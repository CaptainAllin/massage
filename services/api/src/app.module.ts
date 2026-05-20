import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ClientsModule } from './clients/clients.module';
import { TherapistsModule } from './therapists/therapists.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrismaModule } from './common/prisma/prisma.module';
// Stage 2 modules
import { IntakeFormsModule } from './intake-forms/intake-forms.module';
import { BodyMapsModule } from './body-maps/body-maps.module';
import { MedicalConditionsModule } from './medical-conditions/medical-conditions.module';
import { TreatmentNotesModule } from './treatment-notes/treatment-notes.module';
import { TherapistNotesModule } from './therapist-notes/therapist-notes.module';
// Stage 3 modules
import { TherapistAvailabilityModule } from './therapist-availability/therapist-availability.module';
import { RecurringAppointmentsModule } from './recurring-appointments/recurring-appointments.module';
import { RemindersModule } from './reminders/reminders.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    ClientsModule,
    TherapistsModule,
    AppointmentsModule,
    // Stage 2 modules
    IntakeFormsModule,
    BodyMapsModule,
    MedicalConditionsModule,
    TreatmentNotesModule,
    TherapistNotesModule,
    // Stage 3 modules
    TherapistAvailabilityModule,
    RecurringAppointmentsModule,
    RemindersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
