import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CategoriesService, toPublicCategory } from './categories.service.js';
import { CreateCategoryDto, ReorderCategoriesDto, UpdateCategoryDto } from './dto/category.dto.js';

@Controller()
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get('categories')
  list() {
    return this.categories.list({ visibleOnly: true }).map(toPublicCategory);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/categories')
  listAll() {
    return this.categories.list({ visibleOnly: false });
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/categories')
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/categories/order')
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categories.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/categories/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/categories/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.categories.remove(id);
  }
}
