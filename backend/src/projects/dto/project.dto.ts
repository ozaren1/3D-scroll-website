import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsMediaUrl, IsSlug } from '../../common/validators.js';
import {
  CATEGORIES,
  ORIENTATIONS,
  type Category,
  type Orientation,
} from '../project.types.js';

// Optional, but an explicit null is validated (and rejected) instead of skipped.
const IsDefinedOrSkip = () => ValidateIf((_, value) => value !== undefined);

export class CreateProjectDto {
  @IsSlug()
  @MaxLength(80)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  client?: string | null;

  @IsInt()
  @Min(1990)
  @Max(2100)
  year: number;

  @IsIn(CATEGORIES)
  category: Category;

  @IsIn(ORIENTATIONS)
  orientation: Orientation;

  @IsDefinedOrSkip()
  @IsString()
  @MaxLength(600)
  summary?: string;

  @IsMediaUrl()
  @MaxLength(500)
  videoUrl: string;

  @IsOptional()
  @IsMediaUrl()
  @MaxLength(500)
  posterUrl?: string | null;

  @IsDefinedOrSkip()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsDefinedOrSkip()
  @IsBoolean()
  published?: boolean;
}

// skipNullProperties: false — a null in a required column must fail validation, not reach SQLite.
export class UpdateProjectDto extends PartialType(CreateProjectDto, {
  skipNullProperties: false,
}) {}

export class ReorderProjectsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

export class ListProjectsQueryDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category;
}
