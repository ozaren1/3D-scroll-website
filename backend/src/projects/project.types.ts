export const ORIENTATIONS = ['horizontal', 'vertical'] as const;

export type Orientation = (typeof ORIENTATIONS)[number];

export interface Project {
  id: number;
  slug: string;
  title: string;
  client: string | null;
  year: number;
  category: string; // slug of a row in categories
  orientation: Orientation;
  summary: string;
  videoUrl: string;
  posterUrl: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicProject = Omit<Project, 'published' | 'createdAt' | 'updatedAt'>;

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> & {
  sortOrder?: number;
};

export function toPublicProject(project: Project): PublicProject {
  const { published: _published, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } =
    project;
  return rest;
}
