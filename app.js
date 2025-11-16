// ====================================================================
// app.js — Calculadora de consumo + historial + comparativa + localStorage
// ====================================================================

// =========================
// 1. REFERENCIAS AL DOM
// =========================

// Datos de vehículo y prueba
const inputMarca = document.getElementById("marcaVehiculo");
const inputModelo = document.getElementById("modeloVehiculo");
const inputAnio = document.getElementById("anioVehiculo");
const inputVinPlaca = document.getElementById("vinPlaca");
const inputNumeroPrueba = document.getElementById("numeroPrueba");
const inputTecnico = document.getElementById("nombreTecnico");
const inputInicio = document.getElementById("inicioPrueba");
const inputFin = document.getElementById("finPrueba");
const inputObservaciones = document.getElementById("observaciones");

// Botones "Ahora"
const btnInicioAhora = document.getElementById("btnInicioAhora");
const btnFinAhora = document.getElementById("btnFinAhora");

// Combustibles
const fuelButtons = document.querySelectorAll(".fuel-btn");
const inputCombustibleSeleccionado = document.getElementById("combustibleSeleccionado");
const inputPcMJ = document.getElementById("pcMJ");

// Datos de combustible y recorrido
const inputPrecio = document.getElementById("precio");
const inputGalones = document.getElementById("galones");
const inputKmInicial = document.getElementById("kmInicial");
const inputKmFinal = document.getElementById("kmFinal");
const inputKmRecorridos = document.getElementById("kmRecorridos");

// Resultados
const inputEnergiaTotalMJ = document.getElementById("energiaTotalMJ");
const inputMJporSol = document.getElementById("mjPorSol");
const inputG100 = document.getElementById("g100");
const inputKmPorGalon = document.getElementById("kmPorGalon");
const inputKgGLP = document.getElementById("kgGLP");
const inputCostoTotal = document.getElementById("costoTotal");
const inputCostoPorKm = document.getElementById("costoPorKm");
const inputCostoPor100MJ = document.getElementById("costoPor100MJ");

// Panel comparativa
const cmpEnergia = document.getElementById("cmpEnergia");
const cmpRendimiento = document.getElementById("cmpRendimiento");
const cmpAhorroEconomico = document.getElementById("cmpAhorroEconomico");
const cmpEnergiaPorSol = document.getElementById("cmpEnergiaPorSol");

// Tabla
const tbodyHist = document.querySelector("#hist tbody");

// Botones principales
const btnCalcular = document.getElementById("btnCalcular");
const btnGuardar = document.getElementById("btnGuardar");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnBorrarTodo = document.getElementById("btnBorrarTodo");
const btnCSV = document.getElementById("btnCSV");
const btnPDF = document.getElementById("btnPDF");

// =========================
// 2. ESTADO
// =========================

let tipoCombustibleSeleccionado = null;
let listaPruebas = [];

let indiceBase = null;
let indiceAlternativa = null;

const STORAGE_KEY = "historial_pruebas_consumo";

// =========================
// 3. FUNCIONES AUXILIARES
// =========================

// Normaliza entrada numérica (acepta 17.5, 17,5, 1.234,56, etc.)
const toNumber = (v) => {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (!s) return null;

  // quitar espacios
  s = s.replace(/\s/g, "");

  // caso típico Perú: 1.234,56  ó  17,5
  if (s.includes(",") && !s.includes(".")) {
    // si el usuario puso miles con punto: 1.234,56 → 1234,56
    s = s.replace(/\./g, "");
    // coma decimal → punto para JS
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return isNaN(n) ? null : n;
};

// Formato visual en la UI (Perú, con separador de miles)
const formatNumber = (n, d = 2) =>
  n === null || isNaN(n)
    ? ""
    : n.toLocaleString("es-PE", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });

// Formato para CSV (SIN separador de miles, decimal con coma, ideal Excel Perú)
const formatNumberCSV = (n, d = 2) =>
  n === null || isNaN(n)
    ? ""
    : n.toLocaleString("es-PE", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
        useGrouping: false, // sin miles
      });

