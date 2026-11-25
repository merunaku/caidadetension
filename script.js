// ==========================================
// TABLAS NORMATIVAS RIC N°04 - SEC CHILE
// ==========================================
const MATERIALS_DATA = [
  {
    id: "cu20_iec",
    name: "Cobre recocido estándar (IEC 60228 / RIC N°04)",
    temp: "20 °C",
    rho: 0.0172,
    gamma: 58.14
  },
  {
    id: "cu20_trad",
    name: "Cobre 20 °C (Redondeo clásico de estudio)",
    temp: "20 °C",
    rho: 0.018,
    gamma: 55.556
  },
  {
    id: "cu70",
    name: "Cobre en servicio PVC (NYA / THHN)",
    temp: "70 °C",
    rho: 0.0214,
    gamma: 46.729
  },
  {
    id: "cu90",
    name: "Cobre en servicio XLPE (RV-K / XHHW)",
    temp: "90 °C",
    rho: 0.0228,
    gamma: 43.86
  },
  {
    id: "al20",
    name: "Aluminio estándar",
    temp: "20 °C",
    rho: 0.028,
    gamma: 35.714
  },
  {
    id: "al70",
    name: "Aluminio en servicio PVC",
    temp: "70 °C",
    rho: 0.034,
    gamma: 29.412
  }
];

// Tabla N°4.1 del Pliego Técnico RIC N°04 (Secciones nominales milimétricas y R máx. a 20 °C)
const RIC_SECTIONS_TABLE_4_1 = [
  { mm2: 1.5, rMaxKm: 12.1, usage: "Mínimo reglamentario circuitos de iluminación (RIC N°04 5.4)" },
  { mm2: 2.5, rMaxKm: 7.41, usage: "Mínimo enchufes, circuitos mixtos y subalimentadores" },
  { mm2: 4, rMaxKm: 4.61, usage: "Mínimo reglamentario alimentadores y fuerza" },
  { mm2: 6, rMaxKm: 3.08, usage: "Alimentadores domiciliarios, termos, cocinas" },
  { mm2: 10, rMaxKm: 1.83, usage: "Alimentadores principales de vivienda / tableros" },
  { mm2: 16, rMaxKm: 1.15, usage: "Alimentadores de mayor longitud o demanda" },
  { mm2: 25, rMaxKm: 0.727, usage: "Acometidas y distribución comercial" },
  { mm2: 35, rMaxKm: 0.524, usage: "Alimentadores comerciales e industriales" },
  { mm2: 50, rMaxKm: 0.387, usage: "Líneas de potencia (permite paralelo desde 50 mm²)" },
  { mm2: 70, rMaxKm: 0.268, usage: "Subestaciones y tableros generales" },
  { mm2: 95, rMaxKm: 0.193, usage: "Distribución industrial de alta demanda" },
  { mm2: 120, rMaxKm: 0.153, usage: "Alimentadores industriales pesados" },
  { mm2: 150, rMaxKm: 0.124, usage: "Alimentadores principales de planta" },
  { mm2: 185, rMaxKm: 0.0991, usage: "Grandes cargas industriales" },
  { mm2: 240, rMaxKm: 0.0754, usage: "Acometidas de alta capacidad" }
];

// ==========================================
// UTILIDAD DE FORMATO (3 DECIMALES)
// ==========================================
function fmt(num, decimals = 3) {
  if (!isFinite(num)) return "—";
  return num.toFixed(decimals).replace(".", ",");
}

function frac(numHtml, denHtml) {
  return `
    <span class="fraction">
      <span class="num">${numHtml}</span>
      <span class="den">${denHtml}</span>
    </span>
  `;
}

