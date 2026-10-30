import { IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';
import { CONTENT_TYPES, type AcceptedContentType } from '../file-signature.js';

export class PresignUploadDto {
  @IsIn(Object.keys(CONTENT_TYPES))
  contentType: AcceptedContentType;

  @IsInt()
  @Min(1)
  size: number;
}

export class ConfirmUploadDto {
  @IsString()
  @MaxLength(100)
  key: string;
}
