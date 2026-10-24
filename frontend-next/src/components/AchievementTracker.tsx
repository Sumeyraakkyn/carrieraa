'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ACHIEVEMENTS, type AchievementFacts, USER_SECTIONS } from '@/lib/achievements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AchievementTracker() {
  const pathname = usePathname();

  const refreshAchievements = useCallback(async () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('currentUser');
    if (!token || !username || localStorage.getItem('userRole') !== 'USER') return;

    try {
      const response = await fetch(`${API_URL}/api/rewards/overview`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json();
      const visitKey = `carriera_achievement_visits_${username}`;
      const visits = JSON.parse(localStorage.getItem(visitKey) || '{"pages":[],"firstVisitAt":0}');
      const facts: AchievementFacts = {
        courseCount: data.me?.courseCount || 0,
        cvCount: data.me?.cvCount || 0,
        visitedPages: Array.isArray(visits.pages) ? visits.pages : [],
        firstVisitAt: visits.firstVisitAt || undefined,
      };
      const unlockedKey = `carriera_unlocked_achievements_${username}`;
      const unlocked = new Set<string>(JSON.parse(localStorage.getItem(unlockedKey) || '[]'));
      const newlyUnlocked: typeof ACHIEVEMENTS = [];
      ACHIEVEMENTS.forEach((achievement) => {
        if (achievement.isUnlocked(facts) && !unlocked.has(achievement.id)) {
          unlocked.add(achievement.id);
          newlyUnlocked.push(achievement);
        }
      });
      if (newlyUnlocked.length) {
        localStorage.setItem(unlockedKey, JSON.stringify([...unlocked]));
        newlyUnlocked.forEach((achievement) => window.dispatchEvent(new CustomEvent('carriera:achievement-unlocked', { detail: { achievement } })));
      }
    } catch { /* Başarı sistemi uygulamayı engellemez. */ }
  }, []);

  useEffect(() => {
    const username = localStorage.getItem('currentUser');
    if (!username || localStorage.getItem('userRole') !== 'USER') return;
    if (USER_SECTIONS.includes(pathname)) {
      const key = `carriera_achievement_visits_${username}`;
      const current = JSON.parse(localStorage.getItem(key) || '{"pages":[],"firstVisitAt":0}');
      const firstVisitAt = current.firstVisitAt && Date.now() - current.firstVisitAt <= 7 * 24 * 60 * 60 * 1000 ? current.firstVisitAt : Date.now();
      const pages = Array.from(new Set([...(Array.isArray(current.pages) ? current.pages : []), pathname]));
      localStorage.setItem(key, JSON.stringify({ pages, firstVisitAt }));
    }
    refreshAchievements();
  }, [pathname, refreshAchievements]);

  useEffect(() => {
    window.addEventListener('carriera:achievements-refresh', refreshAchievements);
    return () => window.removeEventListener('carriera:achievements-refresh', refreshAchievements);
  }, [refreshAchievements]);

  return null;
}