const formatDateTime = (dt) => {
  if (!dt) return "";
  const [f, h] = dt.split("T");
  return `${f} ${h || ""}`.trim();
};

const nowAsDateTimeLocal = () => {
  const d = new Date();
  const p = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
};

function limpiarResultados() {
  [
    inputEnergiaTotalMJ,
    inputMJporSol,
    inputG100,
    inputKmPorGalon,
    inputKgGLP,
    inputCostoTotal,
    inputCostoPorKm,
    inputCostoPor100MJ,
  ].forEach((i) => (i.value = ""));

  btnGuardar.disabled = true;
}

function limpiarFormulario() {
  [
    inputMarca,
    inputModelo,
    inputAnio,
    inputVinPlaca,
    inputNumeroPrueba,
    inputTecnico,
    inputInicio,
    inputFin,
    inputObservaciones,
    inputCombustibleSeleccionado,
    inputPcMJ,
    inputPrecio,
    inputGalones,
    inputKmInicial,
    inputKmFinal,
    inputKmRecorridos,
  ].forEach((i) => (i.value = ""));

  tipoCombustibleSeleccionado = null;
  fuelButtons.forEach((b) => b.classList.remove("active"));
  limpiarResultados();
}

// =========================
// 4. SELECCIÓN DE COMBUSTIBLE
// =========================

fuelButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    fuelButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    tipoCombustibleSeleccionado = btn.dataset.tipo;
    const pc = parseFloat(btn.dataset.pc);

    inputCombustibleSeleccionado.value = tipoCombustibleSeleccionado;
    inputPcMJ.value = formatNumber(pc, 2);

    limpiarResultados();
  });
});

// =========================
// 5. KM RECORRIDOS
// =========================

function actualizarKmRecorridos() {
  const i = toNumber(inputKmInicial.value);
  const f = toNumber(inputKmFinal.value);

  if (i === null || f === null || f <= i) {
    inputKmRecorridos.value = "";
    limpiarResultados();
    return;
  }

  inputKmRecorridos.value = formatNumber(f - i, 1);
  limpiarResultados();
}

inputKmInicial.addEventListener("input", actualizarKmRecorridos);
inputKmFinal.addEventListener("input", actualizarKmRecorridos);

// =========================
// 6. VALIDAR FORMULARIO
// =========================

function validarFormularioAntesDeCalcular() {
  const errores = [];

  // Datos del vehículo
  if (!inputMarca.value.trim()) errores.push("Ingresa la marca del vehículo.");
  if (!inputModelo.value.trim()) errores.push("Ingresa el modelo del vehículo.");

  if (!inputAnio.value.trim()) {
    errores.push("Ingresa el año del vehículo.");
  } else {
    const anioNum = parseInt(inputAnio.value, 10);
    if (isNaN(anioNum) || anioNum < 1900 || anioNum > 2100) {
      errores.push("Ingresa un año de vehículo válido (1900–2100).");
    }
  }

  if (!inputVinPlaca.value.trim()) {
    errores.push("Ingresa el VIN o la placa del vehículo.");
  }

  // Datos de prueba
  if (!inputNumeroPrueba.value.trim()) {
    errores.push("Ingresa el número de prueba.");
  }
  if (!inputTecnico.value.trim()) {
    errores.push("Ingresa el nombre del técnico que realiza la prueba.");
  }

  // Fechas
  if (!inputInicio.value) errores.push("Ingresa la fecha y hora de inicio de la prueba.");
  if (!inputFin.value) errores.push("Ingresa la fecha y hora de fin de la prueba.");

  if (inputInicio.value && inputFin.value) {
    const ini = new Date(inputInicio.value);
    const fin = new Date(inputFin.value);
    if (fin <= ini) {
      errores.push("La fecha/hora de fin debe ser mayor que la de inicio.");
    }
  }

  // Combustible
  if (!tipoCombustibleSeleccionado) {
    errores.push("Selecciona un tipo de combustible.");
  }

  // Precio / volumen
  const precio = toNumber(inputPrecio.value);
  const galones = toNumber(inputGalones.value);
  if (precio === null || precio <= 0) {
    errores.push("Ingresa un precio válido del combustible (mayor a 0).");
  }
  if (galones === null || galones <= 0) {
    errores.push("Ingresa un volumen (galones o m³) válido (mayor a 0).");
  }

  // Kilometrajes
  const kmIni = toNumber(inputKmInicial.value);
  const kmFin = toNumber(inputKmFinal.value);
  if (kmIni === null || kmFin === null) {
    errores.push("Ingresa KM inicial y KM final para calcular el recorrido.");
  } else if (kmFin <= kmIni) {
    errores.push("El KM final debe ser mayor que el KM inicial.");
  }

  if (errores.length > 0) {
    alert(errores.join("\n"));
    return false;
  }

  return true;
}

