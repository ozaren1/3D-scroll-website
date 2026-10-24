import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ContactService } from './contact.service.js';
import {
  CreateContactDto,
  ListContactsQueryDto,
  UpdateContactStatusDto,
} from './dto/contact.dto.js';

@Controller()
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post('contact')
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  create(@Body() dto: CreateContactDto) {
    return this.contact.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/contacts')
  list(@Query() query: ListContactsQueryDto) {
    return this.contact.list(query.status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/contacts/:id')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactStatusDto,
  ) {
    return this.contact.setStatus(id, dto.status);
  }
}
