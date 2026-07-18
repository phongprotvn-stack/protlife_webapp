'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('SW registered:', reg.scope),
          (err) => console.warn('SW registration failed:', err)
        );
      });
    }
  }, []);

  return null;
}