// =========================
// 7. CALCULAR
// =========================

btnCalcular.addEventListener("click", () => {
  limpiarResultados();

  const esValido = validarFormularioAntesDeCalcular();
  if (!esValido) return;

  const pc = toNumber(inputPcMJ.value);
  const precio = toNumber(inputPrecio.value);
  const galones = toNumber(inputGalones.value);
  const kmRecorridos = toNumber(inputKmRecorridos.value);

  if (pc === null || pc <= 0) {
    alert("Poder calorífico (PC) no válido. Revisa el tipo de combustible.");
    return;
  }

  const energiaTotalMJ = galones * pc;
  const gPor100 = (galones * 100) / kmRecorridos;
  const kmPorGalon = kmRecorridos / galones;
  const costoTotal = galones * precio;
  const costoPorKm = costoTotal / kmRecorridos;
  const mjPorSol = pc / precio;
  const costoPor100MJ = (100 * precio) / pc;

  let kgGLP = null;
  if (tipoCombustibleSeleccionado === "GLP") {
    const GALON_EN_LITROS = 3.785;
    const DENSIDAD_GLP = 0.55;
    kgGLP = galones * GALON_EN_LITROS * DENSIDAD_GLP;
  }

  inputEnergiaTotalMJ.value = formatNumber(energiaTotalMJ, 2);
  inputMJporSol.value = formatNumber(mjPorSol, 2);
  inputG100.value = formatNumber(gPor100, 2);
  inputKmPorGalon.value = formatNumber(kmPorGalon, 2);
  inputCostoTotal.value = formatNumber(costoTotal, 2);
  inputCostoPorKm.value = formatNumber(costoPorKm, 3);
  inputCostoPor100MJ.value = formatNumber(costoPor100MJ, 2);
  inputKgGLP.value = kgGLP !== null ? formatNumber(kgGLP, 3) : "";

  btnGuardar.disabled = false;
});

// =========================
// 8. HISTORIAL + LOCALSTORAGE
// =========================

function construirPrueba() {
  if (!inputEnergiaTotalMJ.value) {
    alert("Primero calcula la prueba.");
    return null;
  }

  return {
    marca: inputMarca.value.trim(),
    modelo: inputModelo.value.trim(),
    anio: inputAnio.value.trim(),
    vinPlaca: inputVinPlaca.value.trim(),
    numeroPrueba: inputNumeroPrueba.value.trim(),
    tecnico: inputTecnico.value.trim(),
    inicio: inputInicio.value,
    fin: inputFin.value,
    observaciones: inputObservaciones.value.trim(),

    combustible: tipoCombustibleSeleccionado,
    pc: toNumber(inputPcMJ.value),
    precio: toNumber(inputPrecio.value),
    volumen: toNumber(inputGalones.value),

    kmInicial: toNumber(inputKmInicial.value),
    kmFinal: toNumber(inputKmFinal.value),
    kmRecorridos: toNumber(inputKmRecorridos.value),

    energiaTotalMJ: toNumber(inputEnergiaTotalMJ.value),
    gPor100: toNumber(inputG100.value),
    kmPorGalon: toNumber(inputKmPorGalon.value),
    kgGLP: toNumber(inputKgGLP.value),
    costoTotal: toNumber(inputCostoTotal.value),
    costoPorKm: toNumber(inputCostoPorKm.value),
    mjPorSol: toNumber(inputMJporSol.value),
    costoPor100MJ: toNumber(inputCostoPor100MJ.value),
  };
}

