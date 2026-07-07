/* ===== VSL MOBILE MENU - FINAL POSITION + TOUCH FIX 2026-07-07 ===== */
(function(){
  "use strict";
  function byId(id){ return document.getElementById(id); }
  function isMobile(){ return !window.matchMedia || window.matchMedia("(max-width: 860px)").matches; }
  function menu(){ return byId("topbarMenu"); }
  function button(){ return byId("menuToggle"); }
  function backdrop(){ return byId("mobileMenuBackdrop"); }
  function isOpen(){ var m = menu(); return !!(m && m.classList.contains("is-open")); }
  function setOpen(open){
    var m = menu();
    var b = button();
    var bd = backdrop();
    if(!m || !b) return;
    m.classList.toggle("is-open", open);
    b.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
    if(bd) bd.classList.toggle("hidden", !open);
    document.documentElement.classList.toggle("mobile-menu-open", open);
    document.body.classList.toggle("mobile-menu-open", open);
  }
  function openMenu(){ setOpen(true); }
  function closeMenu(){ setOpen(false); }
  function toggleMenu(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
    setOpen(!isOpen());
    return false;
  }
  function clickIsToggle(target){ return !!(target && target.closest && target.closest("#menuToggle")); }
  function clickIsBackdrop(target){ return !!(target && target.closest && target.closest("#mobileMenuBackdrop")); }
  function clickIsMenuButton(target){ return !!(target && target.closest && target.closest("#topbarMenu button")); }
  function captureHandler(ev){
    var target = ev.target;
    if(clickIsToggle(target)) return toggleMenu(ev);
    if(clickIsBackdrop(target)) { ev.preventDefault(); closeMenu(); return false; }
    if(isMobile() && isOpen() && clickIsMenuButton(target)) setTimeout(closeMenu, 0);
  }
  function bind(){
    var b = button();
    var m = menu();
    if(!b || !m) return;
    if(b.dataset.mobileMenuFinalBound === "1") return;
    b.dataset.mobileMenuFinalBound = "1";
    b.onclick = toggleMenu;
    ["pointerdown","touchstart","click"].forEach(function(type){
      document.addEventListener(type, captureHandler, true);
    });
    document.addEventListener("keydown", function(ev){ if(ev.key === "Escape") closeMenu(); }, true);
    window.addEventListener("resize", function(){ if(!isMobile()) closeMenu(); });
  }
  window.VSLMobileMenu = { bind: bind, open: openMenu, close: closeMenu, toggle: toggleMenu, isOpen: isOpen };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
