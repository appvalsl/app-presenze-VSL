/* ===== PROGRAMMAZIONE PRODUZIONE MANOVIE + MAGAZZINO FORME ===== */
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
  const DATE_FMT = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const state = {
    user: null,
    profile: null,
    canUse: false,
    isAdmin: false,
    dates: [],
    programId: null,
    rows: [],
    forms: [],
    search: ''
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

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function plusDaysIso(iso, days) {
    const d = new Date(String(iso) + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function eachDate(from, to) {
    const out = [];
    const start = new Date(String(from) + 'T00:00:00');
    const end = new Date(String(to) + 'T00:00:00');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return out;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
      if (out.length > 31) break;
    }
    return out;
  }

  function formatDateHeader(iso) {
    const d = new Date(String(iso) + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    const parts = DATE_FMT.formatToParts(d);
    const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    return { date: `${day}/${month}/${year}`, weekday: weekday.toUpperCase() };
  }

  async function loadProfile() {
    if (!client) return;
    const session = await client.auth.getSession();
    state.user = session && session.data && session.data.session ? session.data.session.user : null;
    if (!state.user) {
      state.profile = null;
      state.canUse = false;
      state.isAdmin = false;
      return;
    }
    const res = await client.from('app_users').select('*').eq('user_id', state.user.id).maybeSingle();
    state.profile = res.data || { role: 'user', is_active: true, can_manage_operators: false };
    const role = norm(state.profile.role);
    state.isAdmin = state.profile.is_active !== false && (state.profile.can_manage_operators === true || role === 'ADMIN' || role === 'SUPERADMIN');
    state.canUse = state.isAdmin || state.profile.can_manage_programming === true || role === 'PROGRAMMAZIONE' || role === 'PLANNER' || role === 'KEY_USER' || role === 'SUPER_USER';
  }

  function setVisiblePermission() {
    const top = $('openProgrammingBtn');
    const home = $('homeOpenProgrammingBtn');
    if (top) top.classList.toggle('hidden', !state.canUse);
    if (home) home.classList.toggle('hidden', !state.canUse);
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
      btn.innerHTML = '<span class="home-card-icon">P</span><span class="home-card-title">Programmazione</span><span class="home-card-text">Crea il programma produzione delle manovie e collega automaticamente codice forma e quantità dal magazzino forme.</span>';
      homeGrid.appendChild(btn);
      btn.addEventListener('click', openProgramming);
    }
  }


  function bindHideOnOtherNavigation() {
    const ids = [
      'openHomeBtn', 'openAttendanceBtn', 'openPlannedAbsencesBtn', 'openOperatorsBtn', 'openAttendanceAdminBtn',
      'homeOpenAttendanceBtn', 'homeOpenPlannedAbsencesBtn', 'homeOpenAttendanceAdminBtn', 'homeOpenOperatorsBtn'
    ];
    ids.forEach((id) => {
      const el = $(id);
      if (el && el.dataset.boundProgrammingHide !== '1') {
        el.dataset.boundProgrammingHide = '1';
        el.addEventListener('click', () => {
          const view = $('programmingView');
          if (view) view.classList.add('hidden');
        }, true);
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
            <span class="step-badge">Nuova area</span>
            <h2>Programmazione produzione manovie</h2>
            <p>Seleziona giorno o periodo, popola Calzoleria 1 e Calzoleria 2, inserisci articolo/modello/mod-var e lascia che l'app recuperi automaticamente codice forma e quantità forma dal Magazzino Forme.</p>
          </div>
          <div class="rows-top-right">
            <button id="programmingReloadBtn" class="btn btn-secondary" type="button">Ricarica dati</button>
            <button id="programmingSaveBtn" class="btn btn-primary" type="button">Salva programma</button>
          </div>
        </div>
        <div id="programmingMessage" class="message hidden" role="alert" aria-live="polite"></div>
      </div>

      <div class="card inline-card programming-controls">
        <div class="form-grid form-grid-4">
          <div class="field"><label for="programmingFromDate">Dal giorno</label><input id="programmingFromDate" type="date"></div>
          <div class="field"><label for="programmingToDate">Al giorno</label><input id="programmingToDate" type="date"></div>
          <div class="field"><label for="programmingTitleInput">Titolo programma</label><input id="programmingTitleInput" type="text" placeholder="Es. Settimana 28 - Manovie"></div>
          <div class="field"><label>&nbsp;</label><button id="programmingGenerateBtn" class="btn btn-primary btn-block" type="button">Apri tabella periodo</button></div>
        </div>
      </div>

      <div id="formsWarehousePanel" class="card inline-card forms-warehouse-panel hidden">
        <div class="rows-top">
          <div>
            <h3>Magazzino Forme</h3>
            <p>Area admin: importa il file Excel con colonne MOD, MOD VAR, MOD, COD. MODELLO, MODELLO FORMA, DESCRIZIONE FORMA, taglie, TOT, CAUBI_CODUBI e CATUB_DESCRI.</p>
          </div>
          <div class="rows-top-right">
            <button id="downloadFormsTemplateBtn" class="btn btn-secondary" type="button">Scarica template</button>
            <button id="refreshFormsBtn" class="btn btn-secondary" type="button">Aggiorna magazzino</button>
          </div>
        </div>
        <div class="form-grid form-grid-3">
          <div class="field"><label for="formsWarehouseFile">File Excel magazzino forme</label><input id="formsWarehouseFile" type="file" accept=".xlsx,.xls,.csv"></div>
          <div class="field"><label>&nbsp;</label><button id="importFormsWarehouseBtn" class="btn btn-primary btn-block" type="button">Importa / aggiorna magazzino</button></div>
          <div class="field"><label for="formsWarehouseSearch">Cerca forma</label><input id="formsWarehouseSearch" type="text" placeholder="MOD, MOD VAR, COD. MODELLO, forma"></div>
        </div>
        <div id="formsWarehouseStats" class="summary-box compact"></div>
        <div class="table-wrap compact-scroll"><table class="attendance-table"><thead><tr><th>MOD</th><th>MOD VAR</th><th>COD. MODELLO</th><th>MODELLO FORMA</th><th>DESCRIZIONE</th><th>TOT</th><th>UBI</th></tr></thead><tbody id="formsWarehouseBody"></tbody></table></div>
      </div>

      <div class="card programming-table-card">
        <div class="rows-top compact-row-top">
          <div>
            <h3>Programma manovie</h3>
            <p>Scrivi il codice articolo, il codice MOD VAR oppure il codice modello. Il sistema cerca nel Magazzino Forme e compila Codice forma e Quantità forma.</p>
          </div>
          <div class="rows-top-right">
            <button id="addProgrammingRowBtn" class="btn btn-secondary" type="button">+ Riga</button>
            <button id="exportProgrammingExcelBtn" class="btn btn-secondary" type="button">Esporta Excel</button>
          </div>
        </div>
        <div class="programming-priority">ATT.NE SEGUIRE PRIORITA' TEMI COME DA DIRETTIVE V.SPA</div>
        <div id="programmingTableWrap" class="table-wrap programming-table-wrap"></div>
      </div>
    `;
    app.appendChild(section);
  }

  function switchView() {
    ['homeView', 'attendanceView', 'plannedAbsencesView', 'operatorsAdminView', 'attendanceAdminView', 'programmingView'].forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle('hidden', id !== 'programmingView');
    });
  }

  function bind() {
    const map = {
      programmingGenerateBtn: generatePeriod,
      programmingReloadBtn: reloadProgrammingData,
      programmingSaveBtn: saveProgram,
      addProgrammingRowBtn: () => { addRow(); renderProgramTable(); },
      importFormsWarehouseBtn: importFormsWarehouse,
      refreshFormsBtn: loadFormsWarehouse,
      downloadFormsTemplateBtn: downloadFormsTemplate,
      exportProgrammingExcelBtn: exportProgramExcel
    };
    Object.keys(map).forEach((id) => {
      const el = $(id);
      if (el && el.dataset.boundProgramming !== '1') {
        el.dataset.boundProgramming = '1';
        el.addEventListener('click', map[id]);
      }
    });
    const search = $('formsWarehouseSearch');
    if (search && search.dataset.boundProgramming !== '1') {
      search.dataset.boundProgramming = '1';
      search.addEventListener('input', () => { state.search = search.value || ''; renderFormsWarehouse(); });
    }
    const wrap = $('programmingTableWrap');
    if (wrap && wrap.dataset.boundProgramming !== '1') {
      wrap.dataset.boundProgramming = '1';
      wrap.addEventListener('input', handleTableInput);
      wrap.addEventListener('change', handleTableInput);
      wrap.addEventListener('click', handleTableClick);
    }
  }

  async function openProgramming() {
    await loadProfile();
    setVisiblePermission();
    if (!state.user) { show($('globalMessage'), 'Effettua il login per accedere alla programmazione.', 'error'); return; }
    if (!state.canUse) { show($('globalMessage'), 'Non sei autorizzato alla sezione Programmazione.', 'error'); return; }
    ensureView();
    bind();
    switchView();
    hide($('globalMessage'));
    $('formsWarehousePanel')?.classList.toggle('hidden', !state.isAdmin);
    if ($('programmingFromDate') && !$('programmingFromDate').value) $('programmingFromDate').value = todayIso();
    if ($('programmingToDate') && !$('programmingToDate').value) $('programmingToDate').value = plusDaysIso(todayIso(), 2);
    await reloadProgrammingData();
    if (!state.dates.length) generatePeriod();
  }

  async function reloadProgrammingData() {
    await loadFormsWarehouse();
    renderProgramTable();
  }

  function generatePeriod() {
    hide($('programmingMessage'));
    const from = $('programmingFromDate')?.value || '';
    const to = $('programmingToDate')?.value || from;
    const dates = eachDate(from, to);
    if (!dates.length) { show($('programmingMessage'), 'Seleziona un periodo valido. Massimo 31 giorni.', 'error'); return; }
    state.dates = dates;
    const existing = state.rows.length ? state.rows : [];
    state.rows = existing.length ? existing.map((r) => ensureRowQuantities(r)) : [newRow('CALZOLERIA 1'), newRow('CALZOLERIA 2')];
    renderProgramTable();
  }

  function newRow(line) {
    const quantities = {};
    state.dates.forEach((d) => { quantities[d] = ''; });
    return {
      tempId: 'tmp_' + Math.random().toString(36).slice(2),
      line_name: line || 'CALZOLERIA 1',
      lookup_code: '',
      article_code: '',
      form_code: '',
      form_qty: '',
      note: '',
      quantities
    };
  }

  function ensureRowQuantities(row) {
    const next = { ...row, quantities: { ...(row.quantities || {}) } };
    state.dates.forEach((d) => { if (next.quantities[d] === undefined) next.quantities[d] = ''; });
    Object.keys(next.quantities).forEach((d) => { if (!state.dates.includes(d)) delete next.quantities[d]; });
    return next;
  }

  function addRow(line) {
    state.rows.push(newRow(line || 'CALZOLERIA 1'));
  }

  function lookupForm(code) {
    const q = norm(code);
    if (!q) return null;
    return state.forms.find((item) => {
      return [item.article_code, item.mod_var, item.mod, item.cod_model, item.model_forma].some((value) => norm(value) === q);
    }) || state.forms.find((item) => {
      return [item.article_code, item.mod_var, item.mod, item.cod_model, item.model_forma].some((value) => norm(value).includes(q));
    }) || null;
  }

  function applyLookup(row) {
    const found = lookupForm(row.lookup_code || row.article_code);
    if (!found) {
      row.article_code = row.lookup_code || row.article_code || '';
      row.form_code = '';
      row.form_qty = '';
      return false;
    }
    row.article_code = found.cod_model || found.article_code || row.lookup_code || '';
    row.form_code = found.model_forma || '';
    row.form_qty = found.total_qty ?? '';
    return true;
  }

  function renderProgramTable() {
    const wrap = $('programmingTableWrap');
    if (!wrap) return;
    if (!state.dates.length) {
      wrap.innerHTML = '<div class="empty-state">Seleziona un giorno o un periodo e premi “Apri tabella periodo”.</div>';
      return;
    }
    const dateHeads = state.dates.map((d) => {
      const f = formatDateHeader(d);
      return `<th class="date-col"><div>${esc(f.date)}</div><small>${esc(f.weekday)}</small></th>`;
    }).join('');
    const body = state.rows.map((row, index) => {
      const qCells = state.dates.map((d) => `<td class="qty-day-cell"><input type="number" min="0" step="1" inputmode="numeric" data-row-index="${index}" data-field="qty" data-date="${esc(d)}" value="${esc(row.quantities?.[d] || '')}" placeholder="0"></td>`).join('');
      return `<tr>
        <td class="line-cell"><select data-row-index="${index}" data-field="line_name">${PROGRAM_LINES.map((line) => `<option value="${esc(line)}" ${row.line_name === line ? 'selected' : ''}>${esc(line.replace('CALZOLERIA', 'VSL'))}</option>`).join('')}</select></td>
        <td class="form-code-cell"><strong>${esc(row.form_code || '-')}</strong></td>
        <td class="form-qty-cell">${esc(row.form_qty || '-')}</td>
        <td class="article-cell"><input class="programming-article-input" type="text" data-row-index="${index}" data-field="lookup_code" value="${esc(row.lookup_code || row.article_code || '')}" placeholder="Articolo / MOD VAR / MOD"></td>
        ${qCells}
        <td class="note-cell"><textarea data-row-index="${index}" data-field="note" rows="2" placeholder="Nota opzionale">${esc(row.note || '')}</textarea></td>
        <td class="action-cell"><button class="btn btn-danger btn-small" type="button" data-action="delete-row" data-row-index="${index}">Elimina</button></td>
      </tr>`;
    }).join('');
    const totals = state.dates.map((d) => {
      const total = state.rows.reduce((sum, row) => sum + num(row.quantities?.[d], 0), 0);
      return `<td class="total-cell">${esc(total)}</td>`;
    }).join('');
    wrap.innerHTML = `<table class="attendance-table programming-table">
      <thead><tr><th>Linea</th><th>Codice forma</th><th>Qta forme</th><th>Articolo</th>${dateHeads}<th>Note</th><th>Azioni</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td><strong>Totale</strong></td><td></td><td></td><td></td>${totals}<td></td><td></td></tr></tfoot>
    </table>`;
  }

  function handleTableInput(event) {
    const target = event.target;
    if (!target || target.dataset.rowIndex === undefined) return;
    const index = Number(target.dataset.rowIndex);
    const row = state.rows[index];
    if (!row) return;
    const field = target.dataset.field;
    if (field === 'qty') row.quantities[target.dataset.date] = target.value;
    else row[field] = target.value;
    if (field === 'lookup_code' && event.type === 'change') {
      applyLookup(row);
      renderProgramTable();
    }
    if (field === 'line_name') renderProgramTable();
  }

  function handleTableClick(event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'delete-row') {
      const index = Number(btn.dataset.rowIndex);
      state.rows.splice(index, 1);
      renderProgramTable();
    }
  }

  async function loadFormsWarehouse() {
    if (!client) return;
    const res = await client.from('forms_warehouse').select('*').order('cod_model', { ascending: true }).limit(5000);
    if (res.error) {
      state.forms = [];
      if (String(res.error.message || '').includes('does not exist')) {
        show($('programmingMessage'), 'Tabella forms_warehouse non trovata: esegui prima il file SQL incluso nello zip.', 'error');
      }
      return;
    }
    state.forms = Array.isArray(res.data) ? res.data : [];
    renderFormsWarehouse();
  }

  function renderFormsWarehouse() {
    const body = $('formsWarehouseBody');
    const stats = $('formsWarehouseStats');
    if (!body || !stats) return;
    const search = norm(state.search || '');
    const rows = state.forms.filter((r) => !search || norm([r.article_code, r.mod_var, r.mod, r.cod_model, r.model_forma, r.description_forma, r.caubi_codubi, r.catub_descri].join(' ')).includes(search)).slice(0, 350);
    stats.innerHTML = `<div><span>Record caricati</span><strong>${esc(state.forms.length)}</strong></div><div><span>Visualizzati</span><strong>${esc(rows.length)}</strong></div><div><span>Uso lookup</span><strong>Articolo / MOD VAR / MOD</strong></div>`;
    body.innerHTML = rows.length ? rows.map((r) => `<tr><td>${esc(r.article_code || r.mod || '-')}</td><td>${esc(r.mod_var || '-')}</td><td>${esc(r.cod_model || '-')}</td><td>${esc(r.model_forma || '-')}</td><td>${esc(r.description_forma || '-')}</td><td>${esc(r.total_qty ?? '-')}</td><td>${esc([r.caubi_codubi, r.catub_descri].filter(Boolean).join(' - ') || '-')}</td></tr>`).join('') : '<tr><td colspan="7">Nessuna forma trovata.</td></tr>';
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

  function normalizeHeader(value) {
    return norm(value).replaceAll('.', '').replaceAll('_', ' ').replace(/\s+/g, ' ');
  }

  function valueByHeader(row, possibilities) {
    const keys = Object.keys(row || {});
    for (const wanted of possibilities) {
      const found = keys.find((key) => normalizeHeader(key) === normalizeHeader(wanted));
      if (found !== undefined) return row[found];
    }
    return '';
  }

  function mapExcelRow(row) {
    const sizeKeys = ['33', '33/', '34', '34/', '35', '35/', '36', '36/', '37', '37/', '38', '38/', '39', '39/', '40', '40/', '41', '41/', '42'];
    const sizes = {};
    sizeKeys.forEach((k) => { sizes[k] = num(valueByHeader(row, [k]), 0); });
    const firstMod = valueByHeader(row, ['MOD']);
    const payload = {
      article_code: String(firstMod || '').trim(),
      mod_var: String(valueByHeader(row, ['MOD VAR', 'MODVAR']) || '').trim(),
      mod: String(valueByHeader(row, ['MOD.2', 'MOD 2', 'COD MOD', 'CODICE MOD', 'MODELLO']) || '').trim(),
      cod_model: String(valueByHeader(row, ['COD. MODELLO', 'COD MODELLO', 'CODICE MODELLO']) || firstMod || '').trim(),
      model_forma: String(valueByHeader(row, ['MODELLO FORMA', 'CODICE FORMA']) || '').trim(),
      description_forma: String(valueByHeader(row, ['DESCRIZIONE FORMA', 'DESCRIZIONE']) || '').trim(),
      size_quantities: sizes,
      total_qty: num(valueByHeader(row, ['TOT', 'TOTALE']), 0),
      caubi_codubi: String(valueByHeader(row, ['CAUBI_CODUBI', 'CAUBI CODUBI', 'CAUBI_CODUBI', 'CAUBI_CODUBI']) || '').trim(),
      catub_descri: String(valueByHeader(row, ['CATUB_DESCRI', 'CATUB DESCRI']) || '').trim(),
      imported_by: state.user ? state.user.id : null,
      updated_at: new Date().toISOString()
    };
    if (!payload.mod) payload.mod = String(valueByHeader(row, ['MOD_1', 'MOD 1']) || '').trim();
    return payload;
  }

  async function importFormsWarehouse() {
    hide($('programmingMessage'));
    if (!state.isAdmin) { show($('programmingMessage'), 'Solo admin può importare il Magazzino Forme.', 'error'); return; }
    const input = $('formsWarehouseFile');
    const file = input && input.files ? input.files[0] : null;
    if (!file) { show($('programmingMessage'), 'Seleziona un file Excel o CSV da importare.', 'error'); return; }
    try {
      await ensureXlsxLibrary();
      const data = await file.arrayBuffer();
      const workbook = window.XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const payload = rows.map(mapExcelRow).filter((r) => r.cod_model || r.mod_var || r.model_forma);
      if (!payload.length) { show($('programmingMessage'), 'Nessuna riga valida trovata nel file.', 'error'); return; }
      const chunkSize = 500;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const res = await client.from('forms_warehouse').upsert(chunk, { onConflict: 'cod_model,mod_var,model_forma,caubi_codubi' });
        if (res.error) throw res.error;
      }
      await loadFormsWarehouse();
      show($('programmingMessage'), `Magazzino Forme importato correttamente: ${payload.length} righe.`, 'success');
    } catch (error) {
      show($('programmingMessage'), error.message || 'Errore durante import Magazzino Forme.', 'error');
    }
  }

  async function saveProgram() {
    hide($('programmingMessage'));
    if (!state.dates.length) { show($('programmingMessage'), 'Prima seleziona il periodo.', 'error'); return; }
    state.rows.forEach(applyLookup);
    const validRows = state.rows.filter((r) => r.line_name && (r.article_code || r.lookup_code));
    if (!validRows.length) { show($('programmingMessage'), 'Inserisci almeno una riga con articolo/modello/mod-var.', 'error'); return; }
    try {
      const programPayload = {
        title: $('programmingTitleInput')?.value || `Programma ${state.dates[0]} - ${state.dates[state.dates.length - 1]}`,
        start_date: state.dates[0],
        end_date: state.dates[state.dates.length - 1],
        created_by: state.user.id,
        updated_at: new Date().toISOString()
      };
      const programRes = await client.from('production_programs').insert(programPayload).select().single();
      if (programRes.error) throw programRes.error;
      const programId = programRes.data.id;
      const items = validRows.map((r, index) => ({
        program_id: programId,
        sort_order: index + 1,
        line_name: r.line_name,
        lookup_code: r.lookup_code || r.article_code,
        article_code: r.article_code || r.lookup_code,
        form_code: r.form_code || '',
        form_qty: num(r.form_qty, 0),
        quantities_by_date: r.quantities || {},
        note: r.note || '',
        created_by: state.user.id
      }));
      const itemsRes = await client.from('production_program_items').insert(items);
      if (itemsRes.error) throw itemsRes.error;
      state.programId = programId;
      renderProgramTable();
      show($('programmingMessage'), 'Programma produzione salvato correttamente.', 'success');
    } catch (error) {
      show($('programmingMessage'), error.message || 'Errore durante salvataggio programma.', 'error');
    }
  }

  function downloadFormsTemplate() {
    const rows = [
      ['MOD','MOD VAR','MOD','COD. MODELLO','MODELLO FORMA','DESCRIZIONE FORMA','33','33/','34','34/','35','35/','36','36/','37','37/','38','38/','39','39/','40','40/','41','41/','42','TOT','CAUBI_CODUBI','CATUB_DESCRI'],
      ['1W0S0393YPX','393YPX','393','1W0S0393YPX','FRV877/1','FORMA 2095877/1 FORO BUSS. 28MM',0,0,14,11,23,25,51,49,77,69,102,62,69,44,43,21,24,12,14,710,'MODULA2','MODULA2']
    ];
    downloadCsv('template_magazzino_forme.csv', rows);
  }

  function exportProgramExcel() {
    if (!state.dates.length) return;
    const headers = ['LINEA', 'CODICE FORMA', 'QTA FORME', 'ARTICOLO'].concat(state.dates.map((d) => formatDateHeader(d).date)).concat(['NOTE']);
    const rows = [headers].concat(state.rows.map((r) => [r.line_name, r.form_code, r.form_qty, r.article_code || r.lookup_code].concat(state.dates.map((d) => r.quantities?.[d] || '')).concat([r.note || ''])));
    rows.push(['TOTALE', '', '', ''].concat(state.dates.map((d) => state.rows.reduce((s, r) => s + num(r.quantities?.[d], 0), 0))).concat(['']));
    downloadCsv('programma_manovie.csv', rows);
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map((cell) => '"' + String(cell ?? '').replaceAll('"', '""') + '"').join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function init() {
    if (!client) return;
    ensureNavigation();
    ensureView();
    bind();
    bindHideOnOtherNavigation();
    await loadProfile();
    setVisiblePermission();
    setTimeout(async () => { await loadProfile(); setVisiblePermission(); }, 1200);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
