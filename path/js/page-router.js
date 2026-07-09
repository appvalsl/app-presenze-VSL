/* ==========================================================
   VSL Operations Workforce - Multipage Router V3
   ========================================================== */
(function () {
  'use strict';

  var PAGE_PATHS = {
    dashboard: 'index.html',
    presenze: 'pages/presenze.html',
    assenze: 'pages/assenze-programmate.html',
    riepilogo: 'pages/riepilogo-presenze.html',
    gestione: 'pages/gestione-applicazione.html',
    programmazione: 'pages/programmazione.html',
    'tempi-metodi': 'pages/tempi-metodi.html'
  };

  var BOOT_BUTTONS = {
    dashboard: ['openHomeBtn'],
    presenze: ['openAttendanceBtn', 'homeOpenAttendanceBtn'],
    assenze: ['openPlannedAbsencesBtn', 'homeOpenPlannedAbsencesBtn'],
    riepilogo: ['openAttendanceAdminBtn', 'homeOpenAttendanceAdminBtn'],
    gestione: ['openOperatorsBtn', 'homeOpenOperatorsBtn'],
    programmazione: ['openProgrammingBtn', 'homeOpenProgrammingBtn'],
    'tempi-metodi': ['openTempiMetodiBtn', 'homeOpenTempiMetodiBtn']
  };

  var NAV_IDS = {
    openHomeBtn: 'dashboard',
    openAttendanceBtn: 'presenze',
    homeOpenAttendanceBtn: 'presenze',
    openPlannedAbsencesBtn: 'assenze',
    homeOpenPlannedAbsencesBtn: 'assenze',
    openAttendanceAdminBtn: 'riepilogo',
    homeOpenAttendanceAdminBtn: 'riepilogo',
    openOperatorsBtn: 'gestione',
    homeOpenOperatorsBtn: 'gestione',
    openProgrammingBtn: 'programmazione',
    homeOpenProgrammingBtn: 'programmazione',
    openTempiMetodiBtn: 'tempi-metodi',
    homeOpenTempiMetodiBtn: 'tempi-metodi'
  };

  function currentPage() {
    return (document.body && document.body.dataset && document.body.dataset.page) || 'dashboard';
  }

  function rootPrefix() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : './';
  }

  function urlFor(page) {
    return rootPrefix() + (PAGE_PATHS[page] || PAGE_PATHS.dashboard);
  }

  function closeMenu() {
    if (window.VSLMobileMenu && typeof window.VSLMobileMenu.close === 'function') window.VSLMobileMenu.close();
  }

  function navigateTo(page) {
    if (!page) return;
    if (page === currentPage()) { closeMenu(); return; }
    window.location.assign(urlFor(page));
  }

  function installNavigationInterceptor() {
    document.addEventListener('click', function (event) {
      if (window.__VSL_PAGE_BOOTSTRAPPING__) return;
      var target = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!target || !target.id || !NAV_IDS[target.id]) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      navigateTo(NAV_IDS[target.id]);
    }, true);
  }

  function forceHomeCardsToNavigate() {
    Object.keys(NAV_IDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.dataset.pageTarget = NAV_IDS[id];
      if (id.indexOf('homeOpen') === 0) {
        el.onclick = function (ev) {
          if (ev) { ev.preventDefault(); ev.stopPropagation(); }
          navigateTo(NAV_IDS[id]);
          return false;
        };
      }
    });
  }

  function clickFirstAvailable(ids) {
    for (var i = 0; i < ids.length; i += 1) {
      var el = document.getElementById(ids[i]);
      if (el) {
        window.__VSL_PAGE_BOOTSTRAPPING__ = true;
        try { el.click(); } finally {
          setTimeout(function () { window.__VSL_PAGE_BOOTSTRAPPING__ = false; }, 50);
        }
        return true;
      }
    }
    return false;
  }

  function applyPageChrome() {
    var page = currentPage();
    document.documentElement.dataset.vslPage = page;
    document.body.dataset.vslPage = page;
    Object.keys(NAV_IDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('is-current-page', NAV_IDS[id] === page);
    });
  }

  function bootstrapPage() {
    var page = currentPage();
    var ids = BOOT_BUTTONS[page] || BOOT_BUTTONS.dashboard;
    var attempts = 0;
    var maxAttempts = 100;
    var timer = window.setInterval(function () {
      attempts += 1;
      applyPageChrome();
      forceHomeCardsToNavigate();
      var app = document.getElementById('appSection');
      var auth = document.getElementById('authSection');
      var appVisible = app && !app.classList.contains('hidden');
      var authVisible = auth && !auth.classList.contains('hidden');
      if (authVisible && !appVisible) {
        if (attempts > maxAttempts) window.clearInterval(timer);
        return;
      }
      if (clickFirstAvailable(ids) || attempts > maxAttempts) {
        window.clearInterval(timer);
        applyPageChrome();
        forceHomeCardsToNavigate();
      }
    }, 120);
  }

  function init() {
    installNavigationInterceptor();
    applyPageChrome();
    forceHomeCardsToNavigate();
    bootstrapPage();
    window.setTimeout(applyPageChrome, 800);
    window.setTimeout(applyPageChrome, 1800);
    window.setTimeout(forceHomeCardsToNavigate, 800);
    window.setTimeout(forceHomeCardsToNavigate, 1800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
