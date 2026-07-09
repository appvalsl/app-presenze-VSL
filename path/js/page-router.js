/* ==========================================================
   VSL Operations Workforce - Multipage Router
   ----------------------------------------------------------
   This file turns the previous one-page workflow into real
   page URLs while preserving all existing application logic.
   Each HTML page declares body[data-page]. The router:
   1) Opens the correct legacy view at startup.
   2) Converts top menu/home navigation into real page changes.
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

  function silentlyCloseMobileMenu() {
    if (window.VSLMobileMenu && typeof window.VSLMobileMenu.close === 'function') {
      window.VSLMobileMenu.close();
    }
  }

  function navigateTo(page) {
    if (!page) return;
    if (page === currentPage()) {
      silentlyCloseMobileMenu();
      return;
    }
    window.location.href = urlFor(page);
  }

  function installNavigationInterceptor() {
    document.addEventListener('click', function (event) {
      if (window.__VSL_PAGE_BOOTSTRAPPING__) return;
      var target = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!target || !target.id) return;
      var page = NAV_IDS[target.id];
      if (!page) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      navigateTo(page);
    }, true);
  }

  function clickFirstAvailable(ids) {
    for (var i = 0; i < ids.length; i += 1) {
      var el = document.getElementById(ids[i]);
      if (el) {
        window.__VSL_PAGE_BOOTSTRAPPING__ = true;
        try { el.click(); } finally {
          setTimeout(function () { window.__VSL_PAGE_BOOTSTRAPPING__ = false; }, 0);
        }
        return true;
      }
    }
    return false;
  }

  function bootstrapPage() {
    var page = currentPage();
    var ids = BOOT_BUTTONS[page] || BOOT_BUTTONS.dashboard;
    var attempts = 0;
    var maxAttempts = 80;
    var timer = window.setInterval(function () {
      attempts += 1;
      var appVisible = document.getElementById('appSection') && !document.getElementById('appSection').classList.contains('hidden');
      var authVisible = document.getElementById('authSection') && !document.getElementById('authSection').classList.contains('hidden');
      if (authVisible && !appVisible) {
        if (attempts > maxAttempts) window.clearInterval(timer);
        return;
      }
      if (clickFirstAvailable(ids) || attempts > maxAttempts) {
        window.clearInterval(timer);
      }
    }, 150);
  }

  function markActiveNavigation() {
    var page = currentPage();
    Object.keys(NAV_IDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('is-current-page', NAV_IDS[id] === page);
    });
  }

  function init() {
    installNavigationInterceptor();
    bootstrapPage();
    window.setTimeout(markActiveNavigation, 1200);
    window.setTimeout(markActiveNavigation, 2400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
