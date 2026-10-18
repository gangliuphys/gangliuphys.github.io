/* ==========================================================================
   个人学术主页 · 交互脚本
   模块：① 语言切换  ② 主题切换  ③ 移动端导航  ④ 滚动高亮  ⑤ 站内搜索
   无任何第三方依赖，纯原生实现。
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     工具函数
     ------------------------------------------------------------------ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const store = {
    get(key, fallback) {
      try {
        return localStorage.getItem(key) || fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) { /* 隐私模式忽略 */ }
    },
  };

  /** 转义 HTML，防止搜索内容注入 */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  /* ------------------------------------------------------------------
     ① 语言切换
     ------------------------------------------------------------------ */
  // 按钮显示「切到另一种语言」的名称：中文界面下显示 EN，英文界面下显示 CN
  const LANG_TOGGLE_TEXT = { zh: 'EN', en: 'CN' };

  function applyLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    // 1) 双属性元素：整体替换 innerHTML
    $$('[data-zh]').forEach((el) => {
      const value = el.getAttribute(`data-${lang}`);
      if (value != null) el.innerHTML = value;
    });

    // 2) 纯文本元素（无需保留子标签）
    //    注意属性全名带 data- 前缀
    $$('[data-zh-text]').forEach((el) => {
      const value = el.getAttribute(`data-${lang}-text`);
      if (value != null) el.textContent = value;
    });

    // 3) 富文本（作者名带 <sup> 上标、期刊带 <em> 等）
    $$('[data-zh-html]').forEach((el) => {
      const value = el.getAttribute(`data-${lang}-html`);
      if (value != null) el.innerHTML = value;
    });

    // 4) 图片 alt
    $$('[data-zh-alt]').forEach((el) => {
      const value = el.getAttribute(`data-${lang}-alt`);
      if (value != null) el.setAttribute('alt', value);
    });

    // 5) title 等无障碍属性
    $$('[data-zh-title]').forEach((el) => {
      const value = el.getAttribute(`data-${lang}-title`);
      if (value != null) el.setAttribute('title', value);
    });

    // 6) 搜索框占位符
    const input = $('#searchInput');
    if (input) {
      input.placeholder = lang === 'zh'
        ? '搜索论文、项目、新闻…  (Search…)'
        : 'Search papers, projects, news…  (搜索…)';
    }

    // 7) 语言按钮本身（不在 data 体系内）
    const label = $('#langLabel');
    if (label) label.textContent = LANG_TOGGLE_TEXT[lang];

    // 8) 资源链接按语言切换（简历 PDF 等）
    $$('[data-zh-href]').forEach((el) => {
      const value = el.getAttribute(`data-${lang}-href`);
      if (value != null) {
        el.setAttribute('href', value);
        if (el.hasAttribute('download')) el.removeAttribute('download');
      }
    });

    store.set('lang', lang);
  }

  function initLang() {
    applyLang(store.get('lang', 'zh'));

    const toggle = $('#langToggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-lang') || 'zh';
      applyLang(current === 'zh' ? 'en' : 'zh');

      // 语言变化后搜索结果分组名需重建
      const panel = $('#searchPanel');
      if (panel && !panel.hidden) {
        const input = $('#searchInput');
        if (input) renderResults(input.value.trim());
      }
    });
  }

  /* ------------------------------------------------------------------
     ② 主题切换
     ------------------------------------------------------------------ */
  function syncThemeIcon(theme) {
    const sun = $('#iconSun');
    const moon = $('#iconMoon');
    if (sun) sun.hidden = theme !== 'light';
    if (moon) moon.hidden = theme === 'light';
  }

  function initTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    syncThemeIcon(current);

    const btn = $('#themeToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      syncThemeIcon(next);
      store.set('theme', next);
    });

    // 用户未手动选择过时，跟随系统变化
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', (e) => {
        if (store.get('theme', null)) return;
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        syncThemeIcon(theme);
      });
    }
  }

  /* ------------------------------------------------------------------
     ③ 移动端导航
     ------------------------------------------------------------------ */
  function initNav() {
    const burger = $('#burger');
    const links = $('#navLinks');
    if (!burger || !links) return;

    burger.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });

    $$('.nav__link', links).forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!links.classList.contains('is-open')) return;
      if (links.contains(e.target) || burger.contains(e.target)) return;
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !links.classList.contains('is-open')) return;
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }

  /* ------------------------------------------------------------------
     ④ 滚动高亮当前导航项
     ------------------------------------------------------------------ */
  function initScrollSpy() {
    const navLinks = $$('.nav__link');
    const targets = navLinks
      .map((a) => {
        const href = a.getAttribute('href') || '';
        if (!href.startsWith('#') || href === '#') return null;
        const section = document.getElementById(href.slice(1));
        return section ? { link: a, section } : null;
      })
      .filter(Boolean);

    if (!targets.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const hit = targets.find((t) => t.section === entry.target);
        if (hit) hit.link.classList.add('is-active');
      });
    }, {
      rootMargin: '-72px 0px -65% 0px',
      threshold: 0,
    });

    targets.forEach((t) => observer.observe(t.section));
  }

  /* ------------------------------------------------------------------
     ⑤ 站内搜索
     ------------------------------------------------------------------ */
  // 论文区为纯英文，分组名固定英文
  const SEARCH_INDEX = [
    { group: { zh: 'Publications', en: 'Publications' }, selector: '.pub' },
    { group: { zh: '全部论文', en: 'All Publications' }, selector: '.refitem' },
    { group: { zh: '项目', en: 'Projects' }, selector: '.grant' },
    { group: { zh: '动态', en: 'News' }, selector: '.news__item' },
    { group: { zh: '研究兴趣', en: 'Research Interests' }, selector: '.interest' },
    { group: { zh: '教育背景', en: 'Education' }, selector: '#education .tl-item' },
    { group: { zh: '工作经历', en: 'Experience' }, selector: '#experience .tl-item' },
  ];

  let searchIndex = [];
  let activeIndex = -1;

  function collectIndex() {
    const lang = document.documentElement.getAttribute('data-lang') || 'zh';
    const index = [];

    SEARCH_INDEX.forEach(({ group, selector }) => {
      $$(selector).forEach((el) => {
        if (el.closest('.nav')) return;

        const titleEl = $('.pub__title, .grant__title, .tl-degree, .interest__title, .refitem__title, h3', el) || el;
        const title = (titleEl.textContent || '').trim();

        // 同时收录中英文，切换语言后仍能搜到
        const haystack = [
          title,
          (el.textContent || '').trim(),
          el.getAttribute('data-zh') || '',
          el.getAttribute('data-en') || '',
        ].join(' ').toLowerCase();

        index.push({
          title,
          group: group[lang] || group.zh,
          haystack,
          anchor: '#' + (el.closest('section[id]')?.id || 'top'),
          // 标记是否位于弹窗内，点击搜索结果时需先打开弹窗
          inModal: !!el.closest('#pubsModal'),
        });
      });
    });

    return index;
  }

  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const idx = safe.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return safe;
    return safe.slice(0, idx)
      + '<mark>' + safe.slice(idx, idx + query.length) + '</mark>'
      + safe.slice(idx + query.length);
  }

  function renderResults(query) {
    const box = $('#searchResults');
    if (!box) return;

    const isZh = (document.documentElement.getAttribute('data-lang') || 'zh') === 'zh';

    if (!query) {
      box.innerHTML = '<div class="search__empty">'
        + (isZh ? '输入关键词开始搜索，支持中英文。' : 'Type to search. Both Chinese and English keywords work.')
        + '</div>';
      return;
    }

    const hits = searchIndex.filter((item) => item.haystack.includes(query.toLowerCase()));

    if (!hits.length) {
      box.innerHTML = '<div class="search__empty">'
        + (isZh ? '没有找到相关内容。' : 'No matches found.')
        + '</div>';
      return;
    }

    const groups = {};
    hits.forEach((hit) => {
      (groups[hit.group] = groups[hit.group] || []).push(hit);
    });

    box.innerHTML = Object.keys(groups).map((group) => (
      '<div class="search__group">'
      + '<p class="search__group-label">' + escapeHtml(group) + '</p>'
      + groups[group].map((hit) => (
        '<a class="search__result" href="' + hit.anchor + '"'
        + (hit.inModal ? ' data-open-modal="1"' : '') + '>'
        + '<span class="search__result-title">' + highlight(hit.title, query) + '</span>'
        + '</a>'
      )).join('')
      + '</div>'
    )).join('');

    activeIndex = -1;
  }

  function openSearch() {
    const panel = $('#searchPanel');
    const input = $('#searchInput');
    if (!panel || !input) return;

    searchIndex = collectIndex();
    panel.hidden = false;
    document.body.style.overflow = 'hidden';
    input.focus();
    renderResults(input.value.trim());
  }

  function closeSearch() {
    const panel = $('#searchPanel');
    if (!panel) return;
    panel.hidden = true;
    document.body.style.overflow = '';
    const btn = $('#searchOpen');
    if (btn) btn.focus();
  }

  function moveActive(delta) {
    const items = $$('.search__result');
    if (!items.length) return;

    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].classList.remove('is-active');
    }
    activeIndex = (activeIndex + delta + items.length) % items.length;

    const active = items[activeIndex];
    active.classList.add('is-active');
    if (active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }

  function initSearch() {
    const openBtn = $('#searchOpen');
    const panel = $('#searchPanel');
    const input = $('#searchInput');
    if (!openBtn || !panel || !input) return;

    openBtn.addEventListener('click', openSearch);

    panel.addEventListener('click', (e) => {
      const result = e.target.closest('.search__result');
      if (e.target === panel) {
        closeSearch();
      } else if (result) {
        // 命中弹窗内的论文时，先打开弹窗再关闭搜索面板
        if (result.hasAttribute('data-open-modal')) {
          const pubsBtn = $('#pubsToggle');
          if (pubsBtn) pubsBtn.click();
        }
        closeSearch();
      }
    });

    input.addEventListener('input', () => renderResults(input.value.trim()));

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        panel.hidden ? openSearch() : closeSearch();
        return;
      }
      if (panel.hidden) return;

      // 弹窗优先：搜索面板在弹窗打开时不响应 Esc，避免两个处理器同时抢占
      const pubsModal = $('#pubsModal');
      if (pubsModal && !pubsModal.hidden) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveActive(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const active = $('.search__result.is-active') || $('.search__result');
        if (active) active.click();
      }
    });
  }

  /* ------------------------------------------------------------------
     ⑥ 全部论文弹窗
     ------------------------------------------------------------------ */
  function initPubsModal() {
    const btn = $('#pubsToggle');
    const modal = $('#pubsModal');
    const closeBtn = $('#pubsModalClose');
    if (!btn || !modal) return;

    let lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      btn.setAttribute('aria-expanded', 'true');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.hidden = true;
      document.body.style.overflow = '';
      btn.setAttribute('aria-expanded', 'false');
      if (lastFocused) lastFocused.focus();
    }

    btn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // 点击遮罩空白处关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Esc 关闭 + 弹窗内焦点循环（无障碍）
    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = $$(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
          modal
        ).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     ⑦ 全部论文列表编号（反向：最早的论文为 [1]）
     ------------------------------------------------------------------ */
  function initRefNumbers() {
    const list = $('.reflist');
    if (!list) return;

    const setNumbers = () => {
      // CSS 用 counter-increment: -1 反向递减，
      // 起始值须为「条目数 + 1」：首次递减后才是条目数，
      // 于是列表最后一条（最早）恰好显示为 [1]
      list.style.counterReset = `ref ${list.children.length + 1}`;
    };

    setNumbers();

    // 弹窗内的条目在打开时才可见，但数量固定，这里一并兜底
    if ('MutationObserver' in window && list.children.length === 0) {
      const obs = new MutationObserver(() => {
        if (list.children.length > 0) {
          setNumbers();
          obs.disconnect();
        }
      });
      obs.observe(list, { childList: true });
    }
  }

  /* ------------------------------------------------------------------
     年份自动更新
     ------------------------------------------------------------------ */
  function initYear() {
    const year = String(new Date().getFullYear());
    $$('[data-current-year]').forEach((el) => { el.textContent = year; });
  }

  /* ------------------------------------------------------------------
     累计访问次数
     ------------------------------------------------------------------
     读取仓库里的 counter.json（由 GitHub Actions 定时累加）。

     为什么不用第三方统计服务：
       本项目部署环境的网络对 countapi.xyz、不蒜子（counter 子域）、
       abacus、open-count 等服务均不通或已失效，实测全部超时。
       raw.githubusercontent.com 则稳定可达且带 CORS 头，适合做数据源。

     写入由 GitHub Actions 完成（见 .github/workflows/counter.yml），
     前端只读不写，因此无需在任何公开代码里暴露 Token。
     ------------------------------------------------------------------ */
  function initVisitCount() {
    var wrap = document.getElementById('visit-wrap');
    if (!wrap) return;

    var url = 'https://raw.githubusercontent.com/gangliuphys/'
      + 'gangliuphys.github.io/main/counter.json';

    var timer = setTimeout(function() { wrap.hidden = true; }, 6000);

    fetch(url, { cache: 'no-store' })
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(d) {
        clearTimeout(timer);
        var n = parseInt(d && d.count, 10);
        if (isNaN(n) || n <= 0) { wrap.hidden = true; return; }
        var text = n.toLocaleString('en-US');
        var zh = wrap.querySelector('#visit-count');
        var en = wrap.querySelector('#visit-count-en');
        if (zh) zh.textContent = text;
        if (en) en.textContent = text;
        wrap.hidden = false;
      })
      .catch(function() {
        clearTimeout(timer);
        wrap.hidden = true;   // 读不到就静默隐藏，不给访客看破相
      });
  }

  /* ------------------------------------------------------------------
     初始化
     ------------------------------------------------------------------ */
  function boot() {
    initLang();
    initTheme();
    initNav();
    initScrollSpy();
    initSearch();
    initPubsModal();
    initRefNumbers();
    initYear();
    initVisitCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();