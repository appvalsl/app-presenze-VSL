console.log("APP AVVIATA - fix lavorazioni 2026-07-03");

const InserimentoPresenzeApp = (() => {
  "use strict";

  const STORAGE_KEY =
    window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY
      ? window.APP_CONFIG.STORAGE_KEY
      : "inserimento-presenze-state";

  const client =
    window.AppSupabase && typeof window.AppSupabase.getClient === "function"
      ? window.AppSupabase.getClient()
      : window.supabase.createClient(
          window.APP_CONFIG.SUPABASE_URL,
          window.APP_CONFIG.SUPABASE_ANON_KEY
        );

  const STATIONS_BY_LINE = {
    "CALZOLERIA 1": [
        "Assente",
        "Responsabile linea 1",
        "Carico manovia",
        "Premonta",
        "Montaggio manuale",
        "Calzera",
        "Carico e grattatura strutture",
        "Ribattitura e rimozione chiodi",
        "Sgrossatura e ribattitura",
        "Segno a dima e boetta",
        "Cardatura fine",
        "Incollaggio suola",
        "Incollaggio tomaia",
        "Suolatura",
        "Pulizia",
        "Inchiodatura"
    ],
    "CALZOLERIA 2": [
        "Assente",
        "Responsabile linea 2",
        "Carico manovia",
        "Premonta",
        "Montaggio manuale",
        "Calzera",
        "Carico e grattatura strutture",
        "Ribattitura e rimozione chiodi",
        "Sgrossatura",
        "Segno a dima e boetta",
        "Cardatura fine",
        "Incollaggio suola",
        "Incollaggio tomaia",
        "Suolatura",
        "Pulizia",
        "Inchiodatura"
    ],
    "RIFINITURA 1": [
        "Assente",
        "Carico manovia",
        "Applicazione accessorio",
        "Applicazione soletta di pulizia",
        "Pulizia interna",
        "Stiratura interna e ritocco",
        "Stiratura esterna",
        "Spazzolina e pulizia esterna",
        "Impallatura",
        "Spazzolatura e lissatura",
        "Ritocco",
        "Lavorazioni particolari",
        "Scatolatura"
    ],
    "RIFINITURA 2": [
        "Assente",
        "Carico manovia",
        "Applicazione accessorio",
        "Applicazione soletta di pulizia",
        "Lavorazioni particolari",
        "Pulizia interna",
        "Stiratura interna",
        "Stiratura esterna",
        "Pulizia esterna",
        "Spazzolina",
        "Impallatura",
        "Spazzolatura e lissatura",
        "Ritocco",
        "Scatolatura"
    ]
};

  const WORKS_BY_LINE_STATION = {};

  const state = {
    currentStep: 1,
    activeMainView: "home",
    activeView: "setup",
    user: null,
    currentUserProfile: null,
    operators: [],
    workOperations: [],
    operatorSearchIndex: [],
    lastOperatorsLoadError: "",
    setup: {
      lineName: "",
      workDate: "",
      startTime: "",
      endTime: "",
      lunchMin: "60",
      snackMin: "10",
      stopsMin: "0",
      stopsNote: "",
      globalEventoMin: "0",
      globalAssembleaMin: "0",
      globalScioperoMin: "0",
      globalFlessibilitaHours: "0",
      dayDurationMinutes: 0,
      baseWorkMinutes: 0,
      baseNetMinutes: 0
    },
    rows: [],
    operatorsAdmin: {
      searchText: "",
      lineFilter: "",
      statusFilter: "active"
    },
    attendanceAdmin: {
      sessions: [],
      rows: [],
      selectedSessionId: null,
      dateFilter: "",
      lineFilter: "",
      searchText: "",
      editRow: null
    },
    applicationAdmin: {
      activeTable: "operators",
      rows: [],
      columns: []
    },
    usersAdmin: {
      rows: []
    }
  };

  const dom = {};

  function initDom() {
    dom.authSection = document.getElementById("authSection");
    dom.appSection = document.getElementById("appSection");
    dom.globalMessage = document.getElementById("globalMessage");

    dom.userBadge = document.getElementById("userBadge");
    dom.logoutBtn = document.getElementById("logoutBtn");
    dom.openHomeBtn = document.getElementById("openHomeBtn");
    dom.openAttendanceBtn = document.getElementById("openAttendanceBtn");
    dom.openPlannedAbsencesBtn = document.getElementById("openPlannedAbsencesBtn");
    dom.openOperatorsBtn = document.getElementById("openOperatorsBtn");
    dom.openAttendanceAdminBtn = document.getElementById("openAttendanceAdminBtn");

    dom.emailInput = document.getElementById("emailInput");
    dom.passwordInput = document.getElementById("passwordInput");
    dom.loginBtn = document.getElementById("loginBtn");
    dom.authErrors = document.getElementById("authErrors");

    dom.homeView = document.getElementById("homeView");
    dom.plannedAbsencesView = document.getElementById("plannedAbsencesView");
    dom.homeOpenAttendanceBtn = document.getElementById("homeOpenAttendanceBtn");
    dom.homeOpenPlannedAbsencesBtn = document.getElementById("homeOpenPlannedAbsencesBtn");
    dom.homeOpenAttendanceAdminBtn = document.getElementById("homeOpenAttendanceAdminBtn");
    dom.homeOpenOperatorsBtn = document.getElementById("homeOpenOperatorsBtn");
    dom.attendanceView = document.getElementById("attendanceView");
    dom.operatorsAdminView = document.getElementById("operatorsAdminView");
    dom.attendanceAdminView = document.getElementById("attendanceAdminView");

    dom.setupView = document.getElementById("setupView");
    dom.rowsView = document.getElementById("rowsView");

    dom.wizardErrors = document.getElementById("wizardErrors");
    dom.rowsErrors = document.getElementById("rowsErrors");

    dom.stepBadge = document.getElementById("stepBadge");
    dom.progressFill = document.getElementById("progressFill");
    dom.step1 = document.getElementById("step1");
    dom.step2 = document.getElementById("step2");
    dom.step3 = document.getElementById("step3");
    dom.step4 = document.getElementById("step4");
    dom.step5 = document.getElementById("step5");

    dom.lineSelect = document.getElementById("lineSelect");
    dom.workDate = document.getElementById("workDate");
    dom.startTime = document.getElementById("startTime");
    dom.endTime = document.getElementById("endTime");
    dom.lunchMin = document.getElementById("lunchMin");
    dom.snackMin = document.getElementById("snackMin");
    dom.stopsMin = document.getElementById("stopsMin");
    dom.stopsNote = document.getElementById("stopsNote");
    dom.globalEventoMin = document.getElementById("globalEventoMin");
    dom.globalAssembleaMin = document.getElementById("globalAssembleaMin");
    dom.globalScioperoMin = document.getElementById("globalScioperoMin");
    dom.globalFlessibilitaHours = document.getElementById("globalFlessibilitaHours");

    dom.setupSummaryBox = document.getElementById("setupSummaryBox");

    dom.wizardBackBtn = document.getElementById("wizardBackBtn");
    dom.wizardNextBtn = document.getElementById("wizardNextBtn");
    dom.loadOperatorsBtn = document.getElementById("loadOperatorsBtn");

    dom.rowsSetupSummary = document.getElementById("rowsSetupSummary");
dom.rowCountBadge = document.getElementById("rowCountBadge");
dom.backToSetupBtn = document.getElementById("backToSetupBtn");
dom.saveRowsBtn = document.getElementById("saveRowsBtn");
dom.resetRowsBtn = document.getElementById("resetRowsBtn");
dom.attendanceTableBody = document.getElementById("attendanceTableBody");

    dom.addOperatorSearch = document.getElementById("addOperatorSearch");
    dom.operatorsDatalist = document.getElementById("operatorsDatalist");
    dom.addOperatorBtn = document.getElementById("addOperatorBtn");

    dom.confirmModal = document.getElementById("confirmModal");
    dom.confirmModalSummary = document.getElementById("confirmModalSummary");
    dom.closeConfirmModalBtn = document.getElementById("closeConfirmModalBtn");
    dom.cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
    dom.confirmSaveBtn = document.getElementById("confirmSaveBtn");

    dom.attendanceAdminMessage = document.getElementById("attendanceAdminMessage");
    dom.attendanceAdminDateFilter = document.getElementById("attendanceAdminDateFilter");
    dom.attendanceAdminLineFilter = document.getElementById("attendanceAdminLineFilter");
    dom.attendanceAdminSearchInput = document.getElementById("attendanceAdminSearchInput");
    dom.refreshAttendanceAdminBtn = document.getElementById("refreshAttendanceAdminBtn");
    dom.attendanceAdminStats = document.getElementById("attendanceAdminStats");
    dom.attendanceAdminSessionsBody = document.getElementById("attendanceAdminSessionsBody");
    dom.attendanceAdminRowsBody = document.getElementById("attendanceAdminRowsBody");
    dom.attendanceAdminDetailTitle = document.getElementById("attendanceAdminDetailTitle");
    dom.attendanceRowModal = document.getElementById("attendanceRowModal");
    dom.attendanceRowModalTitle = document.getElementById("attendanceRowModalTitle");
    dom.attendanceRowModalMessage = document.getElementById("attendanceRowModalMessage");
    dom.attendanceRowFormId = document.getElementById("attendanceRowFormId");
    dom.attendanceRowSessionId = document.getElementById("attendanceRowSessionId");
    dom.attendanceRowOperatorInput = document.getElementById("attendanceRowOperatorInput");
    dom.attendanceRowLineInput = document.getElementById("attendanceRowLineInput");
    dom.attendanceRowStationInput = document.getElementById("attendanceRowStationInput");
    dom.attendanceRowWorkHoursInput = document.getElementById("attendanceRowWorkHoursInput");
    dom.attendanceRowEventoInput = document.getElementById("attendanceRowEventoInput");
    dom.attendanceRowAssembleaInput = document.getElementById("attendanceRowAssembleaInput");
    dom.attendanceRowScioperoInput = document.getElementById("attendanceRowScioperoInput");
    dom.attendanceRowWorksBox = document.getElementById("attendanceRowWorksBox");
    dom.closeAttendanceRowModalBtn = document.getElementById("closeAttendanceRowModalBtn");
    dom.cancelAttendanceRowModalBtn = document.getElementById("cancelAttendanceRowModalBtn");
    dom.saveAttendanceRowBtn = document.getElementById("saveAttendanceRowBtn");
    dom.operatorsAdminMessage = document.getElementById("operatorsAdminMessage");
    dom.applicationTableSelect = document.getElementById("applicationTableSelect");
    dom.loadApplicationTableBtn = document.getElementById("loadApplicationTableBtn");
    dom.clearApplicationTableBtn = document.getElementById("clearApplicationTableBtn");
    dom.applicationAdminMessage = document.getElementById("applicationAdminMessage");
    dom.applicationAdminTableWrap = document.getElementById("applicationAdminTableWrap");
    dom.applicationAdminTableHead = document.getElementById("applicationAdminTableHead");
    dom.applicationAdminTableBody = document.getElementById("applicationAdminTableBody");
    dom.refreshUsersAdminBtn = document.getElementById("refreshUsersAdminBtn");
    dom.usersAdminMessage = document.getElementById("usersAdminMessage");
    dom.usersAdminTableBody = document.getElementById("usersAdminTableBody");
    dom.openAttendanceFromApplicationBtn = document.getElementById("openAttendanceFromApplicationBtn");
    dom.newAppUserEmailInput = document.getElementById("newAppUserEmailInput");
    dom.newAppUserIdInput = document.getElementById("newAppUserIdInput");
    dom.newAppUserRoleInput = document.getElementById("newAppUserRoleInput");
    dom.addAppUserBtn = document.getElementById("addAppUserBtn");
    dom.operatorsSearchInput = document.getElementById("operatorsSearchInput");
    dom.operatorsLineFilter = document.getElementById("operatorsLineFilter");
    dom.operatorsStatusFilter = document.getElementById("operatorsStatusFilter");
    dom.refreshOperatorsBtn = document.getElementById("refreshOperatorsBtn");
    dom.newOperatorBtn = document.getElementById("newOperatorBtn");
    dom.operatorsAdminStats = document.getElementById("operatorsAdminStats");
    dom.operatorsAdminTableBody = document.getElementById("operatorsAdminTableBody");

    dom.operatorModal = document.getElementById("operatorModal");
    dom.operatorModalTitle = document.getElementById("operatorModalTitle");
    dom.operatorModalMessage = document.getElementById("operatorModalMessage");
    dom.closeOperatorModalBtn = document.getElementById("closeOperatorModalBtn");
    dom.cancelOperatorModalBtn = document.getElementById("cancelOperatorModalBtn");
    dom.saveOperatorBtn = document.getElementById("saveOperatorBtn");

    dom.operatorFormId = document.getElementById("operatorFormId");
    dom.operatorSurnameInput = document.getElementById("operatorSurnameInput");
    dom.operatorNameInput = document.getElementById("operatorNameInput");
    dom.operatorIdCodeInput = document.getElementById("operatorIdCodeInput");
    dom.operatorCdcInput = document.getElementById("operatorCdcInput");
    dom.operatorLineInput = document.getElementById("operatorLineInput");
    dom.operatorMacroLineInput = document.getElementById("operatorMacroLineInput");
    dom.operatorStationInput = document.getElementById("operatorStationInput");
    dom.operatorStandardHoursInput = document.getElementById("operatorStandardHoursInput");
    dom.operatorPlantInput = document.getElementById("operatorPlantInput");
    dom.operatorIsActiveInput = document.getElementById("operatorIsActiveInput");
  }

  async function init() {
  console.log("INIT");

  initDom();
  bindEvents();
  restoreState();

  if (!client) {
    showBox(dom.authErrors, "Client Supabase non disponibile.", "error");
    return;
  }

  const sessionUser = await getAuthenticatedUser();

  if (sessionUser) {
    state.user = sessionUser;

    await loadCurrentUserProfile();

    showAuthenticatedUI();

    // Carico SEMPRE operatori e lavorazioni.
    // Il problema era che work_operations non veniva caricato quando le righe
    // erano ripristinate dalla sessione del browser.
    await loadOperatorsFromDatabase();
    await loadWorkOperationsFromDatabase();

    if (state.rows.length) {
      state.rows = state.rows.map((row) => {
        const lineForWorks = row.line_day || state.setup.lineName || row.line_orig || "";
        const options = getWorkOptions(lineForWorks, row.postazione);
        return {
          ...row,
          line_day: lineForWorks || row.line_day || state.setup.lineName || "",
          lavorazioni: options.length ? options : (Array.isArray(row.lavorazioni) ? row.lavorazioni : [])
        };
      });
      saveState();
    }

    renderAll();
  } else {
    showLoggedOutUI();
    renderSetupForm();
    renderRowsView();
  }
}




function handleResetRows() {
  if (!state.rows.length) {
    showBox(dom.globalMessage, "Non ci sono presenze da resettare.", "info");
    return;
  }

  const conferma = confirm(
    "Sei sicuro di voler resettare tutte le presenze e tornare alle righe iniziali?"
  );

  if (!conferma) {
    return;
  }

  const selectedLine = normalizeText(state.setup.lineName);

  const filtered = state.operators.filter((operator) => {
    return (
      normalizeText(operator.lineaProduzione) === selectedLine &&
      operator.isActive !== false
    );
  });

  state.rows = filtered.map((operator, index) =>
    buildAttendanceRow(operator, index)
  );

  reorderRows();
  saveState();
  renderAll();

  showBox(dom.globalMessage, "Presenze resettate correttamente.", "success");
}




  
  function bindEvents() {
    if (dom.loginBtn) {
      dom.loginBtn.addEventListener("click", handleLogin);
    }

    if (dom.passwordInput) {
      dom.passwordInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          handleLogin();
        }
      });
    }

    if (dom.logoutBtn) {
      dom.logoutBtn.addEventListener("click", handleLogout);
    }

    if (dom.openHomeBtn) {
      dom.openHomeBtn.addEventListener("click", () => {
        state.activeMainView = "home";
        hideBox(dom.globalMessage);
        renderAll();
      });
    }
    if (dom.homeOpenAttendanceBtn) {
      dom.homeOpenAttendanceBtn.addEventListener("click", () => {
        state.activeMainView = "attendance";
        hideBox(dom.globalMessage);
        renderAll();
      });
    }
    if (dom.homeOpenAttendanceAdminBtn) {
      dom.homeOpenAttendanceAdminBtn.addEventListener("click", async () => {
        if (!canManageAttendance()) { showBox(dom.globalMessage, "Non sei autorizzato a consultare le presenze.", "error"); return; }
        state.activeMainView = "attendanceAdmin";
        renderPermissions();
        renderAttendanceAdmin();
        await loadAttendanceAdminSessions();
        renderAll();
      });
    }
    if (dom.homeOpenOperatorsBtn) {
      dom.homeOpenOperatorsBtn.addEventListener("click", () => {
        if (!canManageOperators()) { showBox(dom.globalMessage, "Non sei autorizzato a gestire l'applicazione.", "error"); return; }
        state.activeMainView = "operators";
        hideBox(dom.globalMessage);
        renderAll();
      });
    }
    if (dom.openAttendanceBtn) {
      dom.openAttendanceBtn.addEventListener("click", () => {
        state.activeMainView = "attendance";
        renderAll();
      });
    }

    if (dom.openOperatorsBtn) {
      dom.openOperatorsBtn.addEventListener("click", () => {
        if (!canManageOperators()) {
          showBox(dom.globalMessage, "Non sei autorizzato a gestire gli operatori.", "error");
          return;
        }

        state.activeMainView = "operators";
        renderAll();
      });
    }

    if (dom.openAttendanceAdminBtn) {
      dom.openAttendanceAdminBtn.addEventListener("click", async () => {
        hideBox(dom.globalMessage);
        if (!canManageAttendance()) {
          showBox(dom.globalMessage, "Non sei autorizzato a consultare le presenze.", "error");
          return;
        }
        state.activeMainView = "attendanceAdmin";
        renderPermissions();
        renderAttendanceAdmin();
        await loadAttendanceAdminSessions();
        renderAll();
      });
    }

    if (dom.wizardBackBtn) {
      dom.wizardBackBtn.addEventListener("click", handleWizardBack);
    }

    if (dom.wizardNextBtn) {
      dom.wizardNextBtn.addEventListener("click", handleWizardNext);
    }

    if (dom.resetRowsBtn) {
      dom.resetRowsBtn.addEventListener("click", handleResetRows);
    }

    if (dom.loadOperatorsBtn) {
      dom.loadOperatorsBtn.addEventListener("click", handleLoadOperatorsForLine);
    }

    if (dom.backToSetupBtn) {
      dom.backToSetupBtn.addEventListener("click", () => {
        state.activeView = "setup";
        state.currentStep = 5;
        hideBox(dom.rowsErrors);
        hideBox(dom.globalMessage);
        saveState();
        renderAll();
      });
    }

    if (dom.saveRowsBtn) {
      dom.saveRowsBtn.addEventListener("click", handleSaveRows);
    }

    if (dom.addOperatorBtn) {
      dom.addOperatorBtn.addEventListener("click", handleAddOperator);
    }

    if (dom.addOperatorSearch) {
      dom.addOperatorSearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleAddOperator();
        }
      });
    }

    if (dom.attendanceTableBody) {
      dom.attendanceTableBody.addEventListener("input", handleRowTableInteraction);
      dom.attendanceTableBody.addEventListener("change", handleRowTableInteraction);
      dom.attendanceTableBody.addEventListener("click", (event) => {
        const button = event.target.closest('button[data-action]');
        if (button) {
          handleRowTableInteraction(event);
        }
      });
    }

    if (dom.closeConfirmModalBtn) {
      dom.closeConfirmModalBtn.addEventListener("click", closeConfirmModal);
    }

    if (dom.cancelConfirmBtn) {
      dom.cancelConfirmBtn.addEventListener("click", closeConfirmModal);
    }

    if (dom.confirmSaveBtn) {
      dom.confirmSaveBtn.addEventListener("click", handleConfirmSave);
    }

    if (dom.confirmModal) {
      dom.confirmModal.addEventListener("click", (event) => {
        if (event.target === dom.confirmModal) {
          closeConfirmModal();
        }
      });
    }

    if (dom.operatorsSearchInput) {
      dom.operatorsSearchInput.addEventListener("input", () => {
        state.operatorsAdmin.searchText = dom.operatorsSearchInput.value || "";
        renderOperatorsAdmin();
    renderAttendanceAdmin();
      });
    }

    if (dom.operatorsLineFilter) {
      dom.operatorsLineFilter.addEventListener("change", () => {
        state.operatorsAdmin.lineFilter = dom.operatorsLineFilter.value || "";
        renderOperatorsAdmin();
    renderAttendanceAdmin();
      });
    }

    if (dom.operatorsStatusFilter) {
      dom.operatorsStatusFilter.addEventListener("change", () => {
        state.operatorsAdmin.statusFilter = dom.operatorsStatusFilter.value || "active";
        renderOperatorsAdmin();
    renderAttendanceAdmin();
      });
    }

    if (dom.refreshOperatorsBtn) {
      dom.refreshOperatorsBtn.addEventListener("click", async () => {
        await loadOperatorsFromDatabase();
        renderAll();
      });
    }

    if (dom.newOperatorBtn) {
      dom.newOperatorBtn.addEventListener("click", () => {
        if (!canManageOperators()) {
          showBox(dom.operatorsAdminMessage, "Non sei autorizzato a gestire gli operatori.", "error");
          return;
        }
        openOperatorModalForCreate();
      });
    }

    if (dom.operatorsAdminTableBody) {
      dom.operatorsAdminTableBody.addEventListener("click", handleOperatorsAdminTableClick);
    }

    if (dom.closeOperatorModalBtn) {
      dom.closeOperatorModalBtn.addEventListener("click", closeOperatorModal);
    }

    if (dom.cancelOperatorModalBtn) {
      dom.cancelOperatorModalBtn.addEventListener("click", closeOperatorModal);
    }

    if (dom.saveOperatorBtn) {
      dom.saveOperatorBtn.addEventListener("click", handleSaveOperator);
    }

    if (dom.operatorModal) {
      dom.operatorModal.addEventListener("click", (event) => {
        if (event.target === dom.operatorModal) {
          closeOperatorModal();
    closeAttendanceRowModal();
        }
      });
    }


    if (dom.refreshAttendanceAdminBtn) {
      dom.refreshAttendanceAdminBtn.addEventListener("click", async () => {
        await loadAttendanceAdminSessions();
        renderAll();
      });
    }
    if (dom.attendanceAdminDateFilter) {
      dom.attendanceAdminDateFilter.addEventListener("change", async () => {
        state.attendanceAdmin.dateFilter = dom.attendanceAdminDateFilter.value || "";
        await loadAttendanceAdminSessions();
        renderAttendanceAdmin();
      });
    }
    if (dom.attendanceAdminLineFilter) {
      dom.attendanceAdminLineFilter.addEventListener("change", async () => {
        state.attendanceAdmin.lineFilter = dom.attendanceAdminLineFilter.value || "";
        await loadAttendanceAdminSessions();
        renderAttendanceAdmin();
      });
    }
    if (dom.attendanceAdminSearchInput) {
      dom.attendanceAdminSearchInput.addEventListener("input", () => {
        state.attendanceAdmin.searchText = dom.attendanceAdminSearchInput.value || "";
        renderAttendanceAdminRows();
      });
    }
    if (dom.attendanceAdminSessionsBody) {
      dom.attendanceAdminSessionsBody.addEventListener("click", handleAttendanceAdminSessionsClick);
    }
    if (dom.attendanceAdminRowsBody) {
      dom.attendanceAdminRowsBody.addEventListener("click", handleAttendanceAdminRowsClick);
    }
    if (dom.closeAttendanceRowModalBtn) dom.closeAttendanceRowModalBtn.addEventListener("click", closeAttendanceRowModal);
    if (dom.cancelAttendanceRowModalBtn) dom.cancelAttendanceRowModalBtn.addEventListener("click", closeAttendanceRowModal);
    if (dom.saveAttendanceRowBtn) dom.saveAttendanceRowBtn.addEventListener("click", handleSaveAttendanceRowEdit);
    if (dom.attendanceRowStationInput) {
      dom.attendanceRowStationInput.addEventListener("change", () => {
        renderAttendanceRowWorksBox(true);
      });
    }
    if (dom.attendanceRowModal) {
      dom.attendanceRowModal.addEventListener("click", (event) => {
        if (event.target === dom.attendanceRowModal) closeAttendanceRowModal();
      });
    }

    if (dom.loadApplicationTableBtn) {
      dom.loadApplicationTableBtn.addEventListener("click", async () => {
        await loadApplicationAdminTable();
      });
    }
    if (dom.clearApplicationTableBtn) {
      dom.clearApplicationTableBtn.addEventListener("click", () => {
        state.applicationAdmin.rows = [];
        state.applicationAdmin.columns = [];
        renderApplicationAdminTable();
    renderUsersAdmin();
        hideBox(dom.applicationAdminMessage);
      });
    }
    if (dom.applicationAdminTableBody) {
      dom.applicationAdminTableBody.addEventListener("click", handleApplicationAdminClick);
    }

    if (dom.refreshUsersAdminBtn) {
      dom.refreshUsersAdminBtn.addEventListener("click", async () => {
        await loadUsersAdmin();
      });
    }
    if (dom.addAppUserBtn) {
      dom.addAppUserBtn.addEventListener("click", handleAddAppUser);
    }

    if (dom.usersAdminTableBody) {
      dom.usersAdminTableBody.addEventListener("click", handleUsersAdminClick);
    }
    if (dom.openAttendanceFromApplicationBtn) {
      dom.openAttendanceFromApplicationBtn.addEventListener("click", async () => {
        if (!canManageAttendance()) {
          showBox(dom.globalMessage, "Non sei autorizzato a gestire le presenze salvate.", "error");
          return;
        }
        state.activeMainView = "attendanceAdmin";
        renderPermissions();
        renderAttendanceAdmin();
        await loadAttendanceAdminSessions();
        renderAll();
      });
    }

    const setupInputs = [
      dom.lineSelect,
      dom.workDate,
      dom.startTime,
      dom.endTime,
      dom.lunchMin,
      dom.snackMin,
      dom.stopsMin,
      dom.stopsNote
    ];

    setupInputs.forEach((element) => {
      if (!element) return;
      const eventType = element.tagName === "SELECT" ? "change" : "input";
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

    const globalExtraInputs = [
      dom.globalEventoMin,
      dom.globalAssembleaMin,
      dom.globalScioperoMin,
      dom.globalFlessibilitaHours
    ];

    globalExtraInputs.forEach((element) => {
      if (!element) return;
      element.addEventListener("input", () => {
        readSetupFromForm();
        syncQuickButtons();
        applyGlobalExtrasToRows();
        renderSetupSummary();
        renderRowsSetupSummary();
        if (state.rows.length) {
          renderRowsView();
        }
        saveState();
      });
    });

    document.querySelectorAll(".quick-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.target;
        const value = button.dataset.value;
        const target = document.getElementById(targetId);
        if (!target) return;
        target.value = value;
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }
  async function getAuthenticatedUser() {
    try {
      const response = await client.auth.getSession();

      if (
        response &&
        response.data &&
        response.data.session &&
        response.data.session.user
      ) {
        return response.data.session.user;
      }

      return null;
    } catch (error) {
      console.error("Errore getSession:", error);
      return null;
    }
  }

  async function handleLogin() {
    console.log("LOGIN CLICK");

    hideBox(dom.authErrors);
    hideBox(dom.globalMessage);

    const email = (dom.emailInput ? dom.emailInput.value : "").trim();
    const password = dom.passwordInput ? dom.passwordInput.value : "";

    if (!email || !password) {
      showBox(dom.authErrors, "Inserisci email e password.", "error");
      return;
    }

    setButtonLoading(dom.loginBtn, true, "Accesso in corso...");

    try {
      const response = await client.auth.signInWithPassword({
        email,
        password
      });

      if (response.error) {
        showBox(dom.authErrors, "Errore login: " + response.error.message, "error");
        return;
      }

      if (!response.data || !response.data.user) {
        showBox(dom.authErrors, "Accesso non riuscito. Utente non disponibile.", "error");
        return;
      }

      state.user = response.data.user;

      console.log("LOGIN OK:", response.data);

      await loadCurrentUserProfile();

      showAuthenticatedUI();

      await loadOperatorsFromDatabase();

      renderAll();

      showBox(dom.globalMessage, "Login effettuato con successo.", "success");

      if (dom.passwordInput) {
        dom.passwordInput.value = "";
      }
    } catch (error) {
      console.error("Errore login:", error);
      showBox(dom.authErrors, "Errore inatteso durante il login.", "error");
    } finally {
      setButtonLoading(dom.loginBtn, false, "Accedi");
    }
  }

  async function handleLogout() {
    try {
      await client.auth.signOut();
    } catch (error) {
      console.error("Errore logout:", error);
    }

    clearState();
    showLoggedOutUI();
    renderSetupForm();
    renderRowsView();
    closeConfirmModal();
    closeOperatorModal();
    closeAttendanceRowModal();
  }

  async function ensureAppUserRecord(authUser) {
    if (!client || !authUser || !authUser.id) return null;
    const basePayload = {
      user_id: authUser.id,
      email: authUser.email || "",
      role: "user",
      can_manage_operators: false,
      is_active: true
    };
    const payloadWithLines = {
      ...basePayload,
      allowed_lines: []
    };
    try {
      let insertResponse = await client
        .from("app_users")
        .insert(payloadWithLines)
        .select()
        .maybeSingle();
      if (insertResponse.error && String(insertResponse.error.message || "").toLowerCase().includes("allowed_lines")) {
        insertResponse = await client
          .from("app_users")
          .insert(basePayload)
          .select()
          .maybeSingle();
      }
      if (insertResponse.error) {
        throw insertResponse.error;
      }
      return insertResponse.data || basePayload;
    } catch (error) {
      console.warn("Creazione automatica app_users non riuscita:", error);
      return basePayload;
    }
  }
  async function loadCurrentUserProfile() {
    if (!state.user || !state.user.id) {
      state.currentUserProfile = null;
      return;
    }
    try {
      const response = await client
        .from("app_users")
        .select("*")
        .eq("user_id", state.user.id)
        .maybeSingle();
      if (response.error) {
        console.warn("Errore lettura app_users:", response.error.message);
      }
      if (response.data) {
        state.currentUserProfile = response.data;
      } else {
        state.currentUserProfile = await ensureAppUserRecord(state.user);
      }
    } catch (error) {
      console.warn("Profilo app_users non disponibile:", error);
      state.currentUserProfile = await ensureAppUserRecord(state.user);
    }
  }
  function profileRole(profile) {
    return normalizeText(profile && profile.role ? profile.role : "user");
  }
  function parseAllowedLines(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    if (value === undefined || value === null || value === "") return [];
    if (typeof value === "string") {
      const raw = value.trim();
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      } catch (_) {}
      return raw.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }
  function currentAllowedLines() {
    const profile = state.currentUserProfile || {};
    return parseAllowedLines(profile.allowed_lines || profile.linee_autorizzate || profile.allowedLines || profile.linee || profile.linee_produzione);
  }
  function isAdminUser() {
    const profile = state.currentUserProfile || {};
    const role = profileRole(profile);
    return Boolean(profile && profile.is_active !== false && (role === "ADMIN" || role === "SUPERADMIN" || profile.can_manage_operators === true));
  }
  function isSuperUser() {
    const profile = state.currentUserProfile || {};
    const role = profileRole(profile);
    return Boolean(profile && profile.is_active !== false && (role === "SUPER_USER" || role === "SUPERUSER" || role === "SUPER UTENTE" || role === "KEY_USER"));
  }
  function canUseProductionLine(lineName) {
    if (!lineName) return false;
    if (isAdminUser() || isSuperUser()) return true;
    const allowed = currentAllowedLines();
    if (!allowed.length) return false;
    const wanted = normalizeText(lineName);
    return allowed.some((line) => normalizeText(line) === wanted);
  }
  function filterOperatorsForCurrentUser(operators) {
    if (isAdminUser() || isSuperUser()) return operators;
    const allowed = currentAllowedLines();
    if (!allowed.length) return [];
    return operators.filter((operator) => allowed.some((line) => normalizeText(line) === normalizeText(operator.lineaProduzione)));
  }
  function restrictLineSelectOptions() {
    if (!dom.lineSelect) return;
    if (!dom.lineSelect.dataset.originalOptions) {
      dom.lineSelect.dataset.originalOptions = Array.from(dom.lineSelect.options).map((option) => option.value + "|||" + option.textContent).join("[[OPT]]");
    }
    const saved = dom.lineSelect.dataset.originalOptions.split("[[OPT]]").map((item) => {
      const parts = item.split("|||");
      return { value: parts[0] || "", label: parts.slice(1).join("|||") || parts[0] || "" };
    });
    const current = dom.lineSelect.value || state.setup.lineName || "";
    dom.lineSelect.innerHTML = saved
      .filter((option, index) => index === 0 || !option.value || canUseProductionLine(option.value))
      .map((option) => `<option value="${escapeAttribute(option.value)}">${escapeHtml(option.label)}</option>`)
      .join("");
    if (current && canUseProductionLine(current)) {
      dom.lineSelect.value = current;
    } else if (current) {
      dom.lineSelect.value = "";
      state.setup.lineName = "";
    }
  }
  function canManageOperators() {
    return isAdminUser();
  }

  function canManageAttendance() {
    return isAdminUser() || isSuperUser();
  }
  function showAuthenticatedUI() {
    if (dom.authSection) dom.authSection.classList.add("hidden");
    if (dom.appSection) dom.appSection.classList.remove("hidden");
    if (state.activeMainView === "attendance" && !state.rows.length && !state.setup.lineName) { state.activeMainView = "home"; }

    if (dom.userBadge) {
      const email =
        state.user && state.user.email ? state.user.email : "Utente autenticato";

      const role =
        state.currentUserProfile && state.currentUserProfile.role
          ? " (" + state.currentUserProfile.role + ")"
          : "";

      dom.userBadge.textContent = email + role;
      dom.userBadge.classList.remove("hidden");
    }

    if (dom.logoutBtn) dom.logoutBtn.classList.remove("hidden");
    if (dom.openHomeBtn) dom.openHomeBtn.classList.remove("hidden");
    if (dom.openPlannedAbsencesBtn) dom.openPlannedAbsencesBtn.classList.remove("hidden");
    if (dom.openAttendanceBtn) dom.openAttendanceBtn.classList.remove("hidden");

    hideBox(dom.authErrors);

    renderPermissions();
  }

  function showLoggedOutUI() {
    if (dom.authSection) dom.authSection.classList.remove("hidden");
    if (dom.appSection) dom.appSection.classList.add("hidden");

    if (dom.userBadge) {
      dom.userBadge.textContent = "";
      dom.userBadge.classList.add("hidden");
    }

    if (dom.logoutBtn) dom.logoutBtn.classList.add("hidden");
    if (dom.openHomeBtn) dom.openHomeBtn.classList.add("hidden");
    if (dom.openPlannedAbsencesBtn) dom.openPlannedAbsencesBtn.classList.add("hidden");
    if (dom.openAttendanceBtn) dom.openAttendanceBtn.classList.add("hidden");
    if (dom.openOperatorsBtn) dom.openOperatorsBtn.classList.add("hidden");
    if (dom.openAttendanceAdminBtn) dom.openAttendanceAdminBtn.classList.add("hidden");

    hideBox(dom.globalMessage);
  }

  function renderPermissions() {
    const adminAllowed = canManageOperators();
    const attendanceAdminAllowed = canManageAttendance();

    if (dom.openOperatorsBtn) {
      dom.openOperatorsBtn.classList.toggle("hidden", !adminAllowed);
    }

    if (dom.newOperatorBtn) {
      dom.newOperatorBtn.classList.toggle("hidden", !adminAllowed);
    }
    if (dom.openAttendanceAdminBtn) {
      dom.openAttendanceAdminBtn.classList.toggle("hidden", !attendanceAdminAllowed);
    }

    if (!adminAllowed && state.activeMainView === "operators") {
      state.activeMainView = "home";
    }
    if (!attendanceAdminAllowed && state.activeMainView === "attendanceAdmin") {
      state.activeMainView = "home";
    }

    if (dom.homeView) { dom.homeView.classList.toggle("hidden", state.activeMainView !== "home"); }
    if (dom.plannedAbsencesView && state.activeMainView !== "plannedAbsences") { dom.plannedAbsencesView.classList.add("hidden"); }
    if (dom.homeOpenAttendanceAdminBtn) { dom.homeOpenAttendanceAdminBtn.classList.toggle("hidden", !attendanceAdminAllowed); }
    if (dom.homeOpenOperatorsBtn) { dom.homeOpenOperatorsBtn.classList.toggle("hidden", !adminAllowed); }

    if (dom.attendanceView) {
      dom.attendanceView.classList.toggle(
        "hidden",
        state.activeMainView !== "attendance"
      );
    }

    if (dom.operatorsAdminView) {
      dom.operatorsAdminView.classList.toggle(
        "hidden",
        state.activeMainView !== "operators" || !adminAllowed
      );
    }
    if (dom.attendanceAdminView) {
      dom.attendanceAdminView.classList.toggle(
        "hidden",
        state.activeMainView !== "attendanceAdmin" || !attendanceAdminAllowed
      );
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
      showBox(dom.wizardErrors, validation.message, "error");
      return;
    }

    if (state.currentStep < 5) {
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

    const step1Validation = validateStep(1);

    if (!step1Validation.ok) {
      state.currentStep = 1;
      renderAll();
      showBox(dom.wizardErrors, step1Validation.message, "error");
      return;
    }

    const step2Validation = validateStep(2);

    if (!step2Validation.ok) {
      state.currentStep = 2;
      renderAll();
      showBox(dom.wizardErrors, step2Validation.message, "error");
      return;
    }

    const step3Validation = validateStep(3);

    if (!step3Validation.ok) {
      state.currentStep = 3;
      renderAll();
      showBox(dom.wizardErrors, step3Validation.message, "error");
      return;
    }

    if (!state.operators.length) {
      await loadOperatorsFromDatabase();
    }
    if (!state.workOperations.length) {
      await loadWorkOperationsFromDatabase();
    }

    const activeOperators = state.operators.filter(
      (operator) => operator.isActive !== false
    );

    if (!activeOperators.length) {
      const detail = state.lastOperatorsLoadError
        ? " Dettaglio: " + state.lastOperatorsLoadError
        : " Nessun record attivo restituito dalla tabella operators.";

      showBox(
        dom.wizardErrors,
        "Impossibile caricare gli operatori dal database." + detail,
        "error"
      );
      return;
    }

    if (!canUseProductionLine(state.setup.lineName)) {
      showBox(dom.wizardErrors, "Non sei autorizzato a caricare operatori per questa linea.", "error");
      return;
    }

    const selectedLine = normalizeText(state.setup.lineName);

    const filtered = activeOperators.filter((operator) => {
      return normalizeText(operator.lineaProduzione) === selectedLine;
    });

    if (!filtered.length) {
      const dbLines = unique(
        activeOperators
          .map((operator) => operator.lineaProduzione)
          .filter(Boolean)
      );

      const dbLineText = dbLines.length
        ? dbLines.join(", ")
        : "nessuna linea valorizzata nel DB";

      showBox(
        dom.wizardErrors,
        "Nessun operatore trovato per la linea selezionata. Linee presenti nel DB: " +
          dbLineText,
        "error"
      );
      return;
    }

    state.rows = filtered.map((operator, index) =>
      buildAttendanceRow(operator, index)
    );

    state.activeView = "rows";
    state.activeMainView = "attendance";

    saveState();
    renderAll();

    showBox(
      dom.globalMessage,
      "Operatori caricati correttamente: " + state.rows.length + ".",
      "success"
    );
  }

  async function loadOperatorsFromDatabase() {
    if (!client) return;

    state.lastOperatorsLoadError = "";

    try {
      const response = await client
        .from("operators")
        .select("*")
        .order("cognome", { ascending: true });

      if (response.error) {
        throw response.error;
      }

      const rawOperators = Array.isArray(response.data) ? response.data : [];

      const mappedOperators = rawOperators
        .map(mapOperatorRow)
        .filter((operator) => {
          return operator.id !== null || operator.nome || operator.cognome;
        });

      state.operators = filterOperatorsForCurrentUser(mappedOperators);

      // La ricerca "Aggiungi operatore" deve restare globale: serve per aggiungere
      // operatori esterni/prestati da altre linee. Il filtro allowed_lines resta valido
      // solo per il caricamento automatico della linea, non per questa ricerca.
      state.operatorSearchIndex = mappedOperators
        .filter((operator) => operator.isActive !== false)
        .map((operator) => {
          return {
            key: buildOperatorSearchLabel(operator),
            operator
          };
        });

      renderOperatorsDatalist();
      renderOperatorsFilters();

      if (!rawOperators.length) {
        state.lastOperatorsLoadError =
          "La query sulla tabella operators ha restituito 0 righe.";
      }
    } catch (error) {
      console.error("Errore caricamento operators:", error);

      state.lastOperatorsLoadError = error.message || "errore sconosciuto";

      state.operators = [];
      state.operatorSearchIndex = [];

      showBox(
        dom.globalMessage,
        "Errore caricamento operatori: " + state.lastOperatorsLoadError,
        "error"
      );

      renderOperatorsDatalist();
      renderOperatorsFilters();
    }
  }

  function mapOperatorRow(row) {
    const id = firstDefined(row, ["id", "ID"]);

    const cognome =
      firstDefined(row, ["cognome", "last_name", "lastname"]) || "";

    const nome =
      firstDefined(row, ["nome", "first_name", "firstname"]) || "";

    const idOperatore =
      firstDefined(row, [
        "idOperatore",
        "id_operatore",
        "idoperatore",
        "codice_operatore",
        "codice"
      ]) || "";

    const idCdc =
      firstDefined(row, [
        "idCdc",
        "id_cdc",
        "idcdc",
        "cdc",
        "centro_di_costo"
      ]) || "";

    const macroLineaProduzione =
      firstDefined(row, [
        "macroLineaProduzione",
        "macro_linea_produzione",
        "macrolineaproduzione"
      ]) || "";

    const lineaProduzione =
      firstDefined(row, [
        "lineaProduzione",
        "linea_produzione",
        "lineaproduzione",
        "line_name",
        "linea",
        "line"
      ]) || "";

    const postazione =
      firstDefined(row, ["postazione", "station", "stazione"]) || "";

    const oreStandardRaw = firstDefined(row, [
      "oreStandard",
      "ore_standard",
      "orestandard",
      "standard_hours"
    ]);

    const stabilimento =
      firstDefined(row, ["stabilimento", "stabilimento_nome"]) || "";

    const isActiveRaw = firstDefined(row, ["is_active", "isactive"]);

    return {
      id: id !== undefined && id !== "" ? id : null,
      cognome: String(cognome).trim(),
      nome: String(nome).trim(),
      idOperatore: String(idOperatore).trim(),
      idCdc: String(idCdc).trim(),
      macroLineaProduzione: String(macroLineaProduzione).trim(),
      lineaProduzione: String(lineaProduzione).trim(),
      postazione: String(postazione).trim(),
      oreStandard:
        oreStandardRaw === undefined ||
        oreStandardRaw === null ||
        oreStandardRaw === ""
          ? 0
          : Number(oreStandardRaw),
      stabilimento: String(stabilimento).trim(),
      isActive:
        isActiveRaw === undefined || isActiveRaw === null
          ? true
          : Boolean(isActiveRaw)
    };
  }

  function buildOperatorSearchLabel(operator) {
    const fullName =
      [operator.cognome, operator.nome].filter(Boolean).join(" ").trim() ||
      "Operatore";

    const idPart = operator.idOperatore
      ? "ID: " + operator.idOperatore
      : "ID: -";

    const linePart = operator.lineaProduzione
      ? "Linea: " + operator.lineaProduzione
      : "Linea: -";

    return fullName + " | " + idPart + " | " + linePart;
  }

  function buildAttendanceRow(operator, index) {
    const lineName = state.setup.lineName;
    const stationOptions = getStationOptions(lineName, operator.postazione);
    const initialStation = stationOptions.includes(operator.postazione)
      ? operator.postazione
      : stationOptions[0] || "";
    const workMin = Number(state.setup.baseWorkMinutes) || 0;
    const globalEventoMin = toNonNegativeInt(state.setup.globalEventoMin);
    const globalAssembleaMin = toNonNegativeInt(state.setup.globalAssembleaMin);
    const globalScioperoMin = toNonNegativeInt(state.setup.globalScioperoMin);
    const globalFlessibilitaHours = toNonNegativeNumber(state.setup.globalFlessibilitaHours);
    const baseOreStandard = Number(operator.oreStandard) || 0;
    const oreStandardGiorno = globalFlessibilitaHours > 0 ? globalFlessibilitaHours : baseOreStandard;
    const finalMin = calculateFinalMinutes(
      workMin,
      Number(state.setup.snackMin) || 0,
      Number(state.setup.stopsMin) || 0,
      globalEventoMin,
      globalAssembleaMin,
      globalScioperoMin
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
      ore_standard: oreStandardGiorno,
      base_ore_standard: baseOreStandard,
      flessibilita_hours: globalFlessibilitaHours,
      is_duplicate: false,
      work_min: workMin,
      evento_min: globalEventoMin,
      assemblea_min: globalAssembleaMin,
      sciopero_min: globalScioperoMin,
      final_min: finalMin,
      lavorazioni: getWorkOptions(lineName, initialStation),
      worksOpen: false,
      extrasOpen: false,
      dirty: false,
      removed: false
    };
  }

  function handleAddOperator() {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    const rawValue = (dom.addOperatorSearch ? dom.addOperatorSearch.value : "").trim();

    if (!rawValue) {
      showBox(dom.rowsErrors, "Scrivi o seleziona un operatore da aggiungere.", "error");
      return;
    }

    let found = state.operatorSearchIndex.find((item) => item.key === rawValue);

    if (!found) {
      const query = normalizeText(rawValue);

      found = state.operatorSearchIndex.find((item) =>
        normalizeText(item.key).includes(query)
      );
    }

    if (!found || !found.operator) {
      showBox(
        dom.rowsErrors,
        "Operatore non trovato. Seleziona un valore presente nell’elenco.",
        "error"
      );
      return;
    }

    const operator = found.operator;


    if (isOperatorAlreadyInRows(operator)) {
      showBox(dom.rowsErrors, "Questo operatore è già presente nella tabella.", "error");
      return;
    }

    state.rows.push(buildAttendanceRow(operator, state.rows.length));

    reorderRows();

    state.activeView = "rows";
    state.activeMainView = "attendance";

    saveState();
    renderRowsView();

    if (dom.addOperatorSearch) {
      dom.addOperatorSearch.value = "";
    }

    showBox(dom.globalMessage, "Operatore aggiunto correttamente.", "success");
  }

  function isOperatorAlreadyInRows(operator) {
    return state.rows.some((row) => {
      if (row.operator_id !== null && operator.id !== null) {
        return String(row.operator_id) === String(operator.id);
      }

      if (row.id_operatore && operator.idOperatore) {
        return normalizeText(row.id_operatore) === normalizeText(operator.idOperatore);
      }

      const rowName = normalizeText(
        [row.cognome, row.nome].filter(Boolean).join(" ")
      );

      const operatorName = normalizeText(
        [operator.cognome, operator.nome].filter(Boolean).join(" ")
      );

      return rowName && operatorName && rowName === operatorName;
    });
  }




async function handleRowTableInteraction(event) {
  const target = event.target;
  if (!target) return;

  const actionButton = target.closest("button[data-action]");
  const sourceElement = actionButton || target;

  const rowIndex = Number(sourceElement.dataset.rowIndex);
  const field = sourceElement.dataset.field;
  const action = sourceElement.dataset.action;

  // Duplica riga
  if (action === "duplicate") {
    if (Number.isNaN(rowIndex) || !state.rows[rowIndex]) return;

    const rowToClone = state.rows[rowIndex];
    const newRow = {
      ...rowToClone,
      ore_standard: 0,
      base_ore_standard: 0,
      flessibilita_hours: 0,
      is_duplicate: true,
      work_min: 0,
      evento_min: 0,
      assemblea_min: 0,
      sciopero_min: 0,
      final_min: 0,
      extrasOpen: false,
      worksOpen: false,
      lavorazioni: [...(rowToClone.lavorazioni || [])],
      sort_order: state.rows.length + 1,
      dirty: true
    };

    state.rows.splice(rowIndex + 1, 0, newRow);

    reorderRows();
    saveState();
    renderRowsView();

    showBox(dom.globalMessage, "Riga duplicata correttamente.", "success");
    return;
  }

  // Toggle apertura/chiusura lavorazioni
  if (action === "toggle-works") {
    if (Number.isNaN(rowIndex) || !state.rows[rowIndex]) return;

    if (!state.workOperations.length) {
      await loadWorkOperationsFromDatabase();
    }

    const row = state.rows[rowIndex];
    const lineForWorks = row.line_day || state.setup.lineName || row.line_orig || "";
    row.line_day = lineForWorks || row.line_day || state.setup.lineName || "";
    row.worksOpen = !row.worksOpen;

    if (row.worksOpen) {
      const options = getWorkOptions(lineForWorks, row.postazione);
      row.lavorazioni = options.length ? options : (Array.isArray(row.lavorazioni) ? row.lavorazioni : []);
    }

    saveState();
    renderRowsView();
    return;
  }
  // Toggle apertura/chiusura Eventi / anomalie
  if (action === "toggle-extras") {
    if (Number.isNaN(rowIndex) || !state.rows[rowIndex]) return;

    state.rows[rowIndex].extrasOpen = !state.rows[rowIndex].extrasOpen;
    saveState();
    renderRowsView();
    return;
  }

  if (Number.isNaN(rowIndex) || !field || !state.rows[rowIndex]) return;

  const row = state.rows[rowIndex];

  // Postazione: aggiorna lavorazioni usando la linea della riga.
  if (field === "postazione") {
    row.postazione = target.value;

    if (!state.workOperations.length) {
      await loadWorkOperationsFromDatabase();
    }

    const lineForWorks = row.line_day || state.setup.lineName || row.line_orig || "";
    row.line_day = lineForWorks || row.line_day || state.setup.lineName || "";
    row.lavorazioni = getWorkOptions(lineForWorks, row.postazione);

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
    return;
  }

  if (field === "lavorazione") {
    const selectedWork = normalizeWorkItem({
      nome: target.dataset.workName || "",
      carrello: target.dataset.carrello || ""
    });
    const current = Array.isArray(row.lavorazioni)
      ? row.lavorazioni.map((item) => normalizeWorkItem(item)).filter((item) => item.nome)
      : [];
    const key = workKey(selectedWork);
    const existingIndex = current.findIndex((item) => workKey(item) === key);
    if (target.checked && existingIndex < 0) current.push(selectedWork);
    if (!target.checked && existingIndex >= 0) current.splice(existingIndex, 1);
    row.lavorazioni = current;
    row.dirty = true;
    saveState();
    return;
  }
  // Ore lavorate
  if (field === "workHours") {
    row.work_min = hoursStringToMinutes(target.value);
  }

  // Campi extra
  if (field === "evento_min") {
    row.evento_min = toNonNegativeInt(target.value);
  }

  if (field === "assemblea_min") {
    row.assemblea_min = toNonNegativeInt(target.value);
  }

  if (field === "sciopero_min") {
    row.sciopero_min = toNonNegativeInt(target.value);
  }

  if (field === "flessibilita_hours") {
    row.flessibilita_hours = toNonNegativeNumber(target.value);
    const isDuplicate = Boolean(row.is_duplicate) || Number(row.ore_standard) === 0 && Number(row.base_ore_standard) === 0;
    if (isDuplicate) {
      row.ore_standard = 0;
      row.flessibilita_hours = 0;
      row.is_duplicate = true;
    } else {
      const baseOreStandard = Number(row.base_ore_standard) || Number(row.ore_standard) || 0;
      row.base_ore_standard = baseOreStandard;
      row.ore_standard = row.flessibilita_hours > 0 ? row.flessibilita_hours : baseOreStandard;
    }
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

  // Re-render solo quando esci dal campo
  if (event.type === "change") {
    renderRowsView();
  }
}


  
  
  function handleSaveRows() {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    if (!state.user) {
      showBox(dom.rowsErrors, "Sessione non valida. Effettua di nuovo il login.", "error");
      return;
    }

    if (!state.rows.length) {
      showBox(dom.rowsErrors, "Non ci sono righe da salvare.", "error");
      return;
    }

    const validation = validateAllRows();

    if (!validation.ok) {
      showBox(dom.rowsErrors, validation.message, "error");
      return;
    }

    openConfirmModal();
  }

  async function handleConfirmSave() {
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);

    if (!state.user) {
      closeConfirmModal();
      showBox(dom.rowsErrors, "Sessione non valida. Effettua di nuovo il login.", "error");
      return;
    }

    if (!state.rows.length) {
      closeConfirmModal();
      showBox(dom.rowsErrors, "Non ci sono righe da salvare.", "error");
      return;
    }

    const validation = validateAllRows();

    if (!validation.ok) {
      closeConfirmModal();
      showBox(dom.rowsErrors, validation.message, "error");
      return;
    }

    setButtonLoading(dom.confirmSaveBtn, true, "Salvataggio in corso...");

    try {
      const sessionPayload = {
        work_date: state.setup.workDate,
        line_name: state.setup.lineName,
        start_time: state.setup.startTime,
        end_time: state.setup.endTime,
        lunch_min: toNonNegativeInt(state.setup.lunchMin),
        snack_min: toNonNegativeInt(state.setup.snackMin),
        stops_min: toNonNegativeInt(state.setup.stopsMin),
        stops_note: state.setup.stopsNote || "",
        base_work_minutes: Number(state.setup.baseWorkMinutes) || 0,
        base_net_minutes: Number(state.setup.baseNetMinutes) || 0,
        created_by: state.user.id
      };

      const sessionResponse = await client
        .from("attendance_sessions")
        .upsert(sessionPayload, {
          onConflict: "work_date,line_name"
        })
        .select()
        .single();

      if (sessionResponse.error) {
        throw sessionResponse.error;
      }

      const attendanceSession = sessionResponse.data;

      if (!attendanceSession || !attendanceSession.id) {
        throw new Error("Sessione presenze non restituita dal database.");
      }

      const deleteResponse = await client
        .from("attendance_rows")
        .delete()
        .eq("attendance_session_id", attendanceSession.id);

      if (deleteResponse.error) {
        throw deleteResponse.error;
      }

      const rowsPayload = state.rows.map((row, index) => {
        return {
          attendance_session_id: attendanceSession.id,
          operator_id: row.operator_id,
          sort_order: index + 1,
          stabilimento: row.stabilimento || "",
          cognome: row.cognome || "",
          nome: row.nome || "",
          id_operatore: row.id_operatore || "",
          id_cdc: row.id_cdc || "",
          macro_linea_produzione: row.macro_linea_produzione || "",
          line_orig: row.line_orig || "",
          line_day: row.line_day || "",
          postazione: row.postazione || "",
          ore_standard: Number(row.ore_standard) || 0,
          work_min: Number(row.work_min) || 0,
          evento_min: Number(row.evento_min) || 0,
          assemblea_min: Number(row.assemblea_min) || 0,
          sciopero_min: Number(row.sciopero_min) || 0,
          final_min: Number(row.final_min) || 0,
          lavorazioni: Array.isArray(row.lavorazioni) ? row.lavorazioni.map((item) => normalizeWorkItem(item)).filter((item) => item.nome) : [],
          dirty: Boolean(row.dirty),
          removed: Boolean(row.removed),
          created_by: state.user.id
        };
      });

      const insertResponse = await client
        .from("attendance_rows")
        .insert(rowsPayload);

      if (insertResponse.error) {
        throw insertResponse.error;
      }

      closeConfirmModal();

      resetAfterSuccessfulSave();

      showBox(dom.globalMessage, "Dati salvati correttamente nel database.", "success");
    } catch (error) {
      console.error("Errore salvataggio:", error);
      showBox(
        dom.rowsErrors,
        error.message || "Errore durante il salvataggio nel database.",
        "error"
      );
    } finally {
      setButtonLoading(dom.confirmSaveBtn, false, "Conferma e salva");
    }
  }

  function renderAll() {
    renderPermissions();
    renderSetupForm();
    renderWizard();
    renderSetupSummary();
    renderRowsSetupSummary();
    renderRowsView();
    renderOperatorsDatalist();
    renderOperatorsFilters();
    renderOperatorsAdmin();
    renderAttendanceAdmin();
  }

  function renderSetupForm() {
    restrictLineSelectOptions();
    if (dom.lineSelect) dom.lineSelect.value = state.setup.lineName || "";
    if (dom.workDate) dom.workDate.value = state.setup.workDate || "";
    if (dom.startTime) dom.startTime.value = state.setup.startTime || "";
    if (dom.endTime) dom.endTime.value = state.setup.endTime || "";
    if (dom.lunchMin) dom.lunchMin.value = state.setup.lunchMin || "60";
    if (dom.snackMin) dom.snackMin.value = state.setup.snackMin || "10";
    if (dom.stopsMin) dom.stopsMin.value = state.setup.stopsMin || "0";
    if (dom.stopsNote) dom.stopsNote.value = state.setup.stopsNote || "";
    if (dom.globalEventoMin) dom.globalEventoMin.value = state.setup.globalEventoMin || "0";
    if (dom.globalAssembleaMin) dom.globalAssembleaMin.value = state.setup.globalAssembleaMin || "0";
    if (dom.globalScioperoMin) dom.globalScioperoMin.value = state.setup.globalScioperoMin || "0";
    if (dom.globalFlessibilitaHours) dom.globalFlessibilitaHours.value = state.setup.globalFlessibilitaHours || "0";

    syncQuickButtons();
  }

  function renderWizard() {
    const steps = [dom.step1, dom.step2, dom.step3, dom.step4, dom.step5];

    steps.forEach((stepElement, index) => {
      if (!stepElement) return;

      const stepNumber = index + 1;
      stepElement.classList.toggle("hidden", stepNumber !== state.currentStep);
    });

    if (dom.stepBadge) {
      dom.stepBadge.textContent = "Step " + state.currentStep + " di 5";
    }

    if (dom.progressFill) {
      dom.progressFill.style.width = (state.currentStep / 5) * 100 + "%";
    }

    if (dom.wizardBackBtn) {
      dom.wizardBackBtn.disabled = state.currentStep === 1;
    }

    if (dom.wizardNextBtn) {
      dom.wizardNextBtn.classList.toggle("hidden", state.currentStep === 5);
    }

    if (dom.setupView) {
      dom.setupView.classList.toggle("hidden", state.activeView !== "setup");
    }

    if (dom.rowsView) {
      dom.rowsView.classList.toggle("hidden", state.activeView !== "rows");
    }
  }

  function renderSetupSummary() {
    if (!dom.setupSummaryBox) return;

    readSetupFromForm();

    const items = [
      ["Linea", state.setup.lineName || "-"],
      ["Data", state.setup.workDate || "-"],
      ["Inizio", state.setup.startTime || "-"],
      ["Fine", state.setup.endTime || "-"],
      ["Pausa pranzo", toNonNegativeInt(state.setup.lunchMin) + " min"],
      ["Pausa colazione", toNonNegativeInt(state.setup.snackMin) + " min"],
      ["Fermi", toNonNegativeInt(state.setup.stopsMin) + " min"],
      ["Nota fermi", state.setup.stopsNote || "-"],
      ["Evento globale", toNonNegativeInt(state.setup.globalEventoMin) + " min"],
      ["Assemblea globale", toNonNegativeInt(state.setup.globalAssembleaMin) + " min"],
      ["Sciopero globale", toNonNegativeInt(state.setup.globalScioperoMin) + " min"],
      ["Flessibilità globale", toNonNegativeNumber(state.setup.globalFlessibilitaHours) + " h"],
      ["Durata giornata", formatMinutes(state.setup.dayDurationMinutes || 0)],
      ["Ore lavorate base", formatMinutes(state.setup.baseWorkMinutes || 0)],
      ["Tempo netto base", formatMinutes(state.setup.baseNetMinutes || 0)]
    ];

    dom.setupSummaryBox.innerHTML = items
      .map((item) => {
        return `
          <div class="summary-item">
            <span class="label">${escapeHtml(item[0])}</span>
            <span class="value">${escapeHtml(item[1])}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderRowsSetupSummary() {
    if (!dom.rowsSetupSummary) return;

    readSetupFromForm();

    const items = [
      ["Linea", state.setup.lineName || "-"],
      ["Data", state.setup.workDate || "-"],
      ["Inizio", state.setup.startTime || "-"],
      ["Fine", state.setup.endTime || "-"],
      ["Ore lavorate base", formatMinutes(state.setup.baseWorkMinutes || 0)],
      ["Colazione", toNonNegativeInt(state.setup.snackMin) + " min"],
      ["Fermi", toNonNegativeInt(state.setup.stopsMin) + " min"],
      ["Evento globale", toNonNegativeInt(state.setup.globalEventoMin) + " min"],
      ["Assemblea globale", toNonNegativeInt(state.setup.globalAssembleaMin) + " min"],
      ["Sciopero globale", toNonNegativeInt(state.setup.globalScioperoMin) + " min"],
      ["Flessibilità globale", toNonNegativeNumber(state.setup.globalFlessibilitaHours) + " h"],
      ["Tempo netto base", formatMinutes(state.setup.baseNetMinutes || 0)]
    ];

    dom.rowsSetupSummary.innerHTML = items
      .map((item) => {
        return `
          <div class="summary-item">
            <span class="label">${escapeHtml(item[0])}</span>
            <span class="value">${escapeHtml(item[1])}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderRowsView() {
    if (dom.rowCountBadge) {
      dom.rowCountBadge.textContent =
        state.rows.length + " " + (state.rows.length === 1 ? "riga" : "righe");
    }

    if (!dom.attendanceTableBody) return;

    if (!state.rows.length) {
      dom.attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="muted">
              Nessuna riga caricata. Completa il setup e carica gli operatori della linea.
            </div>
          </td>
        </tr>
      `;
      return;
    }

    dom.attendanceTableBody.innerHTML = state.rows
      .map((row, index) => {
        const workHours = minutesToHoursString(row.work_min);
        const finalHours = minutesToHoursString(row.final_min);
        const extrasOpen = Boolean(row.extrasOpen);
        const extrasActive =
          (Number(row.evento_min) || 0) > 0 ||
          (Number(row.assemblea_min) || 0) > 0 ||
          (Number(row.sciopero_min) || 0) > 0;

        const options = getStationOptions(state.setup.lineName, row.postazione)
          .map((station) => {
            const selected = station === row.postazione ? "selected" : "";
            return `
              <option value="${escapeAttribute(station)}" ${selected}>
                ${escapeHtml(station)}
              </option>
            `;
          })
          .join("");

        const operatorLabel =
          [row.cognome, row.nome].filter(Boolean).join(" ").trim() || "Operatore";

        const extrasToggleClass = extrasActive
          ? "extras-toggle has-values"
          : "extras-toggle";

        return `
          <tr>
            <td data-label="Operatore" class="cell-operator">
              <div class="operator-name">${escapeHtml(operatorLabel)}</div>
            </td>


            <td data-label="Ore lavorate (h)">
              <input
                class="table-input"
                type="number"
                min="0"
                step="0.25"
                inputmode="decimal"
                value="${escapeAttribute(workHours)}"
                data-row-index="${index}"
                data-field="workHours"
              >
            </td>

            <td data-label="Extra">
              <button
                type="button"
                class="${extrasToggleClass}"
                data-row-index="${index}"
                data-action="toggle-extras"
              >
                ${extrasOpen ? "−" : "+"} Eventi / anomalie
              </button>

              ${
                extrasOpen
                  ? `
                <div class="extras-panel">
                  <div class="extras-field">
                    <label>Evento min</label>
                    <input
                      class="table-input"
                      type="number"
                      min="0"
                      step="1"
                      inputmode="numeric"
                      value="${escapeAttribute(String(row.evento_min))}"
                      data-row-index="${index}"
                      data-field="evento_min"
                    >
                  </div>

                  <div class="extras-field">
                    <label>Assemblea min</label>
                    <input
                      class="table-input"
                      type="number"
                      min="0"
                      step="1"
                      inputmode="numeric"
                      value="${escapeAttribute(String(row.assemblea_min))}"
                      data-row-index="${index}"
                      data-field="assemblea_min"
                    >
                  </div>

                  <div class="extras-field">
                    <label>Sciopero min</label>
                    <input
                      class="table-input"
                      type="number"
                      min="0"
                      step="1"
                      inputmode="numeric"
                      value="${escapeAttribute(String(row.sciopero_min))}"
                      data-row-index="${index}"
                      data-field="sciopero_min"
                    >
                  </div>
                  <div class="extras-field">
                    <label>Flessibilità ore</label>
                    <input
                      class="table-input"
                      type="number"
                      min="0"
                      step="0.25"
                      inputmode="decimal"
                      value="${escapeAttribute(String(Number(row.flessibilita_hours) || 0))}"
                      data-row-index="${index}"
                      data-field="flessibilita_hours"
                      ${Boolean(row.is_duplicate) ? "readonly disabled" : ""}
                    >
                    
                    ${Boolean(row.is_duplicate) ? '<div class="duplicate-note">Riga duplicata: ore standard bloccate a 0.</div>' : ''}
                  </div>
                </div>
              `
                  : ""
              }
            </td>

            <td data-label="Lavorazioni">
              <button
                type="button"
                class="extras-toggle works-toggle ${Array.isArray(row.lavorazioni) && row.lavorazioni.length ? "has-values" : ""}"
                data-row-index="${index}"
                data-action="toggle-works"
              >
                ${row.worksOpen ? "−" : "+"} Specifica lavorazione
              </button>
              ${
                row.worksOpen
                  ? renderWorksPanel(row, index, state.setup.lineName)
                  : ""
              }
            </td>

            <td data-label="Postazione">
              <select
                class="table-select"
                data-row-index="${index}"
                data-field="postazione"
              >
                ${options}
              </select>
            </td>

            <td data-label="Finali" class="final-cell">
              <div class="final-box">
                <span class="final-main">${escapeHtml(String(row.final_min))} min</span>
                <span class="final-sub">${escapeHtml(finalHours)} h</span>
                <span class="final-sub">Std: ${escapeHtml(String(Number(row.ore_standard) || 0))} h</span>
              </div>
            </td>

            <td data-label="Azioni">
              <button
                class="btn btn-secondary btn-small"
                data-row-index="${index}"
                data-action="duplicate"
              >
                Duplica
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }
  function renderOperatorsDatalist() {
    if (!dom.operatorsDatalist) return;

    dom.operatorsDatalist.innerHTML = state.operatorSearchIndex
      .map((item) => {
        return `<option value="${escapeAttribute(item.key)}"></option>`;
      })
      .join("");
  }

  function renderOperatorsFilters() {
    if (!dom.operatorsLineFilter) return;

    const lines = unique(
      state.operators
        .map((operator) => operator.lineaProduzione)
        .filter(Boolean)
    ).sort((a, b) => a.localeCompare(b, "it"));

    const current = state.operatorsAdmin.lineFilter || "";

    dom.operatorsLineFilter.innerHTML =
      `<option value="">Tutte le linee</option>` +
      lines
        .map((line) => {
          return `<option value="${escapeAttribute(line)}">${escapeHtml(line)}</option>`;
        })
        .join("");

    dom.operatorsLineFilter.value = current;
  }

  function renderOperatorsAdmin() {
    if (!dom.operatorsAdminView || !canManageOperators()) return;
    if (!dom.operatorsAdminTableBody || !dom.operatorsAdminStats) return;

    const allOperators = [...state.operators];
    const searchText = normalizeText(state.operatorsAdmin.searchText || "");
    const lineFilter = normalizeText(state.operatorsAdmin.lineFilter || "");
    const statusFilter = state.operatorsAdmin.statusFilter || "active";

    const filtered = allOperators.filter((operator) => {
      const lineOk =
        !lineFilter || normalizeText(operator.lineaProduzione) === lineFilter;

      let statusOk = true;

      if (statusFilter === "active") {
        statusOk = operator.isActive !== false;
      }

      if (statusFilter === "inactive") {
        statusOk = operator.isActive === false;
      }

      const haystack = normalizeText(
        [
          operator.cognome,
          operator.nome,
          operator.idOperatore,
          operator.idCdc,
          operator.lineaProduzione,
          operator.macroLineaProduzione
        ].join(" ")
      );

      const searchOk = !searchText || haystack.includes(searchText);

      return lineOk && statusOk && searchOk;
    });

    const activeCount = allOperators.filter(
      (operator) => operator.isActive !== false
    ).length;

    const inactiveCount = allOperators.filter(
      (operator) => operator.isActive === false
    ).length;

    const linesCount = unique(
      allOperators.map((operator) => operator.lineaProduzione).filter(Boolean)
    ).length;

    dom.operatorsAdminStats.innerHTML = `
      <div class="summary-item">
        <span class="label">Totale operatori</span>
        <span class="value">${escapeHtml(String(allOperators.length))}</span>
      </div>
      <div class="summary-item">
        <span class="label">Operatori attivi</span>
        <span class="value">${escapeHtml(String(activeCount))}</span>
      </div>
      <div class="summary-item">
        <span class="label">Operatori non attivi</span>
        <span class="value">${escapeHtml(String(inactiveCount))}</span>
      </div>
      <div class="summary-item">
        <span class="label">Linee presenti</span>
        <span class="value">${escapeHtml(String(linesCount))}</span>
      </div>
    `;

    if (!filtered.length) {
      dom.operatorsAdminTableBody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="muted">
              Nessun operatore trovato con i filtri selezionati.
            </div>
          </td>
        </tr>
      `;
      return;
    }

    dom.operatorsAdminTableBody.innerHTML = filtered
      .map((operator) => {
        const badge =
          operator.isActive !== false
            ? `<span class="badge-active">Attivo</span>`
            : `<span class="badge-inactive">Non attivo</span>`;

        const toggleLabel =
          operator.isActive !== false ? "Disattiva" : "Riattiva";

        return `
          <tr>
            <td>${escapeHtml(operator.cognome || "-")}</td>
            <td>${escapeHtml(operator.nome || "-")}</td>
            <td>${escapeHtml(operator.idOperatore || "-")}</td>
            <td>${escapeHtml(operator.idCdc || "-")}</td>
            <td>${escapeHtml(operator.lineaProduzione || "-")}</td>
            <td>${escapeHtml(operator.macroLineaProduzione || "-")}</td>
            <td>${escapeHtml(operator.postazione || "-")}</td>
            <td>${escapeHtml(String(Number(operator.oreStandard) || 0))}</td>
            <td>${badge}</td>
            <td>
              <div class="table-actions">
                <button
                  class="btn btn-secondary btn-small"
                  type="button"
                  data-action="edit-operator"
                  data-id="${escapeAttribute(String(operator.id))}"
                >
                  Modifica
                </button>
                <button
                  class="btn btn-secondary btn-small"
                  type="button"
                  data-action="toggle-operator"
                  data-id="${escapeAttribute(String(operator.id))}"
                >
                  ${escapeHtml(toggleLabel)}
                </button>
              </div>
            </td>
            


          </tr>
        `;
      })
      .join("");
  }

  function handleOperatorsAdminTableClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    if (!canManageOperators()) {
      showBox(dom.operatorsAdminMessage, "Non sei autorizzato a gestire gli operatori.", "error");
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (!id) return;

    const operator = state.operators.find((item) => {
      return String(item.id) === String(id);
    });

    if (!operator) {
      showBox(dom.operatorsAdminMessage, "Operatore non trovato.", "error");
      return;
    }

    if (action === "edit-operator") {
      openOperatorModalForEdit(operator);
      return;
    }

    if (action === "toggle-operator") {
      handleToggleOperatorActive(operator);
    }
  }

  function openOperatorModalForCreate() {
    if (!dom.operatorModal) return;

    if (dom.operatorModalTitle) {
      dom.operatorModalTitle.textContent = "Nuovo operatore";
    }

    setValue(dom.operatorFormId, "");
    setValue(dom.operatorSurnameInput, "");
    setValue(dom.operatorNameInput, "");
    setValue(dom.operatorIdCodeInput, "");
    setValue(dom.operatorCdcInput, "");
    setValue(dom.operatorLineInput, "");
    setValue(dom.operatorMacroLineInput, "");
    setValue(dom.operatorStationInput, "");
    setValue(dom.operatorStandardHoursInput, "0");
    setValue(dom.operatorPlantInput, "");
    setValue(dom.operatorIsActiveInput, "true");

    hideBox(dom.operatorModalMessage);

    dom.operatorModal.classList.remove("hidden");
    dom.operatorModal.setAttribute("aria-hidden", "false");
  }

  function openOperatorModalForEdit(operator) {
    if (!dom.operatorModal) return;

    if (dom.operatorModalTitle) {
      dom.operatorModalTitle.textContent = "Modifica operatore";
    }

    setValue(dom.operatorFormId, String(operator.id || ""));
    setValue(dom.operatorSurnameInput, operator.cognome || "");
    setValue(dom.operatorNameInput, operator.nome || "");
    setValue(dom.operatorIdCodeInput, operator.idOperatore || "");
    setValue(dom.operatorCdcInput, operator.idCdc || "");
    setValue(dom.operatorLineInput, operator.lineaProduzione || "");
    setValue(dom.operatorMacroLineInput, operator.macroLineaProduzione || "");
    setValue(dom.operatorStationInput, operator.postazione || "");
    setValue(dom.operatorStandardHoursInput, String(Number(operator.oreStandard) || 0));
    setValue(dom.operatorPlantInput, operator.stabilimento || "");
    setValue(dom.operatorIsActiveInput, operator.isActive !== false ? "true" : "false");

    hideBox(dom.operatorModalMessage);

    dom.operatorModal.classList.remove("hidden");
    dom.operatorModal.setAttribute("aria-hidden", "false");
  }

  function closeOperatorModal() {
    if (!dom.operatorModal) return;

    dom.operatorModal.classList.add("hidden");
    dom.operatorModal.setAttribute("aria-hidden", "true");
    hideBox(dom.operatorModalMessage);
  }

  async function handleSaveOperator() {
    if (!canManageOperators()) {
      showBox(dom.operatorModalMessage, "Non sei autorizzato a gestire gli operatori.", "error");
      return;
    }

    const payload = getOperatorFormPayload();

    if (!payload.ok) {
      showBox(dom.operatorModalMessage, payload.message, "error");
      return;
    }

    setButtonLoading(dom.saveOperatorBtn, true, "Salvataggio...");

    try {
      const operatorId = dom.operatorFormId ? dom.operatorFormId.value : "";

      let response;

      if (operatorId) {
        response = await client
          .from("operators")
          .update({
            cognome: payload.data.cognome,
            nome: payload.data.nome,
            idoperatore: payload.data.idoperatore,
            idcdc: payload.data.idcdc,
            lineaproduzione: payload.data.lineaproduzione,
            macrolineaproduzione: payload.data.macrolineaproduzione,
            postazione: payload.data.postazione,
            orestandard: payload.data.orestandard,
            stabilimento: payload.data.stabilimento,
            is_active: payload.data.is_active,
            updated_by: state.user.id
          })
          .eq("id", operatorId)
          .select();
      } else {
        response = await client
          .from("operators")
          .insert({
            cognome: payload.data.cognome,
            nome: payload.data.nome,
            idoperatore: payload.data.idoperatore,
            idcdc: payload.data.idcdc,
            lineaproduzione: payload.data.lineaproduzione,
            macrolineaproduzione: payload.data.macrolineaproduzione,
            postazione: payload.data.postazione,
            orestandard: payload.data.orestandard,
            stabilimento: payload.data.stabilimento,
            is_active: payload.data.is_active,
            created_by: state.user.id,
            updated_by: state.user.id
          })
          .select();
      }

      if (response.error) {
        throw response.error;
      }

      await loadOperatorsFromDatabase();

      renderAll();

      closeOperatorModal();
    closeAttendanceRowModal();

      showBox(dom.operatorsAdminMessage, "Operatore salvato correttamente.", "success");
    } catch (error) {
      console.error("Errore salvataggio operatore:", error);
      showBox(
        dom.operatorModalMessage,
        error.message || "Errore durante il salvataggio operatore.",
        "error"
      );
    } finally {
      setButtonLoading(dom.saveOperatorBtn, false, "Salva operatore");
    }
  }

  function getOperatorFormPayload() {
    const cognome = (dom.operatorSurnameInput ? dom.operatorSurnameInput.value : "").trim();
    const nome = (dom.operatorNameInput ? dom.operatorNameInput.value : "").trim();
    const idoperatore = (dom.operatorIdCodeInput ? dom.operatorIdCodeInput.value : "").trim();
    const idcdc = (dom.operatorCdcInput ? dom.operatorCdcInput.value : "").trim();
    const lineaproduzione = (dom.operatorLineInput ? dom.operatorLineInput.value : "").trim();
    const macrolineaproduzione = (dom.operatorMacroLineInput ? dom.operatorMacroLineInput.value : "").trim();
    const postazione = (dom.operatorStationInput ? dom.operatorStationInput.value : "").trim();
    const orestandard = toNonNegativeNumber(dom.operatorStandardHoursInput ? dom.operatorStandardHoursInput.value : 0);
    const stabilimento = (dom.operatorPlantInput ? dom.operatorPlantInput.value : "").trim();
    const is_active = String(dom.operatorIsActiveInput ? dom.operatorIsActiveInput.value : "true") === "true";

    if (!cognome) {
      return { ok: false, message: "Il cognome è obbligatorio." };
    }

    if (!nome) {
      return { ok: false, message: "Il nome è obbligatorio." };
    }

    if (!idoperatore) {
      return { ok: false, message: "L'ID operatore è obbligatorio." };
    }

    if (!lineaproduzione) {
      return { ok: false, message: "La linea di produzione è obbligatoria." };
    }

    return {
      ok: true,
      data: {
        cognome,
        nome,
        idoperatore,
        idcdc,
        lineaproduzione,
        macrolineaproduzione,
        postazione,
        orestandard,
        stabilimento,
        is_active
      }
    };
  }

  async function handleToggleOperatorActive(operator) {
    if (!canManageOperators()) {
      showBox(dom.operatorsAdminMessage, "Non sei autorizzato a gestire gli operatori.", "error");
      return;
    }

    try {
      const response = await client
        .from("operators")
        .update({
          is_active: !(operator.isActive !== false),
          updated_by: state.user.id
        })
        .eq("id", operator.id)
        .select();

      if (response.error) {
        throw response.error;
      }

      await loadOperatorsFromDatabase();

      renderAll();

      const text =
        operator.isActive !== false
          ? "Operatore disattivato correttamente."
          : "Operatore riattivato correttamente.";

      showBox(dom.operatorsAdminMessage, text, "success");
    } catch (error) {
      console.error("Errore cambio stato operatore:", error);
      showBox(
        dom.operatorsAdminMessage,
        error.message || "Errore durante il cambio stato operatore.",
        "error"
      );
    }
  }


  async function loadAttendanceAdminSessions() {
    if (!client || !canManageAttendance()) return;
    try {
      let query = client
        .from("attendance_sessions")
        .select("*")
        .order("work_date", { ascending: false })
        .order("line_name", { ascending: true });
      if (state.attendanceAdmin.dateFilter) query = query.eq("work_date", state.attendanceAdmin.dateFilter);
      if (state.attendanceAdmin.lineFilter) query = query.eq("line_name", state.attendanceAdmin.lineFilter);
      const response = await query;
      if (response.error) throw response.error;
      state.attendanceAdmin.sessions = Array.isArray(response.data) ? response.data : [];
      const lines = unique(state.attendanceAdmin.sessions.map((session) => session.line_name).filter(Boolean)).sort((a, b) => a.localeCompare(b, "it"));
      if (dom.attendanceAdminLineFilter) {
        const current = state.attendanceAdmin.lineFilter || "";
        dom.attendanceAdminLineFilter.innerHTML = `<option value="">Tutte le linee</option>` + lines.map((line) => `<option value="${escapeAttribute(line)}">${escapeHtml(line)}</option>`).join("");
        dom.attendanceAdminLineFilter.value = current;
      }
      if (state.attendanceAdmin.selectedSessionId) {
        const stillExists = state.attendanceAdmin.sessions.some((item) => String(item.id) === String(state.attendanceAdmin.selectedSessionId));
        if (!stillExists) {
          state.attendanceAdmin.selectedSessionId = null;
          state.attendanceAdmin.rows = [];
        }
      }
    } catch (error) {
      console.error("Errore riepilogo presenze:", error);
      showBox(dom.attendanceAdminMessage, error.message || "Errore caricamento riepilogo presenze.", "error");
    }
  }
  async function loadAttendanceAdminRows(sessionId) {
    if (!client || !canManageAttendance() || !sessionId) return;
    try {
      const response = await client
        .from("attendance_rows")
        .select("*")
        .eq("attendance_session_id", sessionId)
        .order("sort_order", { ascending: true });
      if (response.error) throw response.error;
      state.attendanceAdmin.selectedSessionId = sessionId;
      state.attendanceAdmin.rows = (Array.isArray(response.data) ? response.data : []).map((row) => ({
        ...row,
        lavorazioni: parseLavorazioni(row.lavorazioni)
      }));
    } catch (error) {
      console.error("Errore dettaglio presenze:", error);
      showBox(dom.attendanceAdminMessage, error.message || "Errore caricamento dettaglio presenze.", "error");
    }
  }
  function renderAttendanceAdmin() {
    if (!dom.attendanceAdminView || !canManageAttendance()) return;
    if (dom.attendanceAdminDateFilter) dom.attendanceAdminDateFilter.value = state.attendanceAdmin.dateFilter || "";
    if (dom.attendanceAdminSearchInput) dom.attendanceAdminSearchInput.value = state.attendanceAdmin.searchText || "";
    renderAttendanceAdminSessions();
    renderAttendanceAdminRows();
  }
  function renderAttendanceAdminSessions() {
    if (!dom.attendanceAdminSessionsBody || !dom.attendanceAdminStats) return;
    const sessions = state.attendanceAdmin.sessions || [];
    dom.attendanceAdminStats.innerHTML = `
      <div class="summary-item"><span class="label">Giornate</span><span class="value">${escapeHtml(String(sessions.length))}</span></div>
      <div class="summary-item"><span class="label">Filtro data</span><span class="value">${escapeHtml(state.attendanceAdmin.dateFilter || "Tutte")}</span></div>
      <div class="summary-item"><span class="label">Filtro linea</span><span class="value">${escapeHtml(state.attendanceAdmin.lineFilter || "Tutte")}</span></div>
    `;
    if (!sessions.length) {
      dom.attendanceAdminSessionsBody.innerHTML = `<tr><td colspan="5"><div class="muted">Nessuna giornata salvata trovata.</div></td></tr>`;
      return;
    }
    dom.attendanceAdminSessionsBody.innerHTML = sessions.map((session) => {
      const isSelected = String(session.id) === String(state.attendanceAdmin.selectedSessionId);
      return `
        <tr class="${isSelected ? "is-selected" : ""}">
          <td>${escapeHtml(session.work_date || "-")}</td>
          <td>${escapeHtml(session.line_name || "-")}</td>
          <td>${escapeHtml("-")}</td>
          <td>${escapeHtml(formatMinutes(Number(session.base_net_minutes) || 0))}</td>
          <td><button class="btn btn-secondary btn-small" type="button" data-action="load-session" data-id="${escapeAttribute(String(session.id))}">Apri dettaglio</button></td>
        </tr>
      `;
    }).join("");
  }
  function renderAttendanceAdminRows() {
    if (!dom.attendanceAdminRowsBody || !dom.attendanceAdminDetailTitle) return;
    const session = (state.attendanceAdmin.sessions || []).find((item) => String(item.id) === String(state.attendanceAdmin.selectedSessionId));
    const rows = state.attendanceAdmin.rows || [];
    const search = normalizeText(state.attendanceAdmin.searchText || "");
    const filtered = rows.filter((row) => {
      const haystack = normalizeText([row.cognome, row.nome, row.line_day, row.postazione, ...(parseLavorazioni(row.lavorazioni))].join(" "));
      return !search || haystack.includes(search);
    });
    const totalFinal = filtered.reduce((acc, row) => acc + (Number(row.final_min) || 0), 0);
    dom.attendanceAdminDetailTitle.innerHTML = `
      <div class="summary-item"><span class="label">Dettaglio</span><span class="value">${escapeHtml(session ? (session.work_date + " - " + session.line_name) : "Seleziona una giornata")}</span></div>
      <div class="summary-item"><span class="label">Righe</span><span class="value">${escapeHtml(String(filtered.length))}</span></div>
      <div class="summary-item"><span class="label">Finali filtrati</span><span class="value">${escapeHtml(formatMinutes(totalFinal))}</span></div>
    `;
    if (!state.attendanceAdmin.selectedSessionId) {
      dom.attendanceAdminRowsBody.innerHTML = `<tr><td colspan="8"><div class="muted">Apri una giornata per vedere il dettaglio.</div></td></tr>`;
      return;
    }
    if (!filtered.length) {
      dom.attendanceAdminRowsBody.innerHTML = `<tr><td colspan="8"><div class="muted">Nessuna riga trovata.</div></td></tr>`;
      return;
    }
    dom.attendanceAdminRowsBody.innerHTML = filtered.map((row) => {
      const operatorLabel = [row.cognome, row.nome].filter(Boolean).join(" ").trim() || "Operatore";
      const extras = `${Number(row.evento_min) || 0}/${Number(row.assemblea_min) || 0}/${Number(row.sciopero_min) || 0} min`;
      return `
        <tr>
          <td>${escapeHtml(operatorLabel)}</td>
          <td>${escapeHtml(row.line_day || "-")}</td>
          <td>${escapeHtml(row.postazione || "-")}</td>
          <td>${escapeHtml(formatWorksPreview(parseLavorazioni(row.lavorazioni)))}</td>
          <td>${escapeHtml(minutesToHoursString(Number(row.work_min) || 0))}</td>
          <td>${escapeHtml(formatMinutes(Number(row.final_min) || 0))}</td>
          <td>${escapeHtml(extras)}</td>
          <td><button class="btn btn-secondary btn-small" type="button" data-action="edit-attendance-row" data-id="${escapeAttribute(String(row.id))}">Modifica</button></td>
        </tr>
      `;
    }).join("");
  }
  async function handleAttendanceAdminSessionsClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "load-session") {
      await loadAttendanceAdminRows(button.dataset.id);
      renderAttendanceAdmin();
    }
  }
  function handleAttendanceAdminRowsClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "edit-attendance-row") {
      const row = (state.attendanceAdmin.rows || []).find((item) => String(item.id) === String(button.dataset.id));
      if (row) openAttendanceRowModal(row);
    }
  }
  function openAttendanceRowModal(row) {
    if (!dom.attendanceRowModal) return;
    state.attendanceAdmin.editRow = { ...row, lavorazioni: parseLavorazioni(row.lavorazioni) };
    const operatorLabel = [row.cognome, row.nome].filter(Boolean).join(" ").trim() || "Operatore";
    setValue(dom.attendanceRowFormId, String(row.id || ""));
    setValue(dom.attendanceRowSessionId, String(row.attendance_session_id || ""));
    setValue(dom.attendanceRowOperatorInput, operatorLabel);
    setValue(dom.attendanceRowLineInput, row.line_day || "");
    setValue(dom.attendanceRowWorkHoursInput, minutesToHoursString(Number(row.work_min) || 0));
    setValue(dom.attendanceRowEventoInput, String(Number(row.evento_min) || 0));
    setValue(dom.attendanceRowAssembleaInput, String(Number(row.assemblea_min) || 0));
    setValue(dom.attendanceRowScioperoInput, String(Number(row.sciopero_min) || 0));
    const options = getStationOptions(row.line_day || "", row.postazione || "");
    if (dom.attendanceRowStationInput) {
      dom.attendanceRowStationInput.innerHTML = options.map((station) => `<option value="${escapeAttribute(station)}" ${station === row.postazione ? "selected" : ""}>${escapeHtml(station)}</option>`).join("");
    }
    renderAttendanceRowWorksBox(false);
    hideBox(dom.attendanceRowModalMessage);
    dom.attendanceRowModal.classList.remove("hidden");
    dom.attendanceRowModal.setAttribute("aria-hidden", "false");
  }
  function renderAttendanceRowWorksBox(forceReset) {
    if (!dom.attendanceRowWorksBox || !state.attendanceAdmin.editRow) return;
    const row = state.attendanceAdmin.editRow;
    row.postazione = dom.attendanceRowStationInput ? dom.attendanceRowStationInput.value : row.postazione;
    const options = getWorkOptions(row.line_day || "", row.postazione || "");
    if (forceReset) row.lavorazioni = [...options];
    const selected = parseLavorazioni(row.lavorazioni);
    if (!options.length) {
      dom.attendanceRowWorksBox.innerHTML = `<div class="muted">Nessuna lavorazione configurata per questa postazione.</div>`;
      return;
    }
    const selectedKeys = new Set(selected.map(workKey));
    dom.attendanceRowWorksBox.innerHTML = options.map((work) => {
      const checked = selectedKeys.has(workKey(work)) ? "checked" : "";
      return `<label class="work-check"><input type="checkbox" ${checked} data-work-name="${escapeAttribute(work.nome)}" data-carrello="${escapeAttribute(work.carrello)}"><span class="work-check-text"><strong>${escapeHtml(work.nome)}</strong><em>${carrelloText}</em></span></label>`;
    }).join("");
  }
  function closeAttendanceRowModal() {
    if (!dom.attendanceRowModal) return;
    dom.attendanceRowModal.classList.add("hidden");
    dom.attendanceRowModal.setAttribute("aria-hidden", "true");
    state.attendanceAdmin.editRow = null;
    hideBox(dom.attendanceRowModalMessage);
  }
  async function handleSaveAttendanceRowEdit() {
    if (!canManageAttendance() || !state.attendanceAdmin.editRow) return;
    const rowId = dom.attendanceRowFormId ? dom.attendanceRowFormId.value : "";
    const sessionId = dom.attendanceRowSessionId ? dom.attendanceRowSessionId.value : "";
    const workMin = hoursStringToMinutes(dom.attendanceRowWorkHoursInput ? dom.attendanceRowWorkHoursInput.value : 0);
    const eventoMin = toNonNegativeInt(dom.attendanceRowEventoInput ? dom.attendanceRowEventoInput.value : 0);
    const assembleaMin = toNonNegativeInt(dom.attendanceRowAssembleaInput ? dom.attendanceRowAssembleaInput.value : 0);
    const scioperoMin = toNonNegativeInt(dom.attendanceRowScioperoInput ? dom.attendanceRowScioperoInput.value : 0);
    const postazione = dom.attendanceRowStationInput ? dom.attendanceRowStationInput.value : "";
    const checkedWorks = dom.attendanceRowWorksBox ? Array.from(dom.attendanceRowWorksBox.querySelectorAll("input[type='checkbox']:checked")).map((input) => normalizeWorkItem({ nome: input.dataset.workName || "", carrello: input.dataset.carrello || "" })).filter((item) => item.nome) : [];
    const session = (state.attendanceAdmin.sessions || []).find((item) => String(item.id) === String(sessionId));
    const finalMin = calculateFinalMinutes(workMin, Number(session && session.snack_min) || 0, Number(session && session.stops_min) || 0, eventoMin, assembleaMin, scioperoMin);
    setButtonLoading(dom.saveAttendanceRowBtn, true, "Salvataggio...");
    try {
      const response = await client
        .from("attendance_rows")
        .update({
          postazione,
          work_min: workMin,
          evento_min: eventoMin,
          assemblea_min: assembleaMin,
          sciopero_min: scioperoMin,
          final_min: finalMin,
          lavorazioni: checkedWorks,
          dirty: true
        })
        .eq("id", rowId)
        .select();
      if (response.error) throw response.error;
      await loadAttendanceAdminRows(sessionId);
      renderAttendanceAdmin();
      closeAttendanceRowModal();
      showBox(dom.attendanceAdminMessage, "Presenza modificata correttamente.", "success");
    } catch (error) {
      console.error("Errore modifica presenza:", error);
      showBox(dom.attendanceRowModalMessage, error.message || "Errore durante il salvataggio modifica.", "error");
    } finally {
      setButtonLoading(dom.saveAttendanceRowBtn, false, "Salva modifica");
    }
  }
  function parseLavorazioni(value) {
    if (Array.isArray(value)) {
      return value.map((item) => normalizeWorkItem(item)).filter((item) => item.nome);
    }
    if (!value) return [];
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.map((item) => normalizeWorkItem(item)).filter((item) => item.nome)
          : [];
      } catch (error) {
        return value
          .split(",")
          .map((item) => normalizeWorkItem(item.trim()))
          .filter((item) => item.nome);
      }
    }
    return [];
  }




  async function handleAddAppUser() {
    if (!client || !canManageOperators()) return;
    const email = (dom.newAppUserEmailInput ? dom.newAppUserEmailInput.value : "").trim();
    const userId = (dom.newAppUserIdInput ? dom.newAppUserIdInput.value : "").trim();
    const role = (dom.newAppUserRoleInput ? dom.newAppUserRoleInput.value : "user").trim() || "user";
    if (!email || !userId) {
      showBox(dom.usersAdminMessage, "Inserisci email e UUID Supabase Auth dell'utente.", "error");
      return;
    }
    const isAdmin = normalizeText(role) === "ADMIN";
    setButtonLoading(dom.addAppUserBtn, true, "Aggiungo...");
    hideBox(dom.usersAdminMessage);
    try {
      const response = await client
        .from("app_users")
        .upsert({
          user_id: userId,
          email: email,
          role: isAdmin ? "admin" : "user",
          can_manage_operators: isAdmin,
          is_active: true
        }, { onConflict: "user_id" })
        .select();
      if (response.error) throw response.error;
      if (dom.newAppUserEmailInput) dom.newAppUserEmailInput.value = "";
      if (dom.newAppUserIdInput) dom.newAppUserIdInput.value = "";
      if (dom.newAppUserRoleInput) dom.newAppUserRoleInput.value = "user";
      await loadUsersAdmin();
      showBox(dom.usersAdminMessage, "Utente aggiunto/aggiornato correttamente in Gestione applicazione.", "success");
    } catch (error) {
      console.error("Errore aggiunta utente:", error);
      showBox(dom.usersAdminMessage, error.message || "Errore durante l'aggiunta utente.", "error");
    } finally {
      setButtonLoading(dom.addAppUserBtn, false, "Aggiungi utente a Gestione applicazione");
    }
  }

  async function loadUsersAdmin() {
    if (!client || !canManageOperators()) return;
    hideBox(dom.usersAdminMessage);
    setButtonLoading(dom.refreshUsersAdminBtn, true, "Caricamento...");
    try {
      const response = await client
        .from("app_users")
        .select("user_id,email,role,can_manage_operators,is_active,created_at,updated_at")
        .order("email", { ascending: true });
      if (response.error) throw response.error;
      state.usersAdmin.rows = Array.isArray(response.data) ? response.data : [];
      renderUsersAdmin();
      showBox(dom.usersAdminMessage, "Utenti caricati da app_users. Se mancano utenti, aggiungili con email e UUID da Authentication > Users.", "success");
    } catch (error) {
      console.error("Errore caricamento utenti:", error);
      showBox(dom.usersAdminMessage, error.message || "Errore caricamento utenti.", "error");
    } finally {
      setButtonLoading(dom.refreshUsersAdminBtn, false, "Aggiorna utenti");
    }
  }
  function renderUsersAdmin() {
    if (!dom.usersAdminTableBody || !canManageOperators()) return;
    const rows = state.usersAdmin && Array.isArray(state.usersAdmin.rows) ? state.usersAdmin.rows : [];
    if (!rows.length) {
      dom.usersAdminTableBody.innerHTML = `<tr><td colspan="5"><div class="muted">Premi “Aggiorna utenti” per caricare gli utenti applicazione.</div></td></tr>`;
      return;
    }
    dom.usersAdminTableBody.innerHTML = rows.map((user) => {
      const isAdmin = normalizeText(user.role) === "ADMIN" || user.can_manage_operators === true;
      const isActive = user.is_active === true;
      return `
        <tr>
          <td>${escapeHtml(user.email || "-")}</td>
          <td>${escapeHtml(user.role || "user")}</td>
          <td>${isAdmin ? `<span class="badge-active">Admin</span>` : `<span class="badge-inactive">User</span>`}</td>
          <td>${isActive ? `<span class="badge-active">Attivo</span>` : `<span class="badge-inactive">Non attivo</span>`}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-small" type="button" data-action="toggle-user-admin" data-id="${escapeAttribute(String(user.user_id))}">${isAdmin ? "Rendi user" : "Rendi admin"}</button>
              <button class="btn btn-secondary btn-small" type="button" data-action="toggle-user-active" data-id="${escapeAttribute(String(user.user_id))}">${isActive ? "Disattiva" : "Riattiva"}</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }
  async function handleUsersAdminClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button || !canManageOperators()) return;
    const userId = button.dataset.id;
    const action = button.dataset.action;
    const user = (state.usersAdmin.rows || []).find((item) => String(item.user_id) === String(userId));
    if (!user) return;
    let payload = {};
    if (action === "toggle-user-admin") {
      const isAdmin = normalizeText(user.role) === "ADMIN" || user.can_manage_operators === true;
      payload = {
        role: isAdmin ? "user" : "admin",
        can_manage_operators: !isAdmin,
        is_active: user.is_active === false ? false : true
      };
    } else if (action === "toggle-user-active") {
      payload = { is_active: !(user.is_active === true) };
    } else {
      return;
    }
    setButtonLoading(button, true, "Salvo...");
    try {
      const response = await client
        .from("app_users")
        .update(payload)
        .eq("user_id", userId)
        .select();
      if (response.error) throw response.error;
      await loadUsersAdmin();
      if (state.user && String(state.user.id) === String(userId)) {
        await loadCurrentUserProfile();
        renderPermissions();
      }
      showBox(dom.usersAdminMessage, "Permessi aggiornati correttamente.", "success");
    } catch (error) {
      console.error("Errore aggiornamento utente:", error);
      showBox(dom.usersAdminMessage, error.message || "Errore aggiornamento utente.", "error");
    } finally {
      setButtonLoading(button, false, action === "toggle-user-admin" ? "Aggiorna ruolo" : "Aggiorna stato");
    }
  }

  const APPLICATION_TABLES = {
    operators: { label: "Operatori", key: "id", order: "cognome" },
    app_users: { label: "Utenti / permessi", key: "user_id", order: "email" },
    attendance_sessions: { label: "Sessioni presenze", key: "id", order: "work_date" },
    attendance_rows: { label: "Righe presenze", key: "id", order: "sort_order" }
  };
  async function loadApplicationAdminTable() {
    if (!client || !canManageOperators()) return;
    const tableName = dom.applicationTableSelect ? dom.applicationTableSelect.value : "operators";
    const config = APPLICATION_TABLES[tableName];
    if (!config) return;
    state.applicationAdmin.activeTable = tableName;
    setButtonLoading(dom.loadApplicationTableBtn, true, "Caricamento...");
    hideBox(dom.applicationAdminMessage);
    try {
      let query = client.from(tableName).select("*").limit(200);
      if (config.order && tableName !== "attendance_rows") {
        query = query.order(config.order, { ascending: tableName === "attendance_sessions" ? false : true });
      }
      const response = await query;
      if (response.error) throw response.error;
      state.applicationAdmin.rows = Array.isArray(response.data) ? response.data : [];
      state.applicationAdmin.columns = buildColumnsFromRows(state.applicationAdmin.rows);
      renderApplicationAdminTable();
    renderUsersAdmin();
      showBox(dom.applicationAdminMessage, "Tabella caricata: " + config.label + ".", "success");
    } catch (error) {
      console.error("Errore caricamento tabella applicazione:", error);
      showBox(dom.applicationAdminMessage, error.message || "Errore caricamento tabella.", "error");
    } finally {
      setButtonLoading(dom.loadApplicationTableBtn, false, "Carica tabella");
    }
  }
  function buildColumnsFromRows(rows) {
    const columns = [];
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!columns.includes(key)) columns.push(key);
      });
    });
    return columns.slice(0, 12);
  }
  function renderApplicationAdminTable() {
    if (!dom.applicationAdminTableWrap || !dom.applicationAdminTableHead || !dom.applicationAdminTableBody) return;
    const rows = state.applicationAdmin.rows || [];
    const columns = state.applicationAdmin.columns || [];
    dom.applicationAdminTableWrap.classList.toggle("hidden", !rows.length);
    if (!rows.length) {
      dom.applicationAdminTableHead.innerHTML = "";
      dom.applicationAdminTableBody.innerHTML = "";
      return;
    }
    dom.applicationAdminTableHead.innerHTML = `<tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}<th>Azioni</th></tr>`;
    dom.applicationAdminTableBody.innerHTML = rows.map((row, index) => {
      return `<tr>${columns.map((column) => `<td>${escapeHtml(formatGenericCell(row[column]))}</td>`).join("")}<td><button type="button" class="btn btn-secondary btn-small" data-action="edit-application-row" data-index="${index}">Modifica JSON</button></td></tr>`;
    }).join("");
  }
  function formatGenericCell(value) {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value).slice(0, 120);
    return String(value).slice(0, 120);
  }
  async function handleApplicationAdminClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button || button.dataset.action !== "edit-application-row") return;
    const index = Number(button.dataset.index);
    const row = state.applicationAdmin.rows[index];
    if (!row) return;
    const tableName = state.applicationAdmin.activeTable;
    const config = APPLICATION_TABLES[tableName];
    const keyField = config.key;
    const keyValue = row[keyField];
    if (!keyValue) {
      showBox(dom.applicationAdminMessage, "Impossibile modificare: chiave record non trovata.", "error");
      return;
    }
    const edited = prompt("Modifica JSON record. Attenzione: devi lasciare un JSON valido.", JSON.stringify(row, null, 2));
    if (!edited) return;
    let parsed;
    try {
      parsed = JSON.parse(edited);
    } catch (error) {
      showBox(dom.applicationAdminMessage, "JSON non valido. Modifica annullata.", "error");
      return;
    }
    delete parsed[keyField];
    setButtonLoading(button, true, "Salvo...");
    try {
      const response = await client.from(tableName).update(parsed).eq(keyField, keyValue).select();
      if (response.error) throw response.error;
      await loadApplicationAdminTable();
      showBox(dom.applicationAdminMessage, "Record modificato correttamente.", "success");
    } catch (error) {
      console.error("Errore modifica record:", error);
      showBox(dom.applicationAdminMessage, error.message || "Errore modifica record.", "error");
    } finally {
      setButtonLoading(button, false, "Modifica JSON");
    }
  }

  function openConfirmModal() {
    if (!dom.confirmModal || !dom.confirmModalSummary) {
      handleConfirmSave();
      return;
    }

    const summary = buildSummaryByStation();

    dom.confirmModalSummary.innerHTML = summary
      .map((item) => {
        const namesText = item.names.length ? item.names.join(", ") : "-";
        const extraClass = item.isTotal ? " confirm-total" : "";

        return `
          <div class="confirm-card${extraClass}">
            <h3 class="confirm-card-title">${escapeHtml(item.title)}</h3>

            <div class="confirm-kpis">
              <div class="confirm-kpi">
                <span class="confirm-kpi-label">Operatori</span>
                <span class="confirm-kpi-value">${escapeHtml(String(item.operatorCount))}</span>
              </div>

              <div class="confirm-kpi">
                <span class="confirm-kpi-label">Ore lavorate</span>
                <span class="confirm-kpi-value">${escapeHtml(formatMinutes(item.workMin))}</span>
              </div>

              <div class="confirm-kpi">
                <span class="confirm-kpi-label">Finali</span>
                <span class="confirm-kpi-value">${escapeHtml(formatMinutes(item.finalMin))}</span>
              </div>

              <div class="confirm-kpi">
                <span class="confirm-kpi-label">Eventi / Ass. / Sciop.</span>
                <span class="confirm-kpi-value">
                  ${escapeHtml(item.eventoMin + " / " + item.assembleaMin + " / " + item.scioperoMin + " min")}
                </span>
              </div>
            </div>

            <div class="confirm-names">
              <strong>Nominativi:</strong> ${escapeHtml(namesText)}
            </div>
          </div>
        `;
      })
      .join("");

    dom.confirmModal.classList.remove("hidden");
    dom.confirmModal.setAttribute("aria-hidden", "false");
  }

  function closeConfirmModal() {
    if (!dom.confirmModal) return;

    dom.confirmModal.classList.add("hidden");
    dom.confirmModal.setAttribute("aria-hidden", "true");
  }

  function buildSummaryByStation() {
    const groups = new Map();

    state.rows.forEach((row) => {
      const key = row.postazione || "Senza postazione";

      if (!groups.has(key)) {
        groups.set(key, {
          title: key,
          operatorCount: 0,
          workMin: 0,
          finalMin: 0,
          eventoMin: 0,
          assembleaMin: 0,
          scioperoMin: 0,
          names: [],
          isTotal: false
        });
      }

      const group = groups.get(key);

      group.operatorCount += 1;
      group.workMin += Number(row.work_min) || 0;
      group.finalMin += Number(row.final_min) || 0;
      group.eventoMin += Number(row.evento_min) || 0;
      group.assembleaMin += Number(row.assemblea_min) || 0;
      group.scioperoMin += Number(row.sciopero_min) || 0;

      const fullName =
        [row.cognome, row.nome].filter(Boolean).join(" ").trim() ||
        "Operatore";

      group.names.push(fullName);
    });

    const results = Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "it")
    );

    const total = results.reduce(
      (acc, item) => {
        acc.operatorCount += item.operatorCount;
        acc.workMin += item.workMin;
        acc.finalMin += item.finalMin;
        acc.eventoMin += item.eventoMin;
        acc.assembleaMin += item.assembleaMin;
        acc.scioperoMin += item.scioperoMin;
        acc.names.push(...item.names);
        return acc;
      },
      {
        title: "Totale giornata",
        operatorCount: 0,
        workMin: 0,
        finalMin: 0,
        eventoMin: 0,
        assembleaMin: 0,
        scioperoMin: 0,
        names: [],
        isTotal: true
      }
    );

    return [...results, total];
  }

  function readSetupFromForm() {
    state.setup.lineName = dom.lineSelect ? dom.lineSelect.value : "";
    state.setup.workDate = dom.workDate ? dom.workDate.value : "";
    state.setup.startTime = dom.startTime ? dom.startTime.value : "";
    state.setup.endTime = dom.endTime ? dom.endTime.value : "";

    state.setup.lunchMin = String(
      toNonNegativeInt(dom.lunchMin ? dom.lunchMin.value : 0)
    );

    state.setup.snackMin = String(
      toNonNegativeInt(dom.snackMin ? dom.snackMin.value : 0)
    );

    state.setup.stopsMin = String(
      toNonNegativeInt(dom.stopsMin ? dom.stopsMin.value : 0)
    );

    state.setup.stopsNote = dom.stopsNote ? dom.stopsNote.value : "";
    state.setup.globalEventoMin = String(toNonNegativeInt(dom.globalEventoMin ? dom.globalEventoMin.value : 0));
    state.setup.globalAssembleaMin = String(toNonNegativeInt(dom.globalAssembleaMin ? dom.globalAssembleaMin.value : 0));
    state.setup.globalScioperoMin = String(toNonNegativeInt(dom.globalScioperoMin ? dom.globalScioperoMin.value : 0));
    state.setup.globalFlessibilitaHours = String(toNonNegativeNumber(dom.globalFlessibilitaHours ? dom.globalFlessibilitaHours.value : 0));

    const dayMinutes = minutesBetweenTimes(
      state.setup.startTime,
      state.setup.endTime
    );

    const lunchMin = toNonNegativeInt(state.setup.lunchMin);
    const snackMin = toNonNegativeInt(state.setup.snackMin);
    const stopsMin = toNonNegativeInt(state.setup.stopsMin);

    state.setup.dayDurationMinutes = dayMinutes > 0 ? dayMinutes : 0;
    state.setup.baseWorkMinutes = Math.max(
      state.setup.dayDurationMinutes - lunchMin,
      0
    );
    state.setup.baseNetMinutes = Math.max(
      state.setup.baseWorkMinutes - snackMin - stopsMin,
      0
    );
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.setup.lineName) {
        return {
          ok: false,
          message: "Seleziona una linea di produzione."
        };
      }
      return { ok: true };
    }

    if (step === 2) {
      if (!state.setup.workDate || !state.setup.startTime || !state.setup.endTime) {
        return {
          ok: false,
          message: "Data, orario di inizio e orario di fine sono obbligatori."
        };
      }
      const dayMinutes = minutesBetweenTimes(
        state.setup.startTime,
        state.setup.endTime
      );
      if (!Number.isFinite(dayMinutes) || dayMinutes <= 0) {
        return {
          ok: false,
          message: "L'orario di fine deve essere successivo all'orario di inizio."
        };
      }
      state.setup.dayDurationMinutes = dayMinutes;
      state.setup.baseWorkMinutes = Math.max(dayMinutes - toNonNegativeInt(state.setup.lunchMin), 0);
      state.setup.baseNetMinutes = Math.max(
        state.setup.baseWorkMinutes - toNonNegativeInt(state.setup.snackMin) - toNonNegativeInt(state.setup.stopsMin),
        0
      );
      return { ok: true };
    }

    if (step === 3) {
      const previous = validateStep(2);
      if (!previous.ok) return previous;
      const lunchMin = toNonNegativeInt(state.setup.lunchMin);
      const snackMin = toNonNegativeInt(state.setup.snackMin);
      const stopsMin = toNonNegativeInt(state.setup.stopsMin);
      const dayMinutes = minutesBetweenTimes(
        state.setup.startTime,
        state.setup.endTime
      );
      const baseWorkMinutes = dayMinutes - lunchMin;
      const baseNetMinutes = baseWorkMinutes - snackMin - stopsMin;
      if (baseWorkMinutes < 0) {
        return {
          ok: false,
          message: "La pausa pranzo non può rendere negative le ore lavorabili."
        };
      }
      if (baseNetMinutes < 0) {
        return {
          ok: false,
          message: "Il tempo produttivo netto non può essere negativo."
        };
      }
      state.setup.dayDurationMinutes = dayMinutes;
      state.setup.baseWorkMinutes = baseWorkMinutes;
      state.setup.baseNetMinutes = baseNetMinutes;
      return { ok: true };
    }

    if (step === 4) {
      return validateStep(3);
    }

    return { ok: true };
  }

  function validateAllRows() {
    const step1 = validateStep(1);

    if (!step1.ok) return step1;

    const step2 = validateStep(2);

    if (!step2.ok) return step2;

    for (let index = 0; index < state.rows.length; index += 1) {
      const row = state.rows[index];

      if ((Number(row.work_min) || 0) < 0) {
        return {
          ok: false,
          message: "Ore lavorate negative alla riga " + (index + 1) + "."
        };
      }

      if (
        (Number(row.evento_min) || 0) < 0 ||
        (Number(row.assemblea_min) || 0) < 0 ||
        (Number(row.sciopero_min) || 0) < 0
      ) {
        return {
          ok: false,
          message: "Minuti negativi non consentiti alla riga " + (index + 1) + "."
        };
      }

      if ((Number(row.final_min) || 0) < 0) {
        return {
          ok: false,
          message: "Il tempo finale non può essere negativo alla riga " + (index + 1) + "."
        };
      }
    }

    return { ok: true };
  }

  function applyGlobalExtrasToRows() {
    const globalEventoMin = toNonNegativeInt(state.setup.globalEventoMin);
    const globalAssembleaMin = toNonNegativeInt(state.setup.globalAssembleaMin);
    const globalScioperoMin = toNonNegativeInt(state.setup.globalScioperoMin);
    const globalFlessibilitaHours = toNonNegativeNumber(state.setup.globalFlessibilitaHours);

    state.rows = state.rows.map((row) => {
      const isDuplicate = Boolean(row.is_duplicate) || (Number(row.ore_standard) === 0 && Number(row.base_ore_standard) === 0);
      const baseOreStandard = Number(row.base_ore_standard) || Number(row.ore_standard) || 0;
      const nextRow = {
        ...row,
        evento_min: globalEventoMin,
        assemblea_min: globalAssembleaMin,
        sciopero_min: globalScioperoMin,
        base_ore_standard: isDuplicate ? 0 : baseOreStandard,
        flessibilita_hours: isDuplicate ? 0 : globalFlessibilitaHours,
        is_duplicate: isDuplicate,
        ore_standard: isDuplicate ? 0 : (globalFlessibilitaHours > 0 ? globalFlessibilitaHours : baseOreStandard),
        dirty: true
      };

      nextRow.final_min = calculateFinalMinutes(
        Number(nextRow.work_min) || 0,
        Number(state.setup.snackMin) || 0,
        Number(state.setup.stopsMin) || 0,
        Number(nextRow.evento_min) || 0,
        Number(nextRow.assemblea_min) || 0,
        Number(nextRow.sciopero_min) || 0
      );
      return nextRow;
    });
  }

  function recalcAllRows() {
    state.rows = state.rows.map((row) => {
      const workMin =
        Number(row.work_min) || Number(state.setup.baseWorkMinutes) || 0;
      const isDuplicate = Boolean(row.is_duplicate) || (Number(row.ore_standard) === 0 && Number(row.base_ore_standard) === 0);
      const baseOreStandard = Number(row.base_ore_standard) || Number(row.ore_standard) || 0;
      const flexHours = isDuplicate ? 0 : toNonNegativeNumber(row.flessibilita_hours);

      return {
        ...row,
        line_day: state.setup.lineName,
        base_ore_standard: isDuplicate ? 0 : baseOreStandard,
        flessibilita_hours: flexHours,
        is_duplicate: isDuplicate,
        ore_standard: isDuplicate ? 0 : (flexHours > 0 ? flexHours : baseOreStandard),
        final_min: calculateFinalMinutes(
          workMin,
          Number(state.setup.snackMin) || 0,
          Number(state.setup.stopsMin) || 0,
          Number(row.evento_min) || 0,
          Number(row.assemblea_min) || 0,
          Number(row.sciopero_min) || 0
        )
      };
    });
  }

  function reorderRows() {
    state.rows = state.rows.map((row, index) => {
      return {
        ...row,
        sort_order: index + 1
      };
    });
  }

  function resetAfterSuccessfulSave() {
    const preservedUser = state.user;
    const preservedProfile = state.currentUserProfile;
    const preservedOperators = [...state.operators];
    const preservedSearchIndex = [...state.operatorSearchIndex];
    const preservedLastError = state.lastOperatorsLoadError;

    sessionStorage.removeItem(STORAGE_KEY);

    state.currentStep = 1;
    state.activeMainView = "attendance";
    state.activeView = "setup";
    state.user = preservedUser;
    state.currentUserProfile = preservedProfile;
    state.operators = preservedOperators;
    state.operatorSearchIndex = preservedSearchIndex;
    state.lastOperatorsLoadError = preservedLastError;

    state.setup = {
      lineName: "",
      workDate: "",
      startTime: "",
      endTime: "",
      lunchMin: "60",
      snackMin: "10",
      stopsMin: "0",
      stopsNote: "",
      globalEventoMin: "0",
      globalAssembleaMin: "0",
      globalScioperoMin: "0",
      globalFlessibilitaHours: "0",
      dayDurationMinutes: 0,
      baseWorkMinutes: 0,
      baseNetMinutes: 0
    };

    state.rows = [];

    hideBox(dom.authErrors);
    hideBox(dom.wizardErrors);
    hideBox(dom.rowsErrors);

    if (dom.addOperatorSearch) {
      dom.addOperatorSearch.value = "";
    }

    renderAll();
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

      if (!parsed || typeof parsed !== "object") return;

      state.currentStep = clampStep(parsed.currentStep);
      state.activeView = parsed.activeView === "rows" ? "rows" : "setup";

      if (parsed.setup && typeof parsed.setup === "object") {
        state.setup = {
          ...state.setup,
          ...parsed.setup,
          lunchMin: parsed.setup.lunchMin === undefined ? "60" : String(parsed.setup.lunchMin),
          snackMin: parsed.setup.snackMin === undefined ? "10" : String(parsed.setup.snackMin),
          globalEventoMin: parsed.setup.globalEventoMin === undefined ? "0" : String(parsed.setup.globalEventoMin),
          globalAssembleaMin: parsed.setup.globalAssembleaMin === undefined ? "0" : String(parsed.setup.globalAssembleaMin),
          globalScioperoMin: parsed.setup.globalScioperoMin === undefined ? "0" : String(parsed.setup.globalScioperoMin),
          globalFlessibilitaHours: parsed.setup.globalFlessibilitaHours === undefined ? "0" : String(parsed.setup.globalFlessibilitaHours)
        };
      }

      if (Array.isArray(parsed.rows)) {
        state.rows = parsed.rows.map((row, index) => {
          return {
            sort_order: index + 1,
            operator_id: row.operator_id === undefined ? null : row.operator_id,
            stabilimento: row.stabilimento || "",
            cognome: row.cognome || "",
            nome: row.nome || "",
            id_operatore: row.id_operatore || "",
            id_cdc: row.id_cdc || "",
            macro_linea_produzione: row.macro_linea_produzione || "",
            line_orig: row.line_orig || "",
            line_day: row.line_day || "",
            postazione: row.postazione || "",
            ore_standard: Number(row.ore_standard) || 0,
            base_ore_standard: row.base_ore_standard === undefined ? Number(row.ore_standard) || 0 : Number(row.base_ore_standard) || 0,
            flessibilita_hours: Number(row.flessibilita_hours) || 0,
            is_duplicate: Boolean(row.is_duplicate),
            work_min: Number(row.work_min) || 0,
            evento_min: Number(row.evento_min) || 0,
            assemblea_min: Number(row.assemblea_min) || 0,
            sciopero_min: Number(row.sciopero_min) || 0,
            final_min: Number(row.final_min) || 0,
            lavorazioni: Array.isArray(row.lavorazioni) ? row.lavorazioni.map((item) => normalizeWorkItem(item)).filter((item) => item.nome) : [],
            worksOpen: Boolean(row.worksOpen),
            extrasOpen: Boolean(row.extrasOpen),
            dirty: Boolean(row.dirty),
            removed: Boolean(row.removed)
          };
        });
      }
    } catch (error) {
      console.error("Errore restore state:", error);
    }
  }

  function clearState() {
    sessionStorage.removeItem(STORAGE_KEY);

    state.currentStep = 1;
    state.activeMainView = "attendance";
    state.activeView = "setup";
    state.user = null;
    state.currentUserProfile = null;
    state.operators = [];
    state.operatorSearchIndex = [];
    state.lastOperatorsLoadError = "";

    state.setup = {
      lineName: "",
      workDate: "",
      startTime: "",
      endTime: "",
      lunchMin: "60",
      snackMin: "10",
      stopsMin: "0",
      stopsNote: "",
      globalEventoMin: "0",
      globalAssembleaMin: "0",
      globalScioperoMin: "0",
      globalFlessibilitaHours: "0",
      dayDurationMinutes: 0,
      baseWorkMinutes: 0,
      baseNetMinutes: 0
    };

    state.rows = [];

    state.operatorsAdmin = {
      searchText: "",
      lineFilter: "",
      statusFilter: "active"
    };
    state.attendanceAdmin = {
      sessions: [],
      rows: [],
      selectedSessionId: null,
      dateFilter: "",
      lineFilter: "",
      searchText: "",
      editRow: null
    };

    hideBox(dom.authErrors);
    hideBox(dom.wizardErrors);
    hideBox(dom.rowsErrors);
    hideBox(dom.globalMessage);
    hideBox(dom.operatorsAdminMessage);
    hideBox(dom.operatorModalMessage);

    if (dom.emailInput) dom.emailInput.value = "";
    if (dom.passwordInput) dom.passwordInput.value = "";
    if (dom.addOperatorSearch) dom.addOperatorSearch.value = "";
    if (dom.operatorsSearchInput) dom.operatorsSearchInput.value = "";
    if (dom.operatorsLineFilter) dom.operatorsLineFilter.value = "";
    if (dom.operatorsStatusFilter) dom.operatorsStatusFilter.value = "active";
  }

  function syncQuickButtons() {
    document.querySelectorAll(".quick-btn").forEach((button) => {
      const targetId = button.dataset.target;
      const value = button.dataset.value;
      const target = document.getElementById(targetId);

      const isActive = Boolean(target) && String(target.value) === String(value);

      button.classList.toggle("is-active", isActive);
    });
  }



  async function loadWorkOperationsFromDatabase() {
    if (!client) return;
    try {
      const response = await client
        .from("work_operations")
        .select("id,linea,postazione,lavorazione,carrello,is_active,sort_order")
        .eq("is_active", true)
        .order("linea", { ascending: true })
        .order("postazione", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("lavorazione", { ascending: true });

      if (response.error) {
        console.warn("Tabella work_operations non disponibile:", response.error.message);
        state.workOperations = [];
        if (dom.rowsErrors) {
          showBox(dom.rowsErrors, "Errore caricamento lavorazioni: " + response.error.message, "error");
        }
        return;
      }

      state.workOperations = Array.isArray(response.data) ? response.data : [];
      console.log("Lavorazioni caricate da work_operations:", state.workOperations.length);
    } catch (error) {
      console.warn("Errore caricamento work_operations:", error);
      state.workOperations = [];
      if (dom.rowsErrors) {
        showBox(dom.rowsErrors, "Errore caricamento lavorazioni: " + (error.message || error), "error");
      }
    }
  }

  function normalizeWorkItem(item, fallbackCarrello) {
    if (item && typeof item === "object") {
      return {
        nome: String(item.nome || item.name || item.lavorazione || "").trim(),
        carrello: String(item.carrello || item.cart || fallbackCarrello || "").trim()
      };
    }
    return {
      nome: String(item || "").trim(),
      carrello: String(fallbackCarrello || "").trim()
    };
  }
  function workKey(item) {
    const work = normalizeWorkItem(item);
    return work.nome + "||" + work.carrello;
  }
  function normalizeMatchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function getWorkOptions(lineName, stationName) {
    const wantedLine = normalizeMatchText(lineName || "");
    const wantedStation = normalizeMatchText(stationName || "");

    const dbWorks = Array.isArray(state.workOperations)
      ? state.workOperations.filter((item) => {
          const itemLine = normalizeMatchText(item.linea || item.line_name || item.line || "");
          const itemStation = normalizeMatchText(item.postazione || item.station_name || item.station || "");
          const active = item.is_active !== false;
          const sameLine = itemLine === wantedLine;
          const sameStation = itemStation === wantedStation;
          const compatibleStation = Boolean(
            wantedStation &&
            itemStation &&
            (itemStation.includes(wantedStation) || wantedStation.includes(itemStation))
          );
          return active && sameLine && (sameStation || compatibleStation);
        })
      : [];

    if (dbWorks.length) {
      return dbWorks
        .sort((a, b) => {
          const orderA = Number(a.sort_order) || 0;
          const orderB = Number(b.sort_order) || 0;
          if (orderA !== orderB) return orderA - orderB;
          return String(a.lavorazione || "").localeCompare(String(b.lavorazione || ""), "it");
        })
        .map((item) => normalizeWorkItem({ nome: item.lavorazione || item.nome || item.name, carrello: item.carrello }))
        .filter((item) => item.nome);
    }

    const lineMap = WORKS_BY_LINE_STATION[lineName] || {};
    const works = Array.isArray(lineMap[stationName]) ? lineMap[stationName] : [];
    return works.map((item) => normalizeWorkItem(item)).filter((item) => item.nome);
  }
  function ensureRowLavorazioni(row, forceReset) {
    if (!row) return [];
    const options = getWorkOptions(row.line_day || state.setup.lineName, row.postazione);
    if (forceReset || !Array.isArray(row.lavorazioni)) {
      row.lavorazioni = [...options];
      return row.lavorazioni;
    }
    const optionKeys = new Set(options.map(workKey));
    row.lavorazioni = row.lavorazioni
      .map((item) => normalizeWorkItem(item))
      .filter((item) => item.nome && optionKeys.has(workKey(item)));
    if (!row.lavorazioni.length && options.length) {
      row.lavorazioni = [...options];
    }
    return row.lavorazioni;
  }
  function renderWorksPanel(row, index, lineName) {
    const baseOptions = getWorkOptions(lineName || row.line_day, row.postazione);
    const existing = Array.isArray(row.lavorazioni)
      ? row.lavorazioni.map((item) => normalizeWorkItem(item)).filter((item) => item.nome)
      : [];
    const options = baseOptions.length ? baseOptions : existing;
    if (!options.length) {
      return `<div class="works-panel"><div class="muted">Nessuna lavorazione configurata per questa postazione.</div></div>`;
    }
    const selected = existing.length ? existing : options;
    const selectedKeys = new Set(selected.map(workKey));
    return `
      <div class="works-panel">
        ${options.map((work) => {
          const checked = selectedKeys.has(workKey(work)) ? "checked" : "";
          return `
            <label class="work-check">
              <input type="checkbox" ${checked} data-row-index="${index}" data-field="lavorazione" data-work-name="${escapeAttribute(work.nome)}" data-carrello="${escapeAttribute(work.carrello)}">
              <span class="work-check-text">
                <strong>${escapeHtml(work.nome)}</strong>
              </span>
            </label>
          `;
        }).join("")}
      </div>
    `;
  }
  function formatWorksPreview(works) {
    const normalized = Array.isArray(works) ? works.map((item) => normalizeWorkItem(item)).filter((item) => item.nome) : [];
    if (!normalized.length) return "Non specificate";
    const labels = normalized.map((item) => item.nome);
    if (labels.length <= 2) return labels.join(", ");
    return labels.slice(0, 2).join(", ") + " +" + (labels.length - 2);
  }

  function getStationOptions(lineName, extraStation) {
    const base = Array.isArray(STATIONS_BY_LINE[lineName])
      ? [...STATIONS_BY_LINE[lineName]]
      : [];

    if (extraStation && !base.includes(extraStation)) {
      base.push(extraStation);
    }

    if (!base.length) {
      return extraStation ? [extraStation] : [""];
    }

    return base;
  }

  function calculateFinalMinutes(
    workMin,
    snackMin,
    stopsMin,
    eventoMin,
    assembleaMin,
    scioperoMin
  ) {
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

    const startParts = String(startTime).split(":").map(Number);
    const endParts = String(endTime).split(":").map(Number);

    const startHour = startParts[0];
    const startMinute = startParts[1];
    const endHour = endParts[0];
    const endMinute = endParts[1];

    if (
      [startHour, startMinute, endHour, endMinute].some((number) =>
        Number.isNaN(number)
      )
    ) {
      return 0;
    }

    return endHour * 60 + endMinute - (startHour * 60 + startMinute);
  }

  function hoursStringToMinutes(value) {
    const number = parseFloat(String(value).replace(",", "."));

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

    return hours + "h " + String(mins).padStart(2, "0") + "m";
  }

  function toNonNegativeInt(value) {
    const number = parseInt(value, 10);

    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }

    return number;
  }

  function toNonNegativeNumber(value) {
    const number = parseFloat(String(value).replace(",", "."));

    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }

    return number;
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
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

  function setValue(element, value) {
    if (element) {
      element.value = value;
    }
  }

  function setButtonLoading(button, loading, text) {
    if (!button) return;

    button.disabled = loading;
    button.textContent = text;
  }

  function clampStep(step) {
    const number = Number(step);

    if (Number.isNaN(number) || number < 1) return 1;
    if (number > 5) return 5;

    return number;
  }

  function showBox(element, message, type) {
    if (!element) return;

    element.textContent = message;
    element.className = "message " + type;
    element.classList.remove("hidden");
  }

  function hideBox(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "message hidden";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM CARICATO");

  InserimentoPresenzeApp.init().catch((error) => {
    console.error("Errore generale init:", error);

    const authErrors = document.getElementById("authErrors");

    if (authErrors) {
      authErrors.textContent =
        "Errore avvio applicazione: " + (error.message || error);
      authErrors.className = "message error";
      authErrors.classList.remove("hidden");
    }
  });
});


