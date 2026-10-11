// Liquid-glass behaviour for the app shell. Colours are not touched here;
// the look itself is in src/styles/glass.css.
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Anything that looks like a card: panels built as "white rounded box".
export const GLASS_CARD =
  '[data-slot="card"],[class*="bg-white"][class*="rounded-xl"],[class*="bg-white"][class*="rounded-2xl"]';

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Soft light that follows the mouse over a card, a brighter edge near the pointer,
// and a very small 3D tilt on small cards. Everything resets when the mouse leaves.
// Pop-up windows (anything inside a fixed overlay) are left alone.
export function useGlassPointer(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root || reduceMotion()) return;
    let current: HTMLElement | null = null;

    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      for (const v of ['--mx', '--my', '--tx', '--ty']) el.style.removeProperty(v);
      el.classList.remove('glass-live');
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      let el = (e.target as Element).closest<HTMLElement>(GLASS_CARD);
      if (el && el.closest('.fixed')) el = null;
      if (el !== current) { reset(current); current = el; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.classList.add('glass-live');
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      // Only small cards tilt; big tables and forms stay still so text stays sharp.
      if (r.width <= 560 && r.height <= 380) {
        el.classList.add('glass-tilt');
        el.style.setProperty('--tx', `${((0.5 - y / r.height) * 5).toFixed(2)}deg`);
        el.style.setProperty('--ty', `${((x / r.width - 0.5) * 5).toFixed(2)}deg`);
      }
    };
    const onLeave = () => { reset(current); current = null; };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      reset(current);
    };
  }, [ref]);
}

export interface LiquidBox { top: number; left: number; width: number; height: number }

// A glass capsule behind the active menu item. When the active item changes the
// capsule slides to the new place like a water drop and settles with a small bounce.
// The active link must carry data-nav-active="true"; the nav must be position: relative.
// Works for indented sub-items too (the capsule takes the link's own size).
export function useLiquidHighlight(navRef: RefObject<HTMLElement | null>, activeKey: string, deps: unknown[] = []) {
  const [box, setBox] = useState<LiquidBox | null>(null);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);
  const lastKey = useRef(activeKey);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('[data-nav-active="true"]');
      setBox(el ? { top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navRef, activeKey, ...deps]);

  // Turn the slide animation on only after the first position is known.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (lastKey.current === activeKey) return;
    lastKey.current = activeKey;
    setMoving(true);
    const id = window.setTimeout(() => setMoving(false), 650);
    return () => window.clearTimeout(id);
  }, [activeKey]);

  return { box, ready, moving };
}
