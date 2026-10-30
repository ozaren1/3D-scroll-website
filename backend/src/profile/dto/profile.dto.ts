import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsMediaUrl } from '../../common/validators.js';

export class SocialLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  label: string;

  @Matches(/^(https:\/\/\S+|mailto:\S+|tel:\+?[\d\s-]+)$/, {
    message: 'url must be an https://, mailto: or tel: link',
  })
  @MaxLength(300)
  url: string;
}

export class ProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  role: string;

  @IsString()
  @MaxLength(200)
  tagline: string;

  @IsString()
  @MaxLength(3000)
  about: string;

  @IsString()
  @MaxLength(120)
  location: string;

  // Status line in the hero, e.g. "Беру проекты на ноябрь"; empty hides it.
  @IsOptional()
  @IsString()
  @MaxLength(80)
  availability?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsMediaUrl()
  @MaxLength(500)
  showreelUrl: string | null;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socials: SocialLinkDto[];
}
