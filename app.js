// app.js — versión galones (pantalla completa + eliminar + CSV/PDF + LocalStorage)

document.addEventListener("DOMContentLoaded", () => {
  // Constantes
  const LITROS_POR_GALON = 3.785;
  const DENSIDAD = 0.55;

  // Helpers
  const $ = (id) => document.getElementById(id);
  const fmt = (n) =>
    Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tbody = document.querySelector("#hist tbody");

  // ---- Cálculo principal
  function calcular() {
    const G = parseFloat($("galones").value);
    const KM = parseFloat($("km").value);
    if (!G || !KM || G <= 0 || KM <= 0) {
      alert("Ingresa valores válidos (>0).");
      return null;
    }

    // Cálculos principales
    const g100 = (G * 100) / KM; // galones cada 100 km
    const kmg = KM / G;         // km por galón
    const kg = G * LITROS_POR_GALON * DENSIDAD; // peso del GLP en kg

    $("kpi_g100").textContent = fmt(g100);
    $("kpi_kmg").textContent = fmt(kmg);
    $("kpi_kg").textContent = fmt(kg);

    $("btnGuardar").disabled = false;
    return { G, KM, g100, kmg, kg };
  }

  // ---- Agregar fila al historial
  function agregarFila(r) {
    const tr = document.createElement("tr");
    const td = (v) => { const el = document.createElement("td"); el.textContent = v; return el; };

    tr.append(
      td(new Date().toLocaleString()),
      td(fmt(r.G)),
      td(fmt(r.KM)),
      td(fmt(r.g100)),
      td(fmt(r.kmg)),
      td(fmt(r.kg))
    );

    // Botón eliminar
    const tdBtn = document.createElement("td");
    tdBtn.innerHTML = `<button type="button" class="btn-delete" title="Eliminar" style="background:none;border:none;cursor:pointer;font-size:16px">🗑️</button>`;
    tr.appendChild(tdBtn);

    tbody.prepend(tr);
    $("btnGuardar").disabled = true;
    guardarHistorial();
  }

  // ---- Limpiar campos
  function limpiar() {
    $("galones").value = "";
    $("km").value = "";
    ["kpi_g100", "kpi_kmg", "kpi_kg"].forEach(id => ($(id).textContent = "—"));
    $("btnGuardar").disabled = true;
    $("galones").focus();
  }

  // ---- Borrar todo
  function borrarTodo() {
    tbody.innerHTML = "";
    guardarHistorial();
  }

  // ---- Exportar CSV
  function exportCSV() {
    const rows = [...document.querySelectorAll("#hist tr")];
    const csv = rows.map((row, idx) => {
      const cells = [...row.children];
      const useful = (idx === 0) ? cells : cells.slice(0, -1);
      return useful.map(td => td.textContent.replace(/"/g, '').trim()).join(",");
    }).join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `historial_consumogas_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---- Exportar PDF
  function exportPDF() {
    const win = window.open("", "_blank");
    const css = `
      <style>
        body{font-family:system-ui,Segoe UI,Arial;margin:24px}
        h2{margin:0 0 12px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}
        th{background:#f2f2f2}
      </style>`;
    const table = document.getElementById("hist").cloneNode(true);
    table.querySelector("thead tr")?.lastElementChild?.remove();
    table.querySelectorAll("tbody tr").forEach(tr => tr.lastElementChild?.remove());
    win.document.write(`<html><head><meta charset="utf-8">${css}</head><body><h2>Historial — ConsumoGas</h2>${table.outerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  // ---- LocalStorage
  function guardarHistorial() { localStorage.setItem("historial", tbody.innerHTML); }
  function cargarHistorial() { const data = localStorage.getItem("historial"); if (data) tbody.innerHTML = data; }

  // ---- Eliminar fila con delegación
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-delete");
    if (btn) { btn.closest("tr")?.remove(); guardarHistorial(); }
  });

  // ---- Eventos UI
  let ultimo = null;
  $("btnCalcular")?.addEventListener("click", () => { ultimo = calcular(); });
  $("btnGuardar")?.addEventListener("click", () => { if (ultimo) agregarFila(ultimo); });
  $("btnLimpiar")?.addEventListener("click", limpiar);
  $("btnBorrarTodo")?.addEventListener("click", borrarTodo);
  $("btnCSV")?.addEventListener("click", exportCSV);
  $("btnPDF")?.addEventListener("click", exportPDF);
  ["galones", "km"].forEach(id => $(id)?.addEventListener("keypress", e => { if (e.key === "Enter") $("btnCalcular").click(); }));

  // ---- Iniciar
  cargarHistorial();
});
