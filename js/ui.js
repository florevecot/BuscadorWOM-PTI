// Interfaz de usuario

import {
  textoSeguro,
  escaparHtml,
  formatearDistancia
} from "./utilidades.js";

export const elementos = {
  inputId: document.getElementById("input-id"),
  botonBuscar: document.getElementById("btn-buscar"),
  sugerencias: document.getElementById("sugerencias"),
  mensaje: document.getElementById("mensaje"),
  inputRadio: document.getElementById("input-radio"),
  valorRadio: document.getElementById("valor-radio"),
  detalleSitio: document.getElementById("detalle-sitio"),
  estadisticas: document.getElementById("estadisticas"),
  resultadoPti: document.getElementById("resultado-pti"),
  botonVolverSitio: document.getElementById("btn-volver-sitio"),
  botonCopiarEnlace: document.getElementById("btn-copiar-enlace"),
  botonExportar: document.getElementById("btn-exportar")
};

export function mostrarMensaje(texto, tipo = "") {
  elementos.mensaje.textContent = texto;
  elementos.mensaje.className = "";

  if (tipo === "error") {
    elementos.mensaje.classList.add("mensaje-error");
  } else if (tipo === "exito") {
    elementos.mensaje.classList.add("mensaje-exito");
  }
}

export function crearContenidoSitio(propiedades) {
  const p = propiedades || {};

  return `
    <h3>${escaparHtml(textoSeguro(p.ID))}</h3>
    <b>Región:</b> ${escaparHtml(textoSeguro(p["Región"]))}<br>
    <b>Comuna:</b> ${escaparHtml(textoSeguro(p["Comuna"]))}<br>
    <b>Proyecto:</b> ${escaparHtml(textoSeguro(p["Proyecto unico Portafolio"]))}<br>
    <b>Etapa:</b> ${escaparHtml(textoSeguro(p["Etapa OOEE"]))}<br>
    <b>Contrato:</b> ${escaparHtml(textoSeguro(p["Contrato"]))}<br>
    <b>Estado:</b> ${escaparHtml(textoSeguro(p["Estatus Contrato"]))}<br>
    <b>Solución:</b> ${escaparHtml(textoSeguro(p["Tipo de Solución Validada"]))}
  `;
}

export function mostrarDetalleSitio(propiedades, coordenadas) {
  const p = propiedades || {};

  elementos.detalleSitio.innerHTML = `
    <h2>Sitio seleccionado</h2>
    <p class="detalle-fila"><strong>ID:</strong> ${escaparHtml(textoSeguro(p.ID))}</p>
    <p class="detalle-fila"><strong>Región:</strong> ${escaparHtml(textoSeguro(p["Región"]))}</p>
    <p class="detalle-fila"><strong>Comuna:</strong> ${escaparHtml(textoSeguro(p["Comuna"]))}</p>
    <p class="detalle-fila"><strong>Proyecto:</strong> ${escaparHtml(textoSeguro(p["Proyecto unico Portafolio"]))}</p>
    <p class="detalle-fila"><strong>Etapa:</strong> ${escaparHtml(textoSeguro(p["Etapa OOEE"]))}</p>
    <p class="detalle-fila"><strong>Contrato:</strong> ${escaparHtml(textoSeguro(p["Contrato"]))}</p>
    <p class="detalle-fila"><strong>Estado:</strong> ${escaparHtml(textoSeguro(p["Estatus Contrato"]))}</p>
    <p class="detalle-fila"><strong>Solución:</strong> ${escaparHtml(textoSeguro(p["Tipo de Solución Validada"]))}</p>
    <div class="coordenadas">
      Latitud: ${coordenadas.lat.toFixed(6)}<br>
      Longitud: ${coordenadas.lng.toFixed(6)}
    </div>
  `;
}

export function mostrarEstadisticas({
  ptiMasCercano,
  cantidadDentro,
  radioMetros,
  distanciaPromedio,
  distanciaMaxima
}) {
  elementos.estadisticas.innerHTML = `
    <h2>Estadísticas</h2>
    <div class="cuadricula-estadisticas">
      <div class="tarjeta-estadistica">
        <div class="valor-estadistica">${cantidadDentro}</div>
        <div class="etiqueta-estadistica">PTI dentro del radio</div>
      </div>

      <div class="tarjeta-estadistica">
        <div class="valor-estadistica">${formatearDistancia(ptiMasCercano?.distancia)}</div>
        <div class="etiqueta-estadistica">PTI más cercano</div>
      </div>

      <div class="tarjeta-estadistica">
        <div class="valor-estadistica">${formatearDistancia(distanciaPromedio)}</div>
        <div class="etiqueta-estadistica">Promedio dentro del radio</div>
      </div>

      <div class="tarjeta-estadistica">
        <div class="valor-estadistica">${radioMetros} m</div>
        <div class="etiqueta-estadistica">Radio utilizado</div>
      </div>
    </div>

    ${
      Number.isFinite(distanciaMaxima)
        ? `<p class="detalle-fila"><strong>PTI más lejano dentro del radio:</strong> ${formatearDistancia(distanciaMaxima)}</p>`
        : ""
    }
  `;
}

export function mostrarCargaPti() {
  elementos.resultadoPti.innerHTML = `
    <h2>PTI cercanos</h2>
    <p class="estado-carga">Cargando PTI.csv...</p>
  `;
}

export function mostrarPtiCargados(cantidad) {
  elementos.resultadoPti.innerHTML = `
    <h2>PTI cercanos</h2>
    <p class="estado-carga">${cantidad} PTI cargados. Busca un sitio para calcular distancias.</p>
  `;
}

export function mostrarErrorPti(texto) {
  elementos.resultadoPti.innerHTML = `
    <h2>PTI cercanos</h2>
    <p class="sin-resultados">${escaparHtml(texto)}</p>
  `;
}
