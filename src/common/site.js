import { translate } from './translations.js';

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* 返回顶部后移除地址栏片段；滚动区块锚点由下方的导航同步维护。 */
  function hideTopHash() {
    if (location.hash !== '#top') return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    history.replaceState(history.state, '', location.pathname + location.search);
  }
  hideTopHash();
  window.addEventListener('hashchange', hideTopHash);

  /* ---------- 主题：跟随系统 / 亮 / 暗 ---------- */
  var THEME_KEY = 'cleanu:theme-mode';
  var MODES = ['auto', 'light', 'dark'];
  var schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var themeBtn = document.querySelector('[data-theme-toggle]');
  var themeMetas = document.querySelectorAll('meta[name="theme-color"]');

  function themeMode() { return root.dataset.themeMode || 'auto'; }
  function nextMode() { return MODES[(MODES.indexOf(themeMode()) + 1) % MODES.length]; }
  function resolvedScheme() {
    var mode = themeMode();
    if (mode !== 'auto') return mode;
    return schemeQuery.matches ? 'dark' : 'light';
  }
  function syncThemeColor() {
    var want = resolvedScheme() === 'dark' ? '#121514' : '#f5f4f1';
    themeMetas.forEach(function (meta) {
      meta.media = meta.content.trim().toLowerCase() === want ? 'all' : 'not all';
    });
  }
  function paintTheme() {
    var label = translate('theme.label', { current: translate('theme.' + themeMode()), next: translate('theme.' + nextMode()) });
    themeBtn.setAttribute('aria-label', label);
    themeBtn.title = label;
    syncThemeColor();
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      root.dataset.themeMode = nextMode();
      try { localStorage.setItem(THEME_KEY, root.dataset.themeMode); } catch (e) { /* 只影响当前页面 */ }
      paintTheme();
    });
    if (schemeQuery.addEventListener) schemeQuery.addEventListener('change', syncThemeColor);
    else if (schemeQuery.addListener) schemeQuery.addListener(syncThemeColor);
    paintTheme();
  }

  /* ---------- 语言链接：渐进保留当前页面的有效锚点 ---------- */
  var languageLink = document.querySelector('[data-language-link]');
  var languageTarget = languageLink ? languageLink.getAttribute('href') : '';
  function syncLanguageHash() {
    if (!languageLink) return;
    var hash = location.hash;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (e) { id = ''; }
    languageLink.setAttribute('href', languageTarget + (id && document.getElementById(id) ? hash : ''));
  }
  if (languageLink) {
    syncLanguageHash();
    window.addEventListener('hashchange', syncLanguageHash);
  }

  /* ---------- 导航抽屉 ---------- */
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('.nav__toggle');

  function setNav(open) {
    nav.dataset.open = open ? 'true' : 'false';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (nav && toggle) {
    setNav(false);
    toggle.addEventListener('click', function () {
      setNav(nav.dataset.open !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.dataset.open === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.dataset.open === 'true' && !nav.contains(e.target)) setNav(false);
    });
    document.querySelectorAll('#primary-nav a').forEach(function (link) {
      link.addEventListener('click', function () { setNav(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setNav(false);
    });
  }

  /* ---------- 当前区块与地址栏锚点（只看本页面上的导航目标） ---------- */
  var navLinks = {};
  var pendingSectionId = null;
  document.querySelectorAll('#primary-nav a').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    var section = document.getElementById(href.slice(1));
    if (section) {
      navLinks[section.id] = { link: link, section: section };
      link.addEventListener('click', function () { pendingSectionId = section.id; });
    }
  });

  var navSectionIds = Object.keys(navLinks);
  var currentSectionId = null;

  function clearCurrent() {
    Object.keys(navLinks).forEach(function (id) {
      navLinks[id].link.removeAttribute('aria-current');
    });
  }

  function setCurrentSection(id) {
    var changed = currentSectionId !== id;
    currentSectionId = id;
    if (changed) {
      clearCurrent();
      if (id) navLinks[id].link.setAttribute('aria-current', 'location');
    }

    var sectionHash = id ? '#' + encodeURIComponent(id) : '';
    var currentHashId;
    try { currentHashId = decodeURIComponent(location.hash.slice(1)); } catch (e) { currentHashId = ''; }
    var currentHashIsSection = Object.prototype.hasOwnProperty.call(navLinks, currentHashId);
    if (id && location.hash !== sectionHash) {
      history.replaceState(history.state, '', location.pathname + location.search + sectionHash);
    } else if (!id && currentHashIsSection) {
      history.replaceState(history.state, '', location.pathname + location.search);
    }
    syncLanguageHash();
  }

  function updateCurrentSection() {
    var activeId = null;
    var activationLine = Math.max((nav ? nav.offsetHeight : 0) + 40, window.innerHeight * 0.5);
    if (pendingSectionId) {
      var requestedId = pendingSectionId;
      var requestedRect = navLinks[requestedId].section.getBoundingClientRect();
      if (requestedRect.top < window.innerHeight && requestedRect.bottom > 0) {
        setCurrentSection(requestedId);
        return;
      }
      pendingSectionId = null;
    }
    navSectionIds.forEach(function (id) {
      if (navLinks[id].section.getBoundingClientRect().top <= activationLine) activeId = id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      activeId = navSectionIds[navSectionIds.length - 1];
    }
    setCurrentSection(activeId);
  }

  if (navSectionIds.length) {
    var initialHashId;
    try { initialHashId = decodeURIComponent(location.hash.slice(1)); } catch (e) { initialHashId = ''; }
    if (navLinks[initialHashId]) {
      currentSectionId = initialHashId;
      pendingSectionId = initialHashId;
      navLinks[initialHashId].link.setAttribute('aria-current', 'location');
    }

    var scrollSpyFrame = 0;
    function scheduleCurrentSectionUpdate() {
      if (scrollSpyFrame) return;
      scrollSpyFrame = window.requestAnimationFrame(function () {
        scrollSpyFrame = 0;
        updateCurrentSection();
      });
    }
    function clearPendingSection() { pendingSectionId = null; }
    window.addEventListener('wheel', clearPendingSection, { passive: true });
    window.addEventListener('touchstart', clearPendingSection, { passive: true });
    window.addEventListener('pointerdown', clearPendingSection, { passive: true });
    window.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].indexOf(e.key) !== -1) clearPendingSection();
    });
    window.addEventListener('scroll', scheduleCurrentSectionUpdate, { passive: true });
    window.addEventListener('resize', scheduleCurrentSectionUpdate);
    window.addEventListener('pageshow', scheduleCurrentSectionUpdate);
    if (document.readyState === 'complete') scheduleCurrentSectionUpdate();
    else window.addEventListener('load', scheduleCurrentSectionUpdate, { once: true });
  }

  /* ---------- 区块淡入上移 ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }
})();
