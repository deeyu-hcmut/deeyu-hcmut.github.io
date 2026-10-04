import { useEffect, useState } from 'react';

// Keep in sync with the pre-paint script in index.html
const THEME_KEY = 'fee_portal_theme';

export type Theme = 'light' | 'dark';

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Follows the OS setting until the visitor picks a theme with the toggle.
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    const query = systemQuery();
    const onSystemChange = () => {
      if (storedTheme()) return;
      const next: Theme = query.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    query.addEventListener('change', onSystemChange);
    return () => query.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
  };

  return [theme, toggle];
}
