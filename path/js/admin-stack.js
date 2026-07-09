/* V7 Gestione applicazione: no cards, all sections stacked */
(function(){
  function page(){return document.body&&document.body.dataset&&document.body.dataset.page;}
  function clickArea(area){var b=document.querySelector('#adminAppDashboard button[data-admin-area="'+area+'"]'); if(b) b.click();}
  function prep(){
    if(page()!=='gestione') return;
    var dash=document.getElementById('adminAppDashboard'); if(!dash) return;
    if(dash.dataset.v7Stacked==='1') return;
    dash.dataset.v7Stacked='1';
    setTimeout(function(){clickArea('users');},80);
    setTimeout(function(){clickArea('work');},420);
    setTimeout(function(){clickArea('operators');},820);
  }
  function loop(){prep(); setTimeout(prep,1200); setTimeout(prep,2500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loop);else loop();
})();
