/* ===== PROGRAMMAZIONE PRODUZIONE MANOVIE + MAGAZZINO FORME - V2 ===== */
(function () {
  'use strict';

  const client = window.AppSupabase && window.AppSupabase.getClient ? window.AppSupabase.getClient() : null;
  const $ = (id) => document.getElementById(id);
  const norm = (v) => String(v || '').trim().toUpperCase();
  const esc = (v) => String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  const num = (v, fallback = 0) => {
    const n = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  };

  const PROGRAM_LINES = ['CALZOLERIA 1', 'CALZOLERIA 2'];
  const LINE_LABEL = { 'CALZOLERIA 1': 'VSL1', 'CALZOLERIA 2': 'VSL2' };
  const DATE_FMT = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const state = {
    user: null,
    profile: null,
    canUse: false,
    isAdmin: false,
    currentPage: 'menu',
    dates: [],
    rows: [],
    forms: [],
    formsSearch: '',
    dbPrograms: [],
    dbItems: [],
    dbFrom: '',
    dbTo: '',
    dbLine: '',
    dbSearch: '',
    editorReady: false
  };

  function show(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = 'message ' + (type || 'info');
    el.classList.remove('hidden');
  }
  function hide(el) {
    if (!el) return;
    el.textContent = '';
    el.className = 'message hidden';
  }
  function todayIso() { return localDateToIso(new Date()); }
  function plusDaysIso(iso, days) {
    const d = parseIsoLocal(iso);
    if (!d) return todayIso();
    d.setDate(d.getDate() + days);
    return localDateToIso(d);
  }
  function localDateToIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function parseIsoLocal(iso) {
    const parts = String(iso || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  function eachDate(from, to) {
    const out = [];
    const start = parseIsoLocal(from);
    const end = parseIsoLocal(to);
    if (!start || !end || end < start) return out;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(localDateToIso(d));
      if (out.length > 31) break;
    }
    return out;
  }
  function formatDateIT(iso) {
    if (!iso) return '-';
    const p = String(iso).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  }
  function formatDateHeader(iso) {
    const d = parseIsoLocal(iso);
    if (!d || Number.isNaN(d.getTime())) return { date: iso, weekday: '' };
    const parts = DATE_FMT.formatToParts(d);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    return { date: `${day}/${month}/${year}`, weekday: weekday.toUpperCase() };
  }
  function lineOrder(line) { return norm(line) === 'CALZOLERIA 1' ? 1 : norm(line) === 'CALZOLERIA 2' ? 2 : 9; }
  function sortRows() {
    state.rows.sort((a, b) => lineOrder(a.line_name) - lineOrder(b.line_name) || String(a.article_code || a.lookup_code || '').localeCompare(String(b.article_code || b.lookup_code || ''), 'it'));
  }

  async function loadProfile() {
    if (!client) return;
    const session = await client.auth.getSession();
    state.user = session && session.data && session.data.session ? session.data.session.user : null;
    if (!state.user) {
      state.profile = null; state.canUse = false; state.isAdmin = false; return;
    }
    const res = await client.from('app_users').select('*').eq('user_id', state.user.id).maybeSingle();
    state.profile = res.data || { role: 'user', is_active: true, can_manage_operators: false };
    const role = norm(state.profile.role);
    state.isAdmin = state.profile.is_active !== false && (state.profile.can_manage_operators === true || role === 'ADMIN' || role === 'SUPERADMIN');
    state.canUse = state.isAdmin || state.profile.can_manage_programming === true || ['PROGRAMMAZIONE', 'PLANNER', 'KEY_USER', 'SUPER_USER', 'SUPERUSER'].includes(role);
  }

  function ensureNavigation() {
    const topbar = $('topbarMenu');
    if (topbar && !$('openProgrammingBtn')) {
      const btn = document.createElement('button');
      btn.id = 'openProgrammingBtn';
      btn.className = 'btn btn-secondary hidden';
      btn.type = 'button';
      btn.textContent = 'Programmazione';
      const before = $('openOperatorsBtn') || $('openAttendanceAdminBtn') || $('userBadge');
      topbar.insertBefore(btn, before || null);
      btn.addEventListener('click', openProgramming);
    }
    const homeGrid = document.querySelector('.home-grid');
    if (homeGrid && !$('homeOpenProgrammingBtn')) {
      const btn = document.createElement('button');
      btn.id = 'homeOpenProgrammingBtn';
      btn.className = 'home-card admin-only-card hidden';
      btn.type = 'button';
      btn.innerHTML = '<span class="home-card-icon">P</span><span class="home-card-title">Programmazione</span><span class="home-card-text">Database programmi e creazione programma manovia VSL1/VSL2.</span>';
      homeGrid.appendChild(btn);
      btn.addEventListener('click', openProgramming);
    }
  }
  function setVisiblePermission() {
    const top = $('openProgrammingBtn');
    const home = $('homeOpenProgrammingBtn');
    if (top) top.classList.toggle('hidden', !state.canUse);
    if (home) home.classList.toggle('hidden', !state.canUse);
  }
  function bindHideOnOtherNavigation() {
    ['openHomeBtn', 'openAttendanceBtn', 'openPlannedAbsencesBtn', 'openOperatorsBtn', 'openAttendanceAdminBtn', 'homeOpenAttendanceBtn', 'homeOpenPlannedAbsencesBtn', 'homeOpenAttendanceAdminBtn', 'homeOpenOperatorsBtn'].forEach((id) => {
      const el = $(id);
      if (el && el.dataset.boundProgrammingHide !== '1') {
        el.dataset.boundProgrammingHide = '1';
        el.addEventListener('click', () => { const view = $('programmingView'); if (view) view.classList.add('hidden'); }, true);
      }
    });
  }

  function ensureView() {
    const app = $('appSection');
    if (!app || $('programmingView')) return;
    const section = document.createElement('section');
    section.id = 'programmingView';
    section.className = 'view hidden programming-page';
    section.innerHTML = `
      <div class="card programming-hero">
        <div class="rows-top">
          <div>
            <span class="step-badge">Programmazione</span>
            <h2>Programmazione produzione manovie</h2>
            <p>Scegli se consultare il database programmi gia salvati oppure creare un nuovo programma VSL1/VSL2.</p>
          </div>
          <div class="rows-top-right programming-global-actions">
            <button id="programmingGoDatabaseBtn" class="btn btn-secondary" type="button">Database programma</button>
            <button id="programmingGoEditorBtn" class="btn btn-primary" type="button">Crea programma</button>
          </div>
        </div>
        <div id="programmingMessage" class="message hidden" role="alert" aria-live="polite"></div>
      </div>

      <div id="programmingMenuPanel" class="programming-menu-panel">
        <div class="programming-choice-grid">
          <button id="programmingChoiceDatabaseBtn" class="programming-choice-card" type="button">
            <span class="home-card-icon">DB</span><span class="home-card-title">Database programma</span>
            <span class="home-card-text">Visualizza i programmi manovia per giorno o periodo, filtra e scarica la vista filtrata.</span>
          </button>
          <button id="programmingChoiceEditorBtn" class="programming-choice-card programming-choice-primary" type="button">
            <span class="home-card-icon">+</span><span class="home-card-title">Crea programma</span>
            <span class="home-card-text">Apri l editor manovia per VSL1 e VSL2 con riepilogo giornaliero e lookup dal Magazzino Forme.</span>
          </button>
        </div>
      </div>

      <div id="programmingDatabasePanel" class="hidden">
        <div class="card inline-card">
          <div class="rows-top compact-row-top">
            <div><h3>Database programma</h3><p>Filtra i programmi salvati per periodo, linea o articolo e scarica l estrazione corrente.</p></div>
            <div class="rows-top-right"><button id="exportProgrammingDatabaseBtn" class="btn btn-secondary" type="button">Scarica vista Excel</button></div>
          </div>
          <div class="form-grid form-grid-4">
            <div class="field"><label for="programmingDbFromDate">Dal giorno</label><input id="programmingDbFromDate" type="date"></div>
            <div class="field"><label for="programmingDbToDate">Al giorno</label><input id="programmingDbToDate" type="date"></div>
            <div class="field"><label for="programmingDbLineFilter">Linea</label><select id="programmingDbLineFilter"><option value="">Tutte</option><option value="CALZOLERIA 1">VSL1</option><option value="CALZOLERIA 2">VSL2</option></select></div>
            <div class="field"><label for="programmingDbSearchInput">Cerca</label><input id="programmingDbSearchInput" type="text" placeholder="Articolo, forma, note"></div>
          </div>
          <div class="actions toolbar"><button id="loadProgrammingDatabaseBtn" class="btn btn-primary" type="button">Carica database programma</button></div>
          <div id="programmingDatabaseStats" class="summary-box compact"></div>
          <div class="table-wrap"><table class="attendance-table programming-db-table"><thead><tr><th>Data</th><th>Titolo</th><th>Linea</th><th>Articolo</th><th>Codice forma</th><th>Qta forme</th><th>Quantita</th><th>Note</th></tr></thead><tbody id="programmingDatabaseBody"></tbody></table></div>
        </div>
      </div>

      <div id="programmingEditorPanel" class="hidden">
        <div id="formsWarehousePanel" class="card inline-card forms-warehouse-panel hidden">
          <div class="rows-top">
            <div>
              <h3>Magazzino Forme</h3>
              <p>Area admin: il caricamento Excel <strong>sostituisce completamente</strong> il magazzino forme precedente.</p>
            </div>
            <div class="rows-top-right"><button id="downloadFormsTemplateBtn" class="btn btn-secondary" type="button">Scarica template</button><button id="refreshFormsBtn" class="btn btn-secondary" type="button">Aggiorna magazzino</button></div>
          </div>
          <div class="form-grid form-grid-3">
            <div class="field"><label for="formsWarehouseFile">File Excel magazzino forme</label><input id="formsWarehouseFile" type="file" accept=".xlsx,.xls,.csv"></div>
            <div class="field"><label>&nbsp;</label><button id="importFormsWarehouseBtn" class="btn btn-primary btn-block" type="button">Sostituisci magazzino con questo Excel</button></div>
            <div class="field"><label for="formsWarehouseSearch">Cerca forma</label><input id="formsWarehouseSearch" type="text" placeholder="MOD, MOD VAR, COD. MODELLO, forma"></div>
          </div>
          <div id="formsImportStatus" class="message info">Nessun import eseguito in questa sessione. Premi Aggiorna magazzino per leggere i dati presenti sul database.</div>
          <div id="formsWarehouseStats" class="summary-box compact"></div>
          <div class="table-wrap compact-scroll"><table class="attendance-table"><thead><tr><th>MOD</th><th>MOD VAR</th><th>MOD lookup</th><th>COD. MODELLO</th><th>MODELLO FORMA</th><th>TOT</th><th>UBI</th></tr></thead><tbody id="formsWarehouseBody"></tbody></table></div>
        </div>

        <div class="card inline-card programming-controls">
          <div class="form-grid form-grid-4">
            <div class="field"><label for="programmingFromDate">Dal giorno</label><input id="programmingFromDate" type="date"></div>
            <div class="field"><label for="programmingToDate">Al giorno</label><input id="programmingToDate" type="date"></div>
            <div class="field"><label for="programmingTitleInput">Titolo programma</label><input id="programmingTitleInput" type="text" placeholder="Es. Settimana 28 - Manovie"></div>
            <div class="field"><label>&nbsp;</label><button id="programmingGenerateBtn" class="btn btn-primary btn-block" type="button">Apri editor periodo</button></div>
          </div>
        </div>

        <div class="card programming-table-card">
          <div class="rows-top compact-row-top">
            <div><h3>Editor programma manovie</h3><p>Le righe sono sempre ordinate per VSL1 e poi VSL2. Inserisci articolo/MOD VAR/MOD, quantita giornaliere e note.</p></div>
            <div class="rows-top-right"><button id="addVsl1ProgrammingRowBtn" class="btn btn-secondary" type="button">+ Riga VSL1</button><button id="addVsl2ProgrammingRowBtn" class="btn btn-secondary" type="button">+ Riga VSL2</button><button id="saveProgrammingEditorBtn" class="btn btn-primary" type="button">Salva programma</button></div>
          </div>
          <div class="programming-priority">ATT.NE SEGUIRE PRIORITA' TEMI COME DA DIRETTIVE V.SPA</div>
          <div id="programmingTableWrap" class="table-wrap programming-table-wrap"></div>
        </div>
      </div>
    `;
    app.appendChild(section);
  }

  function bind() {
    const actions = {
      programmingGoDatabaseBtn: () => openProgrammingPage('database'),
      programmingGoEditorBtn: () => openProgrammingPage('editor'),
      programmingChoiceDatabaseBtn: () => openProgrammingPage('database'),
      programmingChoiceEditorBtn: () => openProgrammingPage('editor'),
      loadProgrammingDatabaseBtn: loadProgramDatabase,
      exportProgrammingDatabaseBtn: exportProgramDatabase,
      programmingGenerateBtn: generatePeriod,
      addVsl1ProgrammingRowBtn: () => { addRow('CALZOLERIA 1'); renderEditor(); },
      addVsl2ProgrammingRowBtn: () => { addRow('CALZOLERIA 2'); renderEditor(); },
      saveProgrammingEditorBtn: saveProgram,
      importFormsWarehouseBtn: importFormsWarehouse,
      refreshFormsBtn: async () => { await loadFormsWarehouse(true); renderFormsWarehouse(); },
      downloadFormsTemplateBtn: downloadFormsTemplate
    };
    Object.keys(actions).forEach((id) => {
      const el = $(id);
      if (el && el.dataset.boundProgramming !== '1') {
        el.dataset.boundProgramming = '1';
        el.addEventListener('click', actions[id]);
      }
    });
    const formsSearch = $('formsWarehouseSearch');
    if (formsSearch && formsSearch.dataset.boundProgramming !== '1') {
      formsSearch.dataset.boundProgramming = '1';
      formsSearch.addEventListener('input', () => { state.formsSearch = formsSearch.value || ''; renderFormsWarehouse(); });
    }
    ['programmingDbFromDate', 'programmingDbToDate', 'programmingDbLineFilter', 'programmingDbSearchInput'].forEach((id) => {
      const el = $(id);
      if (el && el.dataset.boundProgramming !== '1') {
        el.dataset.boundProgramming = '1';
        el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', () => {
          state.dbFrom = $('programmingDbFromDate')?.value || '';
          state.dbTo = $('programmingDbToDate')?.value || '';
          state.dbLine = $('programmingDbLineFilter')?.value || '';
          state.dbSearch = $('programmingDbSearchInput')?.value || '';
          renderProgramDatabase();
        });
      }
    });
    const wrap = $('programmingTableWrap');
    if (wrap && wrap.dataset.boundProgramming !== '1') {
      wrap.dataset.boundProgramming = '1';
      wrap.addEventListener('input', handleEditorInput);
      wrap.addEventListener('change', handleEditorInput);
      wrap.addEventListener('click', handleEditorClick);
    }
  }

  async function openProgramming() {
    await loadProfile();
    setVisiblePermission();
    if (!state.user) { show($('globalMessage'), 'Effettua il login per accedere alla programmazione.', 'error'); return; }
    if (!state.canUse) { show($('globalMessage'), 'Non sei autorizzato alla sezione Programmazione.', 'error'); return; }
    ensureView(); bind(); switchMainView(); hide($('globalMessage'));
    $('formsWarehousePanel')?.classList.toggle('hidden', !state.isAdmin);
    if ($('programmingFromDate') && !$('programmingFromDate').value) $('programmingFromDate').value = todayIso();
    if ($('programmingToDate') && !$('programmingToDate').value) $('programmingToDate').value = plusDaysIso(todayIso(), 2);
    if ($('programmingDbFromDate') && !$('programmingDbFromDate').value) $('programmingDbFromDate').value = todayIso();
    if ($('programmingDbToDate') && !$('programmingDbToDate').value) $('programmingDbToDate').value = plusDaysIso(todayIso(), 7);
    await loadFormsWarehouse(false);
    openProgrammingPage(state.currentPage || 'menu');
  }
  function switchMainView() {
    ['homeView', 'attendanceView', 'plannedAbsencesView', 'operatorsAdminView', 'attendanceAdminView', 'programmingView'].forEach((id) => {
      const el = $(id); if (el) el.classList.toggle('hidden', id !== 'programmingView');
    });
  }
  function openProgrammingPage(page) {
    state.currentPage = page;
    $('programmingMenuPanel')?.classList.toggle('hidden', page !== 'menu');
    $('programmingDatabasePanel')?.classList.toggle('hidden', page !== 'database');
    $('programmingEditorPanel')?.classList.toggle('hidden', page !== 'editor');
    $('formsWarehousePanel')?.classList.toggle('hidden', page !== 'editor' || !state.isAdmin);
    if (page === 'database') loadProgramDatabase();
    if (page === 'editor') {
      renderFormsWarehouse();
      renderEditor();
    }
  }

  // ===== MAGAZZINO FORME =====
  async function loadFormsWarehouse(showMessage) {
    if (!client) return;
    const all = [];
    let from = 0;
    const size = 1000;
    while (true) {
      const res = await client.from('forms_warehouse').select('*').order('cod_model', { ascending: true }).range(from, from + size - 1);
      if (res.error) {
        state.forms = [];
        if (String(res.error.message || '').includes('does not exist')) show($('programmingMessage'), 'Tabella forms_warehouse non trovata: esegui prima lo script SQL incluso nello zip.', 'error');
        return;
      }
      const chunk = Array.isArray(res.data) ? res.data : [];
      all.push(...chunk);
      if (chunk.length < size) break;
      from += size;
      if (from > 50000) break;
    }
    state.forms = all;
    if (showMessage) show($('formsImportStatus'), `Magazzino letto dal database: ${all.length} righe presenti.`, 'success');
    renderFormsWarehouse();
  }
  function renderFormsWarehouse() {
    const body = $('formsWarehouseBody');
    const stats = $('formsWarehouseStats');
    if (!body || !stats) return;
    const search = norm(state.formsSearch || '');
    const rows = state.forms.filter((r) => !search || norm([r.article_code, r.mod_var, r.mod, r.cod_model, r.model_forma, r.description_forma, r.caubi_codubi, r.catub_descri].join(' ')).includes(search));
    stats.innerHTML = `<div><span>Record database</span><strong>${esc(state.forms.length)}</strong></div><div><span>Risultati filtro</span><strong>${esc(rows.length)}</strong></div><div><span>Visualizzati in tabella</span><strong>${esc(Math.min(rows.length, 500))}</strong></div><div><span>Lookup attivo</span><strong>Articolo / MOD VAR / MOD</strong></div>`;
    body.innerHTML = rows.slice(0, 500).map((r) => `<tr><td>${esc(r.article_code || '-')}</td><td>${esc(r.mod_var || '-')}</td><td>${esc(r.mod || '-')}</td><td>${esc(r.cod_model || '-')}</td><td>${esc(r.model_forma || '-')}</td><td>${esc(r.total_qty ?? '-')}</td><td>${esc([r.caubi_codubi, r.catub_descri].filter(Boolean).join(' - ') || '-')}</td></tr>`).join('') || '<tr><td colspan="7">Nessuna forma trovata.</td></tr>';
  }
  async function ensureXlsxLibrary() {
    if (window.XLSX) return true;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return Boolean(window.XLSX);
  }
  function normalizeHeader(value) { return norm(value).replaceAll('.', '').replaceAll('_', ' ').replace(/\s+/g, ' '); }
  function valueByHeader(row, names) {
    const keys = Object.keys(row || {});
    for (const wanted of names) {
      const exact = keys.find((key) => normalizeHeader(key) === normalizeHeader(wanted));
      if (exact !== undefined) return row[exact];
    }
    return '';
  }
  function mapExcelRow(row) {
    const sizeKeys = ['33', '33/', '34', '34/', '35', '35/', '36', '36/', '37', '37/', '38', '38/', '39', '39/', '40', '40/', '41', '41/', '42'];
    const sizes = {}; sizeKeys.forEach((k) => { sizes[k] = num(valueByHeader(row, [k]), 0); });
    const firstMod = valueByHeader(row, ['MOD']);
    const lookupMod = valueByHeader(row, ['MOD_1', 'MOD 1', 'MOD.1', 'MOD.2', 'MOD 2', 'COD MOD', 'CODICE MOD']);
    const codModel = valueByHeader(row, ['COD. MODELLO', 'COD MODELLO', 'CODICE MODELLO']);
    return {
      article_code: String(firstMod || codModel || '').trim(),
      mod_var: String(valueByHeader(row, ['MOD VAR', 'MODVAR']) || '').trim(),
      mod: String(lookupMod || '').trim(),
      cod_model: String(codModel || firstMod || '').trim(),
      model_forma: String(valueByHeader(row, ['MODELLO FORMA', 'CODICE FORMA']) || '').trim(),
      description_forma: String(valueByHeader(row, ['DESCRIZIONE FORMA', 'DESCRIZIONE']) || '').trim(),
      size_quantities: sizes,
      total_qty: num(valueByHeader(row, ['TOT', 'TOTALE']), 0),
      caubi_codubi: String(valueByHeader(row, ['CAUBI_CODUBI', 'CAUBI CODUBI']) || '').trim(),
      catub_descri: String(valueByHeader(row, ['CATUB_DESCRI', 'CATUB DESCRI']) || '').trim(),
      imported_by: state.user ? state.user.id : null
    };
  }
  async function importFormsWarehouse() {
    hide($('programmingMessage'));
    if (!state.isAdmin) { show($('formsImportStatus'), 'Solo admin puo sostituire il Magazzino Forme.', 'error'); return; }
    const input = $('formsWarehouseFile');
    const file = input && input.files ? input.files[0] : null;
    if (!file) { show($('formsImportStatus'), 'Seleziona un file Excel da importare.', 'error'); return; }
    const ok = confirm('Confermi? Il caricamento sostituira completamente il Magazzino Forme precedente.');
    if (!ok) return;
    const btn = $('importFormsWarehouseBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sostituzione in corso...'; }
    try {
      await ensureXlsxLibrary();
      show($('formsImportStatus'), 'Lettura file Excel in corso...', 'info');
      const data = await file.arrayBuffer();
      const workbook = window.XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const payload = rows.map(mapExcelRow).filter((r) => r.cod_model || r.mod_var || r.mod || r.model_forma);
      if (!payload.length) { show($('formsImportStatus'), 'Nessuna riga valida trovata nel file.', 'error'); return; }
      show($('formsImportStatus'), `File letto: ${payload.length} righe valide. Svuoto il magazzino precedente...`, 'info');
      const del = await client.from('forms_warehouse').delete().not('id', 'is', null);
      if (del.error) throw del.error;
      const chunkSize = 500;
      let inserted = 0;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const res = await client.from('forms_warehouse').insert(chunk);
        if (res.error) throw res.error;
        inserted += chunk.length;
        show($('formsImportStatus'), `Import in corso: ${inserted}/${payload.length} righe inserite...`, 'info');
      }
      await loadFormsWarehouse(false);
      show($('formsImportStatus'), `Magazzino Forme sostituito correttamente: ${inserted} righe caricate. Database attuale: ${state.forms.length} righe.`, 'success');
      show($('programmingMessage'), `Caricamento completato: ${inserted} righe. Il vecchio magazzino e stato sovrascritto.`, 'success');
    } catch (error) {
      show($('formsImportStatus'), error.message || 'Errore durante import Magazzino Forme.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Sostituisci magazzino con questo Excel'; }
    }
  }
  function lookupForm(code) {
    const q = norm(code); if (!q) return null;
    return state.forms.find((item) => [item.article_code, item.cod_model, item.mod_var, item.mod, item.model_forma].some((v) => norm(v) === q))
      || state.forms.find((item) => [item.article_code, item.cod_model, item.mod_var, item.mod, item.model_forma].some((v) => norm(v).includes(q)));
  }
  function applyLookup(row) {
    const found = lookupForm(row.lookup_code || row.article_code);
    if (!found) { row.article_code = row.lookup_code || row.article_code || ''; row.form_code = ''; row.form_qty = ''; row.lookup_ok = false; return false; }
    row.article_code = found.cod_model || found.article_code || row.lookup_code || '';
    row.form_code = found.model_forma || '';
    row.form_qty = found.total_qty ?? '';
    row.lookup_ok = true;
    return true;
  }

  // ===== EDITOR =====
  function newRow(line) {
    const quantities = {}; state.dates.forEach((d) => { quantities[d] = ''; });
    return { tempId: 'tmp_' + Math.random().toString(36).slice(2), line_name: line || 'CALZOLERIA 1', lookup_code: '', article_code: '', form_code: '', form_qty: '', note: '', quantities };
  }
  function ensureRowQuantities(row) {
    const next = { ...row, quantities: { ...(row.quantities || {}) } };
    state.dates.forEach((d) => { if (next.quantities[d] === undefined) next.quantities[d] = ''; });
    Object.keys(next.quantities).forEach((d) => { if (!state.dates.includes(d)) delete next.quantities[d]; });
    return next;
  }
  function addRow(line) { state.rows.push(newRow(line)); sortRows(); }
  function generatePeriod() {
    hide($('programmingMessage'));
    const from = $('programmingFromDate')?.value || '';
    const to = $('programmingToDate')?.value || from;
    const dates = eachDate(from, to);
    if (!dates.length) { show($('programmingMessage'), 'Seleziona un periodo valido. Massimo 31 giorni.', 'error'); return; }
    state.dates = dates;
    state.editorReady = true;
    state.rows = state.rows.length ? state.rows.map(ensureRowQuantities) : [newRow('CALZOLERIA 1'), newRow('CALZOLERIA 2')];
    sortRows(); renderEditor();
  }
  function renderDailySummary() {
    const box = $('programmingDailySummary');
    if (box) box.innerHTML = '';
  }
  function renderEditor() {
    sortRows();
    const wrap = $('programmingTableWrap');
    if (!wrap) return;
    if (!state.editorReady || !state.dates.length) {
      wrap.innerHTML = '<div class="empty-state programming-period-empty"><strong>Seleziona il periodo</strong><span>Scegli dal giorno e al giorno, poi premi “Apri editor periodo”. Se selezioni dal 07/07 al 09/07, l editor mostrera 07/07, 08/07 e 09/07.</span></div>';
      return;
    }
    const dateHeads = state.dates.map((d) => { const f = formatDateHeader(d); return `<th class="date-col"><div>${esc(f.date)}</div><small>${esc(f.weekday)}</small></th>`; }).join('');
    const body = state.rows.map((row, index) => {
      const qCells = state.dates.map((d) => `<td class="qty-day-cell"><input type="number" min="0" step="1" inputmode="numeric" data-row-index="${index}" data-field="qty" data-date="${esc(d)}" value="${esc(row.quantities?.[d] || '')}" placeholder="0"></td>`).join('');
      const lookupClass = row.lookup_ok === false && (row.lookup_code || row.article_code) ? ' lookup-ko' : row.lookup_ok ? ' lookup-ok' : '';
      return `<tr class="program-row ${norm(row.line_name) === 'CALZOLERIA 2' ? 'program-row-vsl2' : 'program-row-vsl1'}">
        <td class="line-cell"><select data-row-index="${index}" data-field="line_name">${PROGRAM_LINES.map((line) => `<option value="${esc(line)}" ${row.line_name === line ? 'selected' : ''}>${esc(LINE_LABEL[line])}</option>`).join('')}</select></td>
        <td class="form-code-cell"><strong>${esc(row.form_code || '-')}</strong>${row.lookup_ok === false ? '<small class="lookup-warning">Non trovato</small>' : ''}</td>
        <td class="form-qty-cell">${esc(row.form_qty || '-')}</td>
        <td class="article-cell"><input class="programming-article-input${lookupClass}" type="text" data-row-index="${index}" data-field="lookup_code" value="${esc(row.lookup_code || row.article_code || '')}" placeholder="Articolo / MOD VAR / MOD"></td>
        ${qCells}
        <td class="note-cell"><textarea data-row-index="${index}" data-field="note" rows="2" placeholder="Nota opzionale">${esc(row.note || '')}</textarea></td>
        <td class="action-cell"><button class="btn btn-danger btn-small" type="button" data-action="delete-row" data-row-index="${index}">Elimina</button></td>
      </tr>`;
    }).join('');
    const subtotalRow = (label, line, cls) => {
      const totals = state.dates.map((d) => `<td class="subtotal-cell">${esc(state.rows.filter((r) => r.line_name === line).reduce((s, r) => s + num(r.quantities?.[d], 0), 0))}</td>`).join('');
      return `<tr class="${cls}"><td colspan="4"><strong>${esc(label)}</strong></td>${totals}<td></td><td></td></tr>`;
    };
    const totalCells = state.dates.map((d) => `<td class="total-cell">${esc(state.rows.reduce((s, r) => s + num(r.quantities?.[d], 0), 0))}</td>`).join('');
    wrap.innerHTML = `<table class="attendance-table programming-table"><thead><tr><th>Linea</th><th>Codice forma</th><th>Qta forme</th><th>Articolo</th>${dateHeads}<th>Note</th><th>Azioni</th></tr></thead><tbody>${body}</tbody><tfoot>${subtotalRow('Parziale VSL1', 'CALZOLERIA 1', 'partial-row partial-vsl1')}${subtotalRow('Parziale VSL2', 'CALZOLERIA 2', 'partial-row partial-vsl2')}<tr class="grand-total-row"><td colspan="4"><strong>Totale generale</strong></td>${totalCells}<td></td><td></td></tr></tfoot></table>`;
  }
  function handleEditorInput(event) {
    const target = event.target; if (!target || target.dataset.rowIndex === undefined) return;
    const index = Number(target.dataset.rowIndex); const row = state.rows[index]; if (!row) return;
    const field = target.dataset.field;
    if (field === 'qty') row.quantities[target.dataset.date] = target.value;
    else row[field] = target.value;
    if (field === 'lookup_code' && event.type === 'change') { applyLookup(row); sortRows(); renderEditor(); return; }
    if (field === 'line_name' && event.type === 'change') { sortRows(); renderEditor(); return; }
    if (field === 'qty') renderDailySummary();
  }
  function handleEditorClick(event) {
    const btn = event.target.closest('button[data-action]'); if (!btn) return;
    if (btn.dataset.action === 'delete-row') { state.rows.splice(Number(btn.dataset.rowIndex), 1); renderEditor(); }
  }
  async function saveProgram() {
    hide($('programmingMessage'));
    if (!state.editorReady || !state.dates.length) { show($('programmingMessage'), 'Prima seleziona il periodo e apri l editor.', 'error'); return; }
    state.rows.forEach(applyLookup); sortRows();
    const validRows = state.rows.filter((r) => r.line_name && (r.lookup_code || r.article_code));
    if (!validRows.length) { show($('programmingMessage'), 'Inserisci almeno una riga con articolo/MOD VAR/MOD.', 'error'); return; }
    try {
      const title = $('programmingTitleInput')?.value || `Programma ${formatDateIT(state.dates[0])} - ${formatDateIT(state.dates[state.dates.length - 1])}`;
      const programRes = await client.from('production_programs').insert({ title, start_date: state.dates[0], end_date: state.dates[state.dates.length - 1], created_by: state.user.id }).select().single();
      if (programRes.error) throw programRes.error;
      const programId = programRes.data.id;
      const dailyRows = [];
      validRows.forEach((r, rowIndex) => {
        state.dates.forEach((d) => {
          dailyRows.push({
            program_id: programId,
            program_title: title,
            production_date: d,
            sort_order: rowIndex + 1,
            line_name: r.line_name,
            lookup_code: r.lookup_code || r.article_code,
            article_code: r.article_code || r.lookup_code,
            form_code: r.form_code || '',
            form_qty: num(r.form_qty, 0),
            quantity: num(r.quantities?.[d], 0),
            note: r.note || '',
            created_by: state.user.id
          });
        });
      });
      const dailyRes = await client.from('production_program_daily_rows').insert(dailyRows);
      if (dailyRes.error) throw dailyRes.error;
      show($('programmingMessage'), `Programma salvato correttamente in formato giornaliero: ${dailyRows.length} righe DATA/CODICI/QUANTITA.`, 'success');
    } catch (error) { show($('programmingMessage'), error.message || 'Errore durante salvataggio programma.', 'error'); }
  }


  // ===== DATABASE PROGRAMMI =====
  async function loadProgramDatabase() {
    if (!client) return;
    hide($('programmingMessage'));
    state.dbFrom = $('programmingDbFromDate')?.value || state.dbFrom || '';
    state.dbTo = $('programmingDbToDate')?.value || state.dbTo || '';
    state.dbLine = $('programmingDbLineFilter')?.value || '';
    state.dbSearch = $('programmingDbSearchInput')?.value || '';
    let query = client.from('production_program_daily_rows').select('*').order('production_date', { ascending: false }).order('line_name', { ascending: true }).order('sort_order', { ascending: true }).limit(5000);
    if (state.dbFrom) query = query.gte('production_date', state.dbFrom);
    if (state.dbTo) query = query.lte('production_date', state.dbTo);
    if (state.dbLine) query = query.eq('line_name', state.dbLine);
    const res = await query;
    if (res.error) { show($('programmingMessage'), res.error.message || 'Errore caricamento database programma.', 'error'); return; }
    state.dbPrograms = [];
    state.dbItems = Array.isArray(res.data) ? res.data : [];
    renderProgramDatabase();
  }
  function filteredDbRows() {
    const search = norm(state.dbSearch || '');
    return state.dbItems.filter((row) => {
      if (state.dbLine && row.line_name !== state.dbLine) return false;
      if (search && !norm([row.program_title, row.production_date, row.line_name, row.article_code, row.lookup_code, row.form_code, row.quantity, row.note].join(' ')).includes(search)) return false;
      return true;
    }).sort((a, b) => String(b.production_date || '').localeCompare(String(a.production_date || '')) || lineOrder(a.line_name) - lineOrder(b.line_name) || (a.sort_order || 0) - (b.sort_order || 0));
  }
  function renderProgramDatabase() {
    const body = $('programmingDatabaseBody'); const stats = $('programmingDatabaseStats'); if (!body || !stats) return;
    const rows = filteredDbRows();
    const programCount = new Set(rows.map((r) => r.program_id).filter(Boolean)).size;
    const totalQty = rows.reduce((sum, r) => sum + num(r.quantity, 0), 0);
    stats.innerHTML = `<div><span>Programmi trovati</span><strong>${esc(programCount)}</strong></div><div><span>Righe DATA/CODICI/QUANTITA</span><strong>${esc(rows.length)}</strong></div><div><span>Quantita totale vista</span><strong>${esc(totalQty)}</strong></div>`;
    body.innerHTML = rows.map((row) => `<tr><td>${esc(formatDateIT(row.production_date))}</td><td>${esc(row.program_title || '-')}</td><td>${esc(LINE_LABEL[row.line_name] || row.line_name || '-')}</td><td>${esc(row.article_code || row.lookup_code || '-')}</td><td>${esc(row.form_code || '-')}</td><td>${esc(row.form_qty ?? '-')}</td><td>${esc(row.quantity ?? 0)}</td><td>${esc(row.note || '-')}</td></tr>`).join('') || '<tr><td colspan="8">Nessun programma trovato con i filtri selezionati.</td></tr>';
  }
  function exportProgramDatabase() {
    const rows = filteredDbRows();
    if (!rows.length) { show($('programmingMessage'), 'Nessuna riga da esportare con i filtri attuali.', 'info'); return; }
    const out = [['DATA', 'TITOLO', 'LINEA', 'ARTICOLO', 'CODICE RICERCA', 'CODICE FORMA', 'QTA FORME', 'QUANTITA', 'NOTE']];
    rows.forEach((row) => out.push([formatDateIT(row.production_date), row.program_title || '', LINE_LABEL[row.line_name] || row.line_name || '', row.article_code || '', row.lookup_code || '', row.form_code || '', row.form_qty ?? '', row.quantity ?? 0, row.note || '']));
    downloadCsv('database_programma_filtrato.csv', out);
  }


  // ===== EXPORT / TEMPLATE =====
  function downloadFormsTemplate() {
    downloadCsv('template_magazzino_forme.csv', [
      ['MOD','MOD VAR','MOD','COD. MODELLO','MODELLO FORMA','DESCRIZIONE FORMA','33','33/','34','34/','35','35/','36','36/','37','37/','38','38/','39','39/','40','40/','41','41/','42','TOT','CAUBI_CODUBI','CATUB_DESCRI'],
      ['1W0S0393YPX','393YPX','393','1W0S0393YPX','FRV877/1','FORMA 2095877/1 FORO BUSS. 28MM',0,0,14,11,23,25,51,49,77,69,102,62,69,44,43,21,24,12,14,710,'MODULA2','MODULA2']
    ]);
  }
  function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell ?? '').replaceAll('"', '""') + '"').join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function init() {
    if (!client) return;
    ensureNavigation(); ensureView(); bind(); bindHideOnOtherNavigation();
    await loadProfile(); setVisiblePermission();
    setTimeout(async () => { await loadProfile(); setVisiblePermission(); }, 1200);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
