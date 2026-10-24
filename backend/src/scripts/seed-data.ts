import type { ProjectInput } from '../projects/project.types.js';

// Sample works built from the videos that ship with the frontend (public/assets/video).
// Keep in sync with the frontend fallback (src/app/data.ts). Clients and texts are placeholders.
export const SEED_PROJECTS: ProjectInput[] = [
  {
    slug: 'line-of-light',
    title: 'Свет в линию',
    client: 'Производитель светильников',
    year: 2025,
    category: 'motion',
    orientation: 'horizontal',
    summary: 'Продуктовый 3D-ролик в 4K: светильник собирается из темноты и включается в кадре.',
    videoUrl: '/assets/video/1.mp4',
    posterUrl: '/assets/posters/1.jpg',
    published: true,
  },
  {
    slug: 'comic-drive',
    title: 'Комикс-драйв',
    client: 'Автомастерская',
    year: 2025,
    category: 'reels',
    orientation: 'vertical',
    summary:
      'Вертикальный ролик для Reels: живая съёмка машины и графика в стиле комикса, три секунды на крючок.',
    videoUrl: '/assets/video/2.mp4',
    posterUrl: '/assets/posters/2.jpg',
    published: true,
  },
  {
    slug: 'from-orbit',
    title: 'С орбиты на завод',
    client: 'Промышленная компания',
    year: 2024,
    category: 'corporate',
    orientation: 'horizontal',
    summary:
      'Открывающий шот корпоративного фильма: пролёт от Земли до заводского двора, съёмка с дрона и композитинг.',
    videoUrl: '/assets/video/3.mp4',
    posterUrl: '/assets/posters/3.jpg',
    published: true,
  },
];
