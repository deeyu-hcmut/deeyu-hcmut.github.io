import { useEffect } from 'react';

// The theme always follows the device setting (light/dark), live, with no manual override.
// Keep the initial check in sync with the pre-paint script in index.html.
export function useSystemTheme() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
}
