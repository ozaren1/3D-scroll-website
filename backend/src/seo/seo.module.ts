import { Body, Controller, Get, Module, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SeoDto } from './dto/seo.dto.js';
import { SeoService } from './seo.service.js';

@Controller()
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('seo')
  get() {
    return this.seo.get();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/seo')
  save(@Body() dto: SeoDto) {
    return this.seo.save(dto);
  }
}

@Module({
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
