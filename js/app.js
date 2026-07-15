import {
  cargarSitios,
  cargarPti
} from "./data.js";

import {
  crearCapaSitios,
  crearCapaTodosPti,
  marcarSitioSeleccionado,
  dibujarCirculo,
  volverAlSitio,
  dibujarRadioVivienda,
  mostrarViviendaEnMapa,
  limpiarResultadoViviendaMapa
} from "./mapa.js";

import {
  elementos,
  mostrarMensaje,
  mostrarDetalleSitio,
  mostrarCargaPti,
  mostrarPtiCargados,
  mostrarErrorPti,
  mostrarCargaVivienda,
  mostrarResultadoVivienda,
  mostrarSinVivienda,
  mostrarErrorVivienda
} from "./ui.js";

import { actualizarResultadosPti } from "./pti.js";
import { configurarAutocompletado } from "./buscador.js";
import { exportarResultadosCsv } from "./exportar.js";
import { buscarViviendaMasCercana } from "./viviendas.js";

const sitiosPorId = {};

let sitioSeleccionado = null;
let datosPti = [];
let resultadosActuales = null;
let consultaViviendaEnCurso = false;

function actualizarUrl(id) {
  const url = new URL(window.location.href);

  if (id) {
    url.searchParams.set("id", id);
  } else {
    url.searchParams.delete("id");
  }

  window.history.replaceState({}, "", url);
}

function recalcularResultados() {
  if (!sitioSeleccionado || datosPti.length === 0) {
    resultadosActuales = null;
    elementos.botonExportar.disabled = true;
    return;
  }

  resultadosActuales = actualizarResultadosPti(
    sitioSeleccionado,
    datosPti,
    Number(elementos.inputRadio.value)
  );

  elementos.botonExportar.disabled = !resultadosActuales;
}

function reiniciarViviendaParaNuevoSitio() {
  limpiarResultadoViviendaMapa(false);

  if (elementos.activarVivienda.checked) {
    elementos.resultadoVivienda.innerHTML = `
      <p class="estado-carga">
        Ajusta el radio y presiona “Buscar vivienda”.
      </p>
    `;
  }
}

function seleccionarSitio(registroSitio) {
  sitioSeleccionado = registroSitio;

  const p = registroSitio.feature.properties || {};
  const coordenadas = registroSitio.layer.getLatLng();
  const radioMetros = Number(elementos.inputRadio.value);
  const id = String(p.ID || "").trim().toUpperCase();

  elementos.inputId.value = id;

  mostrarDetalleSitio(p, coordenadas);
  marcarSitioSeleccionado(registroSitio);
  dibujarCirculo(coordenadas, radioMetros);
  recalcularResultados();
  reiniciarViviendaParaNuevoSitio();

  elementos.botonVolverSitio.disabled = false;
  elementos.botonCopiarEnlace.disabled = false;

  actualizarUrl(id);
  mostrarMensaje(`Sitio ${id} encontrado.`, "exito");
}

function buscarPorId() {
  const consulta = elementos.inputId.value.trim().toUpperCase();

  if (!consulta) {
    mostrarMensaje(
      "Escribe un ID, comuna o región para realizar la búsqueda.",
      "error"
    );
    elementos.inputId.focus();
    return;
  }

  const registro = sitiosPorId[consulta];

  if (registro) {
    seleccionarSitio(registro);
    return;
  }

  mostrarMensaje(
    `No existe una coincidencia exacta para ${consulta}. Usa las sugerencias.`,
    "error"
  );
}

function actualizarRadio() {
  const radioMetros = Number(elementos.inputRadio.value);
  elementos.valorRadio.textContent = radioMetros;

  if (!sitioSeleccionado) return;

  dibujarCirculo(sitioSeleccionado.layer.getLatLng(), radioMetros);
  recalcularResultados();
}

function cambiarEstadoVivienda() {
  const activa = elementos.activarVivienda.checked;

  elementos.controlesVivienda.classList.toggle("deshabilitado", !activa);
  elementos.inputRadioVivienda.disabled = !activa;
  elementos.botonBuscarVivienda.disabled = !activa;

  if (!activa) {
    limpiarResultadoViviendaMapa(true);
    elementos.resultadoVivienda.innerHTML = `
      <p class="estado-carga">Activa la opción para realizar la búsqueda.</p>
    `;
    return;
  }

  elementos.resultadoVivienda.innerHTML = `
    <p class="estado-carga">
      Selecciona un sitio, ajusta el radio y presiona “Buscar vivienda”.
    </p>
  `;

  if (sitioSeleccionado) {
    dibujarRadioVivienda(
      sitioSeleccionado.layer.getLatLng(),
      Number(elementos.inputRadioVivienda.value)
    );
  }
}

function actualizarRadioVivienda() {
  const radio = Number(elementos.inputRadioVivienda.value);
  elementos.valorRadioVivienda.textContent = radio;

  if (
    elementos.activarVivienda.checked &&
    sitioSeleccionado
  ) {
    dibujarRadioVivienda(
      sitioSeleccionado.layer.getLatLng(),
      radio
    );

    limpiarResultadoViviendaMapa(false);

    elementos.resultadoVivienda.innerHTML = `
      <p class="estado-carga">
        Radio modificado. Presiona “Buscar vivienda” para recalcular.
      </p>
    `;
  }
}

