(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- 主题：跟随系统 / 亮 / 暗 ---------- */
  var THEME_KEY = 'cleanu:theme-mode';
  var MODES = ['auto', 'light', 'dark'];
  var MODE_LABEL = { auto: '跟随系统', light: '亮色', dark: '暗色' };
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
    var label = '主题：' + MODE_LABEL[themeMode()] + '，点击切换为' + MODE_LABEL[nextMode()];
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

  /* ---------- 当前区块高亮（只看本页面上的锚点） ---------- */
  var navLinks = {};
  document.querySelectorAll('#primary-nav a').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    var section = document.getElementById(href.slice(1));
    if (section) navLinks[section.id] = { link: link, section: section };
  });

  function clearCurrent() {
    Object.keys(navLinks).forEach(function (id) {
      navLinks[id].link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && Object.keys(navLinks).length) {
    var spy = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      var top = visible.reduce(function (a, b) {
        return a.boundingClientRect.top < b.boundingClientRect.top ? a : b;
      });
      clearCurrent();
      var id = top.target.id;
      if (navLinks[id]) navLinks[id].link.setAttribute('aria-current', 'true');
    }, { rootMargin: '-72px 0px -55% 0px', threshold: 0 });

    Object.keys(navLinks).forEach(function (id) { spy.observe(navLinks[id].section); });
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
