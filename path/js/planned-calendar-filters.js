/* V7 Assenze programmate: calendar filters restored */
(function(){
  function page(){return document.body&&document.body.dataset&&document.body.dataset.page;}
  function sync(id,val,eventType){var el=document.getElementById(id); if(!el)return; el.value=val; el.dispatchEvent(new Event(eventType||'input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));}
  function ensure(){
    if(page()!=='assenze') return;
    var cal=document.getElementById('plannedAbsenceCalendar'); if(!cal || document.getElementById('plannedCalendarFiltersV7')) return;
    var box=document.createElement('div'); box.id='plannedCalendarFiltersV7'; box.className='card inline-card planned-calendar-filters-v7';
    box.innerHTML='<div class="admin-subpanel-head"><h3>Filtri calendario</h3><button id="plannedCalendarClearFiltersV7" class="btn btn-secondary" type="button">Pulisci filtri</button></div><div class="form-grid form-grid-4"><div class="field"><label>Dal</label><input id="plannedCalendarFromV7" type="date"></div><div class="field"><label>Al</label><input id="plannedCalendarToV7" type="date"></div><div class="field"><label>Linea</label><select id="plannedCalendarLineV7"><option value="">Tutte le linee</option></select></div><div class="field"><label>Motivo</label><select id="plannedCalendarReasonV7"><option value="">Tutti i motivi</option><option value="FERIE">FERIE</option><option value="PERMESSO">PERMESSO</option><option value="MALATTIA">MALATTIA</option><option value="VISITA MEDICA">VISITA MEDICA</option><option value="104">104</option><option value="ASPETTATIVA">ASPETTATIVA</option><option value="CORSO">CORSO</option><option value="TRASFERTA">TRASFERTA</option><option value="SCIOPERO">SCIOPERO</option><option value="ALTRO">ALTRO</option></select></div><div class="field field-span-3"><label>Cerca</label><input id="plannedCalendarSearchV7" type="text" placeholder="Operatore, motivo, linea o nota"></div></div>';
    cal.parentNode.insertBefore(box, cal);
    var srcLine=document.getElementById('plannedAbsenceLineFilter'), dstLine=document.getElementById('plannedCalendarLineV7');
    if(srcLine&&dstLine){dstLine.innerHTML=srcLine.innerHTML;}
    var pairs=[['plannedCalendarFromV7','plannedAbsenceFromFilter','change'],['plannedCalendarToV7','plannedAbsenceToFilter','change'],['plannedCalendarLineV7','plannedAbsenceLineFilter','change'],['plannedCalendarReasonV7','plannedAbsenceReasonFilter','change'],['plannedCalendarSearchV7','plannedAbsenceSearch','input']];
    pairs.forEach(function(p){var a=document.getElementById(p[0]); if(a){a.addEventListener(p[2],function(){sync(p[1],a.value,p[2]);});}});
    var clear=document.getElementById('plannedCalendarClearFiltersV7'); if(clear){clear.onclick=function(){pairs.forEach(function(p){var a=document.getElementById(p[0]); if(a){a.value=''; sync(p[1],'',p[2]);}});};}
  }
  function init(){ensure(); setTimeout(ensure,1200); setTimeout(ensure,2600);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