// ==========================================
// REFERENCIAS AL DOM
// ==========================================
const dom = {
  form: document.getElementById("calcForm"),
  calcMode: document.getElementById("calcMode"),
  conductorCount: document.getElementById("conductorCount"),
  propMode: document.getElementById("propMode"),
  voltageInput: document.getElementById("voltageInput"),
  lengthInput: document.getElementById("lengthInput"),
  loadSectionGroup: document.getElementById("loadSectionGroup"),
  loadMode: document.getElementById("loadMode"),
  currentInput: document.getElementById("currentInput"),
  powerInput: document.getElementById("powerInput"),
  powerUnit: document.getElementById("powerUnit"),
  cosphiInput: document.getElementById("cosphiInput"),
  materialPreset: document.getElementById("materialPreset"),
  rhoInput: document.getElementById("rhoInput"),
  gammaInput: document.getElementById("gammaInput"),
  sectionInput: document.getElementById("sectionInput"),
  sectionQuickSelect: document.getElementById("sectionQuickSelect"),
  vLossInput: document.getElementById("vLossInput"),
  maxDropInput: document.getElementById("maxDropInput"),

  groupCurrent: document.getElementById("groupCurrent"),
  groupPower: document.getElementById("groupPower"),
  groupCosphi: document.getElementById("groupCosphi"),
  groupSection: document.getElementById("groupSection"),
  groupVLoss: document.getElementById("groupVLoss"),
  groupMaxPct: document.getElementById("groupMaxPct"),

  errorBanner: document.getElementById("errorBanner"),
  kpiGrid: document.getElementById("kpiGrid"),
  verdictBanner: document.getElementById("verdictBanner"),
  dataList: document.getElementById("dataList"),
  stepsContainer: document.getElementById("stepsContainer"),
  materialsTableBody: document.getElementById("materialsTableBody"),
  sectionsTableBody: document.getElementById("sectionsTableBody"),
  btnPrint: document.getElementById("btnPrint"),
  btnReset: document.getElementById("btnReset")
};

// ==========================================
// SINCRONIZACIÓN DE CONTROLES
// ==========================================
function syncVLossFromPct() {
  const V = parseFloat(dom.voltageInput.value);
  const pct = parseFloat(dom.maxDropInput.value);
  if (V > 0 && pct > 0) {
    dom.vLossInput.value = Number(((V * pct) / 100).toFixed(3));
  }
}

function syncPctFromVLoss() {
  const V = parseFloat(dom.voltageInput.value);
  const vLoss = parseFloat(dom.vLossInput.value);
  if (V > 0 && vLoss > 0) {
    dom.maxDropInput.value = Number(((vLoss / V) * 100).toFixed(3));
  }
}

function updateFormVisibility() {
  const mode = dom.calcMode.value;
  const loadMode = dom.loadMode.value;

  if (mode === "drop") {
    dom.groupSection.classList.remove("hidden");
    dom.groupVLoss.classList.add("hidden");
    dom.groupMaxPct.classList.remove("hidden");
  } else if (mode === "section") {
    dom.groupSection.classList.add("hidden");
    dom.groupVLoss.classList.remove("hidden");
    dom.groupMaxPct.classList.remove("hidden");
    syncVLossFromPct();
  } else if (mode === "resistance") {
    dom.groupSection.classList.remove("hidden");
    dom.groupVLoss.classList.add("hidden");
    dom.groupMaxPct.classList.add("hidden");
  }

  if (mode === "resistance") {
    dom.loadSectionGroup.classList.add("hidden");
  } else {
    dom.loadSectionGroup.classList.remove("hidden");
    dom.groupCurrent.classList.add("hidden");
    dom.groupPower.classList.add("hidden");
    dom.groupCosphi.classList.add("hidden");

    if (loadMode === "current_only") {
      dom.groupCurrent.classList.remove("hidden");
    } else if (loadMode === "current_cos") {
      dom.groupCurrent.classList.remove("hidden");
      dom.groupCosphi.classList.remove("hidden");
    } else if (loadMode === "power") {
      dom.groupPower.classList.remove("hidden");
      dom.groupCosphi.classList.remove("hidden");
    }
  }
}

function handleMaterialChange() {
  const selectedId = dom.materialPreset.value;
  const mat = MATERIALS_DATA.find((m) => m.id === selectedId);
  if (mat) {
    dom.rhoInput.value = mat.rho;
    dom.gammaInput.value = mat.gamma;
  }
  renderTables();
  calculateAndRender();
}

