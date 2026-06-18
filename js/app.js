console.log('Inserimento Presenze: app.js caricato');

document.addEventListener('DOMContentLoaded', () => {
  InserimentoPresenzeApp.init().catch((error) => {
    console.error('Errore generale init:', error);
  });
});

const InserimentoPresenzeApp = (() => {
  'use strict';

  const STORAGE_KEY = (window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY) || 'inserimento-presenze-state';
  const client = window.AppSupabase ? window.AppSupabase.getClient() : null;

  const STATIONS_BY_LINE = {
    'CALZOLERIA 1': [
      'Assente',
      'Responsabile linea 1',
      'Carico manovia',
      'Premonta',
      'Montaggio manuale',
      'Carico e grattatura strutture',
      'Ribattitura e rimozione chiodi',
      'Sgrossatura e ribattitura',
      'Segno a dima e boetta',
      'Cardatura fine',
      'Incollaggio suola',
      'Incollaggio tomaia',
      'Suolatura',
      'Pulizia',
      'Inchiodatura'
    ],
    'CALZOLERIA 2': [
      'Assente',
      'Responsabile linea 2',
      'Carico manovia',
      'Premonta',
      'Montaggio manuale',
      'Calzera',
      'Carico e grattatura strutture',
      'Ribattitura e rimozione chiodi',
      'Sgrossatura',
      'Segno a dima e boetta',
      'Cardatura fine',
      'Incollaggio suola',
      'Incollaggio tomaia',
      'Suolatura',
      'Pulizia',
      'Inchiodatura'
    ],
    'RIFINITURA 1': [],
    'RIFINITURA 2': [],
    'MAGAZZINO SEMILAVORATI': [],
    'MAGAZZINO SPEDIZIONI': [],
    'CONTROLLO TOMAIA': []
  };

  const state = {
    currentStep: 1,
    activeView: 'setup',
    user: null,
    operators: [],
    setup: {
      lineName: '',
      workDate: '',
      startTime: '',
      endTime: '',
      lunchMin: '0',
      snackMin: '0',
      stopsMin: '0',
      stopsNote: '',
      dayDurationMinutes: 0,
      baseWorkMinutes: 0,
      baseNetMinutes: 0
    },
    rows: []
  };

  const dom = {};

  function initDom() {
    dom.authSection = document.getElementById('authSection');
    dom.appSection = document.getElementById('appSection');
    dom.globalMessage = document.getElementById('globalMessage');
    dom.userBadge = document.getElementById('userBadge');
    dom.logoutBtn = document.getElementById('logoutBtn');

    dom.emailInput = document.getElementById('emailInput');
    dom.passwordInput = document.getElementById('passwordInput');
    dom.loginBtn = document.getElementById('loginBtn');
    dom.authErrors = document.getElementById('authErrors');

    dom.setupView = document.getElementById('setupView');
    dom.rowsView = document.getElementById('rowsView');

    dom.wizardErrors = document.getElementById('wizardErrors');
    dom.rowsErrors = document.getElementById('rowsErrors');

    dom.stepBadge = document.getElementById('stepBadge');
    dom.progressFill = document.getElementById('progressFill');
    dom.step1 = document.getElementById('step1');
    dom.step2 = document.getElementById('step2');
    dom.step3 = document.getElementById('step3');

    dom.lineSelect = document.getElementById('lineSelect');
    dom.workDate = document.getElementById('workDate');
    dom.startTime = document.getElementById('startTime');
    dom.endTime = document.getElementById('endTime');
    dom.lunchMin = document.getElementById('lunchMin');
    dom.snackMin = document.getElementById('snackMin');
    dom.stopsMin = document.getElementById('stopsMin');
    dom.stopsNote = document.getElementById('stopsNote');

    dom.setupSummaryBox = document.getElementById('setupSummaryBox');

    dom.wizardBackBtn = document.getElementById('wizardBackBtn');
    dom.wizardNextBtn = document.getElementById('wizardNextBtn');
    dom.loadOperatorsBtn = document.getElementById('loadOperatorsBtn');

    dom.rowsSetupSummary = document.getElementById('rowsSetupSummary');
    dom.rowCountBadge = document.getElementById('rowCountBadge');

    dom.backToSetupBtn = document.getElementById('backToSetupBtn');
    dom.addOperatorSelect = document.getElementById('addOperatorSelect');
    dom.addOperatorBtn = document.getElementById('addOperatorBtn');
    dom.saveRowsBtn = document.getElementById('saveRowsBtn');
    dom.attendanceTableBody = document.getElementById('attendanceTableBody');

    console.log('Inserimento Presenze: login button trovato =', Boolean(dom.loginBtn));
  }

  async function init() {
    console.log('Inserimento Presenze: init partito');

    initDom();
    bindEvents();
    restoreState();

    if (!window.AppSupabase || !window.AppSupabase.isConfigured()) {
      showBox(dom.authErrors, 'Config Supabase non completata. Compila js/config.js con URL e ANON KEY reali.', 'error');

      if (dom.loginBtn) {
        dom.loginBtn.disabled = true;
      }

      renderSetupForm();
      renderRowsView();
      return;
    }

    const sessionUser = await getAuthenticatedUser();

    if (sessionUser) {
      state.user = sessionUser;
      showAuthenticatedUI();
      await loadOperatorsFromDatabase();
      renderAll();
    } else {
      showLoggedOutUI();
      renderSetupForm();
      renderRowsView();
    }
  }

  function bindEvents() {
    if (dom.loginBtn) {
      dom.loginBtn.addEventListener('click', handleLogin);
    }

    if (dom.logoutBtn) {
      dom.logoutBtn.addEventListener('click', handleLogout);
    }

    if (dom.wizardBackBtn) {
      dom.wizardBackBtn.addEventListener('click', handleWizardBack);
    }

    if (dom.wizardNextBtn) {
      dom.wizardNextBtn.addEventListener('click', handleWizardNext);
    }

    if (dom.loadOperatorsBtn) {
      dom.loadOperatorsBtn.addEventListener('click', handleLoadOperatorsForLine);
    }

    if (dom.backToSetupBtn) {
      dom.backToSetupBtn.addEventListener('click', () => {
        state.activeView = 'setup';
        state.currentStep = 3;
        hideBox(dom.rowsErrors);
        hideBox(dom.globalMessage);
        saveState();
        renderAll();
      });
    }

    if (dom.addOperatorBtn) {
      dom.addOperatorBtn.addEventListener('click', handleAddOperator);
    }

    if (dom.saveRowsBtn) {
      dom.saveRowsBtn.addEventListener('click', handleSaveRows);
    }

    const persistInputs = [
      dom.lineSelect,
      dom.workDate,
      dom.startTime,
      dom.endTime,
      dom.lunchMin,
      dom.snackMin,
      dom.stopsMin,
      dom.stopsNote
    ];

    persistInputs.forEach((element) => {
      if (!element) return;

      const eventType = element.tagName === 'SELECT' ? 'change' : 'input';

      element.addEventListener(eventType, () => {
        readSetupFromForm();
        syncQuickButtons();
        renderSetupSummary();
        renderRowsSetupSummary();

        if (state.rows.length) {
          recalcAllRows();
          renderRowsView();
        }

        saveState();
      });
    });

    document.querySelectorAll('.quick-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.target;
        const value = button.dataset.value;
        const target = document.getElementById(targetId);

        if (!target) return;

        target.value = value;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    if (dom.attendanceTableBody) {
      dom.attendanceTableBody.addEventListener('input', handleRowTableInteraction);
      dom.attendanceTableBody.addEventListener('change', handleRowTableInteraction);
      dom.attendanceTableBody.addEventListener('click', handleRowTableClick);
    }
  }

  async function getAuthenticatedUser() {
    try {
      const response = await client.auth.getSession();

      return response &&
        response.data &&
        response.data.session &&
        response.data.session.user
        ? response.data.session.user
        : null;
    } catch (error) {
      console.error('Errore getSession:', error);
      return null;
    }
  }

  function showAuthenticatedUI() {
    dom.authSection.classList.add('hidden');
    dom.appSection.classList.remove('hidden');

    dom.userBadge.textContent = state.user && state.user.email ? state.user.email : 'Utente autenticato';
    dom.userBadge.classList.remove('hidden');
    dom.logoutBtn.classList.remove('hidden');

    hideBox(dom.authErrors);
  }

  function showLoggedOutUI() {
    dom.authSection.classList.remove('hidden');
    dom.appSection.classList.add('hidden');

    dom.userBadge.textContent = '';
    dom.userBadge.classList.add('hidden');
    dom.logoutBtn.classList.add('hidden');

    hideBox(dom.globalMessage);
  }

  async function handleLogin() {
    console.log('Inserimento Presenze: click login intercettato');

    hideBox(dom.authErrors);
    hideBox(dom.globalMessage);

    const email = (dom.emailInput.value || '').trim();
    const password = dom.passwordInput.value || '';

    if (!email || !password) {
      showBox(dom.authErrors, 'Inserisci email e password.', 'error');
      return;
    }

    dom.loginBtn.disabled = true;
    dom.loginBtn.textContent = 'Accesso in corso...';

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showBox(dom.authErrors, error.message || 'Accesso non riuscito.', 'error');
        return;
      }

      if (!data || !data.user) {
        showBox(dom.authErrors, 'Accesso non riuscito. Utente non disponibile.', 'error');
        return;
      }

      state.user = data.user;

      showAuthenticatedUI();
      await loadOperatorsFromDatabase();
      renderAll();

      showBox(dom.globalMessage, 'Login effettuato con successo.', 'success');

      dom.passwordInput.value = '';
    } catch (error) {
      console.error('Errore login:', error);
      showBox(dom.authErrors, 'Errore inatteso durante il login.', 'error');
    } finally {
      dom.loginBtn.disabled = false;
      dom.loginBtn.textContent = 'Accedi';
    }
  }

  async function handleLogout() {
    try {
      await client.auth.signOut();
    } catch (error) {
      console.error('Errore logout:', error);
    } finally {
      clearState();
      showLoggedOutUI();
      renderSetupForm();
      renderRowsView();
    }
  }

  function handleWizardBack() {
    hideBox(dom.wizardErrors);
    hideBox(dom.globalMessage);

    if (state.currentStep > 1) {
      state.currentStep -= 1;
      saveState();
      renderAll();
    }
  }

  function handleWizardNext() {
    hideBox(dom.wizardErrors);
    hideBox(dom.globalMessage);

    readSetupFromForm();

    const validation = validateStep(state.currentStep);

    if (!validation.ok) {
      showBox(dom.wizardErrors, validation.message, 'error');
      return;
    }

    if (state.currentStep < 3) {
      state.currentStep += 1;
      saveState();
      renderAll();
    }
  }

  async function handleLoadOperatorsForLine() {
    hideBox(dom.wizardErrors);
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    readSetupFromForm();

    const firstValidation = validateStep(1);

    if (!firstValidation.ok) {
      state.currentStep = 1;
      showBox(dom.wizardErrors, firstValidation.message, 'error');
      renderAll();
      return;
    }

    const secondValidation = validateStep(2);

    if (!secondValidation.ok) {
      state.currentStep = 2;
      showBox(dom.wizardErrors, secondValidation.message, 'error');
      renderAll();
      return;
    }

    if (!state.operators.length) {
      await loadOperatorsFromDatabase();
    }

    const selectedLineNorm = normalizeText(state.setup.lineName);

    const filtered = state.operators.filter((operator) => {
      return normalizeText(operator.lineaProduzione) === selectedLineNorm;
    });

    const dbLines = unique(
      state.operators
        .map((operator) => operator.lineaProduzione)
        .filter(Boolean)
    );

    if (!filtered.length) {
      const dbLineText = dbLines.length ? dbLines.join(', ') : 'nessuna linea trovata nel DB';
      showBox(dom.wizardErrors, `Nessun operatore trovato per la linea selezionata. Linee presenti nel DB: ${dbLineText}`, 'error');
      return;
    }

    state.rows = filtered.map((operator, index) => buildAttendanceRow(operator, index));
    state.activeView = 'rows';

    saveState();
    renderAll();

    showBox(dom.globalMessage, `Operatori caricati correttamente: ${state.rows.length}.`, 'success');
  }

  async function handleSaveRows() {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    if (!state.user) {
      showBox(dom.rowsErrors, 'Sessione non valida. Effettua di nuovo il login.', 'error');
      return;
    }

    if (!state.rows.length) {
      showBox(dom.rowsErrors, 'Non ci sono righe da salvare.', 'error');
      return;
    }

    const validation = validateAllRows();

    if (!validation.ok) {
      showBox(dom.rowsErrors, validation.message, 'error');
      return;
    }

    dom.saveRowsBtn.disabled = true;
    dom.saveRowsBtn.textContent = 'Salvataggio in corso...';

    try {
      const sessionPayload = {
        work_date: state.setup.workDate,
        line_name: state.setup.lineName,
        start_time: state.setup.startTime,
        end_time: state.setup.endTime,
        lunch_min: toNonNegativeInt(state.setup.lunchMin),
        snack_min: toNonNegativeInt(state.setup.snackMin),
        stops_min: toNonNegativeInt(state.setup.stopsMin),
        stops_note: state.setup.stopsNote || '',
        base_work_minutes: Number(state.setup.baseWorkMinutes) || 0,
        base_net_minutes: Number(state.setup.baseNetMinutes) || 0,
        created_by: state.user.email || state.user.id
      };

      const upsertResponse = await client
        .from('attendance_sessions')
        .upsert(sessionPayload, {
          onConflict: 'work_date,line_name'
        })
        .select()
        .single();

      if (upsertResponse.error) {
        throw upsertResponse.error;
      }

      const attendanceSession = upsertResponse.data;

      if (!attendanceSession || !attendanceSession.id) {
        throw new Error('Sessione presenze non restituita dal database.');
      }

      const deleteResponse = await client
        .from('attendance_rows')
        .delete()
        .eq('attendance_session_id', attendanceSession.id);

      if (deleteResponse.error) {
        throw deleteResponse.error;
      }

      const rowsPayload = state.rows.map((row, index) => ({
        attendance_session_id: attendanceSession.id,
        operator_id: row.operator_id,
        sort_order: index + 1,
        stabilimento: row.stabilimento || '',
        cognome: row.cognome || '',
        nome: row.nome || '',
        id_operatore: row.id_operatore || '',
        id_cdc: row.id_cdc || '',
        macro_linea_produzione: row.macro_linea_produzione || '',
        line_orig: row.line_orig || '',
        line_day: row.line_day || '',
        postazione: row.postazione || '',
        ore_standard: row.ore_standard === '' ? null : Number(row.ore_standard),
        work_min: Number(row.work_min) || 0,
        evento_min: Number(row.evento_min) || 0,
        assemblea_min: Number(row.assemblea_min) || 0,
        sciopero_min: Number(row.sciopero_min) || 0,
        final_min: Number(row.final_min) || 0,
        dirty: Boolean(row.dirty),
        removed: Boolean(row.removed),
        created_by: state.user.id
      }));

      const insertResponse = await client
        .from('attendance_rows')
        .insert(rowsPayload);

      if (insertResponse.error) {
        throw insertResponse.error;
      }

      state.rows = state.rows.map((row) => ({
        ...row,
        dirty: false
      }));

      saveState();
      renderRowsView();

      showBox(dom.globalMessage, 'Dati salvati correttamente nel database.', 'success');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      showBox(dom.rowsErrors, error.message || 'Errore durante il salvataggio nel database.', 'error');
    } finally {
      dom.saveRowsBtn.disabled = false;
      dom.saveRowsBtn.textContent = 'Salva nel database';
    }
  }

  async function loadOperatorsFromDatabase() {
    if (!client) return;

    try {
      const response = await client
        .from('operators')
        .select('*');

      if (response.error) {
        throw response.error;
      }

      const rawOperators = Array.isArray(response.data) ? response.data : [];

      console.log('Inserimento Presenze: righe operators caricate =', rawOperators.length);

      state.operators = rawOperators
        .map(mapOperatorRow)
        .filter((row) => row.id !== null || row.nome || row.cognome || row.idOperatore);

      const uniqueLines = unique(
        state.operators
          .map((operator) => operator.lineaProduzione)
          .filter(Boolean)
      );

      console.log('Inserimento Presenze: linee trovate negli operators =', uniqueLines);
    } catch (error) {
      console.error('Errore caricamento operators:', error);
      showBox(dom.globalMessage, `Errore caricamento operatori: ${error.message || 'errore sconosciuto'}`, 'error');
      state.operators = [];
    }
  }

  function mapOperatorRow(row) {
    const id = firstDefined(row, ['id', 'ID']);

    const cognome = firstDefined(row, [
      'cognome',
      'last_name',
      'lastname'
    ]) || '';

    const nome = firstDefined(row, [
      'nome',
      'first_name',
      'firstname'
    ]) || '';

    const idOperatore = firstDefined(row, [
      'idOperatore',
      'idoperatore',
      'id_operatore',
      'codice_operatore',
      'codice'
    ]) || '';

    const idCdc = firstDefined(row, [
      'idCdc',
      'idcdc',
      'id_cdc',
      'cdc',
      'centro_di_costo'
    ]) || '';

    const macroLineaProduzione = firstDefined(row, [
      'macroLineaProduzione',
      'macrolineaproduzione',
      'macro_linea_produzione'
    ]) || '';

    const lineaProduzione = firstDefined(row, [
      'lineaProduzione',
      'lineaproduzione',
      'linea_produzione',
      'line_name',
      'linea',
      'line'
    ])?.toString().trim() || '';

    const postazione = firstDefined(row, [
      'postazione',
      'station',
      'stazione'
    ]) || '';

    const oreStandardRaw = firstDefined(row, [
      'oreStandard',
      'orestandard',
      'ore_standard',
      'standard_hours'
    ]);

    const stabilimento = firstDefined(row, [
      'stabilimento',
      'stabilimento_nome'
    ]) || '';

    return {
      id: id !== undefined ? id : null,
      cognome: String(cognome).trim(),
      nome: String(nome).trim(),
      idOperatore: String(idOperatore).trim(),
      idCdc: String(idCdc).trim(),
      macroLineaProduzione: String(macroLineaProduzione).trim(),
      lineaProduzione: String(lineaProduzione).trim(),
      postazione: String(postazione).trim(),
      oreStandard: oreStandardRaw === undefined || oreStandardRaw === null || oreStandardRaw === '' ? '' : Number(oreStandardRaw),
      stabilimento: String(stabilimento).trim()
    };
  }

  function buildAttendanceRow(operator, index) {
    const lineName = state.setup.lineName;
    const stationOptions = getStationOptions(lineName, operator.postazione);
    const initialStation = stationOptions.includes(operator.postazione) ? operator.postazione : (stationOptions[0] || '');

    const workMin = Number(state.setup.baseWorkMinutes) || 0;

    const finalMin = calculateFinalMinutes(
      workMin,
      Number(state.setup.snackMin) || 0,
      Number(state.setup.stopsMin) || 0,
      0,
      0,
      0
    );

    return {
      operator_id: operator.id,
      sort_order: index + 1,
      stabilimento: operator.stabilimento,
      cognome: operator.cognome,
      nome: operator.nome,
      id_operatore: operator.idOperatore,
      id_cdc: operator.idCdc,
      macro_linea_produzione: operator.macroLineaProduzione,
      line_orig: operator.lineaProduzione,
      line_day: lineName,
      postazione: initialStation,
      ore_standard: operator.oreStandard === '' ? '' : Number(operator.oreStandard),
      work_min: workMin,
      evento_min: 0,
      assemblea_min: 0,
      sciopero_min: 0,
      final_min: finalMin,
      dirty: false,
      removed: false
    };
  }

  function handleRowTableInteraction(event) {
    const target = event.target;

    if (!target) return;

    const rowIndex = Number(target.dataset.rowIndex);
    const field = target.dataset.field;

    if (Number.isNaN(rowIndex) || !field || !state.rows[rowIndex]) {
      return;
    }

    const row = state.rows[rowIndex];

    if (field === 'postazione') {
      row.postazione = target.value;
    }

    if (field === 'workHours') {
      row.work_min = hoursStringToMinutes(target.value);
    }

    if (field === 'evento_min') {
      row.evento_min = toNonNegativeInt(target.value);
    }

    if (field === 'assemblea_min') {
      row.assemblea_min = toNonNegativeInt(target.value);
    }

    if (field === 'sciopero_min') {
      row.sciopero_min = toNonNegativeInt(target.value);
    }

    row.final_min = calculateFinalMinutes(
      Number(row.work_min) || 0,
      Number(state.setup.snackMin) || 0,
      Number(state.setup.stopsMin) || 0,
      Number(row.evento_min) || 0,
      Number(row.assemblea_min) || 0,
      Number(row.sciopero_min) || 0
    );

    row.dirty = true;

    saveState();
    renderRowsView();
  }

  function handleRowTableClick(event) {
    const button = event.target.closest('button[data-action]');

    if (!button) return;

    const rowIndex = Number(button.dataset.rowIndex);
    const action = button.dataset.action;

    if (Number.isNaN(rowIndex) || !state.rows[rowIndex]) {
      return;
    }

    if (action === 'duplicate-row') {
      duplicateRow(rowIndex);
      return;
    }

    if (action === 'delete-row') {
      deleteRow(rowIndex);
    }
  }

  function duplicateRow(rowIndex) {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    const source = state.rows[rowIndex];

    const duplicated = {
      ...source,
      sort_order: state.rows.length + 1,
      ore_standard: '',
      work_min: 0,
      evento_min: 0,
      assemblea_min: 0,
      sciopero_min: 0,
      final_min: 0,
      postazione: '',
      dirty: true,
      removed: false
    };

    state.rows.splice(rowIndex + 1, 0, duplicated);

    state.rows = state.rows.map((row, index) => ({
      ...row,
      sort_order: index + 1
    }));

    saveState();
    renderRowsView();

    showBox(dom.globalMessage, 'Riga duplicata. Modifica postazione e ore lavorate della nuova riga.', 'success');
  }

  function deleteRow(rowIndex) {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    state.rows.splice(rowIndex, 1);

    state.rows = state.rows.map((row, index) => ({
      ...row,
      sort_order: index + 1
    }));

    saveState();
    renderRowsView();

    showBox(dom.globalMessage, 'Riga eliminata.', 'success');
  }

  function handleAddOperator() {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    const selectedId = dom.addOperatorSelect ? dom.addOperatorSelect.value : '';

    if (!selectedId) {
      showBox(dom.rowsErrors, 'Seleziona un operatore da aggiungere.', 'error');
      return;
    }

    const operator = state.operators.find((item) => {
      return String(item.id) === String(selectedId);
    });

    if (!operator) {
      showBox(dom.rowsErrors, 'Operatore non trovato nella lista caricata dal database.', 'error');
      return;
    }

    const alreadyPresent = state.rows.some((row) => {
      return String(row.operator_id) === String(operator.id);
    });

    const newRow = buildAttendanceRow(operator, state.rows.length);

    if (alreadyPresent) {
      newRow.ore_standard = '';
      newRow.work_min = 0;
      newRow.final_min = 0;
      newRow.postazione = '';
    }

    newRow.dirty = true;

    state.rows.push(newRow);

    state.rows = state.rows.map((row, index) => ({
      ...row,
      sort_order: index + 1
    }));

    saveState();
    renderRowsView();

    if (dom.addOperatorSelect) {
      dom.addOperatorSelect.value = '';
    }

    showBox(dom.globalMessage, 'Operatore aggiunto correttamente.', 'success');
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.setup.lineName) {
        return {
          ok: false,
          message: 'Seleziona una linea di produzione.'
        };
      }

      return {
        ok: true
      };
    }

    if (step === 2) {
      if (!state.setup.workDate || !state.setup.startTime || !state.setup.endTime) {
        return {
          ok: false,
          message: 'Data, orario di inizio e orario di fine sono obbligatori.'
        };
      }

      const lunchMin = toNonNegativeInt(state.setup.lunchMin);
      const snackMin = toNonNegativeInt(state.setup.snackMin);
      const stopsMin = toNonNegativeInt(state.setup.stopsMin);
      const dayMinutes = minutesBetweenTimes(state.setup.startTime, state.setup.endTime);

      if (!Number.isFinite(dayMinutes) || dayMinutes <= 0) {
        return {
          ok: false,
          message: 'L\'orario di fine deve essere successivo all\'orario di inizio.'
        };
      }

      const baseWorkMinutes = dayMinutes - lunchMin;
      const baseNetMinutes = baseWorkMinutes - snackMin - stopsMin;

      if (baseWorkMinutes < 0) {
        return {
          ok: false,
          message: 'La pausa pranzo non può rendere negative le ore lavorabili.'
        };
      }

      if (baseNetMinutes < 0) {
        return {
          ok: false,
          message: 'Il tempo produttivo netto non può essere negativo.'
        };
      }

      state.setup.dayDurationMinutes = dayMinutes;
      state.setup.baseWorkMinutes = baseWorkMinutes;
      state.setup.baseNetMinutes = baseNetMinutes;

      return {
        ok: true
      };
    }

    return {
      ok: true
    };
  }

  function validateAllRows() {
    const step1 = validateStep(1);

    if (!step1.ok) {
      return step1;
    }

    const step2 = validateStep(2);

    if (!step2.ok) {
      return step2;
    }

    for (let i = 0; i < state.rows.length; i += 1) {
      const row = state.rows[i];

      if ((Number(row.work_min) || 0) < 0) {
        return {
          ok: false,
          message: `Ore lavorate negative alla riga ${i + 1}.`
        };
      }

      if (
        (Number(row.evento_min) || 0) < 0 ||
        (Number(row.assemblea_min) || 0) < 0 ||
        (Number(row.sciopero_min) || 0) < 0
      ) {
        return {
          ok: false,
          message: `Minuti negativi non consentiti alla riga ${i + 1}.`
        };
      }

      if ((Number(row.final_min) || 0) < 0) {
        return {
          ok: false,
          message: `Il tempo finale non può essere negativo alla riga ${i + 1}.`
        };
      }
    }

    return {
      ok: true
    };
  }

  function renderAll() {
    renderSetupForm();
    renderWizard();
    renderSetupSummary();
    renderRowsSetupSummary();
    renderRowsView();
  }

  function renderSetupForm() {
    if (!dom.lineSelect) return;

    dom.lineSelect.value = state.setup.lineName || '';
    dom.workDate.value = state.setup.workDate || '';
    dom.startTime.value = state.setup.startTime || '';
    dom.endTime.value = state.setup.endTime || '';
    dom.lunchMin.value = state.setup.lunchMin || '0';
    dom.snackMin.value = state.setup.snackMin || '0';
    dom.stopsMin.value = state.setup.stopsMin || '0';
    dom.stopsNote.value = state.setup.stopsNote || '';

    syncQuickButtons();
  }

  function renderWizard() {
    const steps = [
      dom.step1,
      dom.step2,
      dom.step3
    ];

    steps.forEach((stepEl, index) => {
      if (!stepEl) return;

      const stepNumber = index + 1;
      stepEl.classList.toggle('hidden', stepNumber !== state.currentStep);
    });

    if (dom.stepBadge) {
      dom.stepBadge.textContent = `Step ${state.currentStep} di 3`;
    }

    if (dom.progressFill) {
      dom.progressFill.style.width = `${(state.currentStep / 3) * 100}%`;
    }

    if (dom.wizardBackBtn) {
      dom.wizardBackBtn.disabled = state.currentStep === 1;
    }

    if (dom.wizardNextBtn) {
      dom.wizardNextBtn.classList.toggle('hidden', state.currentStep === 3);
    }

    if (dom.setupView) {
      dom.setupView.classList.toggle('hidden', state.activeView !== 'setup');
    }

    if (dom.rowsView) {
      dom.rowsView.classList.toggle('hidden', state.activeView !== 'rows');
    }
  }

  function renderSetupSummary() {
    if (!dom.setupSummaryBox) return;

    readSetupFromForm();
    validateStep(2);

    const items = [
      ['Linea', state.setup.lineName || '-'],
      ['Data', state.setup.workDate || '-'],
      ['Inizio', state.setup.startTime || '-'],
      ['Fine', state.setup.endTime || '-'],
      ['Pausa pranzo', `${toNonNegativeInt(state.setup.lunchMin)} min`],
      ['Pausa snack', `${toNonNegativeInt(state.setup.snackMin)} min`],
      ['Fermi', `${toNonNegativeInt(state.setup.stopsMin)} min`],
      ['Nota fermi', state.setup.stopsNote || '-'],
      ['Durata giornata', formatMinutes(state.setup.dayDurationMinutes || 0)],
      ['Ore lavorate base', formatMinutes(state.setup.baseWorkMinutes || 0)],
      ['Tempo netto base', formatMinutes(state.setup.baseNetMinutes || 0)]
    ];

    dom.setupSummaryBox.innerHTML = items.map(([label, value]) => `
      <div class="summary-item">
        <span class="label">${escapeHtml(label)}</span>
        <span class="value">${escapeHtml(value)}</span>
      </div>
    `).join('');
  }

  function renderRowsSetupSummary() {
    if (!dom.rowsSetupSummary) return;

    readSetupFromForm();

    const items = [
      ['Linea', state.setup.lineName || '-'],
      ['Data', state.setup.workDate || '-'],
      ['Inizio', state.setup.startTime || '-'],
      ['Fine', state.setup.endTime || '-'],
      ['Ore lavorate base', formatMinutes(state.setup.baseWorkMinutes || 0)],
      ['Snack', `${toNonNegativeInt(state.setup.snackMin)} min`],
      ['Fermi', `${toNonNegativeInt(state.setup.stopsMin)} min`],
      ['Tempo netto base', formatMinutes(state.setup.baseNetMinutes || 0)]
    ];

    dom.rowsSetupSummary.innerHTML = items.map(([label, value]) => `
      <div class="summary-item">
        <span class="label">${escapeHtml(label)}</span>
        <span class="value">${escapeHtml(value)}</span>
      </div>
    `).join('');
  }

  function renderRowsView() {
    renderAddOperatorSelect();

    if (!dom.rowCountBadge || !dom.attendanceTableBody) return;

    dom.rowCountBadge.textContent = `${state.rows.length} ${state.rows.length === 1 ? 'riga' : 'righe'}`;

    if (!state.rows.length) {
      dom.attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="muted">Nessuna riga caricata. Completa il setup e carica gli operatori della linea.</div>
          </td>
        </tr>
      `;
      return;
    }

    dom.attendanceTableBody.innerHTML = state.rows.map((row, index) => {
      const workHours = minutesToHoursString(row.work_min);
      const finalHours = minutesToHoursString(row.final_min);

      const options = getStationOptions(state.setup.lineName, row.postazione).map((station) => {
        const selected = station === row.postazione ? 'selected' : '';
        return `<option value="${escapeAttribute(station)}" ${selected}>${escapeHtml(station)}</option>`;
      }).join('');

      const operatorLabel = [
        row.cognome,
        row.nome
      ].filter(Boolean).join(' ').trim() || row.id_operatore || 'Operatore';

      const operatorMeta = [
        row.id_operatore ? `ID op: ${row.id_operatore}` : null,
        row.id_cdc ? `CDC: ${row.id_cdc}` : null,
        row.line_orig ? `Linea orig: ${row.line_orig}` : null
      ].filter(Boolean).join(' • ');

      return `
        <tr>
          <td class="cell-operator">
            <div class="operator-name">${escapeHtml(operatorLabel)}</div>
            <div class="operator-meta">${escapeHtml(operatorMeta || '-')}</div>
          </td>

          <td>${row.ore_standard === '' ? '-' : escapeHtml(String(row.ore_standard))}</td>

          <td>
            <input class="table-input" type="number" min="0" step="0.25" inputmode="decimal" value="${escapeAttribute(workHours)}" data-row-index="${index}" data-field="workHours">
          </td>

          <td>
            <input class="table-input" type="number" min="0" step="1" inputmode="numeric" value="${escapeAttribute(String(row.evento_min))}" data-row-index="${index}" data-field="evento_min">
          </td>

          <td>
            <input class="table-input" type="number" min="0" step="1" inputmode="numeric" value="${escapeAttribute(String(row.assemblea_min))}" data-row-index="${index}" data-field="assemblea_min">
          </td>

          <td>
            <input class="table-input" type="number" min="0" step="1" inputmode="numeric" value="${escapeAttribute(String(row.sciopero_min))}" data-row-index="${index}" data-field="sciopero_min">
          </td>

          <td>
            <select class="table-select" data-row-index="${index}" data-field="postazione">
              ${options}
            </select>
          </td>

          <td class="final-cell">
            <div class="final-box">
              <span class="final-main">${escapeHtml(String(row.final_min))} min</span>
              <span class="final-sub">${escapeHtml(finalHours)} h</span>
            </div>
          </td>

          <td class="actions-cell">
            <button class="mini-btn" type="button" data-action="duplicate-row" data-row-index="${index}">Duplica</button>
            <button class="mini-btn danger" type="button" data-action="delete-row" data-row-index="${index}">Elimina</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderAddOperatorSelect() {
    if (!dom.addOperatorSelect) return;

    const selectedLine = normalizeText(state.setup.lineName);

    const operators = state.operators
      .filter((operator) => {
        if (!selectedLine) return true;
        return normalizeText(operator.lineaProduzione) === selectedLine;
      })
      .sort((a, b) => {
        const nameA = `${a.cognome || ''} ${a.nome || ''} ${a.idOperatore || ''}`.trim();
        const nameB = `${b.cognome || ''} ${b.nome || ''} ${b.idOperatore || ''}`.trim();
        return nameA.localeCompare(nameB, 'it');
      });

    const options = operators.map((operator) => {
      const displayName = [
        operator.cognome,
        operator.nome
      ].filter(Boolean).join(' ').trim() || operator.idOperatore || 'Operatore';

      const label = [
        displayName,
        operator.lineaProduzione ? `- ${operator.lineaProduzione}` : ''
      ].filter(Boolean).join(' ');

      return `<option value="${escapeAttribute(String(operator.id))}">${escapeHtml(label)}</option>`;
    }).join('');

    dom.addOperatorSelect.innerHTML = `
      <option value="">Aggiungi operatore...</option>
      ${options}
    `;
  }

  function readSetupFromForm() {
    if (!dom.lineSelect) return;

    state.setup.lineName = dom.lineSelect.value || '';
    state.setup.workDate = dom.workDate.value || '';
    state.setup.startTime = dom.startTime.value || '';
    state.setup.endTime = dom.endTime.value || '';
    state.setup.lunchMin = String(toNonNegativeInt(dom.lunchMin.value || 0));
    state.setup.snackMin = String(toNonNegativeInt(dom.snackMin.value || 0));
    state.setup.stopsMin = String(toNonNegativeInt(dom.stopsMin.value || 0));
    state.setup.stopsNote = dom.stopsNote.value || '';

    const dayMinutes = minutesBetweenTimes(state.setup.startTime, state.setup.endTime);
    const lunchMin = toNonNegativeInt(state.setup.lunchMin);
    const snackMin = toNonNegativeInt(state.setup.snackMin);
    const stopsMin = toNonNegativeInt(state.setup.stopsMin);

    state.setup.dayDurationMinutes = dayMinutes > 0 ? dayMinutes : 0;
    state.setup.baseWorkMinutes = Math.max(state.setup.dayDurationMinutes - lunchMin, 0);
    state.setup.baseNetMinutes = Math.max(state.setup.baseWorkMinutes - snackMin - stopsMin, 0);
  }

  function syncQuickButtons() {
    document.querySelectorAll('.quick-btn').forEach((button) => {
      const targetId = button.dataset.target;
      const value = button.dataset.value;
      const target = document.getElementById(targetId);
      const isActive = Boolean(target) && String(target.value) === String(value);

      button.classList.toggle('is-active', isActive);
    });
  }

  function recalcAllRows() {
    state.rows = state.rows.map((row) => {
      const currentWorkMin = row.work_min === '' || row.work_min === null || row.work_min === undefined
        ? Number(state.setup.baseWorkMinutes) || 0
        : Number(row.work_min) || 0;

      return {
        ...row,
        line_day: state.setup.lineName,
        work_min: currentWorkMin,
        final_min: calculateFinalMinutes(
          currentWorkMin,
          Number(state.setup.snackMin) || 0,
          Number(state.setup.stopsMin) || 0,
          Number(row.evento_min) || 0,
          Number(row.assemblea_min) || 0,
          Number(row.sciopero_min) || 0
        )
      };
    });
  }

  function getStationOptions(lineName, extraStation) {
    const base = Array.isArray(STATIONS_BY_LINE[lineName])
      ? [...STATIONS_BY_LINE[lineName]]
      : [];

    if (extraStation && !base.includes(extraStation)) {
      base.push(extraStation);
    }

    if (!base.length) {
      return extraStation ? [extraStation] : [''];
    }

    return base;
  }

  function calculateFinalMinutes(workMin, snackMin, stopsMin, eventoMin, assembleaMin, scioperoMin) {
    return Math.max(
      (Number(workMin) || 0) -
      (Number(snackMin) || 0) -
      (Number(stopsMin) || 0) -
      (Number(eventoMin) || 0) -
      (Number(assembleaMin) || 0) -
      (Number(scioperoMin) || 0),
      0
    );
  }

  function minutesBetweenTimes(startTime, endTime) {
    if (!startTime || !endTime) return 0;

    const [startHour, startMinute] = String(startTime).split(':').map(Number);
    const [endHour, endMinute] = String(endTime).split(':').map(Number);

    if ([startHour, startMinute, endHour, endMinute].some((n) => Number.isNaN(n))) {
      return 0;
    }

    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }

  function hoursStringToMinutes(value) {
    const number = parseFloat(String(value).replace(',', '.'));

    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }

    return Math.round(number * 60);
  }

  function minutesToHoursString(minutes) {
    const safe = Math.max(Number(minutes) || 0, 0);
    return (safe / 60).toFixed(2);
  }

  function formatMinutes(minutes) {
    const safe = Math.max(Number(minutes) || 0, 0);
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;

    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }

  function toNonNegativeInt(value) {
    const number = parseInt(value, 10);

    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }

    return number;
  }

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function unique(items) {
    return [...new Set(items)];
  }

  function firstDefined(row, keys) {
    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(row, key) &&
        row[key] !== undefined &&
        row[key] !== null
      ) {
        return row[key];
      }
    }

    return undefined;
  }

  function saveState() {
    const persistData = {
      currentStep: state.currentStep,
      activeView: state.activeView,
      setup: state.setup,
      rows: state.rows
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistData));
  }

  function restoreState() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);

      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== 'object') return;

      state.currentStep = clampStep(parsed.currentStep);
      state.activeView = parsed.activeView === 'rows' ? 'rows' : 'setup';

      if (parsed.setup && typeof parsed.setup === 'object') {
        state.setup = {
          ...state.setup,
          ...parsed.setup
        };
      }

      if (Array.isArray(parsed.rows)) {
        state.rows = parsed.rows.map((row, index) => ({
          sort_order: index + 1,
          operator_id: row.operator_id ?? null,
          stabilimento: row.stabilimento || '',
          cognome: row.cognome || '',
          nome: row.nome || '',
          id_operatore: row.id_operatore || '',
          id_cdc: row.id_cdc || '',
          macro_linea_produzione: row.macro_linea_produzione || '',
          line_orig: row.line_orig || '',
          line_day: row.line_day || '',
          postazione: row.postazione || '',
          ore_standard: row.ore_standard === '' || row.ore_standard === null || row.ore_standard === undefined ? '' : Number(row.ore_standard),
          work_min: Number(row.work_min) || 0,
          evento_min: Number(row.evento_min) || 0,
          assemblea_min: Number(row.assemblea_min) || 0,
          sciopero_min: Number(row.sciopero_min) || 0,
          final_min: Number(row.final_min) || 0,
          dirty: Boolean(row.dirty),
          removed: Boolean(row.removed)
        }));
      }
    } catch (error) {
      console.error('Errore restore state:', error);
    }
  }

  function clearState() {
    sessionStorage.removeItem(STORAGE_KEY);

    state.currentStep = 1;
    state.activeView = 'setup';
    state.user = null;
    state.operators = [];
    state.setup = {
      lineName: '',
      workDate: '',
      startTime: '',
      endTime: '',
      lunchMin: '0',
      snackMin: '0',
      stopsMin: '0',
      stopsNote: '',
      dayDurationMinutes: 0,
      baseWorkMinutes: 0,
      baseNetMinutes: 0
    };
    state.rows = [];

    hideBox(dom.authErrors);
    hideBox(dom.wizardErrors);
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    if (dom.emailInput) {
      dom.emailInput.value = '';
    }

    if (dom.passwordInput) {
      dom.passwordInput.value = '';
    }
  }

  function clampStep(step) {
    const number = Number(step);

    if (Number.isNaN(number) || number < 1) {
      return 1;
    }

    if (number > 3) {
      return 3;
    }

    return number;
  }

  function showBox(element, message, type) {
    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
  }

  function hideBox(element) {
    if (!element) return;

    element.textContent = '';
    element.className = 'message hidden';
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  return {
    init
  };
})();
