import { existsSync } from 'node:fs';
import { openDatabase } from '../database/database.module.js';
import { DEFAULT_PROFILE } from '../profile/default-profile.js';
import { ProfileService } from '../profile/profile.service.js';
import { ProjectsRepository } from '../projects/projects.repository.js';
import { SEED_PROJECTS } from './seed-data.js';

// Fills an empty database with sample works and the sample profile. Safe to re-run.
if (existsSync('.env')) process.loadEnvFile('.env');

const db = openDatabase(process.env.DATABASE_PATH ?? './data/portfolio.db');
const projects = new ProjectsRepository(db);
const profile = new ProfileService(db);

if (projects.allIds().length === 0) {
  SEED_PROJECTS.forEach((project, index) =>
    projects.insert({ ...project, sortOrder: index }),
  );
  console.log(`Seeded ${SEED_PROJECTS.length} projects`);
} else {
  console.log('Projects already present, skipped');
}

if (!profile.isSaved()) {
  profile.save(DEFAULT_PROFILE);
  console.log('Seeded profile');
} else {
  console.log('Profile already present, skipped');
}

db.close();
