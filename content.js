(() => {
  'use strict';

  const DEFAULT_DHIKR = [
    'الحمد لله',
    'سبحان الله',
    'لا إله إلا الله',
    'الله أكبر',
    'لا حول ولا قوة إلا بالله',
    'سبحان الله وبحمده',
    'سبحان الله العظيم',
    'أستغفر الله وأتوب إليه',
    'اللهم صلِّ على محمد',
  ];
  const OLD_ARABIC_DEFAULT_DHIKR = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'أستغفر الله', 'لا إله إلا الله'];
  const OLD_ENGLISH_DEFAULT_DHIKR = ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'Astaghfirullah', 'La ilaha illa Allah'];
  const DEFAULT_SETTINGS = {
    muteAds: true,
    autoSkip: true,
    hideAds: true,
    hideSidebarAds: true,
    dhikrList: [...DEFAULT_DHIKR]
  };

  const OVERLAY_ID = 'yt-dhikr-ad-overlay-extension';
  const AD_HIDE_STYLE_ID = 'yt-dhikr-ad-hide-style';
  let settings = { ...DEFAULT_SETTINGS };
  let playerObserver = null;
  let periodicTimer = null;
  let adActive = false;
  let lastVideo = null;
  let previousVideoState = null;
  let currentDhikr = '';
  let initialized = false;

  function isYouTubePage() {
    return location.hostname === 'youtube.com' || location.hostname.endsWith('.youtube.com');
  }

  function getMoviePlayer() {
    return document.getElementById('movie_player') || document.querySelector('.html5-video-player');
  }

  function getVideo() {
    const player = getMoviePlayer();
    return (player && player.querySelector('video')) || document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function safeText(element) {
    return (element && (element.innerText || element.textContent || '')).trim();
  }

  function elementHasVisibleBox(element) {
    if (!element || !(element instanceof Element)) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function detectAd() {
    const player = getMoviePlayer();
    if (!player) return false;

    const hasAdClass = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
    if (hasAdClass) return true;

    // Important: after an ad is skipped, YouTube may leave hidden/stale ad text
    // nodes in the DOM for a short time. Do NOT treat generic ad labels as an
    // active ad, otherwise the Dhikr overlay can stay forever. Only use strong,
    // player-scoped fallback signals that normally disappear with the ad.
    const strongAdSelectors = [
      '.ytp-ad-duration-remaining',
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-skip-ad-button-modern',
      '.ytp-ad-skip-button-modern'
    ];

    for (const selector of strongAdSelectors) {
      const found = player.querySelector(selector);
      if (found && elementHasVisibleBox(found)) return true;
    }

    return false;
  }

  function rememberAndMute(video) {
    if (!video) return;

    if (lastVideo !== video || !previousVideoState) {
      lastVideo = video;
      previousVideoState = {
        muted: video.muted,
        volume: video.volume
      };
    }

    // Only use the muted flag. Repeatedly forcing volume=0 can fight YouTube's
    // own volume state and cause bad player behavior on some installs.
    video.muted = true;
  }

  function restoreAudio() {
    const video = lastVideo || getVideo();
    if (!video || !previousVideoState) return;

    video.muted = previousVideoState.muted;
    if (typeof previousVideoState.volume === 'number') {
      video.volume = previousVideoState.volume;
    }
    previousVideoState = null;
  }

  function isExactDefaultList(list, defaults) {
    return Array.isArray(list) &&
      list.length === defaults.length &&
      defaults.every(item => list.includes(item));
  }

  function getActiveDhikrList() {
    return Array.isArray(settings.dhikrList) ? settings.dhikrList.filter(Boolean) : DEFAULT_DHIKR;
  }

  function getRandomDhikr() {
    const list = getActiveDhikrList();
    if (!list.length) return '';
    return list[Math.floor(Math.random() * list.length)] || '';
  }

  function ensureOverlay() {
    if (!settings.hideAds) return removeOverlay();

    const player = getMoviePlayer();
    if (!player) return;

    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
      currentDhikr = getRandomDhikr();
      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.setAttribute('role', 'presentation');
      overlay.innerHTML = `
        <div class="yt-dhikr-card">
          <div class="yt-dhikr-text"></div>
          <div class="yt-dhikr-paused-hint">الإعلان متوقف مؤقتًا، اضغط تشغيل حتى ينتهي</div>
          <div class="yt-dhikr-subtitle">سيتم تخطي الإعلان تلقائيا</div>
        </div>
      `;

      const style = document.createElement('style');
      style.textContent = `
        #${OVERLAY_ID} {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 2147483646 !important;
          background: radial-gradient(circle at center, #101010 0%, #000 70%) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none !important;
          color: #fff !important;
          font-family: "Segoe UI", Tahoma, Arial, sans-serif !important;
          text-align: center !important;
          direction: rtl !important;
        }
        #${OVERLAY_ID} .yt-dhikr-card {
          max-width: min(760px, 86%) !important;
          padding: 32px 40px !important;
          border: 1px solid rgba(212, 175, 55, 0.35) !important;
          border-radius: 28px !important;
          background: rgba(16, 16, 16, 0.78) !important;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65) !important;
        }
        #${OVERLAY_ID} .yt-dhikr-text {
          color: #fff8dc !important;
          font-size: clamp(34px, 6vw, 88px) !important;
          font-weight: 900 !important;
          line-height: 1.15 !important;
          text-shadow: 0 4px 22px rgba(212, 175, 55, 0.22) !important;
        }
        #${OVERLAY_ID} .yt-dhikr-paused-hint {
          display: none !important;
          margin-top: 18px !important;
          padding: 10px 16px !important;
          border-radius: 999px !important;
          background: rgba(220, 53, 69, 0.18) !important;
          color: #ffdddd !important;
          font-size: clamp(14px, 2.2vw, 20px) !important;
          font-weight: 800 !important;
        }
        #${OVERLAY_ID}.yt-dhikr-ad-paused .yt-dhikr-paused-hint {
          display: inline-block !important;
        }
        #${OVERLAY_ID} .yt-dhikr-subtitle {
          margin-top: 22px !important;
          color: rgba(255, 255, 255, 0.72) !important;
          font-size: clamp(13px, 2vw, 18px) !important;
          font-weight: 500 !important;
        }
      `;
      overlay.appendChild(style);
    }

    if (overlay.parentElement !== player) {
      const playerStyle = window.getComputedStyle(player);
      if (playerStyle.position === 'static') {
        player.style.setProperty('position', 'relative', 'important');
      }
      player.appendChild(overlay);
    }

    const video = getVideo();
    overlay.classList.toggle('yt-dhikr-ad-paused', Boolean(video && video.paused));

    const card = overlay.querySelector('.yt-dhikr-card');
    const textNode = overlay.querySelector('.yt-dhikr-text');
    const activeDhikr = getActiveDhikrList();

    if (!activeDhikr.length) {
      // User intentionally unchecked/deleted every Dhikr: keep a plain solid
      // black ad cover with no text.
      if (card) card.style.setProperty('display', 'none', 'important');
      return;
    }

    if (card) card.style.removeProperty('display');
    const desiredText = currentDhikr || getRandomDhikr();
    if (textNode && textNode.textContent !== desiredText) {
      textNode.textContent = desiredText;
    }
  }

  function removeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
    currentDhikr = '';
  }

  const AD_SELECTORS = [
    'ytd-ad-slot-renderer',
    'ytd-display-ad-renderer',
    'ytd-companion-slot-renderer',
    'ytd-action-companion-ad-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    'ytd-banner-promo-renderer',
    'ytd-mealbar-promo-renderer',
    '#masthead-ad',
    '#player-ads',
    '.ytd-ad-slot-renderer',
    'ytd-player-legacy-desktop-watch-ads-renderer',
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    'ytp-ad-overlay-container',
    '.ytp-ad-overlay-container',
    '.ytp-ad-text-overlay',
    '.ytp-ad-overlay-slot',
    '.ytp-ad-overlay-image',
    '.ytp-ad-overlay-close-button',
    '.video-ads.ytp-ad-module',
    '.ytp-suggested-action',
    '.ytp-featured-product',
    'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)'
  ];
  const AD_HIDE_CSS = AD_SELECTORS.map(s => `${s} { display: none !important; }`).join('\n');
  let adHideStyle = null;

  function ensureAdHideStyle() {
    if (!settings.hideSidebarAds) {
      if (adHideStyle) { adHideStyle.remove(); adHideStyle = null; }
      return;
    }
    if (adHideStyle) return;
    adHideStyle = document.createElement('style');
    adHideStyle.id = AD_HIDE_STYLE_ID;
    adHideStyle.textContent = AD_HIDE_CSS;
    document.head.appendChild(adHideStyle);
  }

  function applyAdHiding() {
    if (settings.hideSidebarAds) {
      ensureAdHideStyle();
    } else {
      if (adHideStyle) {
        adHideStyle.remove();
        adHideStyle = null;
      }
    }
  }

  function notifyPageSkipper() {
    const enabled = Boolean(settings.autoSkip);
    document.documentElement.setAttribute('data-yt-dhikr-autoskip', enabled ? '1' : '0');
    window.dispatchEvent(new CustomEvent('ytDhikrAdblockSettings', {
      detail: { autoSkip: enabled }
    }));
  }

  function handleAdState() {
    if (!isYouTubePage()) return;
    notifyPageSkipper();

    const nowAdActive = detectAd();

    if (nowAdActive) {
      if (!adActive) currentDhikr = getRandomDhikr();
      adActive = true;
      if (settings.muteAds) rememberAndMute(getVideo());
      else restoreAudio();
      ensureOverlay();
      return;
    }

    if (adActive) {
      adActive = false;
      restoreAudio();
      removeOverlay();
    }
  }

  function loadSettings() {
    chrome.storage.local.get(DEFAULT_SETTINGS, stored => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
      if (!Array.isArray(settings.dhikrList) || isExactDefaultList(settings.dhikrList, OLD_ENGLISH_DEFAULT_DHIKR) || isExactDefaultList(settings.dhikrList, OLD_ARABIC_DEFAULT_DHIKR)) {
        settings.dhikrList = [...DEFAULT_DHIKR];
        chrome.storage.local.set({ dhikrList: settings.dhikrList });
      }

      handleAdState();
      applyAdHiding();
    });
  }

  function listenForSettingsChanges() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      for (const [key, change] of Object.entries(changes)) {
        settings[key] = change.newValue;
      }
      if (!settings.hideAds) removeOverlay();
      if (!settings.muteAds) restoreAudio();
      if ('hideSidebarAds' in changes) applyAdHiding();
      notifyPageSkipper();
      handleAdState();
    });
  }

  function attachPlayerObserver() {
    const player = getMoviePlayer();
    if (!player || player.__ytDhikrObserved) return;

    if (playerObserver) playerObserver.disconnect();
    playerObserver = new MutationObserver(() => handleAdState());

    // Watch only the player. Do not observe the full YouTube document because it
    // mutates constantly and can make the tab unstable on some machines.
    playerObserver.observe(player, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-label', 'title']
    });
    player.__ytDhikrObserved = true;
  }

  function startObserver() {
    attachPlayerObserver();
    clearInterval(periodicTimer);

    // A small polling loop is safer on YouTube than a document-wide observer.
    periodicTimer = setInterval(() => {
      attachPlayerObserver();
      handleAdState();
    }, 500);
  }

  function init() {
    if (initialized || !isYouTubePage()) return;
    initialized = true;
    loadSettings();
    listenForSettingsChanges();
    startObserver();
    document.addEventListener('yt-navigate-finish', () => { handleAdState(); applyAdHiding(); }, true);
    document.addEventListener('visibilitychange', handleAdState, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
    // Also initialize early so document_start can catch pre-rolls as soon as possible.
    setTimeout(init, 0);
  } else {
    init();
  }
})();
