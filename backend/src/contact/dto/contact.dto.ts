import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { CONTACT_STATUSES, type ContactStatus } from '../contact.types.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @Length(10, 4000)
  message: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  budget?: string;

  // Consent to the processing of personal data (see the site's privacy policy); must be true.
  @Equals(true, { message: 'consent must be given' })
  consent: boolean;

  // Honeypot: hidden from people, filled in by bots.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class UpdateContactStatusDto {
  @IsIn(CONTACT_STATUSES)
  status: ContactStatus;
}

export class ListContactsQueryDto {
  @IsOptional()
  @IsIn(CONTACT_STATUSES)
  status?: ContactStatus;
}