/* ===== ADMIN FEATURES MERGED IN APP.JS ===== */
(function () {
  "use strict";
  const client = window.AppSupabase && window.AppSupabase.getClient ? window.AppSupabase.getClient() : null;
  const state = { user: null, profile: null, sessions: [], rows: [], selectedSessionId: null };
  const $ = (id) => document.getElementById(id);
  const norm = (v) => String(v || "").trim().toUpperCase();
  const esc = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const minToHours = (m) => ((Number(m)||0)/60).toFixed(2);
  const fmtMin = (m) => `${Number(m)||0} min`;
  function show(el, msg, type){ if(!el) return; el.textContent=msg; el.className=`message ${type||"info"}`; el.classList.remove("hidden"); }
  function hide(el){ if(!el) return; el.textContent=""; el.className="message hidden"; }
  function isAdmin(){ return state.profile && state.profile.is_active !== false && (state.profile.can_manage_operators === true || norm(state.profile.role)==="ADMIN" || norm(state.profile.role)==="SUPERADMIN"); }
  async function init() {
    if (!client) return;
    setTimeout(async () => {
      await loadProfile();
      if (isAdmin()) {
        if ($("openOperatorsBtn")) { $("openOperatorsBtn").classList.remove("hidden"); $("openOperatorsBtn").textContent = "Gestione applicazione"; }
        if ($("openAttendanceAdminBtn")) $("openAttendanceAdminBtn").classList.remove("hidden");
        enhanceApplicationAdmin();
      }
      bind();
    }, 500);
  }
  async function loadProfile(){
    const session = await client.auth.getSession();
    state.user = session && session.data && session.data.session ? session.data.session.user : null;
    if (!state.user) return;
    const res = await client.from("app_users").select("user_id,email,role,can_manage_operators,is_active").eq("user_id", state.user.id).maybeSingle();
    state.profile = res.data || { user_id: state.user.id, email: state.user.email, role: "user", can_manage_operators:false, is_active:true };
  }
  function bind(){
    const riepilogo = $("openAttendanceAdminBtn");
    if (riepilogo && !riepilogo.dataset.boundAdminExt) {
      riepilogo.dataset.boundAdminExt = "1";
      riepilogo.addEventListener("click", async () => { await openAttendanceAdmin(); });
    }
    if ($("refreshAttendanceAdminBtn")) $("refreshAttendanceAdminBtn").onclick = loadSessions;
    if ($("attendanceAdminDateFilter")) $("attendanceAdminDateFilter").onchange = loadSessions;
    if ($("attendanceAdminLineFilter")) $("attendanceAdminLineFilter").onchange = loadSessions;
    if ($("attendanceAdminSearchInput")) $("attendanceAdminSearchInput").oninput = renderRows;
  }
  function switchView(viewId){
    ["attendanceView","operatorsAdminView","attendanceAdminView"].forEach(id => { const el=$(id); if(el) el.classList.toggle("hidden", id!==viewId); });
  }
  async function openAttendanceAdmin(){
    if (!isAdmin()) return;
    switchView("attendanceAdminView");
    await loadSessions();
  }
  async function loadSessions(){
    const msg=$("attendanceAdminMessage"); hide(msg);
    let q = client.from("attendance_sessions").select("*").order("work_date", { ascending:false }).order("line_name", { ascending:true });
    const d=$("attendanceAdminDateFilter")?.value || "";
    const l=$("attendanceAdminLineFilter")?.value || "";
    if (d) q=q.eq("work_date", d);
    if (l) q=q.eq("line_name", l);
    const res = await q;
    if(res.error){ show(msg, res.error.message, "error"); return; }
    state.sessions = res.data || [];
    renderSessionFilter();
    renderSessions();
  }
  function renderSessionFilter(){
    const sel=$("attendanceAdminLineFilter"); if(!sel) return;
    const cur=sel.value;
    const lines=[...new Set(state.sessions.map(s=>s.line_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"it"));
    sel.innerHTML='<option value="">Tutte le linee</option>'+lines.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join("");
    sel.value=cur;
  }
  function renderSessions(){
    const body=$("attendanceAdminSessionsBody"); if(!body) return;
    if(!state.sessions.length){ body.innerHTML='<tr><td colspan="5"><div class="muted">Nessuna giornata salvata trovata.</div></td></tr>'; return; }
    body.innerHTML=state.sessions.map(s=>`<tr><td>${esc(s.work_date||"-")}</td><td>${esc(s.line_name||"-")}</td><td>${esc(s.start_time||"-")}</td><td>${esc(s.end_time||"-")}</td><td><button class="btn btn-secondary btn-small" data-session-id="${esc(s.id)}">Apri</button></td></tr>`).join("");
    body.querySelectorAll("button[data-session-id]").forEach(b=>b.onclick=()=>loadRows(b.dataset.sessionId));
  }
  async function loadRows(id){
    state.selectedSessionId=id;
    const res=await client.from("attendance_rows").select("*").eq("attendance_session_id", id).order("sort_order", { ascending:true });
    if(res.error){ show($("attendanceAdminMessage"), res.error.message, "error"); return; }
    state.rows=res.data||[];
    renderRows();
  }
  function parseWorks(v){ if(Array.isArray(v)) return v; if(!v) return []; try{const p=JSON.parse(v); return Array.isArray(p)?p:[];}catch{return [];} }
  function renderRows(){
    const body=$("attendanceAdminRowsBody"); if(!body) return;
    const search=norm($("attendanceAdminSearchInput")?.value || "");
    const rows=state.rows.filter(r=>!search || norm([r.cognome,r.nome,r.line_day,r.postazione,JSON.stringify(r.lavorazioni||[])].join(" ")).includes(search));
    if(!state.selectedSessionId){ body.innerHTML='<tr><td colspan="8"><div class="muted">Apri una giornata per vedere il dettaglio.</div></td></tr>'; return; }
    if(!rows.length){ body.innerHTML='<tr><td colspan="8"><div class="muted">Nessuna riga trovata.</div></td></tr>'; return; }
    body.innerHTML=rows.map(r=>{
      const works=parseWorks(r.lavorazioni).map(w=>typeof w==="object" ? w.nome : w).filter(Boolean).join(", ") || "-";
      const name=[r.cognome,r.nome].filter(Boolean).join(" ") || "Operatore";
      return `<tr><td>${esc(name)}</td><td>${esc(r.line_day||"-")}</td><td>${esc(r.postazione||"-")}</td><td>${esc(works)}</td><td>${esc(minToHours(r.work_min))}</td><td>${esc(fmtMin(r.final_min))}</td><td>${esc((r.evento_min||0)+"/"+(r.assemblea_min||0)+"/"+(r.sciopero_min||0))}</td><td><button class="btn btn-secondary btn-small" data-edit-row="${esc(r.id)}">Modifica</button></td></tr>`;
    }).join("");
    body.querySelectorAll("button[data-edit-row]").forEach(b=>b.onclick=()=>quickEditRow(b.dataset.editRow));
  }
  async function quickEditRow(id){
    const row=state.rows.find(r=>String(r.id)===String(id)); if(!row) return;
    const value=prompt("Ore lavorate", minToHours(row.work_min));
    if(value===null) return;
    const workMin=Math.max(0, Math.round(parseFloat(String(value).replace(",","."))*60)||0);
    const session=state.sessions.find(s=>String(s.id)===String(row.attendance_session_id));
    const finalMin=Math.max(0, workMin-(Number(session?.snack_min)||0)-(Number(session?.stops_min)||0)-(Number(row.evento_min)||0)-(Number(row.assemblea_min)||0)-(Number(row.sciopero_min)||0));
    const res=await client.from("attendance_rows").update({work_min:workMin, final_min:finalMin, dirty:true}).eq("id", id).select();
    if(res.error){ show($("attendanceAdminMessage"), res.error.message, "error"); return; }
    await loadRows(row.attendance_session_id);
  }
  function enhanceApplicationAdmin(){
    const view=$("operatorsAdminView"); if(!view || $("appTablesPanel")) return;
    const msg=$("operatorsAdminMessage");
    const panel=document.createElement("div");
    panel.id="appTablesPanel";
    panel.className="card inline-card app-tables-panel";
    panel.innerHTML=`<div class="card-header compact-header"><h3>Tabelle applicazione</h3><p>Gestisci da frontend le principali aree applicative senza perdere la gestione operatori esistente.</p></div><div class="actions toolbar"><button id="goUsersBtn" class="btn btn-secondary" type="button">Utenti e permessi</button><button id="goAttendanceBtn" class="btn btn-secondary" type="button">Riepilogo presenze</button><button id="goOperatorsBtn" class="btn btn-secondary" type="button">Operatori</button></div><div id="usersQuickPanel" class="table-wrap hidden"><table class="attendance-table"><thead><tr><th>Email</th><th>Ruolo</th><th>Admin</th><th>Attivo</th><th>Azioni</th></tr></thead><tbody id="usersQuickBody"></tbody></table></div>`;
    if(msg) msg.insertAdjacentElement("afterend", panel); else view.querySelector(".card")?.prepend(panel);
    $("goAttendanceBtn").onclick=openAttendanceAdmin;
    $("goUsersBtn").onclick=loadUsers;
  }
  async function loadUsers(){
    const panel=$("usersQuickPanel"), body=$("usersQuickBody"); if(!panel||!body) return;
    panel.classList.remove("hidden");
    const res=await client.from("app_users").select("user_id,email,role,can_manage_operators,is_active").order("email", {ascending:true});
    if(res.error){ body.innerHTML=`<tr><td colspan="5">${esc(res.error.message)}</td></tr>`; return; }
    const users=res.data||[];
    body.innerHTML=users.map(u=>`<tr><td>${esc(u.email||"-")}</td><td>${esc(u.role||"user")}</td><td>${u.can_manage_operators?"Sì":"No"}</td><td>${u.is_active?"Sì":"No"}</td><td><button class="btn btn-secondary btn-small" data-toggle-admin="${esc(u.user_id)}">${u.can_manage_operators?"Rendi user":"Rendi admin"}</button></td></tr>`).join("");
    body.querySelectorAll("button[data-toggle-admin]").forEach(b=>b.onclick=()=>toggleAdmin(b.dataset.toggleAdmin, users.find(u=>u.user_id===b.dataset.toggleAdmin)));
  }
  async function toggleAdmin(id,u){
    const admin=!!u.can_manage_operators;
    const res=await client.from("app_users").update({role:admin?"user":"admin", can_manage_operators:!admin, is_active:true}).eq("user_id",id).select();
    if(!res.error) loadUsers();
  }
  document.addEventListener("DOMContentLoaded", init);
})();

/* ===== GESTIONE APPLICAZIONE PERSISTENTE CON SELETTORE TABELLA ===== */
(function () {
  "use strict";
  const client = window.AppSupabase && window.AppSupabase.getClient ? window.AppSupabase.getClient() : null;
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const norm = (v) => String(v || "").trim().toUpperCase();
  let appState = { sessions: [], rows: [], selectedSessionId: null, users: [] };

  function isVisible(el) { return el && !el.classList.contains("hidden"); }
  function showMessage(el, msg, type) { if (!el) return; el.textContent = msg; el.className = "message " + (type || "info"); el.classList.remove("hidden"); }
  function hideMessage(el) { if (!el) return; el.textContent = ""; el.className = "message hidden"; }
  function minToHours(min) { return ((Number(min) || 0) / 60).toFixed(2); }
  function formatWorks(value) {
    let arr = [];
    if (Array.isArray(value)) arr = value;
    else if (value) { try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) arr = parsed; } catch (_) {} }
    return arr.map((item) => typeof item === "object" ? item.nome : item).filter(Boolean).join(", ") || "-";
  }

  async function getProfile() {
    if (!client) return null;
    const session = await client.auth.getSession();
    const user = session && session.data && session.data.session ? session.data.session.user : null;
    if (!user) return null;
    const res = await client.from("app_users").select("role,can_manage_operators,is_active").eq("user_id", user.id).maybeSingle();
    const profile = res.data || {};
    const isAdmin = profile.is_active !== false && (profile.can_manage_operators === true || norm(profile.role) === "ADMIN" || norm(profile.role) === "SUPERADMIN");
    return { user, profile, isAdmin };
  }

  function ensurePersistentPanel() {
    const view = $("operatorsAdminView");
    if (!view) return;
    const old = $("appTablesPanel");
    if (old) old.remove();

    const msg = $("operatorsAdminMessage");
    const panel = document.createElement("div");
    panel.id = "appTablesPanel";
    panel.className = "card inline-card app-tables-panel";
    panel.innerHTML = `
      <div class="card-header compact-header">
        <h3>Tabelle applicazione</h3>
        <p>Seleziona la tabella o l'area da gestire. Il selettore rimane sempre visibile in alto.</p>
      </div>
      <div class="form-grid form-grid-3 app-table-selector-grid">
        <div class="field">
          <label for="applicationAreaSelect">Area / tabella</label>
          <select id="applicationAreaSelect">
            <option value="operators">Operatori</option>
            <option value="app_users">Utenti e permessi</option>
            <option value="attendance">Riepilogo presenze</option>
            <option value="work_config">Lavorazioni configurate</option>
          </select>
        </div>
        <div class="field">
          <label>&nbsp;</label>
          <button id="applicationAreaRefreshBtn" class="btn btn-secondary" type="button">Aggiorna area selezionata</button>
        </div>
      </div>
      <div id="applicationAreaMessage" class="message hidden" role="alert" aria-live="polite"></div>
      <div id="applicationUsersPanel" class="application-area hidden"></div>
      <div id="applicationAttendancePanel" class="application-area hidden"></div>
      <div id="applicationWorkConfigPanel" class="application-area hidden"></div>
      <div id="applicationOperatorsHint" class="application-area hidden">
        <div class="message info">Gestione operatori attiva: usa la tabella operatori sotto questo pannello.</div>
      </div>
    `;
    if (msg) msg.insertAdjacentElement("afterend", panel);
    else view.querySelector(".card")?.prepend(panel);

    const select = $("applicationAreaSelect");
    const refresh = $("applicationAreaRefreshBtn");
    if (select) select.onchange = () => selectArea(select.value);
    if (refresh) refresh.onclick = () => selectArea(select ? select.value : "operators", true);
    selectArea("operators");
  }

  function hideAllAreas() {
    ["applicationUsersPanel", "applicationAttendancePanel", "applicationWorkConfigPanel", "applicationOperatorsHint"].forEach((id) => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
  }

  async function selectArea(area, forceRefresh) {
    hideAllAreas();
    hideMessage($("applicationAreaMessage"));
    if (area === "operators") {
      $("applicationOperatorsHint")?.classList.remove("hidden");
      return;
    }
    if (area === "app_users") {
      $("applicationUsersPanel")?.classList.remove("hidden");
      if (forceRefresh || !appState.users.length) await loadUsersArea();
      else renderUsersArea();
      return;
    }
    if (area === "attendance") {
      $("applicationAttendancePanel")?.classList.remove("hidden");
      renderAttendanceAreaShell();
      await loadAttendanceSessionsArea();
      return;
    }
    if (area === "work_config") {
      $("applicationWorkConfigPanel")?.classList.remove("hidden");
      renderWorkConfigArea();
    }
  }

  async function loadUsersArea() {
    const box = $("applicationUsersPanel");
    if (!box || !client) return;
    const res = await client.from("app_users").select("user_id,email,role,can_manage_operators,is_active").order("email", { ascending: true });
    if (res.error) { showMessage($("applicationAreaMessage"), res.error.message, "error"); return; }
    appState.users = res.data || [];
    renderUsersArea();
  }

  function renderUsersArea() {
    const box = $("applicationUsersPanel");
    if (!box) return;
    const rows = appState.users || [];
    box.innerHTML = `
      <h3 class="admin-subtitle">Utenti e permessi</h3>
      <div class="table-wrap">
        <table class="attendance-table">
          <thead><tr><th>Email</th><th>Ruolo</th><th>Admin</th><th>Attivo</th><th>Azioni</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map((u) => `
              <tr>
                <td>${esc(u.email || "-")}</td>
                <td>${esc(u.role || "user")}</td>
                <td>${u.can_manage_operators ? "Sì" : "No"}</td>
                <td>${u.is_active ? "Sì" : "No"}</td>
                <td><button class="btn btn-secondary btn-small" data-app-user-admin="${esc(u.user_id)}">${u.can_manage_operators ? "Rendi user" : "Rendi admin"}</button></td>
              </tr>
            `).join("") : `<tr><td colspan="5"><div class="muted">Nessun utente presente in app_users.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    box.querySelectorAll("button[data-app-user-admin]").forEach((button) => {
      button.onclick = async () => {
        const user = appState.users.find((item) => String(item.user_id) === String(button.dataset.appUserAdmin));
        if (!user) return;
        const nextAdmin = !user.can_manage_operators;
        const res = await client.from("app_users").update({ role: nextAdmin ? "admin" : "user", can_manage_operators: nextAdmin, is_active: true }).eq("user_id", user.user_id).select();
        if (res.error) showMessage($("applicationAreaMessage"), res.error.message, "error");
        else await loadUsersArea();
      };
    });
  }

  function renderAttendanceAreaShell() {
    const box = $("applicationAttendancePanel");
    if (!box || box.dataset.ready === "1") return;
    box.dataset.ready = "1";
    box.innerHTML = `
      <h3 class="admin-subtitle">Riepilogo presenze</h3>
      <div class="card inline-card">
        <div class="form-grid form-grid-3">
          <div class="field"><label for="appAttendanceDateFilter">Data</label><input id="appAttendanceDateFilter" type="date"></div>
          <div class="field"><label for="appAttendanceLineFilter">Linea</label><select id="appAttendanceLineFilter"><option value="">Tutte le linee</option></select></div>
          <div class="field"><label for="appAttendanceSearchInput">Cerca dettaglio</label><input id="appAttendanceSearchInput" type="text" placeholder="Operatore, postazione, lavorazione"></div>
        </div>
      </div>
      <h4 class="admin-subtitle">Giornate salvate</h4>
      <div class="table-wrap"><table class="attendance-table"><thead><tr><th>Data</th><th>Linea</th><th>Inizio</th><th>Fine</th><th>Azioni</th></tr></thead><tbody id="appAttendanceSessionsBody"></tbody></table></div>
      <h4 class="admin-subtitle">Dettaglio presenze</h4>
      <div class="table-wrap"><table class="attendance-table"><thead><tr><th>Operatore</th><th>Linea</th><th>Postazione</th><th>Lavorazioni</th><th>Ore</th><th>Finali</th><th>Extra</th><th>Azioni</th></tr></thead><tbody id="appAttendanceRowsBody"></tbody></table></div>
    `;
    $("appAttendanceDateFilter").onchange = loadAttendanceSessionsArea;
    $("appAttendanceLineFilter").onchange = loadAttendanceSessionsArea;
    $("appAttendanceSearchInput").oninput = renderAttendanceRowsArea;
  }

  async function loadAttendanceSessionsArea() {
    if (!client) return;
    const d = $("appAttendanceDateFilter")?.value || "";
    const l = $("appAttendanceLineFilter")?.value || "";
    let q = client.from("attendance_sessions").select("*").order("work_date", { ascending: false }).order("line_name", { ascending: true });
    if (d) q = q.eq("work_date", d);
    if (l) q = q.eq("line_name", l);
    const res = await q;
    if (res.error) { showMessage($("applicationAreaMessage"), res.error.message, "error"); return; }
    appState.sessions = res.data || [];
    renderAttendanceLineFilterArea();
    renderAttendanceSessionsArea();
  }

  function renderAttendanceLineFilterArea() {
    const sel = $("appAttendanceLineFilter");
    if (!sel) return;
    const current = sel.value;
    const lines = [...new Set(appState.sessions.map((s) => s.line_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"it"));
    sel.innerHTML = `<option value="">Tutte le linee</option>` + lines.map((line) => `<option value="${esc(line)}">${esc(line)}</option>`).join("");
    sel.value = current;
  }

  function renderAttendanceSessionsArea() {
    const body = $("appAttendanceSessionsBody");
    if (!body) return;
    if (!appState.sessions.length) {
      body.innerHTML = `<tr><td colspan="5"><div class="muted">Nessuna giornata salvata trovata.</div></td></tr>`;
      return;
    }
    body.innerHTML = appState.sessions.map((s) => `
      <tr><td>${esc(s.work_date || "-")}</td><td>${esc(s.line_name || "-")}</td><td>${esc(s.start_time || "-")}</td><td>${esc(s.end_time || "-")}</td><td><button class="btn btn-secondary btn-small" data-open-app-session="${esc(s.id)}">Apri</button></td></tr>
    `).join("");
    body.querySelectorAll("button[data-open-app-session]").forEach((button) => button.onclick = () => loadAttendanceRowsArea(button.dataset.openAppSession));
  }

  async function loadAttendanceRowsArea(sessionId) {
    appState.selectedSessionId = sessionId;
    const res = await client.from("attendance_rows").select("*").eq("attendance_session_id", sessionId).order("sort_order", { ascending: true });
    if (res.error) { showMessage($("applicationAreaMessage"), res.error.message, "error"); return; }
    appState.rows = res.data || [];
    renderAttendanceRowsArea();
  }

  function renderAttendanceRowsArea() {
    const body = $("appAttendanceRowsBody");
    if (!body) return;
    const search = norm($("appAttendanceSearchInput")?.value || "");
    const rows = (appState.rows || []).filter((r) => !search || norm([r.cognome, r.nome, r.line_day, r.postazione, JSON.stringify(r.lavorazioni || [])].join(" ")).includes(search));
    if (!appState.selectedSessionId) { body.innerHTML = `<tr><td colspan="8"><div class="muted">Apri una giornata per vedere il dettaglio.</div></td></tr>`; return; }
    if (!rows.length) { body.innerHTML = `<tr><td colspan="8"><div class="muted">Nessuna riga trovata.</div></td></tr>`; return; }
    body.innerHTML = rows.map((r) => {
      const name = [r.cognome, r.nome].filter(Boolean).join(" ") || "Operatore";
      return `<tr><td>${esc(name)}</td><td>${esc(r.line_day || "-")}</td><td>${esc(r.postazione || "-")}</td><td>${esc(formatWorks(r.lavorazioni))}</td><td>${esc(minToHours(r.work_min))}</td><td>${esc(Number(r.final_min)||0)} min</td><td>${esc((r.evento_min||0)+"/"+(r.assemblea_min||0)+"/"+(r.sciopero_min||0))}</td><td><button class="btn btn-secondary btn-small" data-edit-app-row="${esc(r.id)}">Modifica ore</button></td></tr>`;
    }).join("");
  }

  async function loadWorkOperationsArea() {
    const box = $("applicationWorkConfigPanel");
    if (!box || !client) return;
    const res = await client
      .from("work_operations")
      .select("id,linea,postazione,lavorazione,carrello,is_active,sort_order")
      .order("linea", { ascending: true })
      .order("postazione", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("lavorazione", { ascending: true });
    if (res.error) {
      showMessage($("applicationAreaMessage"), res.error.message, "error");
      return;
    }
    appState.workOperations = res.data || [];
    renderWorkOperationsTable();
  }

  function renderWorkConfigArea() {
    const box = $("applicationWorkConfigPanel");
    if (!box) return;
    box.innerHTML = `
      <h3 class="admin-subtitle">Lavorazioni</h3>
      <div class="actions toolbar">
        <button id="newWorkOperationBtn" class="btn btn-primary" type="button">Nuova lavorazione</button>
        <button id="refreshWorkOperationsBtn" class="btn btn-secondary" type="button">Aggiorna lavorazioni</button>
      </div>
      <div class="table-wrap">
        <table class="attendance-table">
          <thead>
            <tr>
              <th>Linea</th><th>Postazione</th><th>Lavorazione</th><th>Carrello</th><th>Ordine</th><th>Attiva</th><th>Azioni</th>
            </tr>
          </thead>
          <tbody id="workOperationsAdminBody"><tr><td colspan="7"><div class="muted">Caricamento lavorazioni...</div></td></tr></tbody>
        </table>
      </div>
    `;
    $("newWorkOperationBtn").onclick = () => openWorkOperationEditor(null);
    $("refreshWorkOperationsBtn").onclick = loadWorkOperationsArea;
    loadWorkOperationsArea();
  }

  function renderWorkOperationsTable() {
    const body = $("workOperationsAdminBody");
    if (!body) return;
    const rows = appState.workOperations || [];
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="7"><div class="muted">Nessuna lavorazione configurata.</div></td></tr>`;
      return;
    }
    body.innerHTML = rows.map((row) => `
      <tr>
        <td>${esc(row.linea || "-")}</td>
        <td>${esc(row.postazione || "-")}</td>
        <td>${esc(row.lavorazione || "-")}</td>
        <td>${esc(row.carrello || "-")}</td>
        <td>${esc(row.sort_order || 0)}</td>
        <td>${row.is_active ? "Sì" : "No"}</td>
        <td>
          <button class="btn btn-secondary btn-small" data-edit-work="${esc(row.id)}">Modifica</button>
          <button class="btn btn-secondary btn-small" data-toggle-work="${esc(row.id)}">${row.is_active ? "Disattiva" : "Riattiva"}</button>
        </td>
      </tr>
    `).join("");
    body.querySelectorAll("button[data-edit-work]").forEach((button) => button.onclick = () => {
      const row = rows.find((item) => String(item.id) === String(button.dataset.editWork));
      openWorkOperationEditor(row);
    });
    body.querySelectorAll("button[data-toggle-work]").forEach((button) => button.onclick = async () => {
      const row = rows.find((item) => String(item.id) === String(button.dataset.toggleWork));
      if (!row) return;
      const response = await client.from("work_operations").update({ is_active: !row.is_active }).eq("id", row.id).select();
      if (response.error) showMessage($("applicationAreaMessage"), response.error.message, "error");
      else loadWorkOperationsArea();
    });
  }

  async function openWorkOperationEditor(row) {
    const current = row || { linea: "", postazione: "", lavorazione: "", carrello: "", sort_order: 0, is_active: true };
    const raw = prompt(
      "Modifica lavorazione in formato: LINEA | POSTAZIONE | LAVORAZIONE | CARRELLO | ORDINE | ATTIVA(true/false)",
      [current.linea, current.postazione, current.lavorazione, current.carrello || "", current.sort_order || 0, current.is_active !== false].join(" | ")
    );
    if (!raw) return;
    const parts = raw.split("|").map((item) => item.trim());
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) {
      showMessage($("applicationAreaMessage"), "Dati non validi. Servono almeno linea, postazione e lavorazione.", "error");
      return;
    }
    const payload = {
      linea: parts[0],
      postazione: parts[1],
      lavorazione: parts[2],
      carrello: parts[3] || "",
      sort_order: Number(parts[4]) || 0,
      is_active: parts[5] === undefined ? true : String(parts[5]).toLowerCase() !== "false"
    };
    const response = row && row.id
      ? await client.from("work_operations").update(payload).eq("id", row.id).select()
      : await client.from("work_operations").insert(payload).select();
    if (response.error) showMessage($("applicationAreaMessage"), response.error.message, "error");
    else loadWorkOperationsArea();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(async () => {
      const profile = await getProfile();
      if (profile && profile.isAdmin) ensurePersistentPanel();
    }, 900);
  });
})();




/* ===== ASSENZE PROGRAMMATE - FRONTEND FTE LINEE RANGE ===== */
(function(){
  "use strict";
  const client = window.AppSupabase && window.AppSupabase.getClient ? window.AppSupabase.getClient() : null;
  const $ = (id) => document.getElementById(id);
  const norm = (v) => String(v || "").trim().toUpperCase();
  const num = (v, fallback=0) => { const n = Number(String(v ?? "").replace(",",".")); return Number.isFinite(n) ? n : fallback; };
  const esc = (v) => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const todayIso = () => new Date().toISOString().slice(0,10);
  const currentMonth = () => new Date().toISOString().slice(0,7);
  function pad2(value){ return String(value).padStart(2,"0"); }
  function dateToIsoLocal(date){ return date.getFullYear()+"-"+pad2(date.getMonth()+1)+"-"+pad2(date.getDate()); }
  function currentMonthBounds(){ const now=new Date(); const first=new Date(now.getFullYear(), now.getMonth(), 1); const last=new Date(now.getFullYear(), now.getMonth()+1, 0); return { month: now.getFullYear()+"-"+pad2(now.getMonth()+1), from: dateToIsoLocal(first), to: dateToIsoLocal(last) }; }
  function applyCurrentMonthDefaults(force){ const bounds=currentMonthBounds(); const from=$("plannedAbsenceFromFilter"); const to=$("plannedAbsenceToFilter"); const month=$("plannedAbsenceMonth"); if(from && (force || !from.value)) from.value=bounds.from; if(to && (force || !to.value)) to.value=bounds.to; if(month && (force || !month.value)) month.value=bounds.month; }
  const state = { user:null, profile:null, isAdmin:false, isSuperUser:false, operators:[], absences:[], filtered:[] };
  function show(el,msg,type){ if(!el) return; el.textContent=msg; el.className="message "+(type||"info"); el.classList.remove("hidden"); }
  function hide(el){ if(!el) return; el.textContent=""; el.className="message hidden"; }
  function admin(profile){ return !!(profile && profile.is_active !== false && (profile.can_manage_operators === true || norm(profile.role)==="ADMIN" || norm(profile.role)==="SUPERADMIN")); }
  function superUser(profile){ const role=norm(profile && profile.role ? profile.role : ""); return !!(profile && profile.is_active !== false && (role==="SUPER_USER" || role==="SUPERUSER" || role==="SUPER UTENTE" || role==="KEY_USER")); }
  function allowedLines(){ const p=state.profile||{}; const raw=p.allowed_lines || p.linee_autorizzate || p.allowedLines || p.linee || p.linee_produzione || ""; if(Array.isArray(raw)) return raw.map(x=>String(x||"").trim()).filter(Boolean); if(!raw) return []; try{ const parsed=JSON.parse(raw); if(Array.isArray(parsed)) return parsed.map(x=>String(x||"").trim()).filter(Boolean); }catch(_){} return String(raw).split(/[;,]/).map(x=>x.trim()).filter(Boolean); }
  function canUseLine(line){ if(!line) return false; if(state.isAdmin || state.isSuperUser) return true; const allowed=allowedLines(); if(!allowed.length) return false; return allowed.some(l=>norm(l)===norm(line)); }
  function canEdit(row){ return state.isAdmin || state.isSuperUser || (state.user && row && String(row.created_by)===String(state.user.id) && canUseLine(row.line_name)); }
  function formatDateIT(iso){ if(!iso) return "-"; const p=String(iso).split("-"); return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : iso; }
  function getFirst(row, keys, fallback=""){ for(const k of keys){ if(row && row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k]; } return fallback; }
  function eachDate(start,end){ const dates=[]; const s=new Date(start+"T00:00:00"); const e=new Date(end+"T00:00:00"); if(Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return dates; for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){ dates.push(d.toISOString().slice(0,10)); if(dates.length>366) break; } return dates; }
  function calcFte(hours, standardHours, fteProgrammabili){
    const h=num(hours,0); const s=num(standardHours,0); const f=num(fteProgrammabili,0);
    if(s>0 && f>0) return (h / s) * f;
    if(s>0) return h / s;
    return 0;
  }
  function updateFtePreview(){
    const h=num($("plannedAbsenceHours")?.value,0);
    const s=num($("plannedAbsenceStandardHours")?.value,0);
    const op=findOp($("plannedAbsenceOperator")?.value || "");
    const fteBase=op ? num(op.fteProgrammabili, 1) : (1);
    const fte=calcFte(h,s,fteBase);
    if($("plannedAbsenceFte")) $("plannedAbsenceFte").value = Number.isFinite(fte) ? fte.toFixed(2) : "0.00";
  }
  function showAddPanel(scrollToForm){
    const add=$("plannedAddPanel");
    const dash=$("plannedDashboardPanel");
    if(add) add.classList.remove("hidden");
    if(dash) dash.classList.add("hidden");
    if(scrollToForm && add && typeof add.scrollIntoView === "function") add.scrollIntoView({behavior:"smooth", block:"start"});
  }
  function showDashboardPanel(scrollToDashboard){
    const add=$("plannedAddPanel");
    const dash=$("plannedDashboardPanel");
    if(add) add.classList.add("hidden");
    if(dash) dash.classList.remove("hidden");
    if(scrollToDashboard && dash && typeof dash.scrollIntoView === "function") dash.scrollIntoView({behavior:"smooth", block:"start"});
  }
  function showChoiceOnly(){
    const add=$("plannedAddPanel");
    const dash=$("plannedDashboardPanel");
    if(add) add.classList.add("hidden");
    if(dash) dash.classList.add("hidden");
  }
  async function profile(){ if(!client) return; const s=await client.auth.getSession(); state.user=s&&s.data&&s.data.session?s.data.session.user:null; if(!state.user){ state.profile=null; state.isAdmin=false; state.isSuperUser=false; return; } const r=await client.from("app_users").select("*").eq("user_id",state.user.id).maybeSingle(); if(r.data){ state.profile=r.data; } else { const base={user_id:state.user.id,email:state.user.email||"",role:"user",can_manage_operators:false,is_active:true,allowed_lines:[]}; const ins=await client.from("app_users").insert(base).select().maybeSingle(); state.profile=ins.data||base; } state.isAdmin=admin(state.profile); state.isSuperUser=superUser(state.profile); }
  function reveal(){ const b=$("openPlannedAbsencesBtn"); if(b) b.classList.toggle("hidden", !state.user); }
  function view(){ ["homeView","attendanceView","operatorsAdminView","attendanceAdminView","plannedAbsencesView"].forEach(id=>{ const el=$(id); if(el) el.classList.toggle("hidden", id!=="plannedAbsencesView"); }); }
  function mapOperator(row){
    const name=[row.cognome,row.nome].filter(Boolean).join(" ").trim() || row.nome || row.cognome || "Operatore";
    const id=row.id ?? null;
    const line=getFirst(row,["lineaproduzione","lineaProduzione","linea_produzione","linea","line"],"");
    const idOp=getFirst(row,["idoperatore","idOperatore","id_operatore"],"");
    const standardHours=num(getFirst(row,["ore_standard_assenze_programmate","orestandardassenzeprogrammate","ore_standard","orestandard","oreStandard","ore_std","oreStd","ore_giornaliere","oregiornaliere"],8),8);
    const fteProg=num(getFirst(row,["fte_programmabili","fteprogrammabili","FTE PROGRAMMABILI","fteProgrammabili"], 1), 1);
    return { id, name, line:String(line||"").trim(), idOperatore:String(idOp||"").trim(), standardHours, fteProgrammabili:fteProg, label:name+(idOp?" | ID: "+idOp:"")+(line?" | Linea: "+line:"") };
  }
  async function loadOperators(){ const r=await client.from("operators").select("*").order("cognome",{ascending:true}); const mapped=r.error?[]:(r.data||[]).map(mapOperator); state.operators=(state.isAdmin||state.isSuperUser)?mapped:mapped.filter(o=>canUseLine(o.line)); datalist(); lines(); }
  async function loadAbsences(){ let q=client.from("planned_absences").select("*").order("absence_date",{ascending:true}).order("operator_name",{ascending:true}); if(!state.isAdmin && !state.isSuperUser){ const allowed=allowedLines(); if(allowed.length) q=q.in("line_name",allowed); else { state.absences=[]; return; } } const r=await q; if(r.error){ show($("plannedAbsencesMessage"),"Errore: "+r.error.message+". Controlla RLS: la tabella planned_absences deve avere Row Level Security disabilitata oppure policy complete.","error"); state.absences=[]; return; } state.absences=(r.data||[]).filter(a=>canUseLine(a.line_name)); }
  function datalist(){ const dl=$("plannedAbsenceOperatorsList"); if(!dl) return; dl.innerHTML=state.operators.map(o=>`<option value="${esc(o.label)}"></option>`).join(""); }
  function lines(){ const sel=$("plannedAbsenceLineFilter"); if(!sel) return; const cur=sel.value; const lineList=[...new Set(state.operators.map(o=>o.line).filter(Boolean).concat(state.absences.map(a=>a.line_name).filter(Boolean)))].filter(l=>canUseLine(l)).sort((a,b)=>a.localeCompare(b,"it")); sel.innerHTML='<option value="">Tutte le linee</option>'+lineList.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join(""); sel.value=(cur&&canUseLine(cur))?cur:""; }
  function findOp(v){ const raw=String(v||"").trim(); if(!raw) return null; const n=norm(raw); return state.operators.find(o=>o.label===raw) || state.operators.find(o=>norm(o.label).includes(n) || norm(o.name).includes(n)) || null; }
  function syncOperatorDefaults(){
    const op=findOp($("plannedAbsenceOperator")?.value || "");
    if(op){ if($("plannedAbsenceOperator")) $("plannedAbsenceOperator").value=op.label; if($("plannedAbsenceStandardHours")) $("plannedAbsenceStandardHours").value=String(op.standardHours || 8); if($("plannedAbsenceHours") && !$("plannedAbsenceHours").value) $("plannedAbsenceHours").value=String(op.standardHours || 8); }
    updateFtePreview();
  }
  function read(){
    const raw=($("plannedAbsenceOperator")?.value||"").trim(); const op=findOp(raw); const start=$("plannedAbsenceDate")?.value||""; const end=($("plannedAbsenceEndDate")?.value||start||"");
    const hours=num($("plannedAbsenceHours")?.value,0); const standardHours=num($("plannedAbsenceStandardHours")?.value,0); const fteBase=op ? num(op.fteProgrammabili, 1) : (1); const fteAbs=calcFte(hours,standardHours,fteBase);
    const reason=$("plannedAbsenceReason")?.value||"ALTRO"; const notes=($("plannedAbsenceNotes")?.value||"").trim();
    if(!start) return {ok:false,msg:"Inserisci la data di inizio assenza."}; if(!end) return {ok:false,msg:"Inserisci la data di fine assenza."}; if(end < start) return {ok:false,msg:"La data finale non può essere precedente alla data iniziale."}; if(!raw) return {ok:false,msg:"Inserisci l'operatore."}; if(!Number.isFinite(hours)||hours<=0) return {ok:false,msg:"Inserisci ore assenza maggiori di zero."}; if(!Number.isFinite(standardHours)||standardHours<=0) return {ok:false,msg:"Inserisci ore standard assenze programmate maggiori di zero."};
    const dates=eachDate(start,end); if(!dates.length) return {ok:false,msg:"Periodo non valido."}; if(dates.length>366) return {ok:false,msg:"Periodo troppo lungo: massimo 366 giorni."};
    if(!op) return {ok:false,msg:"Operatore non trovato o non autorizzato per le tue linee."};
    if(!canUseLine(op.line)) return {ok:false,msg:"Non sei autorizzato a inserire assenze programmate per questa linea."};
    const base={operator_id:op.id,operator_name:op.name,line_name:op.line,hours,standard_absence_hours:standardHours,fte_absence_programmabili:fteAbs,reason,notes,created_by:state.user.id,created_by_email:state.user.email||""};
    return {ok:true,start,end,dates,base};
  }
  function reset(){ if($("plannedAbsenceId")) $("plannedAbsenceId").value=""; if($("plannedAbsenceFormTitle")) $("plannedAbsenceFormTitle").textContent="Inserisci una nuova assenza"; if($("plannedAbsenceDate")) $("plannedAbsenceDate").value=todayIso(); if($("plannedAbsenceEndDate")) $("plannedAbsenceEndDate").value=todayIso(); if($("plannedAbsenceOperator")) $("plannedAbsenceOperator").value=""; if($("plannedAbsenceHours")) $("plannedAbsenceHours").value="8"; if($("plannedAbsenceStandardHours")) $("plannedAbsenceStandardHours").value="8"; if($("plannedAbsenceFte")) $("plannedAbsenceFte").value="1.00"; if($("plannedAbsenceReason")) $("plannedAbsenceReason").value="FERIE"; if($("plannedAbsenceNotes")) $("plannedAbsenceNotes").value=""; $("cancelPlannedAbsenceEditBtn")?.classList.add("hidden"); }
  async function save(){ hide($("plannedAbsencesMessage")); await profile(); const p=read(); if(!p.ok){ show($("plannedAbsencesMessage"),p.msg,"error"); return; } const id=$("plannedAbsenceId")?.value||""; const btn=$("savePlannedAbsenceBtn"); if(btn){btn.disabled=true;btn.textContent="Salvataggio...";} try{ let r; if(id){ const data={...p.base, absence_date:p.start, updated_at:new Date().toISOString()}; delete data.created_by; delete data.created_by_email; r=await client.from("planned_absences").update(data).eq("id",id).select(); } else { const rows=p.dates.map(d=>({...p.base,absence_date:d,updated_at:new Date().toISOString()})); r=await client.from("planned_absences").insert(rows).select(); } if(r.error) throw r.error; const count=id?1:p.dates.length; reset(); await loadAbsences(); render(); showDashboardPanel(false); show($("plannedAbsencesMessage"), count===1 ? "Assenza salvata correttamente." : `Assenza di lungo periodo salvata correttamente: ${count} giornate registrate.`, "success"); }catch(e){ show($("plannedAbsencesMessage"),e.message||"Errore salvataggio.","error"); } finally{ if(btn){btn.disabled=false;btn.textContent="Salva assenza";} } }
  function filters(){ const from=$("plannedAbsenceFromFilter")?.value||""; const to=$("plannedAbsenceToFilter")?.value||""; const reason=$("plannedAbsenceReasonFilter")?.value||""; const line=$("plannedAbsenceLineFilter")?.value||""; const s=norm($("plannedAbsenceSearch")?.value||""); state.filtered=state.absences.filter(a=>canUseLine(a.line_name)&&(!from||a.absence_date>=from)&&(!to||a.absence_date<=to)&&(!reason||a.reason===reason)&&(!line||a.line_name===line)&&(!s||norm([a.operator_name,a.line_name,a.reason,a.notes,a.created_by_email].join(" ")).includes(s))); }
  function fill(row){ showAddPanel(false); $("plannedAbsenceId").value=row.id||""; $("plannedAbsenceFormTitle").textContent="Modifica assenza"; $("plannedAbsenceDate").value=row.absence_date||""; if($("plannedAbsenceEndDate")) $("plannedAbsenceEndDate").value=row.absence_date||""; const op=state.operators.find(o=>String(o.id)===String(row.operator_id)); $("plannedAbsenceOperator").value=op?op.label:(row.operator_name||""); $("plannedAbsenceHours").value=String(row.hours||0); if($("plannedAbsenceStandardHours")) $("plannedAbsenceStandardHours").value=String(row.standard_absence_hours || op?.standardHours || row.hours || 8); if($("plannedAbsenceFte")) $("plannedAbsenceFte").value=String(num(row.fte_absence_programmabili,calcFte(row.hours,row.standard_absence_hours || op?.standardHours || 8,op?.fteProgrammabili || 1)).toFixed(2)); $("plannedAbsenceReason").value=row.reason||"ALTRO"; $("plannedAbsenceNotes").value=row.notes||""; $("cancelPlannedAbsenceEditBtn")?.classList.remove("hidden"); /* scroll disattivato: resta nella posizione corrente durante Modifica */ }
  async function clickTable(e){ const b=e.target.closest("button[data-action]"); if(!b) return; const row=state.absences.find(x=>String(x.id)===String(b.dataset.id)); if(!row) return; if(!canEdit(row)){ show($("plannedAbsencesMessage"),"Non sei autorizzato.","error"); return; } if(b.dataset.action==="edit"){ fill(row); return; } if(confirm("Eliminare questa assenza?")){ const r=await client.from("planned_absences").delete().eq("id",row.id); if(r.error) show($("plannedAbsencesMessage"),r.error.message,"error"); else { await loadAbsences(); render(); show($("plannedAbsencesMessage"),"Assenza eliminata correttamente.","success"); } } }
  function stats(){ const box=$("plannedAbsenceStats"); if(!box) return; const h=state.filtered.reduce((a,r)=>a+(num(r.hours,0)),0); const fte=state.filtered.reduce((a,r)=>a+num(r.fte_absence_programmabili,0),0); const people=new Set(state.filtered.map(r=>r.operator_name).filter(Boolean)); box.innerHTML=`<div class="summary-item"><span class="label">Giornate filtrate</span><span class="value">${state.filtered.length}</span></div><div class="summary-item"><span class="label">Ore assenza</span><span class="value">${h.toFixed(2)}</span></div><div class="summary-item"><span class="label">FTE assenti</span><span class="value">${fte.toFixed(2)}</span></div><div class="summary-item"><span class="label">Operatori coinvolti</span><span class="value">${people.size}</span></div>`; }
  function table(){ const body=$("plannedAbsencesBody"); if(!body) return; if(!state.filtered.length){ body.innerHTML='<tr><td colspan="10"><div class="muted">Nessuna assenza trovata.</div></td></tr>'; return; } body.innerHTML=state.filtered.map(r=>`<tr><td data-label="Data">${esc(formatDateIT(r.absence_date))}</td><td data-label="Operatore"><strong>${esc(r.operator_name||"-")}</strong></td><td data-label="Linea">${esc(r.line_name||"-")}</td><td data-label="Ore assenza">${esc(num(r.hours,0).toFixed(2))}</td><td data-label="Ore std">${esc(num(r.standard_absence_hours,0).toFixed(2))}</td><td data-label="FTE">${esc(num(r.fte_absence_programmabili,0).toFixed(2))}</td><td data-label="Motivo"><span class="planned-reason-badge reason-${esc(r.reason||"ALTRO")}">${esc(r.reason||"ALTRO")}</span></td><td data-label="Note">${esc(r.notes||"-")}</td><td data-label="Inserita da"><span class="planned-owner-badge">${esc(r.created_by_email||"-")}</span></td><td data-label="Azioni"><div class="planned-actions">${canEdit(r)?`<button class="btn btn-secondary btn-small" data-action="edit" data-id="${esc(r.id)}">Modifica</button><button class="btn btn-danger btn-small" data-action="delete" data-id="${esc(r.id)}">Elimina</button>`:'<span class="muted">Solo lettura</span>'}</div></td></tr>`).join(""); }
  function allCalendarLines(){ const lineList=[...new Set(state.operators.map(o=>o.line).filter(Boolean).concat(state.absences.map(a=>a.line_name).filter(Boolean)))].filter(l=>canUseLine(l)).sort((a,b)=>a.localeCompare(b,"it")); return lineList.length?lineList:["Senza linea"]; }
  function lineSummaryHtml(items){
    const byLine=new Map();
    allCalendarLines().forEach(line=>byLine.set(line,{count:0,hours:0,fteAbs:0}));
    items.forEach(i=>{ const line=i.line_name||"Senza linea"; if(!canUseLine(line)) return; if(!byLine.has(line)) byLine.set(line,{count:0,hours:0,fteAbs:0}); const g=byLine.get(line); g.count+=1; g.hours+=num(i.hours,0); g.fteAbs+=num(i.fte_absence_programmabili,0); });
    return `<div class="planned-line-summary planned-line-summary-all">${[...byLine.entries()].sort((a,b)=>a[0].localeCompare(b[0],"it")).map(([line,g])=>{ const operatorsOfLine=state.operators.filter(op=>(op.line||"Senza linea")===line); const fteTot=operatorsOfLine.reduce((sum,op)=>sum+num(op.fteProgrammabili,1),0); const fteReal=Math.max(0, fteTot-g.fteAbs); const completeClass=g.count===0?" planned-line-complete":""; const assenzeText=g.count===0?"Al completo":`${g.count} ass. · ${g.hours.toFixed(1)}h · ${g.fteAbs.toFixed(2)} FTE assenti`; return `<div class="planned-line-pill planned-line-pill-rich${completeClass}"><strong>${esc(line)}</strong><span>${assenzeText}</span><span>FTE TOTALI: ${fteTot.toFixed(2)}</span><span>FTE reali programmabili: ${fteReal.toFixed(2)}</span></div>`; }).join("")}</div>`;
  }
  function calendar(){
    const box=$("plannedAbsenceCalendar"); if(!box) return;
    const m=$("plannedAbsenceMonth")?.value||currentMonth();
    const source=Array.isArray(state.filtered)?state.filtered:state.absences;
    const rows=source.filter(a=>canUseLine(a.line_name)&&String(a.absence_date||"").startsWith(m));
    if(!rows.length){ box.innerHTML='<div class="planned-empty">Nessuna assenza trovata nel mese selezionato con i filtri attivi.</div>'; return; }
    const g=new Map();
    rows.forEach(r=>{ const d=r.absence_date||"Senza data"; if(!g.has(d)) g.set(d,[]); g.get(d).push(r); });
    box.innerHTML=[...g.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([d,items])=>`<div class="planned-day"><div class="planned-day-head"><span>${esc(formatDateIT(d))}</span><span class="planned-day-count">${items.length}</span></div>${lineSummaryHtml(items)}<ul class="planned-day-list">${items.map(i=>`<li class="planned-day-item"><span><strong>${esc(i.operator_name||"-")}</strong><small>${esc(i.line_name||"Senza linea")}</small></span><span class="planned-day-item-right">${esc(i.reason||"ALTRO")} · ${esc(num(i.hours,0).toFixed(2))}h · ${esc(num(i.fte_absence_programmabili,0).toFixed(2))} FTE ${canEdit(i)?`<button class="btn btn-secondary btn-small planned-calendar-edit" data-action="edit" data-id="${esc(i.id)}" type="button">Modifica</button><button class="btn btn-danger btn-small planned-calendar-delete" data-action="delete" data-id="${esc(i.id)}" type="button">Elimina</button>`:""}</span></li>`).join("")}</ul></div>`).join("");
  }
  function render(){ lines(); filters(); stats(); table(); calendar(); }
  function exportExcelXml(value){
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }
  function exportColName(index){
    let n=index+1, out="";
    while(n>0){ const r=(n-1)%26; out=String.fromCharCode(65+r)+out; n=Math.floor((n-1)/26); }
    return out;
  }
  function exportCell(value,rowIndex,colIndex){
    const ref=exportColName(colIndex)+rowIndex;
    if(typeof value==="number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
    return `<c r="${ref}" t="inlineStr"><is><t>${exportExcelXml(value)}</t></is></c>`;
  }
  function exportSheetXml(rows){
    const body=rows.map((row,i)=>{ const r=i+1; return `<row r="${r}">${row.map((v,c)=>exportCell(v,r,c)).join("")}</row>`; }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData>${body}</sheetData></worksheet>`;
  }
  const exportCrcTable = (()=>{ const t=new Uint32Array(256); for(let i=0;i<256;i++){ let c=i; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[i]=c>>>0; } return t; })();
  function exportCrc32(bytes){ let crc=0xFFFFFFFF; for(let i=0;i<bytes.length;i++) crc=(crc>>>8)^exportCrcTable[(crc^bytes[i])&255]; return (crc^0xFFFFFFFF)>>>0; }
  function exportU16(n){ return [n&255,(n>>>8)&255]; }
  function exportU32(n){ return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]; }
  function exportBytes(str){ return new TextEncoder().encode(str); }
  function exportConcat(parts){ const total=parts.reduce((s,p)=>s+p.length,0); const out=new Uint8Array(total); let pos=0; parts.forEach(p=>{out.set(p,pos); pos+=p.length;}); return out; }
  function exportMakeZip(files){
    const localParts=[]; const centralParts=[]; let offset=0;
    files.forEach(file=>{
      const nameBytes=exportBytes(file.name); const dataBytes=exportBytes(file.content); const crc=exportCrc32(dataBytes);
      const local=new Uint8Array([0x50,0x4B,0x03,0x04,...exportU16(20),...exportU16(0),...exportU16(0),...exportU16(0),...exportU16(0),...exportU32(crc),...exportU32(dataBytes.length),...exportU32(dataBytes.length),...exportU16(nameBytes.length),...exportU16(0)]);
      localParts.push(local,nameBytes,dataBytes);
      const central=new Uint8Array([0x50,0x4B,0x01,0x02,...exportU16(20),...exportU16(20),...exportU16(0),...exportU16(0),...exportU16(0),...exportU16(0),...exportU32(crc),...exportU32(dataBytes.length),...exportU32(dataBytes.length),...exportU16(nameBytes.length),...exportU16(0),...exportU16(0),...exportU16(0),...exportU16(0),...exportU32(0),...exportU32(offset)]);
      centralParts.push(central,nameBytes); offset+=local.length+nameBytes.length+dataBytes.length;
    });
    const centralBytes=exportConcat(centralParts);
    const end=new Uint8Array([0x50,0x4B,0x05,0x06,...exportU16(0),...exportU16(0),...exportU16(files.length),...exportU16(files.length),...exportU32(centralBytes.length),...exportU32(offset),...exportU16(0)]);
    return exportConcat([...localParts,centralBytes,end]);
  }
  function exportXlsxBlob(sheets){
    const defs=sheets.map((s,i)=>({name:s.name,rows:s.rows,id:i+1}));
    const files=[
      {name:"[Content_Types].xml",content:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${defs.map(s=>`<Override PartName="/xl/worksheets/sheet${s.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`},
      {name:"_rels/.rels",content:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
      {name:"xl/workbook.xml",content:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${defs.map(s=>`<sheet name="${exportExcelXml(s.name).slice(0,31)}" sheetId="${s.id}" r:id="rId${s.id}"/>`).join("")}</sheets></workbook>`},
      {name:"xl/_rels/workbook.xml.rels",content:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${defs.map(s=>`<Relationship Id="rId${s.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${s.id}.xml"/>`).join("")}</Relationships>`}
    ];
    defs.forEach(s=>files.push({name:`xl/worksheets/sheet${s.id}.xml`,content:exportSheetXml(s.rows)}));
    return new Blob([exportMakeZip(files)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  }
  function exportIsoToDate(iso){ const d=new Date(String(iso||"")+"T00:00:00"); return Number.isNaN(d.getTime())?null:d; }
  function exportIsoRange(startIso,endIso){
    const out=[]; const s=exportIsoToDate(startIso); const e=exportIsoToDate(endIso); if(!s || !e || e<s) return out;
    for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)){ out.push(d.toISOString().slice(0,10)); if(out.length>366) break; }
    return out;
  }
  function exportDefaultRange(rows){
    const dates=rows.map(r=>r.absence_date).filter(Boolean).sort();
    return {start:$("plannedAbsenceFromFilter")?.value || dates[0] || "", end:$("plannedAbsenceToFilter")?.value || dates[dates.length-1] || ""};
  }
  function exportLineFteTotal(line){
    return state.operators.filter(op=>(op.line||"Senza linea")===line).reduce((sum,op)=>sum+num(op.fteProgrammabili,1),0);
  }
  function exportAbsenceNote(items){
    if(!items.length) return "Nessun assente";
    return items.map(i=>`${i.operator_name || "-"} - ${i.reason || "ALTRO"} - ${num(i.hours,0).toFixed(2)}h - ${num(i.fte_absence_programmabili,0).toFixed(2)} FTE${i.notes ? " - Note: "+i.notes : ""}`).join(" | ");
  }
  function exportSameOperator(op,row){
    if(!op || !row) return false;
    if(op.id !== null && op.id !== undefined && row.operator_id !== null && row.operator_id !== undefined){
      return String(op.id) === String(row.operator_id);
    }
    return norm(op.name || "") === norm(row.operator_name || "");
  }
  function exportPresentiNote(day,line,visible){
    const operatorsOfLine = state.operators
      .filter(op => (op.line || "Senza linea") === line)
      .sort((a,b)=>(a.name||"").localeCompare(b.name||"","it"));
    if(!operatorsOfLine.length) return "Nessun operatore configurato sulla linea";
    const presenti = operatorsOfLine.map(op => {
      const fteBase = num(op.fteProgrammabili,1);
      const fteAbs = visible
        .filter(r => r.absence_date === day && (r.line_name || "Senza linea") === line && exportSameOperator(op,r))
        .reduce((sum,r)=>sum+num(r.fte_absence_programmabili,0),0);
      const ftePresente = Math.max(0, fteBase - fteAbs);
      return { name: op.name || "Operatore", fte: ftePresente };
    }).filter(item => item.fte > 0.0001);
    if(!presenti.length) return "Nessun presente";
    return presenti.map(item => `${item.name} - ${item.fte.toFixed(2)} FTE`).join(" | ");
  }
  function exportPlannedAbsencesView(){
    filters();
    const visible=Array.isArray(state.filtered)?state.filtered:[];
    const range=exportDefaultRange(visible);
    if(!range.start || !range.end){ show($("plannedAbsencesMessage"),"Non ci sono dati da esportare con i filtri attuali.","info"); return; }
    const days=exportIsoRange(range.start,range.end);
    const lineList=allCalendarLines().filter(Boolean).sort((a,b)=>a.localeCompare(b,"it"));
    if(!days.length || !lineList.length){ show($("plannedAbsencesMessage"),"Non ci sono date o linee da esportare.","info"); return; }
    const riepilogo=[["Data","Linea","FTE TOTALI","FTE assenti","FTE reali programmabili","Numero assenti","Assenti / note","Presenti / FTE"]];
    days.forEach(day=>{
      lineList.forEach(line=>{
        const items=visible.filter(r=>r.absence_date===day && (r.line_name||"Senza linea")===line);
        const fteTot=exportLineFteTotal(line);
        const fteAbs=items.reduce((sum,r)=>sum+num(r.fte_absence_programmabili,0),0);
        const fteReal=Math.max(0,fteTot-fteAbs);
        riepilogo.push([formatDateIT(day),line,Number(fteTot.toFixed(2)),Number(fteAbs.toFixed(2)),Number(fteReal.toFixed(2)),items.length,exportAbsenceNote(items),exportPresentiNote(day,line,visible)]);
      });
    });
    const dettaglio=[["Data","Operatore","Linea","Ore assenza","Ore standard","FTE","Motivo","Note","Inserita da"]]
      .concat(visible.slice().sort((a,b)=>String(a.absence_date||"").localeCompare(String(b.absence_date||"")) || String(a.line_name||"").localeCompare(String(b.line_name||""),"it") || String(a.operator_name||"").localeCompare(String(b.operator_name||""),"it")).map(r=>[
        formatDateIT(r.absence_date), r.operator_name||"-", r.line_name||"-", Number(num(r.hours,0).toFixed(2)), Number(num(r.standard_absence_hours,0).toFixed(2)), Number(num(r.fte_absence_programmabili,0).toFixed(2)), r.reason||"ALTRO", r.notes||"", r.created_by_email||""
      ]));
    const blob=exportXlsxBlob([{name:"Riepilogo giornaliero",rows:riepilogo},{name:"Dettaglio assenti",rows:dettaglio}]);
    const filename=`assenze_programmate_${range.start}_${range.end}.xlsx`;
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    show($("plannedAbsencesMessage"),`Export Excel generato correttamente: ${riepilogo.length-1} righe di riepilogo e ${Math.max(0,dettaglio.length-1)} assenze di dettaglio.`,"success");
  }
  window.exportPlannedAbsencesView = exportPlannedAbsencesView;
  async function open(){ await profile(); reveal(); if(!state.user){ show($("globalMessage"),"Effettua il login.","error"); return; } view(); showChoiceOnly(); applyCurrentMonthDefaults(true); if(!$("plannedAbsenceDate").value) $("plannedAbsenceDate").value=todayIso(); if($("plannedAbsenceEndDate")&&!$("plannedAbsenceEndDate").value) $("plannedAbsenceEndDate").value=$("plannedAbsenceDate").value||todayIso(); if(!$("plannedAbsenceMonth").value) $("plannedAbsenceMonth").value=currentMonth(); await loadOperators(); await loadAbsences(); render(); updateFtePreview(); }
  function bind(){
    const top=$("openPlannedAbsencesBtn");
    if(top&&!top.dataset.boundAbs){ top.dataset.boundAbs="1"; top.addEventListener("click",open); }
    const home=$("homeOpenPlannedAbsencesBtn");
    if(home&&!home.dataset.boundAbs){ home.dataset.boundAbs="1"; home.addEventListener("click",open); }
    const openAdd=$("plannedOpenAddBtn");
    if(openAdd&&!openAdd.dataset.boundAbs){ openAdd.dataset.boundAbs="1"; openAdd.addEventListener("click",()=>{ reset(); showAddPanel(true); }); }
    const openCal=$("plannedOpenCalendarBtn");
    if(openCal&&!openCal.dataset.boundAbs){ openCal.dataset.boundAbs="1"; openCal.addEventListener("click",()=>{ showDashboardPanel(true); render(); }); }
    const backDash=$("plannedBackToDashboardBtn");
    if(backDash&&!backDash.dataset.boundAbs){ backDash.dataset.boundAbs="1"; backDash.addEventListener("click",()=>{ reset(); showDashboardPanel(true); }); }
    const saveBtn=$("savePlannedAbsenceBtn");
    if(saveBtn&&!saveBtn.dataset.boundAbs){ saveBtn.dataset.boundAbs="1"; saveBtn.addEventListener("click",save); }
    const cancel=$("cancelPlannedAbsenceEditBtn");
    if(cancel&&!cancel.dataset.boundAbs){ cancel.dataset.boundAbs="1"; cancel.addEventListener("click",()=>{ reset(); showDashboardPanel(true); }); }
    const refresh=$("refreshPlannedAbsencesBtn");
    if(refresh&&!refresh.dataset.boundAbs){ refresh.dataset.boundAbs="1"; refresh.addEventListener("click",async()=>{ await loadAbsences(); render(); show($("plannedAbsencesMessage"),"Dati aggiornati.","success"); }); }
    const exportBtn=$("exportPlannedAbsencesBtn");
    if(exportBtn&&!exportBtn.dataset.boundAbs){ exportBtn.dataset.boundAbs="1"; exportBtn.addEventListener("click",exportPlannedAbsencesView); }
    const startDate=$("plannedAbsenceDate");
    const endDate=$("plannedAbsenceEndDate");
    if(startDate&&endDate&&!startDate.dataset.boundRange){ startDate.dataset.boundRange="1"; startDate.addEventListener("change",()=>{ if(!endDate.value || endDate.value<startDate.value) endDate.value=startDate.value; }); }
    ["plannedAbsenceOperator","plannedAbsenceHours","plannedAbsenceStandardHours"].forEach(id=>{ const el=$(id); if(el&&!el.dataset.boundFte){ el.dataset.boundFte="1"; el.addEventListener(id==="plannedAbsenceOperator"?"change":"input", id==="plannedAbsenceOperator"?syncOperatorDefaults:updateFtePreview); } });
    ["plannedAbsenceFromFilter","plannedAbsenceToFilter","plannedAbsenceReasonFilter","plannedAbsenceLineFilter","plannedAbsenceSearch","plannedAbsenceMonth"].forEach(id=>{ const el=$(id); if(el&&!el.dataset.boundAbs){ el.dataset.boundAbs="1"; el.addEventListener(el.tagName==="SELECT"||el.type==="date"||el.type==="month"?"change":"input",render); } });
    const body=$("plannedAbsencesBody");
    if(body&&!body.dataset.boundAbs){ body.dataset.boundAbs="1"; body.addEventListener("click",clickTable); }
    const cal=$("plannedAbsenceCalendar");
    if(cal&&!cal.dataset.boundAbs){ cal.dataset.boundAbs="1"; cal.addEventListener("click",clickTable); }
  }
  document.addEventListener("DOMContentLoaded", function(){ setTimeout(async()=>{ bind(); await profile(); reveal(); }, 1000); });
})();


/* ===== ROBUST FTE LIVE UPDATE ===== */
(function(){
  function n(v){ const x=Number(String(v||"0").replace(",",".")); return Number.isFinite(x)?x:0; }
  function update(){
    const h=document.getElementById("plannedAbsenceHours");
    const s=document.getElementById("plannedAbsenceStandardHours");
    const out=document.getElementById("plannedAbsenceFte");
    if(!h || !s || !out) return;
    const hours=n(h.value);
    const std=n(s.value);
    let fteBase=1;
    // If the selected option has FTE programmabili stored in the HTML label cannot be read reliably here;
    // the core module writes the correct operator-based value during save. This live preview uses the visible fields.
    const fte = std > 0 ? (hours / std) * fteBase : 0;
    out.value = Number.isFinite(fte) ? fte.toFixed(2) : "0.00";
  }
  document.addEventListener("input", function(e){
    if(e.target && (e.target.id === "plannedAbsenceHours" || e.target.id === "plannedAbsenceStandardHours")) update();
  });
  document.addEventListener("change", function(e){
    if(e.target && (e.target.id === "plannedAbsenceHours" || e.target.id === "plannedAbsenceStandardHours" || e.target.id === "plannedAbsenceOperator")) setTimeout(update, 0);
  });
  document.addEventListener("DOMContentLoaded", function(){ setTimeout(update, 1200); });
})();

/* ===== EXPORT EXCEL ASSENZE PROGRAMMATE - CLICK FALLBACK ===== */
document.addEventListener("click",function(event){
  const button = event.target && event.target.closest ? event.target.closest("#exportPlannedAbsencesBtn") : null;
  if(!button) return;
  if(typeof window.exportPlannedAbsencesView === "function"){
    event.preventDefault();
    window.exportPlannedAbsencesView();
  }
});


/* ===== PATCH FINALE RIEPILOGO ARCHIVIO ADMIN 2026-07-07 ===== */
(function(){
  "use strict";
  const client = window.AppSupabase && window.AppSupabase.getClient ? window.AppSupabase.getClient() : null;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const norm = (value) => String(value || "").trim().toUpperCase();
  const minToHours = (minutes) => ((Number(minutes) || 0) / 60).toFixed(2);
  const safeJsonWorks = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; }
  };
  const worksLabel = (value) => {
    const labels = safeJsonWorks(value).map((item) => typeof item === "object" ? (item.nome || item.name || item.lavorazione || "") : String(item || "")).filter(Boolean);
    return labels.length ? labels.join(", ") : "-";
  };
  function showMessage(target, text, type){
    if (!target) return;
    target.textContent = text;
    target.className = "message " + (type || "info");
    target.classList.remove("hidden");
  }
  function hideMessage(target){
    if (!target) return;
    target.textContent = "";
    target.className = "message hidden";
  }
  function switchMainView(viewId){
    ["homeView","attendanceView","plannedAbsencesView","operatorsAdminView","attendanceAdminView"].forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle("hidden", id !== viewId);
    });
  }

  /* 1) RIEPILOGO PRESENZE ROBUSTO */
  const attendanceState = { sessions: [], rows: [], selectedSessionId: null };
  async function openReliableAttendanceAdmin(){
    if (!client) return;
    switchMainView("attendanceAdminView");
    hideMessage($("globalMessage"));
    if ($("attendanceAdminDateFilter")) $("attendanceAdminDateFilter").value = "";
    if ($("attendanceAdminLineFilter")) $("attendanceAdminLineFilter").value = "";
    if ($("attendanceAdminSearchInput")) $("attendanceAdminSearchInput").value = "";
    attendanceState.selectedSessionId = null;
    attendanceState.rows = [];
    await loadReliableAttendanceSessions();
  }
  async function loadReliableAttendanceSessions(){
    if (!client) return;
    const message = $("attendanceAdminMessage");
    hideMessage(message);
    let query = client.from("attendance_sessions").select("*").order("work_date", { ascending:false }).order("line_name", { ascending:true });
    const date = $("attendanceAdminDateFilter") ? $("attendanceAdminDateFilter").value : "";
    const line = $("attendanceAdminLineFilter") ? $("attendanceAdminLineFilter").value : "";
    if (date) query = query.eq("work_date", date);
    if (line) query = query.eq("line_name", line);
    const response = await query;
    if (response.error) {
      showMessage(message, response.error.message || "Errore caricamento riepilogo presenze.", "error");
      return;
    }
    attendanceState.sessions = Array.isArray(response.data) ? response.data : [];
    renderReliableAttendanceLineFilter();
    renderReliableAttendanceSessions();
    renderReliableAttendanceRows();
  }
  function renderReliableAttendanceLineFilter(){
    const select = $("attendanceAdminLineFilter");
    if (!select) return;
    const current = select.value || "";
    const lines = Array.from(new Set(attendanceState.sessions.map((session) => session.line_name).filter(Boolean))).sort((a,b)=>a.localeCompare(b,"it"));
    select.innerHTML = '<option value="">Tutte le linee</option>' + lines.map((line) => `<option value="${esc(line)}">${esc(line)}</option>`).join("");
    select.value = lines.includes(current) ? current : "";
  }
  function renderReliableAttendanceSessions(){
    const body = $("attendanceAdminSessionsBody");
    if (!body) return;
    if (!attendanceState.sessions.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="muted">Nessuna giornata salvata trovata.</div></td></tr>';
      return;
    }
    body.innerHTML = attendanceState.sessions.map((session) => `
      <tr class="${String(session.id)===String(attendanceState.selectedSessionId) ? "is-selected" : ""}">
        <td data-label="Data">${esc(session.work_date || "-")}</td>
        <td data-label="Linea">${esc(session.line_name || "-")}</td>
        <td data-label="Inizio">${esc(session.start_time || "-")}</td>
        <td data-label="Fine">${esc(session.end_time || "-")}</td>
        <td data-label="Azioni"><button class="btn btn-secondary btn-small" type="button" data-reliable-session-id="${esc(session.id)}">Apri dettaglio</button></td>
      </tr>
    `).join("");
    body.querySelectorAll("button[data-reliable-session-id]").forEach((button) => {
      button.addEventListener("click", () => loadReliableAttendanceRows(button.dataset.reliableSessionId));
    });
  }
  async function loadReliableAttendanceRows(sessionId){
    attendanceState.selectedSessionId = sessionId;
    const message = $("attendanceAdminMessage");
    hideMessage(message);
    const response = await client.from("attendance_rows").select("*").eq("attendance_session_id", sessionId).order("sort_order", { ascending:true });
    if (response.error) {
      showMessage(message, response.error.message || "Errore caricamento dettaglio presenze.", "error");
      return;
    }
    attendanceState.rows = Array.isArray(response.data) ? response.data : [];
    renderReliableAttendanceSessions();
    renderReliableAttendanceRows();
  }
  function renderReliableAttendanceRows(){
    const body = $("attendanceAdminRowsBody");
    if (!body) return;
    const search = norm($("attendanceAdminSearchInput") ? $("attendanceAdminSearchInput").value : "");
    const rows = attendanceState.rows.filter((row) => !search || norm([row.cognome,row.nome,row.line_day,row.postazione,JSON.stringify(row.lavorazioni || [])].join(" ")).includes(search));
    if (!attendanceState.selectedSessionId) {
      body.innerHTML = '<tr><td colspan="8"><div class="muted">Apri una giornata per vedere il dettaglio.</div></td></tr>';
      return;
    }
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="muted">Nessuna riga trovata.</div></td></tr>';
      return;
    }
    body.innerHTML = rows.map((row) => {
      const name = [row.cognome,row.nome].filter(Boolean).join(" ") || "Operatore";
      const extras = `${Number(row.evento_min)||0}/${Number(row.assemblea_min)||0}/${Number(row.sciopero_min)||0} min`;
      return `
        <tr>
          <td data-label="Operatore"><strong>${esc(name)}</strong></td>
          <td data-label="Linea">${esc(row.line_day || "-")}</td>
          <td data-label="Postazione">${esc(row.postazione || "-")}</td>
          <td data-label="Lavorazioni">${esc(worksLabel(row.lavorazioni))}</td>
          <td data-label="Ore">${esc(minToHours(row.work_min))}</td>
          <td data-label="Finali">${esc(Number(row.final_min)||0)} min</td>
          <td data-label="Extra">${esc(extras)}</td>
          <td data-label="Azioni"><button class="btn btn-secondary btn-small" type="button" data-reliable-edit-row="${esc(row.id)}">Modifica ore</button></td>
        </tr>
      `;
    }).join("");
    body.querySelectorAll("button[data-reliable-edit-row]").forEach((button) => {
      button.addEventListener("click", () => reliableQuickEditRow(button.dataset.reliableEditRow));
    });
  }
  async function reliableQuickEditRow(rowId){
    const row = attendanceState.rows.find((item) => String(item.id) === String(rowId));
    if (!row) return;
    const value = prompt("Ore lavorate", minToHours(row.work_min));
    if (value === null) return;
    const number = Number(String(value).replace(",","."));
    if (!Number.isFinite(number) || number < 0) {
      showMessage($("attendanceAdminMessage"), "Inserisci un numero di ore valido.", "error");
      return;
    }
    const workMin = Math.round(number * 60);
    const session = attendanceState.sessions.find((item) => String(item.id) === String(row.attendance_session_id));
    const finalMin = Math.max(0, workMin - (Number(session && session.snack_min)||0) - (Number(session && session.stops_min)||0) - (Number(row.evento_min)||0) - (Number(row.assemblea_min)||0) - (Number(row.sciopero_min)||0));
    const response = await client.from("attendance_rows").update({ work_min: workMin, final_min: finalMin, dirty:true }).eq("id", rowId).select();
    if (response.error) {
      showMessage($("attendanceAdminMessage"), response.error.message || "Errore modifica presenza.", "error");
      return;
    }
    await loadReliableAttendanceRows(row.attendance_session_id);
    showMessage($("attendanceAdminMessage"), "Presenza modificata correttamente.", "success");
  }
  function bindReliableAttendance(){
    const navButtons = [$("openAttendanceAdminBtn"), $("homeOpenAttendanceAdminBtn")].filter(Boolean);
    navButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openReliableAttendanceAdmin();
      }, true);
    });
    const refresh = $("refreshAttendanceAdminBtn");
    if (refresh) refresh.addEventListener("click", (event) => { event.preventDefault(); loadReliableAttendanceSessions(); }, true);
    const date = $("attendanceAdminDateFilter");
    if (date) date.addEventListener("change", () => { attendanceState.selectedSessionId = null; attendanceState.rows = []; loadReliableAttendanceSessions(); }, true);
    const line = $("attendanceAdminLineFilter");
    if (line) line.addEventListener("change", () => { attendanceState.selectedSessionId = null; attendanceState.rows = []; loadReliableAttendanceSessions(); }, true);
    const search = $("attendanceAdminSearchInput");
    if (search) search.addEventListener("input", renderReliableAttendanceRows, true);
  }

  /* 2) ARCHIVIO ASSENZE: MANTIENE SCROLL DURANTE RICERCA */
  function bindPlannedAbsencesSearchStability(){
    const input = $("plannedAbsenceSearch");
    if (!input || input.dataset.noJumpPatch === "1") return;
    input.dataset.noJumpPatch = "1";
    input.addEventListener("input", () => {
      const x = window.scrollX;
      const y = window.scrollY;
      window.requestAnimationFrame(() => {
        input.focus({ preventScroll:true });
        window.scrollTo(x, y);
      });
      setTimeout(() => {
        input.focus({ preventScroll:true });
        window.scrollTo(x, y);
      }, 0);
    }, true);
  }

  /* 3) GESTIONE APPLICAZIONE: HOME ADMIN A PULSANTI */
  const adminState = { users: [], workOperations: [] };
  function ensureAdminDashboard(){
    const view = $("operatorsAdminView");
    if (!view) return;
    const mainCard = view.querySelector(":scope > .card") || view;
    if ($("adminAppDashboard")) return;
    const message = $("operatorsAdminMessage");
    const panel = document.createElement("div");
    panel.id = "adminAppDashboard";
    panel.className = "admin-app-dashboard card inline-card";
    panel.innerHTML = `
      <div class="card-header">
        <h3>Gestione applicazione</h3>
        <p>Scegli l'area da gestire. Le sezioni sono separate per rendere l'amministrazione più chiara.</p>
      </div>
      <div class="admin-app-grid">
        <button class="admin-app-choice" type="button" data-admin-area="operators">
          <span class="admin-app-choice-icon">OP</span>
          <span class="admin-app-choice-title">Anagrafiche operatori</span>
          <span class="admin-app-choice-text">Modifica operatori, linea, postazione, ore standard e stato attivo.</span>
        </button>
        <button class="admin-app-choice" type="button" data-admin-area="users">
          <span class="admin-app-choice-icon">USR</span>
          <span class="admin-app-choice-title">Utenti e permessi</span>
          <span class="admin-app-choice-text">Gestisci ruolo admin/user, abilitazione e autorizzazioni applicative.</span>
        </button>
        <button class="admin-app-choice" type="button" data-admin-area="work">
          <span class="admin-app-choice-icon">LAV</span>
          <span class="admin-app-choice-title">Lavorazioni configurate</span>
          <span class="admin-app-choice-text">Consulta e modifica lavorazioni per linea, postazione, carrello e ordine.</span>
        </button>
      </div>
      <div id="adminUsersPanel" class="admin-subpanel hidden"></div>
      <div id="adminWorkPanel" class="admin-subpanel hidden"></div>
    `;
    if (message) message.insertAdjacentElement("afterend", panel);
    else mainCard.prepend(panel);
    panel.querySelectorAll("button[data-admin-area]").forEach((button) => {
      button.addEventListener("click", () => selectAdminArea(button.dataset.adminArea));
    });
    selectAdminArea("");
  }
  function operatorBlocks(){
    const view = $("operatorsAdminView");
    if (!view) return [];
    const message = $("operatorsAdminMessage");
    const blocks = [];
    let node = message ? message.nextElementSibling : null;
    while (node) {
      if (node.id === "adminAppDashboard") { node = node.nextElementSibling; continue; }
      blocks.push(node);
      node = node.nextElementSibling;
    }
    return blocks.filter((el) => el && !["appTablesPanel"].includes(el.id));
  }
  function selectAdminArea(area){
    const dashboard = $("adminAppDashboard");
    if (!dashboard) return;
    dashboard.querySelectorAll("button[data-admin-area]").forEach((button) => button.classList.toggle("is-active", button.dataset.adminArea === area));
    const userPanel = $("adminUsersPanel");
    const workPanel = $("adminWorkPanel");
    const legacyPanel = $("appTablesPanel");
    const newOperatorBtn = $("newOperatorBtn");
    if (userPanel) userPanel.classList.toggle("hidden", area !== "users");
    if (workPanel) workPanel.classList.toggle("hidden", area !== "work");
    if (legacyPanel) legacyPanel.classList.add("hidden");
    if (newOperatorBtn) newOperatorBtn.classList.toggle("hidden", area !== "operators");
    operatorBlocks().forEach((block) => block.classList.toggle("hidden", area !== "operators"));
    if (area === "users") loadAdminUsers();
    if (area === "work") loadAdminWorkOperations();
  }
  async function loadAdminUsers(){
    const panel = $("adminUsersPanel");
    if (!panel || !client) return;
    panel.innerHTML = '<div class="muted">Caricamento utenti...</div>';
    const response = await client.from("app_users").select("user_id,email,role,can_manage_operators,is_active,allowed_lines").order("email", { ascending:true });
    if (response.error) {
      panel.innerHTML = `<div class="message error">${esc(response.error.message)}</div>`;
      return;
    }
    adminState.users = Array.isArray(response.data) ? response.data : [];
    renderAdminUsers();
  }
  function renderAdminUsers(){
    const panel = $("adminUsersPanel");
    if (!panel) return;
    const rows = adminState.users;
    panel.innerHTML = `
      <div class="admin-subpanel-head"><h3>Utenti e permessi</h3><button class="btn btn-secondary" type="button" id="adminRefreshUsersBtn">Aggiorna utenti</button></div>
      <div class="table-wrap"><table class="attendance-table admin-users-table">
        <thead><tr><th>Email</th><th>Ruolo</th><th>Admin</th><th>Attivo</th><th>Linee autorizzate</th><th>Azioni</th></tr></thead>
        <tbody>${rows.length ? rows.map((user) => `
          <tr>
            <td data-label="Email"><strong>${esc(user.email || "-")}</strong></td>
            <td data-label="Ruolo">${esc(user.role || "user")}</td>
            <td data-label="Admin">${user.can_manage_operators ? "Sì" : "No"}</td>
            <td data-label="Attivo">${user.is_active === false ? "No" : "Sì"}</td>
            <td data-label="Linee autorizzate">${esc(Array.isArray(user.allowed_lines) ? user.allowed_lines.join(", ") : (user.allowed_lines || "-"))}</td>
            <td data-label="Azioni"><div class="table-actions"><button class="btn btn-secondary btn-small" type="button" data-admin-toggle-user="${esc(user.user_id)}">${user.can_manage_operators ? "Rendi user" : "Rendi admin"}</button><button class="btn btn-danger btn-small" type="button" data-admin-active-user="${esc(user.user_id)}">${user.is_active === false ? "Riattiva" : "Disattiva"}</button></div></td>
          </tr>
        `).join("") : '<tr><td colspan="6"><div class="muted">Nessun utente trovato.</div></td></tr>'}</tbody>
      </table></div>
    `;
    const refresh = $("adminRefreshUsersBtn");
    if (refresh) refresh.addEventListener("click", loadAdminUsers);
    panel.querySelectorAll("button[data-admin-toggle-user]").forEach((button) => button.addEventListener("click", () => toggleAdminUser(button.dataset.adminToggleUser)));
    panel.querySelectorAll("button[data-admin-active-user]").forEach((button) => button.addEventListener("click", () => toggleActiveUser(button.dataset.adminActiveUser)));
  }
  async function toggleAdminUser(userId){
    const user = adminState.users.find((item) => String(item.user_id) === String(userId));
    if (!user) return;
    const next = !user.can_manage_operators;
    const response = await client.from("app_users").update({ role: next ? "admin" : "user", can_manage_operators: next }).eq("user_id", userId).select();
    if (!response.error) loadAdminUsers();
  }
  async function toggleActiveUser(userId){
    const user = adminState.users.find((item) => String(item.user_id) === String(userId));
    if (!user) return;
    const response = await client.from("app_users").update({ is_active: !(user.is_active !== false) }).eq("user_id", userId).select();
    if (!response.error) loadAdminUsers();
  }
  async function loadAdminWorkOperations(){
    const panel = $("adminWorkPanel");
    if (!panel || !client) return;
    panel.innerHTML = '<div class="muted">Caricamento lavorazioni...</div>';
    const response = await client.from("work_operations").select("id,linea,postazione,lavorazione,carrello,is_active,sort_order").order("linea", { ascending:true }).order("postazione", { ascending:true }).order("sort_order", { ascending:true });
    if (response.error) {
      panel.innerHTML = `<div class="message error">${esc(response.error.message)}</div>`;
      return;
    }
    adminState.workOperations = Array.isArray(response.data) ? response.data : [];
    renderAdminWorkOperations();
  }
  function renderAdminWorkOperations(){
    const panel = $("adminWorkPanel");
    if (!panel) return;
    const rows = adminState.workOperations;
    panel.innerHTML = `
      <div class="admin-subpanel-head"><h3>Lavorazioni configurate</h3><div class="actions"><button class="btn btn-primary" type="button" id="adminNewWorkBtn">Nuova lavorazione</button><button class="btn btn-secondary" type="button" id="adminRefreshWorkBtn">Aggiorna</button></div></div>
      <div class="table-wrap"><table class="attendance-table admin-work-table">
        <thead><tr><th>Linea</th><th>Postazione</th><th>Lavorazione</th><th>Carrello</th><th>Ordine</th><th>Attiva</th><th>Azioni</th></tr></thead>
        <tbody>${rows.length ? rows.map((row) => `
          <tr>
            <td data-label="Linea">${esc(row.linea || "-")}</td>
            <td data-label="Postazione">${esc(row.postazione || "-")}</td>
            <td data-label="Lavorazione"><strong>${esc(row.lavorazione || "-")}</strong></td>
            <td data-label="Carrello">${esc(row.carrello || "-")}</td>
            <td data-label="Ordine">${esc(row.sort_order || 0)}</td>
            <td data-label="Attiva">${row.is_active === false ? "No" : "Sì"}</td>
            <td data-label="Azioni"><div class="table-actions"><button class="btn btn-secondary btn-small" type="button" data-admin-edit-work="${esc(row.id)}">Modifica</button><button class="btn btn-danger btn-small" type="button" data-admin-toggle-work="${esc(row.id)}">${row.is_active === false ? "Riattiva" : "Disattiva"}</button></div></td>
          </tr>
        `).join("") : '<tr><td colspan="7"><div class="muted">Nessuna lavorazione configurata.</div></td></tr>'}</tbody>
      </table></div>
    `;
    const refresh = $("adminRefreshWorkBtn");
    if (refresh) refresh.addEventListener("click", loadAdminWorkOperations);
    const newBtn = $("adminNewWorkBtn");
    if (newBtn) newBtn.addEventListener("click", () => editAdminWorkOperation(null));
    panel.querySelectorAll("button[data-admin-edit-work]").forEach((button) => button.addEventListener("click", () => {
      const row = adminState.workOperations.find((item) => String(item.id) === String(button.dataset.adminEditWork));
      editAdminWorkOperation(row);
    }));
    panel.querySelectorAll("button[data-admin-toggle-work]").forEach((button) => button.addEventListener("click", () => toggleAdminWorkOperation(button.dataset.adminToggleWork)));
  }
  async function editAdminWorkOperation(row){
    const current = row || { linea:"", postazione:"", lavorazione:"", carrello:"", sort_order:0, is_active:true };
    const raw = prompt("Formato: LINEA | POSTAZIONE | LAVORAZIONE | CARRELLO | ORDINE | ATTIVA(true/false)", [current.linea,current.postazione,current.lavorazione,current.carrello || "",current.sort_order || 0,current.is_active !== false].join(" | "));
    if (!raw) return;
    const parts = raw.split("|").map((item) => item.trim());
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return;
    const payload = { linea: parts[0], postazione: parts[1], lavorazione: parts[2], carrello: parts[3] || "", sort_order: Number(parts[4]) || 0, is_active: parts[5] === undefined ? true : String(parts[5]).toLowerCase() !== "false" };
    const response = row && row.id ? await client.from("work_operations").update(payload).eq("id", row.id).select() : await client.from("work_operations").insert(payload).select();
    if (!response.error) loadAdminWorkOperations();
  }
  async function toggleAdminWorkOperation(id){
    const row = adminState.workOperations.find((item) => String(item.id) === String(id));
    if (!row) return;
    const response = await client.from("work_operations").update({ is_active: !(row.is_active !== false) }).eq("id", id).select();
    if (!response.error) loadAdminWorkOperations();
  }
  function bindAdminDashboard(){
    const buttons = [$("openOperatorsBtn"), $("homeOpenOperatorsBtn")].filter(Boolean);
    buttons.forEach((button) => {
      button.addEventListener("click", () => setTimeout(() => { ensureAdminDashboard(); selectAdminArea(""); }, 0), true);
    });
    ensureAdminDashboard();
    selectAdminArea("");
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      bindReliableAttendance();
      bindPlannedAbsencesSearchStability();
      bindAdminDashboard();
    }, 1200);
  });
})();


