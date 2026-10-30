import type { ProfileDto } from './dto/profile.dto.js';

// Sample content shown until the owner saves a real profile.
export const DEFAULT_PROFILE: ProfileDto = {
  name: 'Кирилл Зотов',
  role: 'Видеомонтажёр и моушен-дизайнер',
  tagline: 'Монтирую рекламу, клипы и вертикальные ролики, которые досматривают до конца.',
  about:
    'Восемь лет в монтаже: реклама, музыкальные клипы, ролики для соцсетей и титры. ' +
    'Собираю историю из исходников, делаю цвет, звук и графику в одном месте, ' +
    'поэтому ролик не ходит по трём подрядчикам. Работаю в Premiere Pro, After Effects и DaVinci Resolve.',
  location: 'Москва · работаю по всей России',
  availability: 'Беру проекты на ноябрь',
  email: 'hello@example.com',
  showreelUrl: null,
  socials: [
    { label: 'Telegram', url: 'https://t.me/example' },
    { label: 'ВКонтакте', url: 'https://vk.com/example' },
    { label: 'VK Видео', url: 'https://vkvideo.ru/@example' },
  ],
};
