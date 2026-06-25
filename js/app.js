console.log("APP AVVIATA");

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
    "RIFINITURA 1": ["Assente"],
    "RIFINITURA 2": ["Assente"],
    "MAGAZZINO SEMILAVORATI": ["Assente"],
    "MAGAZZINO SPEDIZIONI": ["Assente"],
    "CONTROLLO TOMAIA": ["Assente"]
  };

  const state = {
    currentStep: 1,
    activeMainView: "attendance",
    activeView: "setup",
    user: null,
    currentUserProfile: null,
    operators: [],
    operatorSearchIndex: [],
    lastOperatorsLoadError: "",
    setup: {
      lineName: "",
      workDate: "",
      startTime: "",
      endTime: "",
      lunchMin: "0",
      snackMin: "0",
      stopsMin: "0",
      stopsNote: "",
      dayDurationMinutes: 0,
      baseWorkMinutes: 0,
      baseNetMinutes: 0
    },
    rows: [],
    operatorsAdmin: {
      searchText: "",
      lineFilter: "",
      statusFilter: "active"
    }
  };

  const dom = {};

  function initDom() {
    dom.authSection = document.getElementById("authSection");
    dom.appSection = document.getElementById("appSection");
    dom.globalMessage = document.getElementById("globalMessage");

    dom.userBadge = document.getElementById("userBadge");
    dom.logoutBtn = document.getElementById("logoutBtn");
    dom.openAttendanceBtn = document.getElementById("openAttendanceBtn");
    dom.openOperatorsBtn = document.getElementById("openOperatorsBtn");

    dom.emailInput = document.getElementById("emailInput");
    dom.passwordInput = document.getElementById("passwordInput");
    dom.loginBtn = document.getElementById("loginBtn");
    dom.authErrors = document.getElementById("authErrors");

    dom.attendanceView = document.getElementById("attendanceView");
    dom.operatorsAdminView = document.getElementById("operatorsAdminView");

    dom.setupView = document.getElementById("setupView");
    dom.rowsView = document.getElementById("rowsView");

    dom.wizardErrors = document.getElementById("wizardErrors");
    dom.rowsErrors = document.getElementById("rowsErrors");

    dom.stepBadge = document.getElementById("stepBadge");
    dom.progressFill = document.getElementById("progressFill");
    dom.step1 = document.getElementById("step1");
    dom.step2 = document.getElementById("step2");
    dom.step3 = document.getElementById("step3");

    dom.lineSelect = document.getElementById("lineSelect");
    dom.workDate = document.getElementById("workDate");
    dom.startTime = document.getElementById("startTime");
    dom.endTime = document.getElementById("endTime");
    dom.lunchMin = document.getElementById("lunchMin");
    dom.snackMin = document.getElementById("snackMin");
    dom.stopsMin = document.getElementById("stopsMin");
    dom.stopsNote = document.getElementById("stopsNote");

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

    dom.operatorsAdminMessage = document.getElementById("operatorsAdminMessage");
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

    await loadOperatorsFromDatabase();

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
        state.currentStep = 3;
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
      });
    }

    if (dom.operatorsLineFilter) {
      dom.operatorsLineFilter.addEventListener("change", () => {
        state.operatorsAdmin.lineFilter = dom.operatorsLineFilter.value || "";
        renderOperatorsAdmin();
      });
    }

    if (dom.operatorsStatusFilter) {
      dom.operatorsStatusFilter.addEventListener("change", () => {
        state.operatorsAdmin.statusFilter = dom.operatorsStatusFilter.value || "active";
        renderOperatorsAdmin();
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
        }
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
  }

  async function loadCurrentUserProfile() {
    if (!state.user || !state.user.id) {
      state.currentUserProfile = null;
      return;
    }

    try {
      const response = await client
        .from("app_users")
        .select("user_id, email, role, can_manage_operators, is_active")
        .eq("user_id", state.user.id)
        .maybeSingle();

      if (response.error) {
        console.warn("Errore lettura app_users:", response.error.message);
      }

      if (response.data) {
        state.currentUserProfile = response.data;
      } else {
        state.currentUserProfile = {
          user_id: state.user.id,
          email: state.user.email || "",
          role: "user",
          can_manage_operators: false,
          is_active: true
        };
      }
    } catch (error) {
      console.warn("Profilo app_users non disponibile:", error);

      state.currentUserProfile = {
        user_id: state.user.id,
        email: state.user.email || "",
        role: "user",
        can_manage_operators: false,
        is_active: true
      };
    }
  }

  function canManageOperators() {
    return Boolean(
      state.currentUserProfile &&
        state.currentUserProfile.is_active === true &&
        state.currentUserProfile.can_manage_operators === true
    );
  }

  function showAuthenticatedUI() {
    if (dom.authSection) dom.authSection.classList.add("hidden");
    if (dom.appSection) dom.appSection.classList.remove("hidden");

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
    if (dom.openAttendanceBtn) dom.openAttendanceBtn.classList.add("hidden");
    if (dom.openOperatorsBtn) dom.openOperatorsBtn.classList.add("hidden");

    hideBox(dom.globalMessage);
  }

  function renderPermissions() {
    const adminAllowed = canManageOperators();

    if (dom.openOperatorsBtn) {
      dom.openOperatorsBtn.classList.toggle("hidden", !adminAllowed);
    }

    if (dom.newOperatorBtn) {
      dom.newOperatorBtn.classList.toggle("hidden", !adminAllowed);
    }

    if (!adminAllowed && state.activeMainView === "operators") {
      state.activeMainView = "attendance";
    }

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

    if (!state.operators.length) {
      await loadOperatorsFromDatabase();
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

      state.operators = rawOperators
        .map(mapOperatorRow)
        .filter((operator) => {
          return operator.id !== null || operator.nome || operator.cognome;
        });

      state.operatorSearchIndex = state.operators
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
      ore_standard: Number(operator.oreStandard) || 0,
      work_min: workMin,
      evento_min: 0,
      assemblea_min: 0,
      sciopero_min: 0,
      final_min: finalMin,
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




function handleRowTableInteraction(event) {
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
      work_min: 0,
      evento_min: 0,
      assemblea_min: 0,
      sciopero_min: 0,
      final_min: 0,
      extrasOpen: false,
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

  // Postazione: aggiorna senza rifare render immediato
  if (field === "postazione") {
    row.postazione = target.value;

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
  }

  function renderSetupForm() {
    if (dom.lineSelect) dom.lineSelect.value = state.setup.lineName || "";
    if (dom.workDate) dom.workDate.value = state.setup.workDate || "";
    if (dom.startTime) dom.startTime.value = state.setup.startTime || "";
    if (dom.endTime) dom.endTime.value = state.setup.endTime || "";
    if (dom.lunchMin) dom.lunchMin.value = state.setup.lunchMin || "0";
    if (dom.snackMin) dom.snackMin.value = state.setup.snackMin || "0";
    if (dom.stopsMin) dom.stopsMin.value = state.setup.stopsMin || "0";
    if (dom.stopsNote) dom.stopsNote.value = state.setup.stopsNote || "";

    syncQuickButtons();
  }

  function renderWizard() {
    const steps = [dom.step1, dom.step2, dom.step3];

    steps.forEach((stepElement, index) => {
      if (!stepElement) return;

      const stepNumber = index + 1;
      stepElement.classList.toggle("hidden", stepNumber !== state.currentStep);
    });

    if (dom.stepBadge) {
      dom.stepBadge.textContent = "Step " + state.currentStep + " di 3";
    }

    if (dom.progressFill) {
      dom.progressFill.style.width = (state.currentStep / 3) * 100 + "%";
    }

    if (dom.wizardBackBtn) {
      dom.wizardBackBtn.disabled = state.currentStep === 1;
    }

    if (dom.wizardNextBtn) {
      dom.wizardNextBtn.classList.toggle("hidden", state.currentStep === 3);
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
      ["Pausa snack", toNonNegativeInt(state.setup.snackMin) + " min"],
      ["Fermi", toNonNegativeInt(state.setup.stopsMin) + " min"],
      ["Nota fermi", state.setup.stopsNote || "-"],
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
      ["Snack", toNonNegativeInt(state.setup.snackMin) + " min"],
      ["Fermi", toNonNegativeInt(state.setup.stopsMin) + " min"],
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
              <div class="operator-meta">-</div>
            </td>

            <td data-label="Ore std">
              ${escapeHtml(String(Number(row.ore_standard) || 0))}
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
                </div>
              `
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

      const lunchMin = toNonNegativeInt(state.setup.lunchMin);
      const snackMin = toNonNegativeInt(state.setup.snackMin);
      const stopsMin = toNonNegativeInt(state.setup.stopsMin);

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

  function recalcAllRows() {
    state.rows = state.rows.map((row) => {
      const workMin =
        Number(row.work_min) || Number(state.setup.baseWorkMinutes) || 0;

      return {
        ...row,
        line_day: state.setup.lineName,
        ore_standard: Number(row.ore_standard) || 0,
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
      lunchMin: "0",
      snackMin: "0",
      stopsMin: "0",
      stopsNote: "",
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
          ...parsed.setup
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
            work_min: Number(row.work_min) || 0,
            evento_min: Number(row.evento_min) || 0,
            assemblea_min: Number(row.assemblea_min) || 0,
            sciopero_min: Number(row.sciopero_min) || 0,
            final_min: Number(row.final_min) || 0,
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
      lunchMin: "0",
      snackMin: "0",
      stopsMin: "0",
      stopsNote: "",
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
    if (number > 3) return 3;

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
