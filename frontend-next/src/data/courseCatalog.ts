export const COURSE_CATALOG = [
  { id: 'zaman-yonetimi', name: 'Zaman Yönetimi', category: 'stratejik' },
  { id: 'liderlik-1', name: 'Etkili Liderlik Becerileri', category: 'liderlik' },
  { id: 'python-giris', name: 'Python ile Programlamaya Giriş', category: 'cevik' },
  { id: 'react-temelleri', name: 'React ve Modern Web Geliştirme', category: 'cevik' },
  { id: 'veri-analizi-101', name: 'SQL ve Veri Analizi Temelleri', category: 'stratejik' },
] as const;

export const COURSE_CATEGORY_LABELS: Record<string, string> = {
  liderlik: 'Liderlik Gelişimi',
  stratejik: 'Stratejik Planlama',
  cevik: 'Çeviklik & İnovasyon',
};

export function getCourseProgress(completedIds: string[]) {
  const completed = new Set(completedIds);
  const categoryProgress: Record<string, number> = {};

  Object.keys(COURSE_CATEGORY_LABELS).forEach((category) => {
    const categoryCourses = COURSE_CATALOG.filter((course) => course.category === category);
    const done = categoryCourses.filter((course) => completed.has(course.id)).length;
    categoryProgress[category] = categoryCourses.length ? Math.round((done / categoryCourses.length) * 100) : 0;
  });

  return {
    completedCount: COURSE_CATALOG.filter((course) => completed.has(course.id)).length,
    percentage: Math.round((COURSE_CATALOG.filter((course) => completed.has(course.id)).length / COURSE_CATALOG.length) * 100),
    categoryProgress,
    nextCourse: COURSE_CATALOG.find((course) => !completed.has(course.id)) || null,
  };
}
