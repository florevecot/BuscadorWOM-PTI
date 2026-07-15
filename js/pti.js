import {
  calcularDistanciaMetros,
  textoSeguro,
  escaparHtml,
  formatearDistancia
} from "./utilidades.js";

import {
  limpiarMarcadoresPti,
  agregarMarcadorPti,
  enfocarPti
} from "./mapa.js";

import {
  elementos,
  mostrarEstadisticas
} from "./ui.js";

export function actualizarResultadosPti(
  sitioSeleccionado,
  datosPti,
  radioMetros
) {
  limpiarMarcadoresPti();

  if (!sitioSeleccionado) return null;

  if (!datosPti || datosPti.length === 0) {
    elementos.resultadoPti.innerHTML = `
      <h2>PTI cercanos</h2>
      <p class="sin-resultados">No existen datos PTI válidos.</p>
    `;
    return null;
  }

  const coordenadasSitio = sitioSeleccionado.layer.getLatLng();

  const ptiConDistancia = datosPti
    .map(pti => ({
      ...pti,
      distancia: calcularDistanciaMetros(
        coordenadasSitio.lat,
        coordenadasSitio.lng,
        pti.latitud,
        pti.longitud
      )
    }))
    .sort((a, b) => a.distancia - b.distancia);

  const ptiMasCercano = ptiConDistancia[0];
  const ptiDentroDelRadio = ptiConDistancia.filter(
    pti => pti.distancia <= radioMetros
  );

  const distanciaPromedio =
    ptiDentroDelRadio.length > 0
      ? ptiDentroDelRadio.reduce((suma, pti) => suma + pti.distancia, 0)
        / ptiDentroDelRadio.length
      : NaN;

  const distanciaMaxima =
    ptiDentroDelRadio.length > 0
      ? Math.max(...ptiDentroDelRadio.map(pti => pti.distancia))
      : NaN;

  mostrarEstadisticas({
    ptiMasCercano,
    cantidadDentro: ptiDentroDelRadio.length,
    radioMetros,
    distanciaPromedio,
    distanciaMaxima
  });

  const masCercanoDentro = ptiMasCercano.distancia <= radioMetros;

  elementos.resultadoPti.innerHTML = `
    <h2>PTI cercanos</h2>

    <div class="pti-mas-cercano">
      <div class="titulo-pti-cercano">PTI más cercano</div>
      <div><strong>${escaparHtml(textoSeguro(ptiMasCercano.nombre))}</strong></div>
      <div>${formatearDistancia(ptiMasCercano.distancia)}</div>

      <div class="${masCercanoDentro ? "estado-dentro" : "estado-fuera"}">
        ${masCercanoDentro ? "Dentro del radio" : "Fuera del radio seleccionado"}
      </div>

      <button id="btn-ver-pti-cercano" class="btn-ver-pti" type="button">
        Ver en el mapa
      </button>
    </div>

    <div class="resumen-pti">
      <strong>${ptiDentroDelRadio.length}</strong>
      PTI encontrados dentro de
      <strong>${radioMetros} metros</strong>.
    </div>

    <div id="lista-pti" class="lista-pti"></div>
  `;

  const marcadorMasCercano = agregarMarcadorPti(
    ptiMasCercano,
    { esMasCercano: true }
  );

  document
    .getElementById("btn-ver-pti-cercano")
    .addEventListener("click", () => {
      enfocarPti(ptiMasCercano, marcadorMasCercano);
    });

  const lista = document.getElementById("lista-pti");

  if (ptiDentroDelRadio.length === 0) {
    lista.innerHTML = `
      <p class="sin-resultados">No hay PTI dentro del radio seleccionado.</p>
    `;
  } else {
    ptiDentroDelRadio.forEach((pti, indice) => {
      const esMasCercano = pti === ptiMasCercano;
      const marcador = esMasCercano
        ? marcadorMasCercano
        : agregarMarcadorPti(pti);

      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-pti";

      tarjeta.innerHTML = `
        <div class="nombre-pti">
          ${indice + 1}. ${escaparHtml(textoSeguro(pti.nombre))}
          ${
            esMasCercano
              ? `<span class="etiqueta-cercano">Más cercano</span>`
              : ""
          }
        </div>

        <div class="distancia-pti">
          ${formatearDistancia(pti.distancia)}
        </div>
      `;

      tarjeta.addEventListener("click", () => {
        document
          .querySelectorAll(".tarjeta-pti")
          .forEach(elemento => elemento.classList.remove("seleccionada"));

        tarjeta.classList.add("seleccionada");
        enfocarPti(pti, marcador);
      });

      lista.appendChild(tarjeta);
    });
  }

  return {
    ptiMasCercano,
    ptiDentroDelRadio,
    ptiConDistancia,
    distanciaPromedio,
    distanciaMaxima
  };
}
