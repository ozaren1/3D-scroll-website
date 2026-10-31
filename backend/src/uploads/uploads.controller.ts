import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { from, switchMap } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UploadsService } from './uploads.service.js';

// Runs before multer, so a file that would fill the disk is refused before a byte is written.
@Injectable()
class DiskSpaceInterceptor implements NestInterceptor {
  constructor(private readonly uploads: UploadsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['content-length'];
    const declared = header !== undefined && /^\d+$/.test(header) ? Number(header) : null;
    return from(this.uploads.ensureRoomFor(declared)).pipe(switchMap(() => next.handle()));
  }
}

// Guards run before interceptors, so anonymous requests never reach the disk.
@UseGuards(JwtAuthGuard)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(DiskSpaceInterceptor, FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.uploads.store(file);
  }

  @Get('usage')
  usage() {
    return this.uploads.usage();
  }
}
