import { Module } from '@nestjs/common';
import { ProcessController } from './process.controller.js';
import { ProcessService } from './process.service.js';

@Module({
  controllers: [ProcessController],
  providers: [ProcessService],
})
export class ProcessModule {}
