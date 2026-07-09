/* VSL Tempi e Metodi autoload safety */
(function(){
  function page(){return document.body&&document.body.dataset&&document.body.dataset.page;}
  function run(){if(page()!=='tempi-metodi')return;var status=document.getElementById('cycleTimesStatus');var btn=document.getElementById('refreshCycleTimesBtn');if(status&&btn&&/caricamento/i.test(status.textContent||'')){btn.click();}}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(run,2200);setTimeout(run,4500);});
})();
