import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return {
      success: true,
      message: 'Wellness CRM API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
