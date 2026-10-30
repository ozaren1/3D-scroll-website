import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ConfirmUploadDto, PresignUploadDto } from './dto/upload.dto.js';
import { S3StorageService } from './s3-storage.service.js';
import { UploadsService } from './uploads.service.js';

// Guards run before interceptors, so anonymous requests never reach the disk.
@UseGuards(JwtAuthGuard)
@Controller('admin/uploads')
export class UploadsController {
  constructor(
    private readonly uploads: UploadsService,
    private readonly s3: S3StorageService,
  ) {}

  // Local storage: the file comes through the API.
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (this.s3.enabled) {
      await this.uploads.discard(file);
      throw new BadRequestException('Uploads go to S3: use /admin/uploads/presign');
    }
    return this.uploads.store(file);
  }

  // Tells the admin panel how to upload: straight to the bucket (signed form) or through the API.
  @Post('presign')
  @HttpCode(200)
  presign(@Body() dto: PresignUploadDto) {
    return this.s3.enabled ? this.s3.presign(dto.contentType, dto.size) : { mode: 'local' as const };
  }

  @Post('confirm')
  @HttpCode(200)
  confirm(@Body() dto: ConfirmUploadDto) {
    return this.s3.confirm(dto.key);
  }
}
