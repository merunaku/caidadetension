// ==========================================
// DATOS DE TABLAS DE REFERENCIA
// ==========================================
const MATERIALS_DATA = [
  {
    id: "cu20",
    name: "Cobre recocido",
    temp: "20 °C",
    rho: 0.01786,
    gamma: 56.0,
    usage: "Cálculo estándar normativo"
  },
  {
    id: "cu70",
    name: "Cobre en servicio (PVC)",
    temp: "70 °C",
    rho: 0.0214,
    gamma: 46.7,
    usage: "Conductores termoplásticos (NYA, THHN)"
  },
  {
    id: "cu90",
    name: "Cobre en servicio (XLPE)",
    temp: "90 °C",
    rho: 0.0228,
    gamma: 43.9,
    usage: "Conductores termoestables (RV-K, XHHW)"
  },
  {
    id: "al20",
    name: "Aluminio",
    temp: "20 °C",
    rho: 0.0280,
    gamma: 35.7,
    usage: "Acometidas y alimentadores de potencia"
  },
  {
    id: "al70",
    name: "Aluminio en servicio (PVC)",
    temp: "70 °C",
    rho: 0.0340,
    gamma: 29.4,
    usage: "Alimentadores subterráneos / aéreos"
  }
];

const COMMERCIAL_SECTIONS = [
  { mm2: 1.5, awg: "16 AWG", usage: "Alumbrado domiciliario" },
  { mm2: 2.5, awg: "14 AWG", usage: "Enchufes / tomas de uso general" },
  { mm2: 4, awg: "12 AWG", usage: "Cocina, lavadora, circuitos especiales" },
  { mm2: 6, awg: "10 AWG", usage: "Termos eléctricos, subtableros pequeños" },
  { mm2: 10, awg: "8 AWG", usage: "Alimentadores domiciliarios" },
  { mm2: 16, awg: "6 AWG", usage: "Alimentadores principales" },
  { mm2: 25, awg: "4 AWG", usage: "Acometidas y fuerza motriz" },
  { mm2: 35, awg: "2 AWG", usage: "Distribución comercial / industrial" },
  { mm2: 50, awg: "1/0 AWG", usage: "Alimentadores industriales" },
  { mm2: 70, awg: "2/0 AWG", usage: "Subestaciones y tableros generales" },
  { mm2: 95, awg: "3/0 AWG", usage: "Líneas de alta demanda" },
  { mm2: 120, awg: "4/0 AWG", usage: "Distribución industrial pesada" },
  { mm2: 150, awg: "300 kcmil", usage: "Alimentadores principales de planta" },
  { mm2: 185, awg: "350 kcmil", usage: "Grandes cargas industriales" },
  { mm2: 240, awg: "500 kcmil", usage: "Acometidas de alta capacidad" }
];

// ==========================================
// UTILIDADES DE FORMATO
// ==========================================
function fmt(num, decimals = 2) {
  if (!isFinite(num)) return "—";
  return Number(num.toFixed(decimals)).toString().replace(".", ",");
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
  systemType: document.getElementById("systemType"),
  loadMode: document.getElementById("loadMode"),
  voltageInput: document.getElementById("voltageInput"),
  lengthInput: document.getElementById("lengthInput"),
  currentInput: document.getElementById("currentInput"),
  powerInput: document.getElementById("powerInput"),
  powerUnit: document.getElementById("powerUnit"),
  cosphiInput: document.getElementById("cosphiInput"),
  materialPreset: document.getElementById("materialPreset"),
  propMode: document.getElementById("propMode"),
  gammaInput: document.getElementById("gammaInput"),
  rhoInput: document.getElementById("rhoInput"),
  sectionSelect: document.getElementById("sectionSelect"),
  maxDropInput: document.getElementById("maxDropInput"),

  groupCurrent: document.getElementById("groupCurrent"),
  groupPower: document.getElementById("groupPower"),
  groupCosphi: document.getElementById("groupCosphi"),
  groupSection: document.getElementById("groupSection"),

  errorBanner: document.getElementById("errorBanner"),
  problemStatement: document.getElementById("problemStatement"),
  dataList: document.getElementById("dataList"),
  stepsContainer: document.getElementById("stepsContainer"),
  verdictBanner: document.getElementById("verdictBanner"),
  materialsTableBody: document.getElementById("materialsTableBody"),
  sectionsTableBody: document.getElementById("sectionsTableBody"),
  btnPrint: document.getElementById("btnPrint")
};

