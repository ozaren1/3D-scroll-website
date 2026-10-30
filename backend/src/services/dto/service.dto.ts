import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const NullableId = () => ValidateIf((_, value) => value !== null);

export class ServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title: string;

  @IsString()
  @MaxLength(400)
  text: string;

  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(24, { each: true })
  tags: string[];

  // The example under the card: this work if set, else the first work of categoryId, else of fallbackId.
  @NullableId()
  @IsInt()
  @Min(1)
  projectId: number | null;

  @NullableId()
  @IsInt()
  @Min(1)
  categoryId: number | null;

  @NullableId()
  @IsInt()
  @Min(1)
  fallbackId: number | null;
}

export class ServicesDto {
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  items: ServiceDto[];
}