// ==========================================
// RENDERIZADO DE TABLAS RIC
// ==========================================
function renderTables(activeSectionMm2 = null) {
  const selectedMat = dom.materialPreset.value;

  dom.materialsTableBody.innerHTML = MATERIALS_DATA.map((mat) => {
    const isHighlight = mat.id === selectedMat ? "row-highlight" : "";
    return `
      <tr class="${isHighlight}">
        <td>${mat.name}</td>
        <td>${mat.temp}</td>
        <td><strong>${fmt(mat.rho, 4)}</strong></td>
        <td>${fmt(mat.gamma, 3)}</td>
        <td>
          <button type="button" class="btn-table" onclick="applyMaterial('${mat.id}')">
            Aplicar
          </button>
        </td>
      </tr>
    `;
  }).join("");

  dom.sectionsTableBody.innerHTML = RIC_SECTIONS_TABLE_4_1.map((sec) => {
    const isHighlight = activeSectionMm2 === sec.mm2 ? "row-highlight" : "";
    return `
      <tr class="${isHighlight}">
        <td><strong>${fmt(sec.mm2, 1)} mm²</strong></td>
        <td>${fmt(sec.rMaxKm, 3)} Ω/km</td>
        <td>${sec.usage}</td>
        <td>
          <button type="button" class="btn-table" onclick="applySection(${sec.mm2})">
            Usar
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.applyMaterial = function (matId) {
  dom.materialPreset.value = matId;
  handleMaterialChange();
};

window.applySection = function (mm2) {
  dom.sectionInput.value = mm2;
  dom.sectionQuickSelect.value = mm2.toString();
  if (dom.calcMode.value === "section") {
    dom.calcMode.value = "drop";
    updateFormVisibility();
  }
  calculateAndRender();
};

// ==========================================
// MOTOR DE CÁLCULO Y DESARROLLO (3 DECIMALES)
// ==========================================
function calculateAndRender() {
  dom.errorBanner.classList.add("hidden");

  const mode = dom.calcMode.value;
  const condType = dom.conductorCount.value;
  const propMode = dom.propMode.value;
  const loadMode = dom.loadMode.value;

  const V = parseFloat(dom.voltageInput.value);
  const L = parseFloat(dom.lengthInput.value);
  const rho = parseFloat(dom.rhoInput.value);
  const gamma = parseFloat(dom.gammaInput.value);
  const S_selected = parseFloat(dom.sectionInput.value);
  const vLossAllowed = parseFloat(dom.vLossInput.value);
  const maxPct = parseFloat(dom.maxDropInput.value);

  const rawI = parseFloat(dom.currentInput.value);
  const rawP = parseFloat(dom.powerInput.value);
  const pUnit = dom.powerUnit.value;
  const cosphi = parseFloat(dom.cosphiInput.value);

  // Validaciones
  if (!(V > 0 && L > 0 && rho > 0 && gamma > 0)) {
    return showError("Verifica que tensión, largo, resistividad y conductividad sean mayores a cero.");
  }
  if (mode !== "section" && !(S_selected > 0)) {
    return showError("Ingresa una sección S válida mayor a cero (en mm²).");
  }
  if (mode !== "resistance") {
    if (loadMode !== "power" && !(rawI > 0)) {
      return showError("Ingresa una corriente I válida mayor a cero.");
    }
    if (loadMode === "power" && !(rawP > 0)) {
      return showError("Ingresa una potencia P válida mayor a cero.");
    }
    if (loadMode !== "current_only" && !(cosphi > 0 && cosphi <= 1)) {
      return showError("El factor de potencia (cos φ) debe estar entre 0,01 y 1,00.");
    }
  }
  if (mode === "section" && !(vLossAllowed > 0)) {
    return showError("Ingresa un voltaje de pérdida admisible mayor a cero.");
  }

  // Factor de conductores (1 conductor, 2 conductores o trifásico)
  let k = 2;
  let kFormula = "2";
  let kNumeric = "2";
  let condDesc = "2 conductores (Ida y retorno)";

  if (condType === "1") {
    k = 1;
    kFormula = "1";
    kNumeric = "1";
    condDesc = "1 conductor (Solo ida)";
  } else if (condType === "tri") {
    k = Math.sqrt(3);
    kFormula = "√3";
    kNumeric = "1,732";
    condDesc = "Trifásico equilibrado (√3)";
  }

  // Corriente efectiva
  let I = 0;
  let P_watts = 0;
  const useCosphi = loadMode !== "current_only";

  if (mode !== "resistance") {
    if (loadMode === "power") {
      P_watts = pUnit === "kW" ? rawP * 1000 : rawP;
      I = condType === "tri" ? P_watts / (Math.sqrt(3) * V * cosphi) : P_watts / (V * cosphi);
    } else {
      I = rawI;
    }
  }
  const I_eff = useCosphi ? I * cosphi : I;

  // Etiquetas de datos ingresados
  const tags = [
    `<li><strong>Conductores:</strong> ${condDesc}</li>`,
    `<li><strong>Tensión (V):</strong> ${fmt(V, 3)} V</li>`,
    `<li><strong>Largo (L):</strong> ${fmt(L, 3)} m</li>`
  ];
  if (mode !== "resistance") {
    if (loadMode === "power") {
      tags.push(`<li><strong>Potencia (P):</strong> ${fmt(P_watts, 3)} W</li>`);
    } else {
      tags.push(`<li><strong>Corriente (I):</strong> ${fmt(I, 3)} A</li>`);
    }
    if (useCosphi) {
      tags.push(`<li><strong>cos φ:</strong> ${fmt(cosphi, 3)}</li>`);
    }
  }
  if (propMode === "rho") {
    tags.push(`<li><strong>Resistividad (ρ):</strong> ${fmt(rho, 4)} Ω·mm²/m</li>`);
  } else {
    tags.push(`<li><strong>Conductividad (γ):</strong> ${fmt(gamma, 3)} m/(Ω·mm²)</li>`);
  }
  if (mode !== "section") {
    tags.push(`<li><strong>Sección (S):</strong> ${fmt(S_selected, 3)} mm²</li>`);
  } else {
    tags.push(`<li><strong>V<sub>pérdida</sub> admisible:</strong> ${fmt(vLossAllowed, 3)} V (${fmt(maxPct, 3)}%)</li>`);
  }
  dom.dataList.innerHTML = tags.join("");

  const steps = [];
  let stepNum = 1;

  // Paso previo si el dato fue Potencia
  if (mode !== "resistance" && loadMode === "power") {
    const denF = condType === "tri" ? "√3 · V · cos φ" : "V · cos φ";
    const denV = condType === "tri"
      ? `1,732 · ${fmt(V, 3)} · ${fmt(cosphi, 3)}`
      : `${fmt(V, 3)} · ${fmt(cosphi, 3)}`;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la corriente (I)</div>
        <div class="math-block">
          <span>I =</span>
          ${frac("P", denF)}
          <span>=</span>
          ${frac(`${fmt(P_watts, 3)}`, denV)}
          <span>=</span>
          <span class="math-result">${fmt(I, 3)} A</span>
        </div>
      </div>
    `);
  }

  // Helper para ecuación de caída de tensión
  function renderDropMath(S_val, dV_val) {
    const cosF = useCosphi ? " · cos φ" : "";
    const cosV = useCosphi ? ` · ${fmt(cosphi, 3)}` : "";

    if (propMode === "rho") {
      return `
        <div class="math-block">
          <span>ΔV =</span>
          ${frac(`${kFormula} · L · ρ · I${cosF}`, "S")}
          <span>=</span>
          ${frac(`${kNumeric} · ${fmt(L, 3)} · ${fmt(rho, 4)} · ${fmt(I, 3)}${cosV}`, `${fmt(S_val, 3)}`)}
          <span>=</span>
          <span class="math-result">${fmt(dV_val, 3)} V</span>
        </div>
      `;
    } else {
      return `
        <div class="math-block">
          <span>ΔV =</span>
          ${frac(`${kFormula} · L · I${cosF}`, "γ · S")}
          <span>=</span>
          ${frac(`${kNumeric} · ${fmt(L, 3)} · ${fmt(I, 3)}${cosV}`, `${fmt(gamma, 3)} · ${fmt(S_val, 3)}`)}
          <span>=</span>
          <span class="math-result">${fmt(dV_val, 3)} V</span>
        </div>
      `;
    }
  }

  // Helper para ecuación de resistencia
  function renderResistanceMath(S_val, R_val) {
    if (propMode === "rho") {
      return `
        <div class="math-block">
          <span>R =</span>
          ${frac(`${kFormula} · L · ρ`, "S")}
          <span>=</span>
          ${frac(`${kNumeric} · ${fmt(L, 3)} · ${fmt(rho, 4)}`, `${fmt(S_val, 3)}`)}
          <span>=</span>
          <span class="math-result">${fmt(R_val, 3)} Ω</span>
        </div>
      `;
    } else {
      return `
        <div class="math-block">
          <span>R =</span>
          ${frac(`${kFormula} · L`, "γ · S")}
          <span>=</span>
          ${frac(`${kNumeric} · ${fmt(L, 3)}`, `${fmt(gamma, 3)} · ${fmt(S_val, 3)}`)}
          <span>=</span>
          <span class="math-result">${fmt(R_val, 3)} Ω</span>
        </div>
      `;
    }
  }

  // ==========================================
  // MODO 1: CAÍDA DE TENSIÓN + RESISTENCIA + %
  // ==========================================
  if (mode === "drop") {
    const R = propMode === "rho"
      ? (k * L * rho) / S_selected
      : (k * L) / (gamma * S_selected);

    const dV = propMode === "rho"
      ? (k * L * rho * I_eff) / S_selected
      : (k * L * I_eff) / (gamma * S_selected);

    const dV_pct = (dV / V) * 100;
    const V_load = V - dV;

    // KPIs
    dom.kpiGrid.innerHTML = `
      <div class="kpi-card kpi-highlight">
        <div class="kpi-label">Caída de Tensión (ΔV)</div>
        <div class="kpi-value">${fmt(dV, 3)} V</div>
        <div class="kpi-sub">${condDesc}</div>
      </div>
      <div class="kpi-card kpi-highlight">
        <div class="kpi-label">Porcentaje (ΔV%)</div>
        <div class="kpi-value">${fmt(dV_pct, 3)} %</div>
        <div class="kpi-sub">Límite configurado: ${fmt(maxPct, 3)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Resistencia Conductor (R)</div>
        <div class="kpi-value">${fmt(R, 3)} Ω</div>
        <div class="kpi-sub">Sección S = ${fmt(S_selected, 3)} mm²</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tensión en la Carga</div>
        <div class="kpi-value">${fmt(V_load, 3)} V</div>
        <div class="kpi-sub">Alimentación: ${fmt(V, 3)} V</div>
      </div>
    `;

    // Pasos
    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la caída de tensión (ΔV)</div>
        <p class="step-desc">Aplicamos la fórmula directa para <strong>${condDesc.toLowerCase()}</strong>:</p>
        ${renderDropMath(S_selected, dV)}
      </div>
    `);

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo del porcentaje de caída de tensión (ΔV%)</div>
        <div class="math-block">
          <span>ΔV% =</span>
          ${frac("ΔV", "V")}
          <span>· 100 =</span>
          ${frac(`${fmt(dV, 3)} V`, `${fmt(V, 3)} V`)}
          <span>· 100 =</span>
          <span class="math-result">${fmt(dV_pct, 3)} %</span>
        </div>
        <p class="step-desc">Tensión resultante en el punto de consumo: <strong>${fmt(V, 3)} V − ${fmt(dV, 3)} V = ${fmt(V_load, 3)} V</strong>.</p>
      </div>
    `);

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Resistencia eléctrica del conductor (R)</div>
        ${renderResistanceMath(S_selected, R)}
      </div>
    `);

    dom.stepsContainer.innerHTML = steps.join("");
    renderTables(S_selected);

    const isOk = dV_pct <= maxPct;
    dom.verdictBanner.className = `verdict-box ${isOk ? "verdict-ok" : "verdict-fail"}`;
    dom.verdictBanner.innerHTML = isOk
      ? `<h4>CUMPLE CON EL LÍMITE NORMATIVO (${fmt(dV_pct, 3)}% ≤ ${fmt(maxPct, 3)}%)</h4>
         <p>La caída de tensión es de <strong>${fmt(dV, 3)} V (${fmt(dV_pct, 3)}%)</strong> con conductor de <strong>${fmt(S_selected, 3)} mm²</strong> (R = ${fmt(R, 3)} Ω).</p>`
      : `<h4>EXCEDE EL LÍMITE NORMATIVO (${fmt(dV_pct, 3)}% > ${fmt(maxPct, 3)}%)</h4>
         <p>La caída de tensión es de <strong>${fmt(dV, 3)} V (${fmt(dV_pct, 3)}%)</strong>. Cambia a la opción <strong>"2. Sección mínima"</strong> para determinar el calibre adecuado.</p>`;
  }

  // ==========================================
  // MODO 2: SECCIÓN MÍNIMA S = (k · L · ρ · I) / V_pérdida
  // ==========================================
  if (mode === "section") {
    const S_calc = propMode === "rho"
      ? (k * L * rho * I_eff) / vLossAllowed
      : (k * L * I_eff) / (gamma * vLossAllowed);

    const chosenObj = RIC_SECTIONS_TABLE_4_1.find((sec) => sec.mm2 >= S_calc);

    const cosF = useCosphi ? " · cos φ" : "";
    const cosV = useCosphi ? ` · ${fmt(cosphi, 3)}` : "";

    const secMathHtml = propMode === "rho"
      ? `
        <div class="math-block">
          <span>S =</span>
          ${frac(`${kFormula} · L · ρ · I${cosF}`, "V<sub>pérdida</sub>")}
          <span>=</span>
          ${frac(`${kNumeric} · ${fmt(L, 3)} · ${fmt(rho, 4)} · ${fmt(I, 3)}${cosV}`, `${fmt(vLossAllowed, 3)}`)}
          <span>=</span>
          <span class="math-result">${fmt(S_calc, 3)} mm²</span>
        </div>
      `
      : `
        <div class="math-block">
          <span>S =</span>
          ${frac(`${kFormula} · L · I${cosF}`, "γ · V<sub>pérdida</sub>")}
          <span>=</span>
          ${frac(`${kNumeric} · ${fmt(L, 3)} · ${fmt(I, 3)}${cosV}`, `${fmt(gamma, 3)} · ${fmt(vLossAllowed, 3)}`)}
          <span>=</span>
          <span class="math-result">${fmt(S_calc, 3)} mm²</span>
        </div>
      `;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la sección mínima teórica (S)</div>
        <p class="step-desc">Usando el voltaje de pérdida admisible <strong>V<sub>pérdida</sub> = ${fmt(vLossAllowed, 3)} V</strong> (${fmt(maxPct, 3)}% de ${fmt(V, 3)} V):</p>
        ${secMathHtml}
      </div>
    `);

    if (!chosenObj) {
      dom.kpiGrid.innerHTML = `
        <div class="kpi-card kpi-highlight">
          <div class="kpi-label">Sección Teórica (S)</div>
          <div class="kpi-value">${fmt(S_calc, 3)} mm²</div>
          <div class="kpi-sub">Supera 240 mm²</div>
        </div>
      `;
      dom.stepsContainer.innerHTML = steps.join("");
      renderTables(null);
      dom.verdictBanner.className = "verdict-box verdict-fail";
      dom.verdictBanner.innerHTML = `<h4>SECCIÓN SUPERA EL CALIBRE ÚNICO MÁXIMO (240 mm²)</h4>
        <p>Según RIC N°04 Punto 5.28, se deben instalar conductores en paralelo por fase.</p>`;
      return;
    }

    const S_com = chosenObj.mm2;
    const R_real = propMode === "rho"
      ? (k * L * rho) / S_com
      : (k * L) / (gamma * S_com);

    const dV_real = propMode === "rho"
      ? (k * L * rho * I_eff) / S_com
      : (k * L * I_eff) / (gamma * S_com);

    const dV_real_pct = (dV_real / V) * 100;

    dom.kpiGrid.innerHTML = `
      <div class="kpi-card kpi-highlight">
        <div class="kpi-label">Sección Calculada</div>
        <div class="kpi-value">${fmt(S_calc, 3)} mm²</div>
        <div class="kpi-sub">Valor teórico mínimo</div>
      </div>
      <div class="kpi-card kpi-highlight">
        <div class="kpi-label">Sección Comercial RIC</div>
        <div class="kpi-value">${fmt(S_com, 1)} mm²</div>
        <div class="kpi-sub">Tabla N°4.1 RIC N°04</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Caída Real (ΔV / ΔV%)</div>
        <div class="kpi-value">${fmt(dV_real, 3)} V (${fmt(dV_real_pct, 3)}%)</div>
        <div class="kpi-sub">Con sección ${fmt(S_com, 1)} mm²</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Resistencia Real (R)</div>
        <div class="kpi-value">${fmt(R_real, 3)} Ω</div>
        <div class="kpi-sub">${condDesc}</div>
      </div>
    `;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Verificación con sección comercial RIC (${fmt(S_com, 1)} mm²)</div>
        <p class="step-desc">Seleccionamos la sección comercial milimétrica inmediatamente superior según Tabla N°4.1 del RIC N°04 (<strong>${fmt(S_com, 1)} mm²</strong>) y verificamos:</p>
        ${renderDropMath(S_com, dV_real)}
        <div class="math-block">
          <span>ΔV%<sub>real</sub> =</span>
          ${frac(`${fmt(dV_real, 3)} V`, `${fmt(V, 3)} V`)}
          <span>· 100 =</span>
          <span class="math-result">${fmt(dV_real_pct, 3)} %</span>
        </div>
        ${renderResistanceMath(S_com, R_real)}
      </div>
    `);

    dom.stepsContainer.innerHTML = steps.join("");
    renderTables(S_com);

    dom.verdictBanner.className = "verdict-box verdict-ok";
    dom.verdictBanner.innerHTML = `<h4>SECCIÓN COMERCIAL SELECCIONADA: ${fmt(S_com, 1)} mm²</h4>
      <p>Verifica en la <strong>Tabla 1 (RIC N°04 Punto 5.4)</strong> la sección mínima exigida según el tipo de circuito (1,5 mm² iluminación, 2,5 mm² enchufes, 4,0 mm² alimentadores).</p>`;
  }

  // ==========================================
  // MODO 3: SOLO RESISTENCIA DEL CONDUCTOR
  // ==========================================
  if (mode === "resistance") {
    const R = propMode === "rho"
      ? (k * L * rho) / S_selected
      : (k * L) / (gamma * S_selected);

    const rPerKm = (R / (k * L)) * 1000;

    dom.kpiGrid.innerHTML = `
      <div class="kpi-card kpi-highlight">
        <div class="kpi-label">Resistencia Total (R)</div>
        <div class="kpi-value">${fmt(R, 3)} Ω</div>
        <div class="kpi-sub">${condDesc} (L = ${fmt(L, 3)} m)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Resistencia Unitaria</div>
        <div class="kpi-value">${fmt(rPerKm, 3)} Ω/km</div>
        <div class="kpi-sub">Por conductor simple</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Sección Evaluada</div>
        <div class="kpi-value">${fmt(S_selected, 3)} mm²</div>
        <div class="kpi-sub">Parámetro ingresado</div>
      </div>
    `;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso 1</span> Cálculo de la resistencia eléctrica del conductor (R)</div>
        <p class="step-desc">Calculamos la resistencia eléctrica para <strong>${condDesc.toLowerCase()}</strong> de largo <strong>L = ${fmt(L, 3)} m</strong> y sección <strong>S = ${fmt(S_selected, 3)} mm²</strong>:</p>
        ${renderResistanceMath(S_selected, R)}
      </div>
    `);

    dom.stepsContainer.innerHTML = steps.join("");
    renderTables(S_selected);

    dom.verdictBanner.className = "verdict-box verdict-info";
    dom.verdictBanner.innerHTML = `<h4>RESISTENCIA CALCULADA: ${fmt(R, 3)} Ω</h4>
      <p>Corresponde a <strong>${condDesc.toLowerCase()}</strong>. Multiplicando este valor por la corriente I (ΔV = I · R) se obtiene directamente la caída de tensión en voltios.</p>`;
  }
}

