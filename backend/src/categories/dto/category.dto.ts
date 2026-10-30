import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsSlug } from '../../common/validators.js';

export class CreateCategoryDto {
  // Part of the public URL: /works/<slug>.
  @IsSlug()
  @MaxLength(60)
  slug: string;

  // Short name for the filter and captions.
  @IsString()
  @Matches(/\S/, { message: 'label must not be blank' })
  @MaxLength(40)
  label: string;

  // Heading of the category page.
  @IsString()
  @Matches(/\S/, { message: 'title must not be blank' })
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto, { skipNullProperties: false }) {}

export class ReorderCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}
