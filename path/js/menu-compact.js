/* V7 menu compact labels */
(function(){
  function set(){
    var labels={openPlannedAbsencesBtn:'Assenze',openProgrammingBtn:'Programmi',openTempiMetodiBtn:'Tempi',openOperatorsBtn:'Gestione',openAttendanceAdminBtn:'Riepilogo',homeOpenPlannedAbsencesBtn:'Assenze programmate',homeOpenOperatorsBtn:'Gestione applicazione',homeOpenAttendanceAdminBtn:'Riepilogo presenze'};
    Object.keys(labels).forEach(function(id){var el=document.getElementById(id); if(el && !el.dataset.v7Label){el.dataset.v7Label='1'; if(!id.indexOf('homeOpen')===0){} if(!id.startsWith('homeOpen')) el.textContent=labels[id];}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',set);else set();
  setTimeout(set,800);setTimeout(set,1800);
})();
