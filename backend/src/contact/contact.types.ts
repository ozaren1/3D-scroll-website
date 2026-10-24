export const CONTACT_STATUSES = ['new', 'read', 'archived'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface ContactRequest {
  id: number;
  name: string;
  email: string;
  message: string;
  budget: string | null;
  status: ContactStatus;
  consentedAt: string | null;
  createdAt: string;
}
