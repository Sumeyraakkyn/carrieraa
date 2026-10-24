'use client';
/**
 * DarkModeSync
 * next-themes html.dark sınıfını izler ve body'ye eski CSS'lerin
 * beklediği "dark-mode" sınıfını ekler/kaldırır.
 * Ayrıca eski localStorage.darkMode anahtarını da günceller
 * (bazı sayfalar hâlâ bunu okuyor).
 */
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function DarkModeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Eski sayfalar için localStorage senkronizasyonu
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
  }, [resolvedTheme]);

  return null;
}