function showError(msg) {
  dom.errorBanner.textContent = msg;
  dom.errorBanner.classList.remove("hidden");
}

// ==========================================
// EVENTOS E INICIALIZACIÓN
// ==========================================
dom.calcMode.addEventListener("change", () => {
  updateFormVisibility();
  calculateAndRender();
});

dom.conductorCount.addEventListener("change", calculateAndRender);
dom.propMode.addEventListener("change", calculateAndRender);

dom.loadMode.addEventListener("change", () => {
  updateFormVisibility();
  calculateAndRender();
});

dom.materialPreset.addEventListener("change", handleMaterialChange);

// Sincronizar selector rápido de sección con el campo numérico libre
dom.sectionQuickSelect.addEventListener("change", () => {
  if (dom.sectionQuickSelect.value) {
    dom.sectionInput.value = dom.sectionQuickSelect.value;
    calculateAndRender();
  }
});

dom.sectionInput.addEventListener("input", () => {
  const val = parseFloat(dom.sectionInput.value);
  const match = RIC_SECTIONS_TABLE_4_1.find((s) => s.mm2 === val);
  dom.sectionQuickSelect.value = match ? match.mm2.toString() : "";
  calculateAndRender();
});

// Sincronizar rho <-> gamma
dom.rhoInput.addEventListener("input", () => {
  dom.materialPreset.value = "custom";
  const r = parseFloat(dom.rhoInput.value);
  if (r > 0) dom.gammaInput.value = Number((1 / r).toFixed(3));
  calculateAndRender();
});

