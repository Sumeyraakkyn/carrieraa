'use client';

import { useEffect, useState } from 'react';
import type { Achievement } from '@/lib/achievements';

type UnlockEvent = CustomEvent<{ achievement: Achievement }>;

function playUnlockSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(990, context.currentTime + 0.22);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.6);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.62);
    setTimeout(() => context.close(), 800);
  } catch { /* Tarayıcı ses politikasında sessizce devam et. */ }
}

export default function AchievementToast() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const showAchievement = (event: Event) => {
      const detail = (event as UnlockEvent).detail;
      if (!detail?.achievement) return;
      setAchievement(detail.achievement);
      playUnlockSound();
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setAchievement(null), 8000);
    };
    window.addEventListener('carriera:achievement-unlocked', showAchievement);
    return () => {
      window.removeEventListener('carriera:achievement-unlocked', showAchievement);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!achievement) return null;
  return (
    <aside className="achievement-toast" role="status" aria-live="polite">
      <div className="achievement-toast-icon" style={{ background: achievement.color }}><i className={`fa-solid ${achievement.icon}`} /></div>
      <div><small>BAŞARI KAZANILDI · +{achievement.cpReward} CP · +{achievement.xpReward} XP</small><strong>{achievement.title}</strong><p>{achievement.description}</p></div>
      <button type="button" aria-label="Başarı bildirimini kapat" onClick={() => setAchievement(null)}>×</button>
    </aside>
  );
}