function guardarHistorial() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listaPruebas));
}

function cargarHistorial() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    renderHistorial();
    return;
  }

  try {
    const parsed = JSON.parse(data);
    listaPruebas = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error al cargar historial:", err);
    listaPruebas = [];
  }

  renderHistorial();
}

function renderHistorial() {
  tbodyHist.innerHTML = "";

  listaPruebas.forEach((p, i) => {
    const tr = document.createElement("tr");

    if (i === indiceBase) tr.classList.add("row-base");
    if (i === indiceAlternativa) tr.classList.add("row-alt");

    tr.innerHTML = `
      <td>${formatDateTime(p.inicio)}</td>
      <td>${p.combustible}</td>
      <td>${formatNumber(p.volumen, 2)}</td>
      <td>${formatNumber(p.kmRecorridos, 1)}</td>
      <td>${formatNumber(p.energiaTotalMJ, 2)}</td>
      <td>${formatNumber(p.gPor100, 2)}</td>
      <td>${formatNumber(p.kmPorGalon, 2)}</td>
      <td>${formatNumber(p.costoTotal, 2)}</td>
      <td>${p.tecnico}</td>

      <td>
        <button class="btn-base ${i === indiceBase ? "activo-base" : ""}" data-index="${i}">
          ${i === indiceBase ? "Base seleccionada" : "Usar como base"}
        </button>
      </td>

      <td>
        <button class="btn-alt ${i === indiceAlternativa ? "activo-alt" : ""}" data-index="${i}">
          ${i === indiceAlternativa ? "Alternativa seleccionada" : "Usar como alternativa"}
        </button>
      </td>

      <td>
        <button class="btn-eliminar" data-index="${i}">Eliminar</button>
      </td>
    `;

    tbodyHist.appendChild(tr);
  });

  calcularComparativa();
}

function agregarPrueba(prueba) {
  listaPruebas.push(prueba);
  guardarHistorial();
  renderHistorial();
}

function eliminarPrueba(indice) {
  listaPruebas.splice(indice, 1);
  guardarHistorial();
  renderHistorial();
}

btnGuardar.addEventListener("click", () => {
  const p = construirPrueba();
  if (!p) return;
  agregarPrueba(p);
  btnGuardar.disabled = true;
});

tbodyHist.addEventListener("click", (e) => {
  const elim = e.target.closest(".btn-eliminar");
  const base = e.target.closest(".btn-base");
  const alt = e.target.closest(".btn-alt");

  if (elim) {
    const i = parseInt(elim.dataset.index, 10);
    if (isNaN(i)) return;
    if (!confirm("¿Eliminar prueba?")) return;
    eliminarPrueba(i);
    indiceBase = null;
    indiceAlternativa = null;
    return;
  }

  if (base) {
    const i = parseInt(base.dataset.index, 10);
    if (isNaN(i)) return;
    indiceBase = i;
    renderHistorial();
    return;
  }

  if (alt) {
    const i = parseInt(alt.dataset.index, 10);
    if (isNaN(i)) return;
    indiceAlternativa = i;
    renderHistorial();
    return;
  }
});

btnBorrarTodo.addEventListener("click", () => {
  if (!listaPruebas.length) return alert("No hay historial.");
  if (!confirm("¿Borrar TODO el historial?")) return;
  listaPruebas = [];
  indiceBase = null;
  indiceAlternativa = null;
  guardarHistorial();
  renderHistorial();
});

