import { Type } from 'class-transformer';
import { IsDefined, IsObject, IsString, MaxLength, ValidateNested } from 'class-validator';

export class PageMetaDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(300)
  description: string;
}

// Meta tags of the fixed pages; categories carry their own. Empty fields fall back to defaults on the site.
export class SeoDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PageMetaDto)
  home: PageMetaDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PageMetaDto)
  works: PageMetaDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PageMetaDto)
  about: PageMetaDto;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PageMetaDto)
  privacy: PageMetaDto;
}
