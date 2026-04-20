/**
 * Wireframe Studios — Page Transition System
 * Exit: fast wireframe wipe overlay slides in from bottom
 * Enter: overlay slides out revealing new page
 */
(function () {
  const DURATION_EXIT  = 420;   // ms — how long the exit overlay takes to cover screen
  const DURATION_HOLD  = 80;    // ms — brief hold at full cover before navigating
  const DURATION_ENTER = 520;   // ms — how long the enter reveal takes

  /* ── Build the overlay element ── */
  function buildOverlay() {
    const el = document.createElement('div');
    el.id = 'wf-transition';
    el.innerHTML = `
      <div class="wf-t-grid"></div>
      <div class="wf-t-bar"></div>
      <div class="wf-t-logo">
        <svg width="28" height="28" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" stroke="#c8ff00" stroke-width="2"/>
          <rect x="30" y="30" width="60" height="60" stroke="#c8ff00" stroke-width="1"/>
          <line x1="10" y1="10" x2="110" y2="110" stroke="#c8ff00" stroke-width="1"/>
          <line x1="110" y1="10" x2="10" y2="110" stroke="#c8ff00" stroke-width="1"/>
          <circle cx="60" cy="60" r="20" stroke="#c8ff00" stroke-width="1.5"/>
        </svg>
        <span>WF / Studios</span>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  /* ── Inject styles once ── */
  function injectStyles() {
    if (document.getElementById('wf-transition-styles')) return;
    const style = document.createElement('style');
    style.id = 'wf-transition-styles';
    style.textContent = `
      #wf-transition {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: #0a0a0a;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transform: translateY(100%);
        will-change: transform;
      }

      #wf-transition.entering {
        animation: wf-slide-in ${DURATION_EXIT}ms cubic-bezier(0.76, 0, 0.24, 1) forwards;
      }

      #wf-transition.leaving {
        animation: wf-slide-out ${DURATION_ENTER}ms cubic-bezier(0.76, 0, 0.24, 1) forwards;
      }

      @keyframes wf-slide-in {
        from { transform: translateY(100%); }
        to   { transform: translateY(0%);   }
      }

      @keyframes wf-slide-out {
        from { transform: translateY(0%);    }
        to   { transform: translateY(-100%); }
      }

      .wf-t-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(200,255,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,255,0,0.04) 1px, transparent 1px);
        background-size: 60px 60px;
      }

      .wf-t-bar {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 2px;
        background: #c8ff00;
        transform-origin: left;
        transform: scaleX(0);
        animation: wf-bar-fill ${DURATION_EXIT + DURATION_HOLD}ms cubic-bezier(0.76, 0, 0.24, 1) forwards;
      }

      @keyframes wf-bar-fill {
        0%   { transform: scaleX(0); opacity: 1; }
        80%  { transform: scaleX(1); opacity: 1; }
        100% { transform: scaleX(1); opacity: 0.4; }
      }

      .wf-t-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        opacity: 0;
        animation: wf-logo-pop 0.25s ease-out ${DURATION_EXIT * 0.5}ms forwards;
      }

      .wf-t-logo span {
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #c8ff00;
      }

      @keyframes wf-logo-pop {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
      }

      /* Page content fade on exit */
      body.wf-exiting > *:not(#wf-transition) {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Navigate with transition ── */
  function navigateTo(href) {
    injectStyles();
    const overlay = buildOverlay();

    document.body.classList.add('wf-exiting');

    // Slide overlay up from bottom
    overlay.classList.add('entering');

    // After cover + hold, navigate
    setTimeout(() => {
      window.location.href = href;
    }, DURATION_EXIT + DURATION_HOLD);
  }

  /* ── Intercept internal link clicks ── */
  function interceptLinks() {
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip: hash-only links, external links, new-tab links, mailto/tel
      if (
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto') ||
        href.startsWith('tel') ||
        anchor.target === '_blank' ||
        e.ctrlKey || e.metaKey || e.shiftKey
      ) return;

      // Skip anchor links to sections on same page (index.html#about etc)
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      navigateTo(href);
    });
  }

  /* ── Enter animation on page load ── */
  function playEnterAnimation() {
    // Only animate if arriving from an internal navigation
    // We use sessionStorage to pass a flag
    if (!sessionStorage.getItem('wf-navigating')) return;
    sessionStorage.removeItem('wf-navigating');

    injectStyles();
    const overlay = buildOverlay();
    overlay.style.transform = 'translateY(0%)'; // start covering the screen
    overlay.style.pointerEvents = 'none';

    // Slight delay then slide up and away
    requestAnimationFrame(() => {
      setTimeout(() => {
        overlay.classList.add('leaving');
        setTimeout(() => overlay.remove(), DURATION_ENTER);
      }, 60);
    });
  }

  /* ── Set the flag before leaving ── */
  function setNavigatingFlag() {
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || anchor.target === '_blank') return;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) return;
      sessionStorage.setItem('wf-navigating', '1');
    }, true); // capture phase — runs before our navigate handler
  }

  /* ── Init ── */
  injectStyles();
  interceptLinks();
  setNavigatingFlag();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', playEnterAnimation);
  } else {
    playEnterAnimation();
  }
})();
