import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

@Module({
  imports: [CategoriesModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