/* ===== PATCH EXPORT MEGA DATABASE PRESENZE 2026-07-07 ===== */
(function(){
  "use strict";
  const client = window.AppSupabase && window.AppSupabase.getClient ? window.AppSupabase.getClient() : null;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  const norm = (value) => String(value || "").trim().toUpperCase();
  const num = (value, fallback=0) => { const n=Number(String(value ?? "").replace(",",".")); return Number.isFinite(n)?n:fallback; };
  const minToHours = (minutes) => ((Number(minutes) || 0) / 60).toFixed(2);
  const todayIso = () => new Date().toISOString().slice(0,10);
  const currentYearStart = () => new Date().getFullYear()+"-01-01";

  const state = { sessions: [], rows: [], selectedSessionId: null };

  function show(el,msg,type){ if(!el) return; el.textContent=msg; el.className="message "+(type||"info"); el.classList.remove("hidden"); }
  function hide(el){ if(!el) return; el.textContent=""; el.className="message hidden"; }
  function switchView(viewId){ ["homeView","attendanceView","plannedAbsencesView","operatorsAdminView","attendanceAdminView"].forEach(id=>{ const el=$(id); if(el) el.classList.toggle("hidden", id!==viewId); }); }
  function safeWorksArray(value){
    let arr=[];
    if(Array.isArray(value)) arr=value;
    else if(value){ try{ const p=JSON.parse(value); if(Array.isArray(p)) arr=p; }catch(_){} }
    return arr.map(item=> typeof item==="object" ? (item.nome || item.name || item.lavorazione || "") : String(item||"")).filter(Boolean);
  }
  function safeWorks(value){ return safeWorksArray(value).join(", "); }
  function option(value,label){ return `<option value="${esc(value)}">${esc(label||value)}</option>`; }

  function ensureAttendanceControls(){
    const from = $("attendanceAdminDateFilter");
    if(from){
      const label = document.querySelector('label[for="attendanceAdminDateFilter"]');
      if(label) label.textContent = "Dal";
      if(!from.dataset.periodReady){ from.dataset.periodReady="1"; from.placeholder="Dal"; }
      const parent = from.closest(".field");
      if(parent && !$("attendanceAdminToDateFilter")){
        const toField=document.createElement("div");
        toField.className="field";
        toField.innerHTML=`<label for="attendanceAdminToDateFilter">Al</label><input id="attendanceAdminToDateFilter" type="date">`;
        parent.insertAdjacentElement("afterend", toField);
      }
    }
    const refresh = $("refreshAttendanceAdminBtn");
    const actions = refresh ? refresh.parentElement : null;
    if(actions && !$("exportMegaAttendanceBtn")){
      const btn=document.createElement("button");
      btn.id="exportMegaAttendanceBtn";
      btn.type="button";
      btn.className="btn btn-primary";
      btn.textContent="Esporta DB presenze Excel";
      actions.appendChild(btn);
    } else if($("exportMegaAttendanceBtn")) {
      $("exportMegaAttendanceBtn").textContent="Esporta DB presenze Excel";
    }
  }

  function getFilters(){
    return {
      from: $("attendanceAdminDateFilter")?.value || "",
      to: $("attendanceAdminToDateFilter")?.value || "",
      line: $("attendanceAdminLineFilter")?.value || "",
      search: norm($("attendanceAdminSearchInput")?.value || "")
    };
  }

  async function openMegaAttendance(){
    if(!client) return;
    ensureAttendanceControls();
    switchView("attendanceAdminView");
    state.selectedSessionId=null;
    state.rows=[];
    await loadMegaSessions();
  }

  async function loadMegaSessions(){
    if(!client) return;
    ensureAttendanceControls();
    const msg=$("attendanceAdminMessage");
    hide(msg);
    const f=getFilters();
    let query=client.from("attendance_sessions").select("*").order("work_date",{ascending:false}).order("line_name",{ascending:true});
    if(f.from) query=query.gte("work_date", f.from);
    if(f.to) query=query.lte("work_date", f.to);
    if(f.line) query=query.eq("line_name", f.line);
    const res=await query;
    if(res.error){ show(msg,res.error.message||"Errore caricamento riepilogo presenze.","error"); return; }
    state.sessions=Array.isArray(res.data)?res.data:[];
    renderLineFilter();
    renderSessions();
    renderRows();
  }

  function renderLineFilter(){
    const sel=$("attendanceAdminLineFilter");
    if(!sel) return;
    const cur=sel.value||"";
    const lines=[...new Set(state.sessions.map(s=>s.line_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"it"));
    sel.innerHTML=option("","Tutte le linee")+lines.map(l=>option(l,l)).join("");
    sel.value=lines.includes(cur)?cur:"";
  }

  function renderSessions(){
    const body=$("attendanceAdminSessionsBody");
    if(!body) return;
    if(!state.sessions.length){ body.innerHTML='<tr><td colspan="5"><div class="muted">Nessuna giornata salvata trovata.</div></td></tr>'; return; }
    body.innerHTML=state.sessions.map(s=>`<tr class="${String(s.id)===String(state.selectedSessionId)?"is-selected":""}"><td data-label="Data">${esc(s.work_date||"-")}</td><td data-label="Linea">${esc(s.line_name||"-")}</td><td data-label="Inizio">${esc(s.start_time||"-")}</td><td data-label="Fine">${esc(s.end_time||"-")}</td><td data-label="Azioni"><button class="btn btn-secondary btn-small" type="button" data-mega-session="${esc(s.id)}">Apri dettaglio</button></td></tr>`).join("");
    body.querySelectorAll("button[data-mega-session]").forEach(btn=>btn.addEventListener("click",()=>loadMegaRows(btn.dataset.megaSession)));
  }

  async function loadMegaRows(sessionId){
    state.selectedSessionId=sessionId;
    const msg=$("attendanceAdminMessage");
    hide(msg);
    const res=await client.from("attendance_rows").select("*").eq("attendance_session_id",sessionId).order("sort_order",{ascending:true});
    if(res.error){ show(msg,res.error.message||"Errore dettaglio presenze.","error"); return; }
    state.rows=Array.isArray(res.data)?res.data:[];
    renderSessions();
    renderRows();
  }

  function rowMatchesSearch(row,search){
    if(!search) return true;
    return norm([row.nome,row.cognome,row.line_day,row.line_orig,row.postazione,safeWorks(row.lavorazioni)].join(" ")).includes(search);
  }

  function renderRows(){
    const body=$("attendanceAdminRowsBody");
    if(!body) return;
    const search=getFilters().search;
    const rows=state.rows.filter(r=>rowMatchesSearch(r,search));
    if(!state.selectedSessionId){ body.innerHTML='<tr><td colspan="8"><div class="muted">Apri una giornata per vedere il dettaglio.</div></td></tr>'; return; }
    if(!rows.length){ body.innerHTML='<tr><td colspan="8"><div class="muted">Nessuna riga trovata.</div></td></tr>'; return; }
    body.innerHTML=rows.map(r=>`<tr><td data-label="Operatore"><strong>${esc([r.cognome,r.nome].filter(Boolean).join(" ")||"Operatore")}</strong></td><td data-label="Linea">${esc(r.line_day||"-")}</td><td data-label="Postazione">${esc(r.postazione||"-")}</td><td data-label="Lavorazioni">${esc(safeWorks(r.lavorazioni)||"-")}</td><td data-label="Ore">${esc(minToHours(r.work_min))}</td><td data-label="Finali">${esc(Number(r.final_min)||0)} min</td><td data-label="Extra">${esc((Number(r.evento_min)||0)+"/"+(Number(r.assemblea_min)||0)+"/"+(Number(r.sciopero_min)||0)+" min")}</td><td data-label="Azioni"><button class="btn btn-secondary btn-small" type="button" data-mega-edit-row="${esc(r.id)}">Modifica ore</button></td></tr>`).join("");
    body.querySelectorAll("button[data-mega-edit-row]").forEach(btn=>btn.addEventListener("click",()=>quickEditRow(btn.dataset.megaEditRow)));
  }

  async function quickEditRow(rowId){
    const row=state.rows.find(r=>String(r.id)===String(rowId));
    if(!row) return;
    const value=prompt("Ore lavorate",minToHours(row.work_min));
    if(value===null) return;
    const hours=num(value,NaN);
    if(!Number.isFinite(hours) || hours<0){ show($("attendanceAdminMessage"),"Inserisci un numero ore valido.","error"); return; }
    const workMin=Math.round(hours*60);
    const session=state.sessions.find(s=>String(s.id)===String(row.attendance_session_id));
    const finalMin=Math.max(0,workMin-(Number(session?.snack_min)||0)-(Number(session?.stops_min)||0)-(Number(row.evento_min)||0)-(Number(row.assemblea_min)||0)-(Number(row.sciopero_min)||0));
    const res=await client.from("attendance_rows").update({work_min:workMin,final_min:finalMin,dirty:true}).eq("id",rowId).select();
    if(res.error){ show($("attendanceAdminMessage"),res.error.message||"Errore modifica presenza.","error"); return; }
    await loadMegaRows(row.attendance_session_id);
  }

  function operatorsKey(row){
    if(row.operator_id!==undefined && row.operator_id!==null && row.operator_id!=="") return "ID:"+String(row.operator_id);
    if(row.id_operatore) return "CODE:"+norm(row.id_operatore);
    return "NAME:"+norm([row.cognome,row.nome].filter(Boolean).join(" "));
  }
  function operatorKey(op){
    if(op.id!==undefined && op.id!==null && op.id!=="") return "ID:"+String(op.id);
    const code = op.idoperatore || op.id_operatore || op.idOperatore;
    if(code) return "CODE:"+norm(code);
    return "NAME:"+norm([op.cognome,op.nome].filter(Boolean).join(" "));
  }
  async function loadOperatorsMap(){
    const res=await client.from("operators").select("id,cognome,nome,idoperatore,id_operatore,lineaproduzione,lineaProduzione,linea_produzione,linea");
    const map=new Map();
    if(!res.error && Array.isArray(res.data)) res.data.forEach(op=>map.set(operatorKey(op), op));
    return map;
  }

  function xlsxEsc(value){ return String(value == null ? "" : value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;"); }
  function colName(index){ let n=index+1,out=""; while(n>0){ const r=(n-1)%26; out=String.fromCharCode(65+r)+out; n=Math.floor((n-1)/26); } return out; }
  function cellXml(value,row,col){ const ref=colName(col)+row; if(typeof value==="number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`; return `<c r="${ref}" t="inlineStr"><is><t>${xlsxEsc(value)}</t></is></c>`; }
  function sheetXml(rows){ const body=rows.map((row,i)=>`<row r="${i+1}">${row.map((v,c)=>cellXml(v,i+1,c)).join("")}</row>`).join(""); return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`; }
  const crcTable=(()=>{ const t=new Uint32Array(256); for(let i=0;i<256;i++){ let c=i; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[i]=c>>>0; } return t; })();
  function crc32(bytes){ let crc=0xFFFFFFFF; for(let i=0;i<bytes.length;i++) crc=(crc>>>8)^crcTable[(crc^bytes[i])&255]; return (crc^0xFFFFFFFF)>>>0; }
  const u16=n=>[n&255,(n>>>8)&255]; const u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]; const bytes=s=>new TextEncoder().encode(s);
  function concat(parts){ const total=parts.reduce((s,p)=>s+p.length,0); const out=new Uint8Array(total); let pos=0; parts.forEach(p=>{out.set(p,pos); pos+=p.length;}); return out; }
  function makeZip(files){ const locals=[], centrals=[]; let offset=0; files.forEach(file=>{ const nameBytes=bytes(file.name), dataBytes=bytes(file.content), crc=crc32(dataBytes); const local=new Uint8Array([0x50,0x4B,0x03,0x04,...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dataBytes.length),...u32(dataBytes.length),...u16(nameBytes.length),...u16(0)]); locals.push(local,nameBytes,dataBytes); const central=new Uint8Array([0x50,0x4B,0x01,0x02,...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dataBytes.length),...u32(dataBytes.length),...u16(nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]); centrals.push(central,nameBytes); offset += local.length + nameBytes.length + dataBytes.length; }); const centralBytes=concat(centrals); const end=new Uint8Array([0x50,0x4B,0x05,0x06,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralBytes.length),...u32(offset),...u16(0)]); return concat([...locals,centralBytes,end]); }
  function makeXlsx(sheets){
    const defs=sheets.map((s,i)=>({name:s.name,rows:s.rows,id:i+1}));
    const files=[
      {name:"[Content_Types].xml",content:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${defs.map(d=>`<Override PartName="/xl/worksheets/sheet${d.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`},
      {name:"_rels/.rels",content:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
      {name:"xl/workbook.xml",content:`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${defs.map(d=>`<sheet name="${xlsxEsc(d.name)}" sheetId="${d.id}" r:id="rId${d.id}"/>`).join("")}</sheets></workbook>`},
      {name:"xl/_rels/workbook.xml.rels",content:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${defs.map(d=>`<Relationship Id="rId${d.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${d.id}.xml"/>`).join("")}</Relationships>`}
    ];
    defs.forEach(d=>files.push({name:`xl/worksheets/sheet${d.id}.xml`,content:sheetXml(d.rows)}));
    return new Blob([makeZip(files)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  }

  async function exportMegaDatabase(){
    if(!client) return;
    ensureAttendanceControls();
    const msg=$("attendanceAdminMessage");
    hide(msg);
    const f=getFilters();
    let sessionQuery=client.from("attendance_sessions").select("*").order("work_date",{ascending:true}).order("line_name",{ascending:true});
    if(f.from) sessionQuery=sessionQuery.gte("work_date",f.from);
    if(f.to) sessionQuery=sessionQuery.lte("work_date",f.to);
    if(f.line) sessionQuery=sessionQuery.eq("line_name",f.line);
    const sessionsRes=await sessionQuery;
    if(sessionsRes.error){ show(msg,sessionsRes.error.message||"Errore export sessioni.","error"); return; }
    const sessions=Array.isArray(sessionsRes.data)?sessionsRes.data:[];
    if(!sessions.length){ show(msg,"Nessuna presenza da esportare con i filtri attivi.","info"); return; }
    const sessionIds=sessions.map(s=>s.id).filter(Boolean);
    const sessionMap=new Map(sessions.map(s=>[String(s.id),s]));
    let allRows=[];
    for(let i=0;i<sessionIds.length;i+=100){
      const chunk=sessionIds.slice(i,i+100);
      const rowsRes=await client.from("attendance_rows").select("*").in("attendance_session_id",chunk).order("sort_order",{ascending:true});
      if(rowsRes.error){ show(msg,rowsRes.error.message||"Errore export righe.","error"); return; }
      allRows=allRows.concat(Array.isArray(rowsRes.data)?rowsRes.data:[]);
    }
    const operatorsMap=await loadOperatorsMap();
    const search=f.search;
    const dbRows=[["DATA PRESENZA","NOME","COGNOME","LINEA STD","LINEA EFFETTIVA","POSTAZIONE","ORE STD","ORE DI LAVORO","MINUTI FINALI","LAVORAZIONI"]];
    const splitRows=[["DATA","NOME","COGNOME","POSTAZIONE","LAVORAZIONE"]];
    allRows.filter(row=>rowMatchesSearch(row,search)).sort((a,b)=>{
      const sa=sessionMap.get(String(a.attendance_session_id))||{};
      const sb=sessionMap.get(String(b.attendance_session_id))||{};
      return String(sa.work_date||"").localeCompare(String(sb.work_date||"")) || String(a.cognome||"").localeCompare(String(b.cognome||""),"it") || String(a.nome||"").localeCompare(String(b.nome||""),"it");
    }).forEach(row=>{
      const session=sessionMap.get(String(row.attendance_session_id))||{};
      const op=operatorsMap.get(operatorsKey(row));
      const lineStd = (op && (op.lineaproduzione || op.lineaProduzione || op.linea_produzione || op.linea)) || row.line_orig || "";
      const workList=safeWorksArray(row.lavorazioni);
      dbRows.push([
        session.work_date || "",
        row.nome || "",
        row.cognome || "",
        lineStd,
        row.line_day || session.line_name || "",
        row.postazione || "",
        num(row.ore_standard || row.base_ore_standard,0),
        Number(minToHours(row.work_min)),
        Number(row.final_min)||0,
        workList.join(", ")
      ]);
      if(workList.length){
        workList.forEach(work=>splitRows.push([session.work_date||"",row.nome||"",row.cognome||"",row.postazione||"",work]));
      } else {
        splitRows.push([session.work_date||"",row.nome||"",row.cognome||"",row.postazione||"",""]);
      }
    });
    if(dbRows.length===1){ show(msg,"Nessuna riga da esportare con i filtri attivi.","info"); return; }
    const blob=makeXlsx([{name:"DB PRESENZE",rows:dbRows},{name:"LAVORAZIONI SPLIT",rows:splitRows}]);
    const start=f.from || (sessions[0] && sessions[0].work_date) || currentYearStart();
    const end=f.to || (sessions[sessions.length-1] && sessions[sessions.length-1].work_date) || todayIso();
    const filename=`db_presenze_${start}_${end}.xlsx`;
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    show(msg,`Export Excel generato correttamente: ${dbRows.length-1} righe DB PRESENZE e ${splitRows.length-1} righe LAVORAZIONI SPLIT.`,"success");
  }

  function bindMegaAttendance(){
    ensureAttendanceControls();
    const nav=[$("openAttendanceAdminBtn"),$("homeOpenAttendanceAdminBtn")].filter(Boolean);
    nav.forEach(button=>button.addEventListener("click",event=>{ event.preventDefault(); event.stopImmediatePropagation(); openMegaAttendance(); },true));
    const refresh=$("refreshAttendanceAdminBtn");
    if(refresh) refresh.addEventListener("click",event=>{ event.preventDefault(); event.stopImmediatePropagation(); loadMegaSessions(); },true);
    const from=$("attendanceAdminDateFilter");
    const to=$("attendanceAdminToDateFilter");
    const line=$("attendanceAdminLineFilter");
    const search=$("attendanceAdminSearchInput");
    if(from) from.addEventListener("change",event=>{ event.stopImmediatePropagation(); state.selectedSessionId=null; state.rows=[]; loadMegaSessions(); },true);
    if(to) to.addEventListener("change",event=>{ event.stopImmediatePropagation(); state.selectedSessionId=null; state.rows=[]; loadMegaSessions(); },true);
    if(line) line.addEventListener("change",event=>{ event.stopImmediatePropagation(); state.selectedSessionId=null; state.rows=[]; loadMegaSessions(); },true);
    if(search) search.addEventListener("input",event=>{ event.stopImmediatePropagation(); renderRows(); },true);
    const exportBtn=$("exportMegaAttendanceBtn");
    if(exportBtn) exportBtn.addEventListener("click",event=>{ event.preventDefault(); exportMegaDatabase(); });
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(bindMegaAttendance,1400));
})();


/* ===== PATCH BRAND VSL OPERATIONS WORKFORCE 2026-07-07 ===== */
(function(){
  document.addEventListener("DOMContentLoaded", function(){
    document.title = "VSL Operations Workforce";
    const mark = document.querySelector(".brand-mark");
    if (mark) mark.textContent = "VOW";
    const title = document.querySelector(".app-title");
    if (title) title.textContent = "VSL Operations Workforce";
    const subtitle = document.querySelector(".app-subtitle");
    if (subtitle) subtitle.textContent = "People • Production • Planning";
  });
})();


/* ===== MOBILE HAMBURGER MENU RESPONSIVE 2026-07-07 ===== */
(function(){
  "use strict";
  function $(id){ return document.getElementById(id); }
  function visibleMenuButtons(menu){
    return Array.from(menu ? menu.querySelectorAll("button, a, [tabindex]") : [])
      .filter(function(el){ return !el.classList.contains("hidden") && !el.disabled; });
  }
  function setOpen(open){
    var menu = $("topbarMenu");
    var toggle = $("menuToggle");
    var backdrop = $("mobileMenuBackdrop");
    var body = document.body;
    if(!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
    if(backdrop) backdrop.classList.toggle("hidden", !open);
    if(body) body.classList.toggle("mobile-menu-open", open);
    if(open){
      var first = visibleMenuButtons(menu)[0];
      if(first) setTimeout(function(){ first.focus({preventScroll:true}); }, 0);
    } else {
      toggle.focus({preventScroll:true});
    }
  }
  function closeMenu(){ setOpen(false); }
  function toggleMenu(){
    var menu = $("topbarMenu");
    setOpen(!(menu && menu.classList.contains("is-open")));
  }
  function bind(){
    var toggle = $("menuToggle");
    var menu = $("topbarMenu");
    var backdrop = $("mobileMenuBackdrop");
    if(!toggle || !menu || toggle.dataset.mobileMenuBound === "1") return;
    toggle.dataset.mobileMenuBound = "1";
    toggle.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();
      toggleMenu();
    });
    if(backdrop){
      backdrop.addEventListener("click", function(event){
        event.preventDefault();
        closeMenu();
      });
    }
    menu.addEventListener("click", function(event){
      var item = event.target.closest("button, a");
      if(item && window.matchMedia("(max-width: 860px)").matches){
        closeMenu();
      }
    });
    document.addEventListener("keydown", function(event){
      if(event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function(){
      if(!window.matchMedia("(max-width: 860px)").matches) closeMenu();
    });
  }
  document.addEventListener("DOMContentLoaded", bind);
  if(document.readyState !== "loading") bind();
})();


/* ===== PATCH UX FINALE 2026-07-07: label chiara e niente salti su Modifica ===== */
(function(){
  "use strict";
  function renameRefresh(){
    var btn = document.getElementById("refreshPlannedAbsencesBtn");
    if(btn) {
      btn.textContent = "Ricarica dati da database";
      btn.title = "Ricarica operatori e assenze dal database senza cambiare i dati inseriti.";
    }
  }
  document.addEventListener("DOMContentLoaded", function(){
    renameRefresh();
    setInterval(renameRefresh, 1500);
  });
  document.addEventListener("click", function(event){
    var editButton = event.target && event.target.closest ? event.target.closest("button[data-action='edit'], button[data-reliable-edit-row], button[data-mega-edit-row], button[data-edit-row]") : null;
    if(!editButton) return;
    var x = window.scrollX;
    var y = window.scrollY;
    window.requestAnimationFrame(function(){ window.scrollTo(x, y); });
    setTimeout(function(){ window.scrollTo(x, y); }, 0);
    setTimeout(function(){ window.scrollTo(x, y); }, 80);
  }, true);
})();
