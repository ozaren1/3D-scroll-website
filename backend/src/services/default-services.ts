// Sample cards shown until the owner saves their own in the admin panel. They name categories by
// slug; ServicesService turns slugs into ids (the same path upgrades cards saved before plan 006).
export interface LegacyService {
  title: string;
  text: string;
  tags: string[];
  category?: string;
  fallback?: string;
}

export const DEFAULT_SERVICES: LegacyService[] = [
  {
    title: 'Рекламные ролики',
    category: 'ads',
    fallback: 'motion',
    text: 'От монтажного плана до экспорта под каждую площадку: 6, 15 и 30 секунд из одних исходников.',
    tags: ['ТВ', 'Digital', 'Cutdowns'],
  },
  {
    title: 'Вертикальные видео',
    category: 'reels',
    fallback: 'motion',
    text: 'Reels, Shorts и TikTok: крючок в первые три секунды, титры, обложка.',
    tags: ['9:16', 'Субтитры', 'Обложки'],
  },
  {
    title: 'Моушен-дизайн',
    category: 'motion',
    fallback: 'ads',
    text: 'Анимация логотипа, инфографика, титры и продуктовые 3D-шоты.',
    tags: ['2D', '3D', 'Логотипы'],
  },
  {
    title: 'Цвет и звук',
    category: 'corporate',
    fallback: 'ads',
    text: 'Цветокоррекция в DaVinci Resolve, чистка и сведение звука, подбор музыки.',
    tags: ['Грейдинг', 'Звук', 'Музыка'],
  },
];
