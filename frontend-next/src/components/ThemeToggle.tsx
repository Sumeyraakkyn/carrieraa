'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration mismatch önlemek için mount sonrası render et
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="icon-btn" style={{ width: 40, height: 40 }} />;

  const isDark = theme === 'dark';

  return (
    <div
      className="icon-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Açık Mod' : 'Koyu Mod'}
    >
      <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`} />
    </div>
  );
}
