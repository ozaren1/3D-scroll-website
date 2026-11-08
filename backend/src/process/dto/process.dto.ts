import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

export class ProcessStepDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(80)
  title: string;

  @IsString()
  @MaxLength(40)
  time: string;
}

export class ProcessDto {
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ProcessStepDto)
  items: ProcessStepDto[];
}
