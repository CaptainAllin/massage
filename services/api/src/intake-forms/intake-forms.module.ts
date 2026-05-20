import { Module } from '@nestjs/common';
import { IntakeFormsController } from './intake-forms.controller';
import { IntakeFormTemplatesController } from './intake-form-templates.controller';
import { IntakeFormsService } from './intake-forms.service';
import { IntakeFormTemplatesService } from './intake-form-templates.service';

@Module({
  controllers: [IntakeFormsController, IntakeFormTemplatesController],
  providers: [IntakeFormsService, IntakeFormTemplatesService],
  exports: [IntakeFormsService, IntakeFormTemplatesService],
})
export class IntakeFormsModule {}
