export type AchievementFacts = {
  courseCount: number;
  cvCount: number;
  visitedPages: string[];
  firstVisitAt?: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  cpReward: number;
  xpReward: number;
  current: (facts: AchievementFacts) => number;
  target: number;
  isUnlocked: (facts: AchievementFacts) => boolean;
};

const USER_SECTIONS = ['/dashboard', '/profile/view', '/education', '/skills', '/rewards', '/progress', '/potential', '/cv-upload'];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_course', title: 'İlk Adım', description: 'İlk eğitimini tamamla.', icon: 'fa-shoe-prints', color: '#3b82f6', cpReward: 50, xpReward: 100,
    current: (facts) => Math.min(facts.courseCount, 1), target: 1, isUnlocked: (facts) => facts.courseCount >= 1,
  },
  {
    id: 'first_cv', title: 'Gönderdim Gitti', description: "İlk CV'ni yükle.", icon: 'fa-paper-plane', color: '#8b5cf6', cpReward: 75, xpReward: 120,
    current: (facts) => Math.min(facts.cvCount, 1), target: 1, isUnlocked: (facts) => facts.cvCount >= 1,
  },
  {
    id: 'cv_collector', title: 'Bunlardan Kaç Tane Var?', description: 'Toplam 5 CV yükle.', icon: 'fa-folder-open', color: '#f59e0b', cpReward: 250, xpReward: 350,
    current: (facts) => Math.min(facts.cvCount, 5), target: 5, isUnlocked: (facts) => facts.cvCount >= 5,
  },
  {
    id: 'learning_streak', title: 'Bilgi Avcısı', description: '5 eğitimi tamamla.', icon: 'fa-book-open-reader', color: '#10b981', cpReward: 200, xpReward: 300,
    current: (facts) => Math.min(facts.courseCount, 5), target: 5, isUnlocked: (facts) => facts.courseCount >= 5,
  },
  {
    id: 'world_tour', title: '7 Günde Devriâlem', description: '7 gün içinde 8 ana bölümü ziyaret et.', icon: 'fa-earth-americas', color: '#ef4444', cpReward: 150, xpReward: 200,
    current: (facts) => Math.min(facts.visitedPages.length, USER_SECTIONS.length), target: USER_SECTIONS.length,
    isUnlocked: (facts) => Boolean(facts.firstVisitAt && Date.now() - facts.firstVisitAt <= 7 * 24 * 60 * 60 * 1000 && facts.visitedPages.length >= USER_SECTIONS.length),
  },
];

export { USER_SECTIONS };
