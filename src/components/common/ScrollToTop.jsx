import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window (and any shell scroll containers) to the top
 * whenever the route pathname changes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;

    document.querySelectorAll('[data-scroll-reset]').forEach((el) => {
      el.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