// Confirmación para LIMPIAR solo el formulario actual
btnLimpiar.addEventListener("click", () => {
  const ok = confirm(
    "¿Seguro que deseas LIMPIAR el formulario actual?\n\n" +
    "Esta acción solo borra los datos de esta prueba en pantalla,\n" +
    "pero NO borra el historial guardado."
  );

  if (!ok) return;
  limpiarFormulario();
});

// =========================
// 9. FECHA AHORA
// =========================

btnInicioAhora?.addEventListener("click", () => {
  inputInicio.value = nowAsDateTimeLocal();
});

btnFinAhora?.addEventListener("click", () => {
  inputFin.value = nowAsDateTimeLocal();
});

// =========================
// 10. CSV (compatible Excel Perú)
// =========================

const escapeCSV = (val) => {
  if (val === null || val === undefined) return "";
  let s = String(val).replace(/"/g, '""');
  // usamos ; como separador, por eso solo cuidamos ;, salto de línea y comillas
  return /[;\n"]/.test(s) ? `"${s}"` : s;
};

function exportarCSV() {
  if (!listaPruebas.length) return alert("No hay historial.");

  const confirmar = confirm(
    "¿Deseas exportar el historial a CSV para abrirlo en Excel?"
  );
  if (!confirmar) return;

  const headers = [
    "Fecha/hora inicio",
    "Fecha/hora fin",
    "Marca",
    "Modelo",
    "Año",
    "VIN/Placa",
    "N° prueba",
    "Técnico",
    "Combustible",
    "PC (MJ/U)",
    "Precio (S/)",
    "Volumen (U)",
    "Km inicial",
    "Km final",
    "Km recorridos",
    "MJ totales",
    "G/100",
    "km/U",
    "kg GLP",
    "Costo total (S/)",
    "Costo por km (S/)",
    "MJ por sol",
    "Costo por 100 MJ (S/)",
    "Observaciones",
  ];

  const filas = [headers.join(";")];

  listaPruebas.forEach((p) => {
    const fila = [
      formatDateTime(p.inicio),
      formatDateTime(p.fin),
      p.marca,
      p.modelo,
      p.anio,
      p.vinPlaca,
      p.numeroPrueba,
      p.tecnico,
      p.combustible,
      formatNumberCSV(p.pc, 2),
      formatNumberCSV(p.precio, 2),
      formatNumberCSV(p.volumen, 2),
      formatNumberCSV(p.kmInicial, 1),
      formatNumberCSV(p.kmFinal, 1),
      formatNumberCSV(p.kmRecorridos, 1),
      formatNumberCSV(p.energiaTotalMJ, 2),
      formatNumberCSV(p.gPor100, 2),
      formatNumberCSV(p.kmPorGalon, 2),
      formatNumberCSV(p.kgGLP, 3),
      formatNumberCSV(p.costoTotal, 2),
      formatNumberCSV(p.costoPorKm, 3),
      formatNumberCSV(p.mjPorSol, 2),
      formatNumberCSV(p.costoPor100MJ, 2),
      p.observaciones,
    ]
      .map(escapeCSV)
      .join(";");

    filas.push(fila);
  });

  const BOM = "\uFEFF"; // para que Excel respete acentos
  const csvFinal = BOM + filas.join("\n");

  const blob = new Blob([csvFinal], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `pruebas_consumo_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

btnCSV.addEventListener("click", exportarCSV);

// =========================
// 11. COMPARATIVA
// =========================

function calcularComparativa() {
  cmpEnergia.textContent = "Sin datos suficientes.";
  cmpRendimiento.textContent = "Sin datos suficientes.";
  cmpAhorroEconomico.textContent = "Ahorro por km y total.";
  cmpEnergiaPorSol.textContent = "Comparación MJ por S/.";

  if (indiceBase === null || indiceAlternativa === null) return;
  if (indiceBase === indiceAlternativa) {
    cmpEnergia.textContent = "Selecciona pruebas diferentes.";
    return;
  }

  const B = listaPruebas[indiceBase];
  const A = listaPruebas[indiceAlternativa];

  if (!B || !A) return;

  const baseOk = ["GASOLINA", "DIESEL"].includes(B.combustible);
  const altOk = ["GLP", "GNV"].includes(A.combustible);

  if (!baseOk || !altOk) {
    cmpEnergia.textContent =
      "Base debe ser GASOLINA/DIESEL y alternativa GLP/GNV.";
    return;
  }

  const nB = B.combustible;
  const nA = A.combustible;

  // ENERGÍA
  if (B.energiaTotalMJ && A.energiaTotalMJ) {
    const d = A.energiaTotalMJ - B.energiaTotalMJ;
    const pct = (d / B.energiaTotalMJ) * 100;
    const dir = pct >= 0 ? "más" : "menos";

    cmpEnergia.textContent =
      `${nA} entrega ${formatNumber(A.energiaTotalMJ, 2)} MJ ` +
      `vs ${formatNumber(B.energiaTotalMJ, 2)} MJ de ${nB} ` +
      `(${formatNumber(Math.abs(pct), 1)}% ${dir} energía).`;
  }

  // RENDIMIENTO
  if (B.kmPorGalon && A.kmPorGalon) {
    const d = A.kmPorGalon - B.kmPorGalon;
    const pct = (d / B.kmPorGalon) * 100;
    const dir = d >= 0 ? "mayor" : "menor";

    cmpRendimiento.textContent =
      `${nA} rinde ${formatNumber(A.kmPorGalon, 2)} km/U ` +
      `vs ${formatNumber(B.kmPorGalon, 2)} km/U de ${nB} ` +
      `(${formatNumber(Math.abs(pct), 1)}% ${dir} rendimiento).`;
  }

  // AHORRO
  if (B.costoPorKm && A.costoPorKm) {
    const ahorroKm = B.costoPorKm - A.costoPorKm;
    const pctKm = (ahorroKm / B.costoPorKm) * 100;

    const ahorroTotal = B.costoTotal - A.costoTotal;
    const pctTotal = (ahorroTotal / B.costoTotal) * 100;

    let textoKm =
      ahorroKm > 0
        ? `Ahorra S/ ${formatNumber(ahorroKm, 3)} por km (${formatNumber(
            pctKm,
            1
          )}%).`
        : `Menos ahorro: +S/ ${formatNumber(
            Math.abs(ahorroKm),
            3
          )} por km.`;

    let textoTot =
      ahorroTotal > 0
        ? `Ahorro total S/ ${formatNumber(
            ahorroTotal,
            2
          )} (${formatNumber(pctTotal, 1)}%).`
        : `Sobrecosto total S/ ${formatNumber(
            Math.abs(ahorroTotal),
            2
          )}.`;

    cmpAhorroEconomico.textContent = textoKm + " " + textoTot;
  }

  // MJ por Sol
  if (B.mjPorSol && A.mjPorSol) {
    const d = A.mjPorSol - B.mjPorSol;
    const pct = (d / B.mjPorSol) * 100;
    const dir = d >= 0 ? "más" : "menos";

    cmpEnergiaPorSol.textContent =
      `${nA} da ${formatNumber(A.mjPorSol, 2)} MJ por S/ ` +
      `vs ${formatNumber(B.mjPorSol, 2)} MJ por S/ de ${nB} ` +
      `(${formatNumber(Math.abs(pct), 1)}% ${dir} energía por sol).`;
  }
}

// =========================
// 12. INICIO
// =========================

document.addEventListener("DOMContentLoaded", () => {
  cargarHistorial();
});

if (btnPDF) {
  btnPDF.addEventListener("click", () => {
    window.print();
  });
}
