(() => {
  'use strict';

  /**
   * Auto-skip runs in the page MAIN world, not in the isolated extension world.
   * This is important because YouTube can ignore synthetic clicks when its own
   * click listener sees event.isTrusted === false. The addEventListener patch
   * below mirrors the working local extension's strategy: for skip buttons only,
   * YouTube's click handler receives a proxy event whose isTrusted is true.
   */

  if (!(location.hostname === 'youtube.com' || location.hostname.endsWith('.youtube.com'))) return;
  if (window.__ytDhikrMainAutoSkipLoaded) return;
  window.__ytDhikrMainAutoSkipLoaded = true;

  const SKIP_BUTTON_CLASS_NAMES = [
    'videoAdUiSkipButton',
    'ytp-ad-skip-button ytp-button',
    'ytp-ad-skip-button-modern ytp-button',
    'ytp-skip-ad-button',
    'ytp-skip-ad-button ytp-button',
    'ytp-skip-ad-button-modern ytp-button',
    'ytp-skip-ad-button__button'
  ];

  const SKIP_SELECTORS = [
    '.videoAdUiSkipButton',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    '.ytp-skip-ad-button-modern',
    '.ytp-skip-ad-button__button',
    '.ytp-skip-ad-button-container button',
    '.ytp-ad-skip-button-container button',
    '.ytp-ad-skip-button-slot button'
  ];

  const AD_SIGNAL_SELECTORS = [
    '.ytp-ad-visit-advertiser-button',
    '.ytp-visit-advertiser-link',
    '.ytp-ad-badge',
    '.ytp-ad-text',
    '.ytp-ad-duration-remaining'
  ];

  let enabled = true;
  let adWasActive = false;
  let skipAt = 0;
  let lastClickAt = 0;

  window.addEventListener('ytDhikrAdblockSettings', event => {
    if (event && event.detail && typeof event.detail.autoSkip === 'boolean') {
      enabled = event.detail.autoSkip;
      if (!enabled) resetSchedule();
    }
  });

  function getClassName(element) {
    return typeof element.className === 'string' ? element.className : String(element.className || '');
  }

  function isSkipButtonElement(element) {
    if (!element || !(element instanceof HTMLElement)) return false;
    const className = getClassName(element);
    return SKIP_BUTTON_CLASS_NAMES.includes(className) ||
      element.matches('.videoAdUiSkipButton, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-skip-ad-button-modern, .ytp-skip-ad-button__button');
  }

  function wrapYouTubeClickListener(listener) {
    return function ytDhikrTrustedClickHandler(event) {
      const trustedEventProxy = new Proxy(event, {
        get(target, property) {
          if (property === 'isTrusted') return true;
          const value = target[property];
          return typeof value === 'function' ? value.bind(target) : value;
        }
      });

      return listener.call(this, trustedEventProxy);
    };
  }

  function patchAddEventListenerOnce() {
    const original = HTMLElement.prototype.addEventListener;
    if (original.__ytDhikrPatched) return;

    function patchedAddEventListener(type, listener, options) {
      if (type === 'click' && typeof listener === 'function' && isSkipButtonElement(this)) {
        return original.call(this, type, wrapYouTubeClickListener(listener), options);
      }
      return original.call(this, type, listener, options);
    }

    patchedAddEventListener.__ytDhikrPatched = true;
    HTMLElement.prototype.addEventListener = patchedAddEventListener;
  }

  patchAddEventListenerOnce();

  function getPlayer() {
    return document.getElementById('movie_player') || document.querySelector('.html5-video-player');
  }

  function isVisible(element) {
    if (!element || !(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function textOf(element) {
    return `${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''} ${element.textContent || ''}`.trim();
  }

  function looksReadyToSkip(element) {
    const text = textOf(element).toLowerCase();
    const meta = `${getClassName(element)} ${element.id || ''}`.toLowerCase();
    const looksLikeSkip = /skip|تخط|تخطي|تخطّى|تخطّي|تجاوز|ignorar|saltar|passer|überspringen|salta|pular|omitir/.test(`${text} ${meta}`) ||
      /ytp.*skip|skip.*ad|ad.*skip/.test(meta);
    const countdown = /skip in|available in|you can skip|ثوان|ثانية|بعد|خلال/.test(text);
    return looksLikeSkip && !countdown;
  }

  function isAdActive() {
    const player = getPlayer();
    if (!player) return false;
    if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) return true;
    return AD_SIGNAL_SELECTORS.some(selector => {
      const element = player.querySelector(selector) || document.querySelector(selector);
      return element && isVisible(element);
    });
  }

  function resetSchedule() {
    adWasActive = false;
    skipAt = 0;
    lastClickAt = 0;
  }

  function updateSchedule(adActive) {
    if (adActive && !adWasActive) {
      // The working extension waits about 5 seconds, which matches YouTube's
      // normal skippable-ad countdown. We still click earlier if the button is
      // visibly ready.
      skipAt = Date.now() + 5200;
    }

    if (!adActive && adWasActive) {
      resetSchedule();
      return;
    }

    adWasActive = adActive;
  }

  function querySkipButtons() {
    const found = new Set();

    for (const className of SKIP_BUTTON_CLASS_NAMES) {
      Array.from(document.getElementsByClassName(className)).forEach(element => found.add(element));
    }

    for (const selector of SKIP_SELECTORS) {
      document.querySelectorAll(selector).forEach(element => found.add(element));
    }

    const player = getPlayer();
    const roots = [player, document].filter(Boolean);
    for (const root of roots) {
      root.querySelectorAll('button, [role="button"], .ytp-button, [aria-label], [title]').forEach(element => {
        if (looksReadyToSkip(element)) found.add(element);
      });
    }

    return Array.from(found).filter(element => (
      element &&
      isVisible(element) &&
      !element.disabled &&
      element.getAttribute('aria-disabled') !== 'true' &&
      looksReadyToSkip(element)
    ));
  }

  function dispatchLegacyClick(element) {
    const event = document.createEvent('Events');
    event.initEvent('click', true, false);
    element.dispatchEvent(event);
  }

  function clickElement(element) {
    if (!element) return;

    dispatchLegacyClick(element);

    if (typeof element.click === 'function') {
      element.click();
    }
  }

  function clickSkipButtons(buttons) {
    const now = Date.now();
    if (now - lastClickAt < 180) return;
    lastClickAt = now;

    for (const button of buttons) {
      clickElement(button);

      const child = button.querySelector && button.querySelector('button, [role="button"], .ytp-skip-ad-button__button');
      if (child && child !== button && isVisible(child)) clickElement(child);
    }
  }

  function closeOverlayAds() {
    Array.from(document.getElementsByClassName('ytp-ad-overlay-close-button')).forEach(clickElement);
  }

  function syncEnabledFromDom() {
    const value = document.documentElement.getAttribute('data-yt-dhikr-autoskip');
    if (value === '1') enabled = true;
    if (value === '0') enabled = false;
  }

  function tick() {
    syncEnabledFromDom();
    if (!enabled) return;

    const adActive = isAdActive();
    updateSchedule(adActive);
    closeOverlayAds();

    if (!adActive) return;

    const buttons = querySkipButtons();
    const skipTimeReached = skipAt > 0 && Date.now() >= skipAt;

    if (buttons.length && (skipTimeReached || buttons.some(looksReadyToSkip))) {
      clickSkipButtons(buttons);
    }
  }

  const loop = () => {
    try { tick(); } catch (_) {}
    setTimeout(loop, 200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick, { once: true });
  }

  loop();
  document.addEventListener('yt-navigate-finish', tick, true);
})();
