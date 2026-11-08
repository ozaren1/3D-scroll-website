import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProcessDto } from './dto/process.dto.js';
import { ProcessService } from './process.service.js';

@Controller()
export class ProcessController {
  constructor(private readonly process: ProcessService) {}

  @Get('process')
  list() {
    return this.process.list();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/process')
  save(@Body() dto: ProcessDto) {
    return this.process.save(dto.items);
  }
}
