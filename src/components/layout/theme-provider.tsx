'use client';

import { useEffect, useMemo } from 'react';
import { useSettingsStore, fontSizeValue } from '@/stores/settings-store';

/**
 * Applies theme/accent/font settings to <html> CSS variables.
 * Renders nothing — side-effect only.
 */
export function ThemeProvider() {
  const theme = useSettingsStore(s => s.theme);
  const accentColor = useSettingsStore(s => s.accentColor);
  const fontSizeIndex = useSettingsStore(s => s.fontSize);
  const reduceMotion = useSettingsStore(s => s.reduceMotion);

  const resolvedTheme = useMemo(() => {
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;

    // Theme class
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${resolvedTheme}`);

    // Dark mode via Tailwind class
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Accent color CSS variable
    root.style.setProperty('--color-primary', accentColor);
    root.style.setProperty('--color-primary-rgb', hexToRgb(accentColor));

    // Font size
    const fs = fontSizeValue(fontSizeIndex);
    root.style.setProperty('--font-size-base', fs);

    // Motion
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [resolvedTheme, accentColor, fontSizeIndex, reduceMotion]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const root = document.documentElement;
      const isDark = mq.matches;
      root.classList.remove('theme-light', 'theme-dark');
      root.classList.add(`theme-${isDark ? 'dark' : 'light'}`);
      if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return null;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '230, 0, 45';
}
