import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import type { ContactRequest, ContactStatus } from './contact.types.js';
import type { CreateContactDto } from './dto/contact.dto.js';

const SELECT = `SELECT id, name, email, message, budget, status, consented_at AS consentedAt,
  created_at AS createdAt
  FROM contact_requests`;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  create(dto: CreateContactDto): { id: number } {
    if (dto.website) {
      this.logger.warn('Contact request dropped by honeypot');
      return { id: 0 };
    }
    const { lastInsertRowid } = this.db
      .prepare(
        `INSERT INTO contact_requests (name, email, message, budget, consented_at)
         VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
      )
      .run(dto.name, dto.email, dto.message, dto.budget || null);
    return { id: Number(lastInsertRowid) };
  }

  list(status?: ContactStatus): ContactRequest[] {
    const where = status ? 'WHERE status = ?' : '';
    return this.db
      .prepare<ContactStatus[], ContactRequest>(
        `${SELECT} ${where} ORDER BY created_at DESC, id DESC`,
      )
      .all(...(status ? [status] : []));
  }

  setStatus(id: number, status: ContactStatus): ContactRequest {
    const { changes } = this.db
      .prepare('UPDATE contact_requests SET status = ? WHERE id = ?')
      .run(status, id);
    if (changes === 0) throw new NotFoundException('Contact request not found');
    return this.db
      .prepare<[number], ContactRequest>(`${SELECT} WHERE id = ?`)
      .get(id)!;
  }
}
