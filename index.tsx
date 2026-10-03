import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * Mounts into `#root` when running standalone, or into every
 * `[data-napnox-root]` container rendered by the WordPress shortcode (so the
 * generator can appear more than once on a page without clashing).
 */
function mount(): void {
  const containers = document.querySelectorAll<HTMLElement>('[data-napnox-root]');
  const targets: HTMLElement[] = containers.length
    ? Array.from(containers)
    : [document.getElementById('root')].filter((el): el is HTMLElement => Boolean(el));

  for (const target of targets) {
    if (target.dataset.napnoxMounted === '1') continue;
    target.dataset.napnoxMounted = '1';
    // Tailwind utilities are scoped to `.napnox-app` (see tailwind.config.js),
    // so the mount point must carry the class for styles inside it to apply.
    target.classList.add('napnox-app');
    createRoot(target).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
