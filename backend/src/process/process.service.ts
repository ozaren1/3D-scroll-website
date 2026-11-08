import { Inject, Injectable } from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import type { ProcessStepDto } from './dto/process.dto.js';

const PROCESS_KEY = 'process';

const DEFAULT_PROCESS: ProcessStepDto[] = [
  { title: 'Бриф и референсы', time: '1 день' },
  { title: 'Черновой монтаж', time: '2–4 дня' },
  { title: 'Две итерации правок', time: 'входят в цену' },
  { title: 'Экспорт под площадки', time: 'в день сдачи' },
];

// The "Как идёт работа" steps, stored as one JSON value in settings like the service cards.
@Injectable()
export class ProcessService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  list(): ProcessStepDto[] {
    const row = this.db
      .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
      .get(PROCESS_KEY);
    return row ? (JSON.parse(row.value) as ProcessStepDto[]) : DEFAULT_PROCESS;
  }

  save(items: ProcessStepDto[]): ProcessStepDto[] {
    const value = items.map(({ title, time }) => ({ title: title.trim(), time: time.trim() }));
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      )
      .run(PROCESS_KEY, JSON.stringify(value));
    return value;
  }
}
