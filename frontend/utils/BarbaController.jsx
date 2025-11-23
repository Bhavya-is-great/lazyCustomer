// components/BarbaController.jsx
'use client';

import { useEffect } from 'react';

export default function BarbaController() {
  useEffect(() => {
    let barbaInstance = null;
    let gsap = null;
    let destroyed = false;

    // Registry for animations: name -> { once?, leave?, enter? }
    window.__BarbaAnimRegistry = window.__BarbaAnimRegistry || {};

    // Default animation
    const defaultAnim = {
      leave: ({ current }) => gsap.to(current.container, { opacity: 0, y: -20, duration: 0.4 }),
      enter: ({ next }) => gsap.from(next.container, { opacity: 0, y: 20, duration: 0.4 }),
      once: ({ next }) => gsap.from(next.container, { opacity: 0, y: 20, duration: 0.6 }),
    };
    window.__BarbaAnimRegistry['default'] = window.__BarbaAnimRegistry['default'] || defaultAnim;

    function registerHelpers(barba) {
      // public: register animations at runtime
      window.registerBarbaAnimation = (name, handlers) => {
        window.__BarbaAnimRegistry[name] = handlers;
      };

      // public: programmatic navigation through Barba
      window.barbaNavigate = async (href, transitionName = null) => {
        if (!barba) {
          // fallback: normal navigation
          window.location.href = href;
          return;
        }

        // set temporary marker so getAnimationName can use it
        document._barbaTransition = transitionName;
        try {
          await barba.go(href);
        } finally {
          document._barbaTransition = null;
        }
      };

      // expose barba (optional, useful for debugging)
      window.barba = barba;
    }

    function getAnimationName(detail = {}) {
      // 1) click trigger dataset
      if (detail.trigger?.dataset?.transition) return detail.trigger.dataset.transition;
      // 2) next container namespace
      const ns = detail.next?.container?.dataset?.barbaNamespace;
      if (ns && window.__BarbaAnimRegistry[ns]) return ns;
      // 3) programmatic navigation marker
      if (typeof document !== 'undefined' && document._barbaTransition) return document._barbaTransition;
      // 4) fallback
      return 'default';
    }

    async function init() {
      try {
        const [barbaModule, gsapModule] = await Promise.all([
          import('@barba/core'),
          import('gsap'),
        ]);
        const barba = barbaModule.default || barbaModule;
        gsap = gsapModule.gsap || gsapModule.default || gsapModule;
        barbaInstance = barba;

        barba.init({
          sync: true,
          transitions: [
            {
              name: 'dynamic',
              once({ next }) {
                const name = getAnimationName({ next });
                const handlers = window.__BarbaAnimRegistry[name] || window.__BarbaAnimRegistry['default'];
                return handlers.once ? handlers.once({ next, gsap }) : defaultAnim.once({ next, gsap });
              },
              leave(data) {
                const name = getAnimationName(data);
                const handlers = window.__BarbaAnimRegistry[name] || window.__BarbaAnimRegistry['default'];
                return handlers.leave ? handlers.leave(data, gsap) : defaultAnim.leave(data);
              },
              enter(data) {
                const name = getAnimationName(data);
                const handlers = window.__BarbaAnimRegistry[name] || window.__BarbaAnimRegistry['default'];
                return handlers.enter ? handlers.enter(data, gsap) : defaultAnim.enter(data);
              },
            },
          ],
          // you can add views here if needed
        });

        registerHelpers(barba);
      } catch (err) {
        // if import fails, keep app functional (no Barba transitions)
        // console.warn('Barba init failed', err);
      }
    }

    init();

    return () => {
      destroyed = true;
      // cleanup
      try {
        if (barbaInstance && typeof barbaInstance.destroy === 'function') {
          barbaInstance.destroy();
        }
      } catch (e) {}
      // remove globals we created (safe)
      try {
        if (window.registerBarbaAnimation) delete window.registerBarbaAnimation;
        if (window.barbaNavigate) delete window.barbaNavigate;
        if (window.barba) delete window.barba;
        if (window.__BarbaAnimRegistry) window.__BarbaAnimRegistry = {};
      } catch (e) {}
    };
  }, []);

  return null;
}