// ==========================================
// SINCRONIZACIÓN DE INTERFAZ
// ==========================================
function updateFormVisibility() {
  const calcMode = dom.calcMode.value;
  const systemType = dom.systemType.value;
  const loadMode = dom.loadMode.value;

  // Mostrar/ocultar sección según modo de cálculo
  if (calcMode === "drop") {
    dom.groupSection.classList.remove("hidden");
  } else {
    dom.groupSection.classList.add("hidden");
  }

  // En Corriente Continua no existe cos(phi)
  if (systemType === "dc" && loadMode === "current_cos") {
    dom.loadMode.value = "current_only";
  }

  const effectiveLoadMode = dom.loadMode.value;

  dom.groupCurrent.classList.add("hidden");
  dom.groupPower.classList.add("hidden");
  dom.groupCosphi.classList.add("hidden");

  if (effectiveLoadMode === "current_only") {
    dom.groupCurrent.classList.remove("hidden");
  } else if (effectiveLoadMode === "current_cos") {
    dom.groupCurrent.classList.remove("hidden");
    if (systemType !== "dc") {
      dom.groupCosphi.classList.remove("hidden");
    }
  } else if (effectiveLoadMode === "power") {
    dom.groupPower.classList.remove("hidden");
    if (systemType !== "dc") {
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
// RENDERIZADO DE TABLAS DE REFERENCIA
// ==========================================
function renderTables(activeSectionMm2 = null) {
  const selectedMat = dom.materialPreset.value;

  dom.materialsTableBody.innerHTML = MATERIALS_DATA.map((mat) => {
    const isHighlight = mat.id === selectedMat ? "row-highlight" : "";
    return `
      <tr class="${isHighlight}">
        <td>${mat.name}</td>
        <td>${mat.temp}</td>
        <td>${fmt(mat.rho, 5)}</td>
        <td>${fmt(mat.gamma, 1)}</td>
        <td>${mat.usage}</td>
        <td>
          <button type="button" class="btn-table" onclick="applyMaterial('${mat.id}')">
            Aplicar
          </button>
        </td>
      </tr>
    `;
  }).join("");

  dom.sectionsTableBody.innerHTML = COMMERCIAL_SECTIONS.map((sec) => {
    const isHighlight = activeSectionMm2 === sec.mm2 ? "row-highlight" : "";
    return `
      <tr class="${isHighlight}">
        <td><strong>${fmt(sec.mm2, 1)} mm²</strong></td>
        <td>${sec.awg}</td>
        <td>${sec.usage}</td>
      </tr>
    `;
  }).join("");
}

window.applyMaterial = function (matId) {
  dom.materialPreset.value = matId;
  handleMaterialChange();
};

// ==========================================
// MOTOR DE CÁLCULO Y DESARROLLO DIDÁCTICO
// ==========================================
function calculateAndRender() {
  dom.errorBanner.classList.add("hidden");

  const calcMode = dom.calcMode.value;
  const systemType = dom.systemType.value;
  const loadMode = dom.loadMode.value;
  const propMode = dom.propMode.value;

  const V = parseFloat(dom.voltageInput.value);
  const L = parseFloat(dom.lengthInput.value);
  const rho = parseFloat(dom.rhoInput.value);
  const gamma = parseFloat(dom.gammaInput.value);
  const maxPct = parseFloat(dom.maxDropInput.value);
  const S_selected = parseFloat(dom.sectionSelect.value);

  const rawI = parseFloat(dom.currentInput.value);
  const rawP = parseFloat(dom.powerInput.value);
  const pUnit = dom.powerUnit.value;
  const cosphi = systemType === "dc" ? 1 : parseFloat(dom.cosphiInput.value);

  // Validaciones
  if (!(V > 0 && L > 0 && rho > 0 && gamma > 0 && maxPct > 0)) {
    return showError("Verifica que la tensión, longitud, resistividad, conductividad y límite porcentual sean mayores a cero.");
  }
  if (loadMode !== "power" && !(rawI > 0)) {
    return showError("Ingresa una corriente nominal válida mayor a cero.");
  }
  if (loadMode === "power" && !(rawP > 0)) {
    return showError("Ingresa una potencia activa válida mayor a cero.");
  }
  if (systemType !== "dc" && loadMode !== "current_only" && !(cosphi > 0 && cosphi <= 1)) {
    return showError("El factor de potencia (cos φ) debe estar entre 0,1 y 1,0.");
  }

  // Parámetros del sistema
  const isTri = systemType === "tri";
  const k = isTri ? Math.sqrt(3) : 2;
  const kLabel = isTri ? "√3" : "2";
  const systemName =
    systemType === "mono"
      ? "monofásico en corriente alterna"
      : systemType === "tri"
      ? "trifásico equilibrado"
      : "en corriente continua (CC)";

  const matObj = MATERIALS_DATA.find((m) => m.id === dom.materialPreset.value);
  const matName = matObj ? matObj.name.toLowerCase() : "conductor personalizado";

  // Cálculo de corriente y potencia
  let I = 0;
  let P_watts = 0;
  const useCosphi = systemType !== "dc" && loadMode !== "current_only";

  if (loadMode === "power") {
    P_watts = pUnit === "kW" ? rawP * 1000 : rawP;
    I = isTri ? P_watts / (Math.sqrt(3) * V * cosphi) : P_watts / (V * cosphi);
  } else {
    I = rawI;
  }

  // Factor de carga efectivo: (I * cosPhi) si aplica, o solo I
  const I_eff = useCosphi ? I * cosphi : I;

  // 1. Generar Enunciado
  let loadText = "";
  if (loadMode === "power") {
    const pDisplay = pUnit === "kW" ? `${fmt(rawP, 2)} kW (${fmt(P_watts, 0)} W)` : `${fmt(P_watts, 0)} W`;
    loadText =
      systemType === "dc"
        ? `una carga de <strong>${pDisplay}</strong>`
        : `una carga de <strong>${pDisplay}</strong> con un factor de potencia (cos φ) de <strong>${fmt(cosphi, 2)}</strong>`;
  } else if (loadMode === "current_cos") {
    loadText = `una corriente nominal de <strong>${fmt(I, 2)} A</strong> con factor de potencia <strong>cos φ = ${fmt(cosphi, 2)}</strong>`;
  } else {
    loadText = `una corriente nominal de <strong>${fmt(I, 2)} A</strong> (sin considerar desfase / carga resistiva)`;
  }

  const propText =
    propMode === "gamma"
      ? `conductividad eléctrica <strong>γ = ${fmt(gamma, 2)} m/(Ω·mm²)</strong>`
      : `resistividad eléctrica <strong>ρ = ${fmt(rho, 5)} Ω·mm²/m</strong>`;

  if (calcMode === "drop") {
    dom.problemStatement.innerHTML = `
      Se alimenta un circuito ${systemName} a una tensión nominal de <strong>${fmt(V, 0)} V</strong> con ${loadText}. 
      El tablero se encuentra a una distancia de <strong>${fmt(L, 1)} metros</strong> de la carga y se utiliza un conductor de <strong>${matName}</strong> 
      de <strong>${fmt(S_selected, 1)} mm²</strong> de sección (${propText}). 
      Calcula la caída de tensión absoluta (ΔV), la caída de tensión porcentual (ΔV%) y verifica si cumple con el límite máximo del <strong>${fmt(maxPct, 1)}%</strong>.
    `;
  } else {
    dom.problemStatement.innerHTML = `
      Se requiere alimentar un circuito ${systemName} a una tensión nominal de <strong>${fmt(V, 0)} V</strong> con ${loadText}. 
      La longitud del tendido desde el tablero hasta el punto de consumo es de <strong>${fmt(L, 1)} metros</strong> y se empleará <strong>${matName}</strong> (${propText}). 
      Determina la sección mínima teórica (S<sub>mín</sub>), selecciona el calibre comercial normalizado adecuado y verifica la caída de tensión real para no superar el <strong>${fmt(maxPct, 1)}%</strong>.
    `;
  }

  // 2. Renderizar Lista de Datos
  const tags = [
    `<li><strong>Circuito:</strong> ${systemType === "mono" ? "Monofásico (k = 2)" : systemType === "tri" ? "Trifásico (k = √3)" : "Continua (k = 2)"}</li>`,
    `<li><strong>Tensión (V):</strong> ${fmt(V, 1)} V</li>`,
    `<li><strong>Longitud (L):</strong> ${fmt(L, 1)} m</li>`
  ];
  if (loadMode === "power") {
    tags.push(`<li><strong>Potencia (P):</strong> ${fmt(P_watts, 0)} W</li>`);
  } else {
    tags.push(`<li><strong>Corriente (I):</strong> ${fmt(I, 2)} A</li>`);
  }
  if (useCosphi) {
    tags.push(`<li><strong>cos φ:</strong> ${fmt(cosphi, 2)}</li>`);
  }
  if (propMode === "gamma") {
    tags.push(`<li><strong>Conductividad (γ):</strong> ${fmt(gamma, 2)} m/(Ω·mm²)</li>`);
  } else {
    tags.push(`<li><strong>Resistividad (ρ):</strong> ${fmt(rho, 5)} Ω·mm²/m</li>`);
  }
  if (calcMode === "drop") {
    tags.push(`<li><strong>Sección (S):</strong> ${fmt(S_selected, 1)} mm²</li>`);
  }
  tags.push(`<li><strong>Límite ΔV%:</strong> ${fmt(maxPct, 1)}%</li>`);
  dom.dataList.innerHTML = tags.join("");

  // 3. Construir Pasos de Resolución
  const steps = [];
  let stepNum = 1;

  // Paso opcional: Cálculo de corriente si el dato fue Potencia
  if (loadMode === "power") {
    const denFormula = isTri ? "√3 · V · cos φ" : "V · cos φ";
    const denValues = isTri
      ? `1,732 · ${fmt(V, 0)} V · ${fmt(cosphi, 2)}`
      : `${fmt(V, 0)} V · ${fmt(cosphi, 2)}`;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la corriente nominal (I)</div>
        <p class="step-desc">A partir de la potencia activa, despejamos la corriente que circula por los conductores:</p>
        <div class="math-block">
          <span>I =</span>
          ${frac("P", denFormula)}
          <span>=</span>
          ${frac(`${fmt(P_watts, 0)} W`, denValues)}
          <span>=</span>
          <span class="math-result">${fmt(I, 2)} A</span>
        </div>
      </div>
    `);
  }

  // Helper para generar bloques matemáticos según ρ o γ y presencia de cos(phi)
  function buildVoltageDropFormulaHtml(S_val, dV_val) {
    const cosSymbol = useCosphi ? " · cos φ" : "";
    const cosNumVal = useCosphi ? ` · ${fmt(cosphi, 2)}` : "";

    if (propMode === "gamma") {
      return `
        <div class="math-block">
          <span>ΔV =</span>
          ${frac(`${kLabel} · L · I${cosSymbol}`, "γ · S")}
          <span>=</span>
          ${frac(`${kLabel} · ${fmt(L, 1)} · ${fmt(I, 2)}${cosNumVal}`, `${fmt(gamma, 2)} · ${fmt(S_val, 1)}`)}
          <span>=</span>
          <span class="math-result">${fmt(dV_val, 2)} V</span>
        </div>
      `;
    } else {
      return `
        <div class="math-block">
          <span>ΔV =</span>
          ${frac(`${kLabel} · ρ · L · I${cosSymbol}`, "S")}
          <span>=</span>
          ${frac(`${kLabel} · ${fmt(rho, 5)} · ${fmt(L, 1)} · ${fmt(I, 2)}${cosNumVal}`, `${fmt(S_val, 1)}`)}
          <span>=</span>
          <span class="math-result">${fmt(dV_val, 2)} V</span>
        </div>
      `;
    }
  }

  // MODO A: CALCULAR CAÍDA DE TENSIÓN
  if (calcMode === "drop") {
    // Si usa resistividad y no hay cos(phi), mostrar primero resistencia R por Ley de Ohm
    if (propMode === "rho" && !useCosphi) {
      const R_total = (k * rho * L) / S_selected;
      steps.push(`
        <div class="step-card">
          <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Resistencia eléctrica del tramo (R)</div>
          <p class="step-desc">Calculamos la resistencia eléctrica de los conductores considerando la resistividad del material y la longitud del circuito:</p>
          <div class="math-block">
            <span>R =</span>
            ${frac(`${kLabel} · ρ · L`, "S")}
            <span>=</span>
            ${frac(`${kLabel} · ${fmt(rho, 5)} · ${fmt(L, 1)}`, `${fmt(S_selected, 1)}`)}
            <span>=</span>
            <span class="math-result">${fmt(R_total, 4)} Ω</span>
          </div>
        </div>
      `);
    }

    const dV = propMode === "gamma"
      ? (k * L * I_eff) / (gamma * S_selected)
      : (k * rho * L * I_eff) / S_selected;

    const dV_pct = (dV / V) * 100;
    const V_load = V - dV;

    let powerNote = "";
    if (loadMode === "power" && propMode === "gamma") {
      const pNum = isTri ? "L · P" : "2 · L · P";
      powerNote = `
        <div class="note-box">
          <strong>Nota algebraica:</strong> Como <em>I · cos φ</em> equivale a <em>P / (${isTri ? "√3 · " : ""}V)</em>, el factor de potencia se cancela si usas la fórmula directa con potencia: <strong>ΔV = (${pNum}) / (γ · S · V) = ${fmt(dV, 2)} V</strong>.
        </div>
      `;
    }

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la caída de tensión absoluta (ΔV)</div>
        <p class="step-desc">Aplicamos la ecuación de caída de tensión para el circuito ${systemName}:</p>
        ${buildVoltageDropFormulaHtml(S_selected, dV)}
        <p class="step-desc">La tensión real que llega al extremo de la carga es <strong>${fmt(V, 1)} V − ${fmt(dV, 2)} V = ${fmt(V_load, 2)} V</strong>.</p>
        ${powerNote}
      </div>
    `);

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la caída de tensión porcentual (ΔV%)</div>
        <p class="step-desc">Relacionamos la caída en voltios respecto a la tensión nominal de alimentación:</p>
        <div class="math-block">
          <span>ΔV% =</span>
          ${frac("ΔV", "V")}
          <span>· 100 =</span>
          ${frac(`${fmt(dV, 2)} V`, `${fmt(V, 0)} V`)}
          <span>· 100 =</span>
          <span class="math-result">${fmt(dV_pct, 2)} %</span>
        </div>
      </div>
    `);

    dom.stepsContainer.innerHTML = steps.join("");
    renderTables(S_selected);

    const isOk = dV_pct <= maxPct;
    dom.verdictBanner.className = `verdict-box ${isOk ? "verdict-ok" : "verdict-fail"}`;
    dom.verdictBanner.innerHTML = isOk
      ? `<h4>CUMPLE CON EL CRITERIO DE CAÍDA DE TENSIÓN</h4>
         <p>La caída obtenida es de <strong>${fmt(dV_pct, 2)}%</strong> (${fmt(dV, 2)} V), valor inferior o igual al límite máximo permitido del <strong>${fmt(maxPct, 1)}%</strong>. El conductor de <strong>${fmt(S_selected, 1)} mm²</strong> es adecuado por caída de tensión.</p>`
      : `<h4>NO CUMPLE CON EL CRITERIO DE CAÍDA DE TENSIÓN</h4>
         <p>La caída obtenida es de <strong>${fmt(dV_pct, 2)}%</strong> (${fmt(dV, 2)} V), superando el límite máximo permitido del <strong>${fmt(maxPct, 1)}%</strong>. Debes seleccionar una sección comercial mayor (o cambiar a modo "Sección mínima" para calcular el calibre exacto).</p>`;
  }

  // MODO B: CALCULAR SECCIÓN MÍNIMA DE CONDUCTOR
  if (calcMode === "section") {
    const dV_max = V * (maxPct / 100);

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Caída de tensión máxima admisible (ΔV<sub>máx</sub>)</div>
        <p class="step-desc">Convertimos el límite porcentual (${fmt(maxPct, 1)}%) a voltios respecto a la tensión nominal:</p>
        <div class="math-block">
          <span>ΔV<sub>máx</sub> = V ·</span>
          ${frac(`${fmt(maxPct, 1)}`, "100")}
          <span>= ${fmt(V, 0)} V · ${fmt(maxPct / 100, 3)} =</span>
          <span class="math-result">${fmt(dV_max, 2)} V</span>
        </div>
      </div>
    `);

    const S_min = propMode === "gamma"
      ? (k * L * I_eff) / (gamma * dV_max)
      : (k * rho * L * I_eff) / dV_max;

    const cosSymbol = useCosphi ? " · cos φ" : "";
    const cosNumVal = useCosphi ? ` · ${fmt(cosphi, 2)}` : "";

    const sectionFormulaHtml = propMode === "gamma"
      ? `
        <div class="math-block">
          <span>S<sub>mín</sub> =</span>
          ${frac(`${kLabel} · L · I${cosSymbol}`, "γ · ΔV<sub>máx</sub>")}
          <span>=</span>
          ${frac(`${kLabel} · ${fmt(L, 1)} · ${fmt(I, 2)}${cosNumVal}`, `${fmt(gamma, 2)} · ${fmt(dV_max, 2)}`)}
          <span>=</span>
          <span class="math-result">${fmt(S_min, 2)} mm²</span>
        </div>
      `
      : `
        <div class="math-block">
          <span>S<sub>mín</sub> =</span>
          ${frac(`${kLabel} · ρ · L · I${cosSymbol}`, "ΔV<sub>máx</sub>")}
          <span>=</span>
          ${frac(`${kLabel} · ${fmt(rho, 5)} · ${fmt(L, 1)} · ${fmt(I, 2)}${cosNumVal}`, `${fmt(dV_max, 2)}`)}
          <span>=</span>
          <span class="math-result">${fmt(S_min, 2)} mm²</span>
        </div>
      `;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Cálculo de la sección teórica mínima (S<sub>mín</sub>)</div>
        <p class="step-desc">Despejamos la sección transversal S de la ecuación de caída de tensión:</p>
        ${sectionFormulaHtml}
      </div>
    `);

    // Buscar sección comercial inmediatamente superior
    const chosenObj = COMMERCIAL_SECTIONS.find((sec) => sec.mm2 >= S_min);

    if (!chosenObj) {
      dom.stepsContainer.innerHTML = steps.join("");
      renderTables(null);
      dom.verdictBanner.className = "verdict-box verdict-fail";
      dom.verdictBanner.innerHTML = `<h4>SECCIÓN REQUERIDA EXCEDE CALIBRE ÚNICO NORMALIZADO</h4>
        <p>La sección mínima teórica es de <strong>${fmt(S_min, 2)} mm²</strong>, superando los 240 mm². En estos casos se utilizan conductores en paralelo por fase.</p>`;
      return;
    }

    const S_com = chosenObj.mm2;
    const dV_real = propMode === "gamma"
      ? (k * L * I_eff) / (gamma * S_com)
      : (k * rho * L * I_eff) / S_com;
    const dV_real_pct = (dV_real / V) * 100;
    const V_load = V - dV_real;

    steps.push(`
      <div class="step-card">
        <div class="step-title"><span class="step-badge">Paso ${stepNum++}</span> Selección comercial y verificación real</div>
        <p class="step-desc">Siempre se selecciona la sección comercial normalizada <strong>inmediatamente superior</strong> a ${fmt(S_min, 2)} mm², es decir: <strong>${fmt(S_com, 1)} mm² (${chosenObj.awg})</strong>.</p>
        ${buildVoltageDropFormulaHtml(S_com, dV_real)}
        <div class="math-block">
          <span>ΔV%<sub>real</sub> =</span>
          ${frac(`${fmt(dV_real, 2)} V`, `${fmt(V, 0)} V`)}
          <span>· 100 =</span>
          <span class="math-result">${fmt(dV_real_pct, 2)} %</span>
        </div>
        <p class="step-desc">Con este calibre comercial, al extremo de la carga llegarán <strong>${fmt(V_load, 2)} V</strong>.</p>
      </div>
    `);

    dom.stepsContainer.innerHTML = steps.join("");
    renderTables(S_com);

    dom.verdictBanner.className = "verdict-box verdict-ok";
    dom.verdictBanner.innerHTML = `<h4>CONDUCTOR SELECCIONADO: ${fmt(S_com, 1)} mm² (${chosenObj.awg})</h4>
      <p>Para no superar el límite del <strong>${fmt(maxPct, 1)}%</strong> (sección teórica ${fmt(S_min, 2)} mm²), se debe instalar un conductor comercial de <strong>${fmt(S_com, 1)} mm²</strong>, quedando una caída de tensión real de <strong>${fmt(dV_real, 2)} V (${fmt(dV_real_pct, 2)}%)</strong>.</p>`;
  }
}

function showError(msg) {
  dom.errorBanner.textContent = msg;
  dom.errorBanner.classList.remove("hidden");
}

// ==========================================
// EJEMPLOS PRECONFIGURADOS
// ==========================================
const PRESETS = {
  ex1: {
    calcMode: "drop",
    systemType: "mono",
    loadMode: "power",
    voltage: 220,
    length: 35,
    power: 4.4,
    powerUnit: "kW",
    cosphi: 0.9,
    materialPreset: "cu20",
    propMode: "gamma",
    section: "4",
    maxDrop: 3
  },
  ex2: {
    calcMode: "section",
    systemType: "mono",
    loadMode: "power",
    voltage: 220,
    length: 45,
    power: 5.5,
    powerUnit: "kW",
    cosphi: 0.95,
    materialPreset: "cu20",
    propMode: "gamma",
    section: "6",
    maxDrop: 3
  },
  ex3: {
    calcMode: "drop",
    systemType: "mono",
    loadMode: "current_only",
    voltage: 220,
    length: 60,
    current: 32,
    materialPreset: "al20",
    propMode: "rho",
    section: "16",
    maxDrop: 3
  },
  ex4: {
    calcMode: "section",
    systemType: "tri",
    loadMode: "power",
    voltage: 380,
    length: 80,
    power: 15,
    powerUnit: "kW",
    cosphi: 0.85,
    materialPreset: "cu70",
    propMode: "gamma",
    section: "10",
    maxDrop: 3
  }
};

function loadPreset(key) {
  const p = PRESETS[key];
  if (!p) return;

  dom.calcMode.value = p.calcMode;
  dom.systemType.value = p.systemType;
  dom.loadMode.value = p.loadMode;
  dom.voltageInput.value = p.voltage;
  dom.lengthInput.value = p.length;
  if (p.current) dom.currentInput.value = p.current;
  if (p.power) dom.powerInput.value = p.power;
  if (p.powerUnit) dom.powerUnit.value = p.powerUnit;
  if (p.cosphi) dom.cosphiInput.value = p.cosphi;
  dom.materialPreset.value = p.materialPreset;
  dom.propMode.value = p.propMode;
  dom.sectionSelect.value = p.section;
  dom.maxDropInput.value = p.maxDrop;

  updateFormVisibility();
  handleMaterialChange();
}

// ==========================================
// EVENTOS E INICIALIZACIÓN
// ==========================================
dom.calcMode.addEventListener("change", () => {
  updateFormVisibility();
  calculateAndRender();
});

dom.systemType.addEventListener("change", () => {
  updateFormVisibility();
  calculateAndRender();
});

dom.loadMode.addEventListener("change", () => {
  updateFormVisibility();
  calculateAndRender();
});

dom.materialPreset.addEventListener("change", handleMaterialChange);

// Sincronizar rho <-> gamma automáticamente al editar manualmente
dom.gammaInput.addEventListener("input", () => {
  dom.materialPreset.value = "custom";
  const g = parseFloat(dom.gammaInput.value);
  if (g > 0) dom.rhoInput.value = (1 / g).toFixed(5);
  calculateAndRender();
});

dom.rhoInput.addEventListener("input", () => {
  dom.materialPreset.value = "custom";
  const r = parseFloat(dom.rhoInput.value);
  if (r > 0) dom.gammaInput.value = (1 / r).toFixed(2);
  calculateAndRender();
});

// Recalcular en tiempo real ante cualquier cambio
[
  dom.propMode,
  dom.voltageInput,
  dom.lengthInput,
  dom.currentInput,
  dom.powerInput,
  dom.powerUnit,
  dom.cosphiInput,
  dom.sectionSelect,
  dom.maxDropInput
].forEach((el) => {
  el.addEventListener("input", calculateAndRender);
  el.addEventListener("change", calculateAndRender);
});

dom.form.addEventListener("submit", (e) => {
  e.preventDefault();
  calculateAndRender();
});

// Botones de acceso rápido
document.querySelectorAll("[data-preset]").forEach((btn) => {
  btn.addEventListener("click", () => loadPreset(btn.dataset.preset));
});

document.querySelectorAll("[data-v]").forEach((btn) => {
  btn.addEventListener("click", () => {
    dom.voltageInput.value = btn.dataset.v;
    calculateAndRender();
  });
});

document.querySelectorAll("[data-dv]").forEach((btn) => {
  btn.addEventListener("click", () => {
    dom.maxDropInput.value = btn.dataset.dv;
    calculateAndRender();
  });
});

dom.btnPrint.addEventListener("click", () => window.print());

// Inicializar vista al cargar
updateFormVisibility();
renderTables(parseFloat(dom.sectionSelect.value));
calculateAndRender();