async function buscarVivienda() {
  if (!elementos.activarVivienda.checked) return;

  if (!sitioSeleccionado) {
    mostrarErrorVivienda("Primero selecciona un sitio WOM.");
    return;
  }

  if (consultaViviendaEnCurso) return;

  const coordenadas = sitioSeleccionado.layer.getLatLng();
  const radio = Number(elementos.inputRadioVivienda.value);

  consultaViviendaEnCurso = true;
  elementos.botonBuscarVivienda.disabled = true;

  limpiarResultadoViviendaMapa(false);
  dibujarRadioVivienda(coordenadas, radio);
  mostrarCargaVivienda();

  try {
    const vivienda = await buscarViviendaMasCercana(
      coordenadas.lat,
      coordenadas.lng,
      radio
    );

    if (!vivienda) {
      mostrarSinVivienda(radio);
      return;
    }

    mostrarResultadoVivienda(vivienda);
    mostrarViviendaEnMapa(vivienda);
  } catch (error) {
    console.error("Error de búsqueda de vivienda:", error);

    const mensaje = error.name === "AbortError"
      ? "La consulta tardó demasiado. Intenta nuevamente."
      : "No fue posible consultar OpenStreetMap en este momento.";

    mostrarErrorVivienda(mensaje);
  } finally {
    consultaViviendaEnCurso = false;
    elementos.botonBuscarVivienda.disabled =
      !elementos.activarVivienda.checked;
  }
}

function exportarResultados() {
  if (!sitioSeleccionado || !resultadosActuales) {
    mostrarMensaje("Primero selecciona un sitio.", "error");
    return;
  }

  try {
    exportarResultadosCsv({
      sitio: sitioSeleccionado,
      radioMetros: Number(elementos.inputRadio.value),
      ptiMasCercano: resultadosActuales.ptiMasCercano,
      ptiDentroDelRadio: resultadosActuales.ptiDentroDelRadio
    });

    mostrarMensaje("Archivo CSV generado correctamente.", "exito");
  } catch (error) {
    console.error(error);
    mostrarMensaje("No fue posible exportar los resultados.", "error");
  }
}

async function copiarEnlace() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    mostrarMensaje("Enlace copiado al portapapeles.", "exito");
  } catch {
    mostrarMensaje(
      "No fue posible copiar automáticamente. Copia la dirección desde el navegador.",
      "error"
    );
  }
}

function abrirSitioDesdeUrl() {
  const parametros = new URLSearchParams(window.location.search);
  const id = String(parametros.get("id") || "").trim().toUpperCase();

  if (!id) return;

  const registro = sitiosPorId[id];

  if (!registro) {
    mostrarMensaje(`El ID ${id} de la URL no existe.`, "error");
    return;
  }

  seleccionarSitio(registro);
}

async function iniciarAplicacion() {
  mostrarCargaPti();

  try {
    const geojson = await cargarSitios();

    const resultadoSitios = crearCapaSitios(
      geojson,
      seleccionarSitio
    );

    Object.assign(sitiosPorId, resultadoSitios.sitiosPorId);

    configurarAutocompletado({
      input: elementos.inputId,
      contenedor: elementos.sugerencias,
      obtenerRegistros: () => sitiosPorId,
      alSeleccionar: seleccionarSitio,
      limite: 10
    });

    mostrarMensaje(
      `${Object.keys(sitiosPorId).length} sitios cargados.`,
      "exito"
    );
  } catch (error) {
    console.error("Error al cargar sitios:", error);
    mostrarMensaje("No fue posible cargar Sitios.geojson.", "error");
    return;
  }

  try {
    datosPti = await cargarPti();
    mostrarPtiCargados(datosPti.length);
    crearCapaTodosPti(datosPti);
  } catch (error) {
    console.error("Error al cargar PTI:", error);
    mostrarErrorPti(error.message || "No fue posible cargar PTI.csv.");
  }

  abrirSitioDesdeUrl();
}

elementos.botonBuscar.addEventListener("click", buscarPorId);

elementos.inputId.addEventListener("keydown", evento => {
  if (evento.key !== "Enter") return;

  const activa = elementos.sugerencias.querySelector(
    ".sugerencia-item.activa"
  );

  if (!activa) buscarPorId();
});

elementos.inputRadio.addEventListener("input", actualizarRadio);
elementos.botonVolverSitio.addEventListener("click", volverAlSitio);
elementos.botonCopiarEnlace.addEventListener("click", copiarEnlace);
elementos.botonExportar.addEventListener("click", exportarResultados);

elementos.activarVivienda.addEventListener("change", cambiarEstadoVivienda);
elementos.inputRadioVivienda.addEventListener("input", actualizarRadioVivienda);
elementos.botonBuscarVivienda.addEventListener("click", buscarVivienda);

iniciarAplicacion();
