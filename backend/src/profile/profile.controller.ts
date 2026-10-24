import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProfileDto } from './dto/profile.dto.js';
import { ProfileService } from './profile.service.js';

@Controller()
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('profile')
  get() {
    return this.profile.get();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/profile')
  save(@Body() dto: ProfileDto) {
    return this.profile.save(dto);
  }
}
