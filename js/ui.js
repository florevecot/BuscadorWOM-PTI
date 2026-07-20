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
  botonReiniciar: document.getElementById("btn-reiniciar"),
  botonCopiarId: document.getElementById("btn-copiar-id"),
  botonGoogleMaps: document.getElementById("btn-google-maps"),
  botonCopiarEnlace: document.getElementById("btn-copiar-enlace"),
  botonExportar: document.getElementById("btn-exportar"),
  toast: document.getElementById("toast"),

  activarVivienda: document.getElementById("activar-vivienda"),
  controlesVivienda: document.getElementById("controles-vivienda"),
  inputRadioVivienda: document.getElementById("input-radio-vivienda"),
  valorRadioVivienda: document.getElementById("valor-radio-vivienda"),
  botonBuscarVivienda: document.getElementById("btn-buscar-vivienda"),
  resultadoVivienda: document.getElementById("resultado-vivienda"),
  radioMasivoPti: document.getElementById("radio-masivo-pti"),
  radioMasivoVivienda: document.getElementById("radio-masivo-vivienda"),
  botonAnalizarTodos: document.getElementById("btn-analizar-todos"),
  botonCancelarAnalisis: document.getElementById("btn-cancelar-analisis"),
  botonDescargarAnalisis: document.getElementById("btn-descargar-analisis"),
  panelProgreso: document.getElementById("panel-progreso"),
  textoProgreso: document.getElementById("texto-progreso"),
  porcentajeProgreso: document.getElementById("porcentaje-progreso"),
  rellenoProgreso: document.getElementById("relleno-progreso"),
  detalleProgreso: document.getElementById("detalle-progreso")
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
    <h2>Estadísticas PTI</h2>

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

export function mostrarCargaVivienda() {
  elementos.resultadoVivienda.innerHTML = `
    <div class="cargando-vivienda">
      <span class="spinner"></span>
      Consultando edificios en OpenStreetMap...
    </div>
  `;
}

export function mostrarResultadoVivienda(vivienda) {
  const esAmpliada = vivienda.metodo === "ampliada";

  elementos.resultadoVivienda.innerHTML = `
    <div class="tarjeta-vivienda">
      <div class="titulo-vivienda">Construcción más cercana</div>

      <div>
        <strong>Tipo:</strong>
        ${escaparHtml(textoSeguro(vivienda.tipoVisible))}
      </div>

      <div>
        <strong>Distancia al centro:</strong>
        ${formatearDistancia(vivienda.distancia)}
      </div>

      <div>
        <strong>Radio consultado:</strong>
        ${vivienda.radioMetros} m
      </div>

      <span class="etiqueta-metodo">
        ${esAmpliada ? "Búsqueda ampliada: cualquier edificio" : "Búsqueda residencial"}
      </span>

      ${
        esAmpliada
          ? `<p class="advertencia-vivienda">
               No se encontraron edificios clasificados explícitamente como vivienda.
               El resultado puede corresponder a otro tipo de construcción.
             </p>`
          : ""
      }
    </div>
  `;
}

export function mostrarSinVivienda(radioMetros) {
  elementos.resultadoVivienda.innerHTML = `
    <p class="sin-resultados">
      No se encontraron edificios registrados en OpenStreetMap dentro de ${radioMetros} m.
    </p>
  `;
}

export function mostrarErrorVivienda(texto) {
  elementos.resultadoVivienda.innerHTML = `
    <p class="mensaje-error">${escaparHtml(texto)}</p>
  `;
}


let temporizadorToast = null;

export function mostrarToast(texto, tipo = "exito") {
  if (!elementos.toast) return;

  window.clearTimeout(temporizadorToast);
  elementos.toast.textContent = texto;
  elementos.toast.className = `toast visible ${tipo}`;

  temporizadorToast = window.setTimeout(() => {
    elementos.toast.className = "toast";
  }, 2600);
}

export function reiniciarPaneles() {
  elementos.detalleSitio.innerHTML = `
    <h2>Sitio seleccionado</h2>
    <p>Busca un ID o selecciona un punto en el mapa.</p>
  `;

  elementos.estadisticas.innerHTML = `
    <h2>Estadísticas PTI</h2>
    <p class="estado-carga">
      Selecciona un sitio para calcular estadísticas.
    </p>
  `;

  elementos.resultadoPti.innerHTML = `
    <h2>PTI cercanos</h2>
    <p class="estado-carga">
      Busca un sitio para calcular distancias.
    </p>
  `;

  elementos.resultadoVivienda.innerHTML = `
    <p class="estado-carga">
      Activa la opción para realizar la búsqueda.
    </p>
  `;
}


export function actualizarRadiosMasivos(radioPti,radioVivienda){elementos.radioMasivoPti.textContent=`${radioPti} m`;elementos.radioMasivoVivienda.textContent=`${radioVivienda} m`;}
export function prepararAnalisisMasivo(){elementos.panelProgreso.classList.remove("oculto");elementos.botonAnalizarTodos.disabled=true;elementos.botonCancelarAnalisis.disabled=false;elementos.botonDescargarAnalisis.disabled=true;elementos.textoProgreso.textContent="Preparando análisis...";elementos.porcentajeProgreso.textContent="0 %";elementos.rellenoProgreso.style.width="0%";elementos.detalleProgreso.textContent="";}
export function actualizarProgresoMasivo({procesados,total,idSitio,etapa}){const porcentaje=total>0?Math.round(procesados/total*100):0;elementos.textoProgreso.textContent=`${procesados} de ${total} sitios`;elementos.porcentajeProgreso.textContent=`${porcentaje} %`;elementos.rellenoProgreso.style.width=`${porcentaje}%`;elementos.detalleProgreso.textContent=idSitio?`${etapa}: ${idSitio}`:etapa;}
export function finalizarAnalisisMasivo({total,errores,cancelado}){elementos.botonAnalizarTodos.disabled=false;elementos.botonCancelarAnalisis.disabled=true;elementos.botonDescargarAnalisis.disabled=total===0;elementos.textoProgreso.textContent=cancelado?"Análisis cancelado":"Análisis completado";elementos.detalleProgreso.textContent=`${total} resultados disponibles · ${errores} consultas con error`;if(!cancelado){elementos.porcentajeProgreso.textContent="100 %";elementos.rellenoProgreso.style.width="100%";}}
