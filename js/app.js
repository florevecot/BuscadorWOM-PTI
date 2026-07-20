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
  limpiarResultadoViviendaMapa,
  reiniciarMapa
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
  mostrarErrorVivienda,
  mostrarToast,
  reiniciarPaneles,
  actualizarRadiosMasivos,
  prepararAnalisisMasivo,
  actualizarProgresoMasivo,
  finalizarAnalisisMasivo
} from "./ui.js";

import { actualizarResultadosPti } from "./pti.js";
import { configurarAutocompletado } from "./buscador.js";
import { exportarResultadosCsv } from "./exportar.js";
import { buscarViviendaMasCercana } from "./viviendas.js";
import {ejecutarAnalisisMasivo,cancelarAnalisisMasivo,obtenerResultadosMasivos,descargarAnalisisMasivoCsv} from "./analisis.js";

const sitiosPorId = {};

let sitioSeleccionado = null;
let datosPti = [];
let resultadosActuales = null;
let consultaViviendaEnCurso = false;
let analisisMasivoEnCurso = false;

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
  elementos.botonCopiarId.disabled = false;
  elementos.botonGoogleMaps.disabled = false;
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
  actualizarRadiosMasivos(radioMetros, Number(elementos.inputRadioVivienda.value));

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
  actualizarRadiosMasivos(Number(elementos.inputRadio.value), radio);

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

async function iniciarAnalisisMasivo(){if(analisisMasivoEnCurso)return;const cantidad=Object.keys(sitiosPorId).length;if(!cantidad||!datosPti.length){mostrarToast("Aún no se han cargado los sitios o los PTI.","error");return;}if(!window.confirm(`Se analizarán ${cantidad} sitios. La búsqueda de viviendas puede tardar varios minutos. ¿Deseas continuar?`))return;analisisMasivoEnCurso=true;prepararAnalisisMasivo();try{const resultado=await ejecutarAnalisisMasivo({sitiosPorId,datosPti,radioPti:Number(elementos.inputRadio.value),radioVivienda:Number(elementos.inputRadioVivienda.value),alProgreso:actualizarProgresoMasivo});finalizarAnalisisMasivo({total:resultado.resultados.length,errores:resultado.errores,cancelado:resultado.cancelado});mostrarToast(resultado.cancelado?`Análisis cancelado. ${resultado.resultados.length} resultados disponibles.`:`Análisis completo: ${resultado.resultados.length} sitios procesados.`,resultado.cancelado?"error":"exito");}catch(error){console.error(error);finalizarAnalisisMasivo({total:obtenerResultadosMasivos().length,errores:1,cancelado:true});mostrarToast("El análisis se interrumpió. Puedes descargar resultados parciales.","error");}finally{analisisMasivoEnCurso=false;}}
function cancelarAnalisisActual(){if(!analisisMasivoEnCurso)return;cancelarAnalisisMasivo();elementos.botonCancelarAnalisis.disabled=true;elementos.detalleProgreso.textContent="Cancelación solicitada. Terminando el sitio actual...";}
function descargarAnalisisCompleto(){try{descargarAnalisisMasivoCsv(obtenerResultadosMasivos());mostrarToast("CSV masivo generado correctamente.");}catch(error){mostrarToast("No hay resultados masivos para descargar.","error");}}

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
    mostrarToast("Enlace copiado al portapapeles.");
  } catch {
    mostrarMensaje(
      "No fue posible copiar automáticamente. Copia la dirección desde el navegador.",
      "error"
    );
  }
}


async function copiarId() {
  if (!sitioSeleccionado) {
    mostrarToast("Primero selecciona un sitio.", "error");
    return;
  }

  const id = String(
    sitioSeleccionado.feature.properties?.ID || ""
  ).trim();

  try {
    await navigator.clipboard.writeText(id);
    mostrarToast(`ID ${id} copiado.`);
  } catch {
    mostrarToast("No fue posible copiar el ID.", "error");
  }
}

function abrirGoogleMaps() {
  if (!sitioSeleccionado) {
    mostrarToast("Primero selecciona un sitio.", "error");
    return;
  }

  const coordenadas = sitioSeleccionado.layer.getLatLng();
  const url = `https://www.google.com/maps?q=${coordenadas.lat},${coordenadas.lng}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function reiniciarBusqueda() {
  sitioSeleccionado = null;
  resultadosActuales = null;
  consultaViviendaEnCurso = false;

  elementos.inputId.value = "";
  elementos.inputRadio.value = "400";
  elementos.valorRadio.textContent = "400";

  elementos.activarVivienda.checked = false;
  elementos.inputRadioVivienda.value = "300";
  elementos.valorRadioVivienda.textContent = "300";
  elementos.inputRadioVivienda.disabled = true;
  elementos.botonBuscarVivienda.disabled = true;
  elementos.controlesVivienda.classList.add("deshabilitado");

  elementos.botonVolverSitio.disabled = true;
  elementos.botonCopiarId.disabled = true;
  elementos.botonGoogleMaps.disabled = true;
  elementos.botonCopiarEnlace.disabled = true;
  elementos.botonExportar.disabled = true;

  elementos.sugerencias.innerHTML = "";
  elementos.sugerencias.classList.add("oculto");

  mostrarMensaje(
    `${Object.keys(sitiosPorId).length} sitios cargados.`,
    "exito"
  );

  reiniciarPaneles();
  reiniciarMapa();
  actualizarUrl("");
  elementos.inputId.focus();

  mostrarToast("Búsqueda reiniciada.");
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
elementos.botonReiniciar.addEventListener("click", reiniciarBusqueda);
elementos.botonCopiarId.addEventListener("click", copiarId);
elementos.botonGoogleMaps.addEventListener("click", abrirGoogleMaps);
elementos.botonCopiarEnlace.addEventListener("click", copiarEnlace);
elementos.botonExportar.addEventListener("click", exportarResultados);

elementos.botonAnalizarTodos.addEventListener("click", iniciarAnalisisMasivo);
elementos.botonCancelarAnalisis.addEventListener("click", cancelarAnalisisActual);
elementos.botonDescargarAnalisis.addEventListener("click", descargarAnalisisCompleto);

elementos.activarVivienda.addEventListener("change", cambiarEstadoVivienda);
elementos.inputRadioVivienda.addEventListener("input", actualizarRadioVivienda);
elementos.botonBuscarVivienda.addEventListener("click", buscarVivienda);

actualizarRadiosMasivos(Number(elementos.inputRadio.value),Number(elementos.inputRadioVivienda.value));

iniciarAplicacion();
