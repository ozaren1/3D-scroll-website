import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ServicesDto } from './dto/service.dto.js';
import { ServicesService } from './services.service.js';

@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get('services')
  list() {
    return this.services.list();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/services')
  save(@Body() dto: ServicesDto) {
    return this.services.save(dto.items);
  }
}