dom.gammaInput.addEventListener("input", () => {
  dom.materialPreset.value = "custom";
  const g = parseFloat(dom.gammaInput.value);
  if (g > 0) dom.rhoInput.value = Number((1 / g).toFixed(4));
  calculateAndRender();
});

// Sincronizar V_pérdida <-> ΔV% y Tensión
dom.voltageInput.addEventListener("input", () => {
  syncVLossFromPct();
  calculateAndRender();
});

dom.maxDropInput.addEventListener("input", () => {
  syncVLossFromPct();
  calculateAndRender();
});

dom.vLossInput.addEventListener("input", () => {
  syncPctFromVLoss();
  calculateAndRender();
});

// Recalcular en tiempo real
[
  dom.lengthInput,
  dom.currentInput,
  dom.powerInput,
  dom.powerUnit,
  dom.cosphiInput
].forEach((el) => {
  el.addEventListener("input", calculateAndRender);
  el.addEventListener("change", calculateAndRender);
});

dom.form.addEventListener("submit", (e) => {
  e.preventDefault();
  calculateAndRender();
});

// Botones rápidos
document.querySelectorAll("[data-v]").forEach((btn) => {
  btn.addEventListener("click", () => {
    dom.voltageInput.value = btn.dataset.v;
    syncVLossFromPct();
    calculateAndRender();
  });
});

document.querySelectorAll("[data-dv]").forEach((btn) => {
  btn.addEventListener("click", () => {
    dom.maxDropInput.value = btn.dataset.dv;
    syncVLossFromPct();
    calculateAndRender();
  });
});

dom.btnReset.addEventListener("click", () => {
  dom.calcMode.value = "drop";
  dom.conductorCount.value = "2";
  dom.propMode.value = "rho";
  dom.voltageInput.value = "220";
  dom.lengthInput.value = "35";
  dom.loadMode.value = "current_only";
  dom.currentInput.value = "25";
  dom.materialPreset.value = "cu20_iec";
  dom.sectionInput.value = "4";
  dom.sectionQuickSelect.value = "4";
  dom.maxDropInput.value = "3";
  updateFormVisibility();
  syncVLossFromPct();
  handleMaterialChange();
});

dom.btnPrint.addEventListener("click", () => window.print());

// Inicialización
updateFormVisibility();
syncVLossFromPct();
renderTables(parseFloat(dom.sectionInput.value));
calculateAndRender();