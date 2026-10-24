import { Matches } from 'class-validator';

// A site-relative path ("/media/x.mp4", but not "//host" or "/\host") or an absolute https URL.
export const MEDIA_URL_PATTERN = /^(\/(?![/\\])\S*|https:\/\/\S+)$/;

export const IsMediaUrl = () =>
  Matches(MEDIA_URL_PATTERN, {
    message: '$property must be a path starting with "/" or an https:// URL',
  });

export const IsSlug = () =>
  Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: '$property may contain only lowercase latin letters, digits and dashes',
  });
