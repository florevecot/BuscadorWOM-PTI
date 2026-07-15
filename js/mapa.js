import { crearContenidoSitio } from "./ui.js";
import {
  escaparHtml,
  textoSeguro,
  formatearDistancia
} from "./utilidades.js";

export const mapa = L.map("map", { zoomControl: true })
  .setView([-33.45, -70.66], 5);

const capaCalles = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }
);

const capaSatelital = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
    maxZoom: 19
  }
);

const capaEtiquetas = L.tileLayer(
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Labels &copy; Esri",
    maxZoom: 19
  }
);

capaCalles.addTo(mapa);

export const controlCapas = L.control.layers(
  {
    "Mapa de calles": capaCalles,
    "Imagen satelital": capaSatelital
  },
  {
    "Etiquetas sobre satélite": capaEtiquetas
  },
  {
    collapsed: false,
    position: "topright"
  }
).addTo(mapa);

let marcadorSeleccionado = null;
let circuloBusqueda = null;
let marcadoresPti = [];
let lineaConexion = null;
let coordenadasSitioSeleccionado = null;
let capaTodosPti = null;
let capaSitiosWom = null;

let circuloVivienda = null;
let marcadorVivienda = null;
let lineaVivienda = null;

const controlLeyenda = L.control({ position: "bottomright" });

controlLeyenda.onAdd = function () {
  const div = L.DomUtil.create("div", "leyenda-mapa");

  div.innerHTML = `
    <strong>Leyenda</strong>
    <div><span class="punto-leyenda punto-wom"></span>Sitio WOM</div>
    <div><span class="punto-leyenda punto-sitio"></span>Sitio WOM seleccionado</div>
    <div><span class="punto-leyenda punto-pti"></span>PTI dentro del radio</div>
    <div><span class="punto-leyenda punto-cercano"></span>PTI más cercano</div>
    <div><span class="punto-leyenda punto-todos-pti"></span>Todos los PTI</div>
    <div><span class="punto-leyenda punto-vivienda"></span>Vivienda/edificio cercano</div>
  `;

  return div;
};

controlLeyenda.addTo(mapa);

export function crearCapaSitios(geojson, alSeleccionar) {
  const sitiosPorId = {};

  capaSitiosWom = L.geoJSON(geojson, {
    pointToLayer(feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: "#8e44ad",
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9
      });
    },

    onEachFeature(feature, layer) {
      const p = feature.properties || {};
      const id = String(p.ID || "").trim().toUpperCase();

      layer.bindPopup(crearContenidoSitio(p));

      if (id) {
        sitiosPorId[id] = { feature, layer };
      }

      layer.on("click", () => alSeleccionar({ feature, layer }));
    }
  });

  capaSitiosWom.addTo(mapa);
  controlCapas.addOverlay(capaSitiosWom, "Sitios WOM");

  if (capaSitiosWom.getBounds().isValid()) {
    mapa.fitBounds(capaSitiosWom.getBounds());
  }

  return { capa: capaSitiosWom, sitiosPorId };
}

export function crearCapaTodosPti(datosPti) {
  if (capaTodosPti) {
    mapa.removeLayer(capaTodosPti);
    controlCapas.removeLayer(capaTodosPti);
  }

  capaTodosPti = L.layerGroup();

  datosPti.forEach(pti => {
    const marcador = L.circleMarker(
      [pti.latitud, pti.longitud],
      {
        radius: 4,
        color: "#ffffff",
        weight: 1,
        fillColor: "#0077cc",
        fillOpacity: 0.85
      }
    );

    marcador.bindTooltip(textoSeguro(pti.nombre), { direction: "top" });

    marcador.bindPopup(
      crearTablaDatosPti(
        { ...pti, distancia: NaN },
        false
      )
    );

    marcador.addTo(capaTodosPti);
  });

  capaTodosPti.addTo(mapa);
  controlCapas.addOverlay(capaTodosPti, "Todos los PTI");

  return capaTodosPti;
}

export function marcarSitioSeleccionado(registroSitio) {
  coordenadasSitioSeleccionado = registroSitio.layer.getLatLng();

  if (marcadorSeleccionado) {
    mapa.removeLayer(marcadorSeleccionado);
  }

  limpiarLineaConexion();
  limpiarResultadoViviendaMapa(false);

  // El sitio seleccionado sigue siendo morado.
  marcadorSeleccionado = L.circleMarker(
    coordenadasSitioSeleccionado,
    {
      radius: 11,
      color: "#4b1760",
      weight: 4,
      fillColor: "#8e44ad",
      fillOpacity: 1
    }
  ).addTo(mapa);

  marcadorSeleccionado.bindPopup(
    crearContenidoSitio(registroSitio.feature.properties)
  );

  marcadorSeleccionado.openPopup();
  return marcadorSeleccionado;
}

export function dibujarCirculo(coordenadas, radioMetros) {
  if (circuloBusqueda) {
    mapa.removeLayer(circuloBusqueda);
  }

  circuloBusqueda = L.circle(coordenadas, {
    radius: radioMetros,
    color: "#7d3c98",
    weight: 2,
    opacity: 0.9,
    fillColor: "#9b59b6",
    fillOpacity: 0.15
  }).addTo(mapa);

  mapa.fitBounds(circuloBusqueda.getBounds(), {
    padding: [40, 40],
    maxZoom: 18
  });

  return circuloBusqueda;
}

export function limpiarMarcadoresPti() {
  marcadoresPti.forEach(marcador => mapa.removeLayer(marcador));
  marcadoresPti = [];
  limpiarLineaConexion();
}

function crearTablaDatosPti(pti, incluirDistancia = true) {
  const datos = { ...pti.datosOriginales };

  if (incluirDistancia && Number.isFinite(pti.distancia)) {
    datos["Distancia calculada"] = formatearDistancia(pti.distancia);
  }

  const filas = Object.entries(datos)
    .filter(([, valor]) =>
      valor !== undefined &&
      valor !== null &&
      String(valor).trim() !== ""
    )
    .map(([campo, valor]) => `
      <tr>
        <td>${escaparHtml(campo)}</td>
        <td>${escaparHtml(textoSeguro(valor))}</td>
      </tr>
    `)
    .join("");

  return `
    <div class="popup-pti">
      <h3>${escaparHtml(textoSeguro(pti.nombre))}</h3>
      <table class="tabla-popup">${filas}</table>
    </div>
  `;
}

export function agregarMarcadorPti(pti, opciones = {}) {
  const esMasCercano = opciones.esMasCercano === true;

  const marcador = L.circleMarker(
    [pti.latitud, pti.longitud],
    {
      radius: esMasCercano ? 9 : 7,
      color: "#ffffff",
      weight: esMasCercano ? 3 : 2,
      fillColor: esMasCercano ? "#f39c12" : "#138a46",
      fillOpacity: 1
    }
  ).addTo(mapa);

  marcador.bindTooltip(
    `${pti.nombre} · ${formatearDistancia(pti.distancia)}`,
    { direction: "top" }
  );

  marcador.bindPopup(crearTablaDatosPti(pti, true));
  marcadoresPti.push(marcador);

  return marcador;
}

export function dibujarLineaConexion(pti) {
  limpiarLineaConexion();

  if (!coordenadasSitioSeleccionado) return;

  lineaConexion = L.polyline(
    [
      coordenadasSitioSeleccionado,
      [pti.latitud, pti.longitud]
    ],
    {
      color: "#3f51b5",
      weight: 3,
      opacity: 0.85,
      dashArray: "8, 7"
    }
  ).addTo(mapa);

  lineaConexion.bindTooltip(
    formatearDistancia(pti.distancia),
    {
      permanent: true,
      direction: "center",
      className: "tooltip-distancia"
    }
  );
}

export function limpiarLineaConexion() {
  if (lineaConexion) {
    mapa.removeLayer(lineaConexion);
    lineaConexion = null;
  }
}

export function enfocarPti(pti, marcador) {
  mapa.setView([pti.latitud, pti.longitud], 18);
  marcador.openPopup();
  dibujarLineaConexion(pti);
}

export function volverAlSitio() {
  if (!coordenadasSitioSeleccionado) return;

  if (circuloBusqueda) {
    mapa.fitBounds(circuloBusqueda.getBounds(), {
      padding: [40, 40],
      maxZoom: 18
    });
    return;
  }

  mapa.setView(coordenadasSitioSeleccionado, 18);
}

export function dibujarRadioVivienda(coordenadas, radioMetros) {
  if (circuloVivienda) {
    mapa.removeLayer(circuloVivienda);
  }

  circuloVivienda = L.circle(coordenadas, {
    radius: radioMetros,
    color: "#008c95",
    weight: 2,
    opacity: 0.9,
    dashArray: "7, 6",
    fillColor: "#00a7b3",
    fillOpacity: 0.07
  }).addTo(mapa);

  return circuloVivienda;
}

export function mostrarViviendaEnMapa(vivienda) {
  limpiarResultadoViviendaMapa(false);

  if (!coordenadasSitioSeleccionado) return;

  marcadorVivienda = L.circleMarker(
    [vivienda.latitud, vivienda.longitud],
    {
      radius: 10,
      color: "#ffffff",
      weight: 3,
      fillColor: "#00a7b3",
      fillOpacity: 1
    }
  ).addTo(mapa);

  marcadorVivienda.bindPopup(`
    <h3>Construcción cercana</h3>
    <b>Tipo:</b> ${escaparHtml(textoSeguro(vivienda.tipoVisible))}<br>
    <b>Distancia al centro:</b> ${formatearDistancia(vivienda.distancia)}<br>
    <b>Fuente:</b> OpenStreetMap<br>
    <b>ID OSM:</b> ${escaparHtml(`${vivienda.tipoElemento}/${vivienda.id}`)}
  `);

  lineaVivienda = L.polyline(
    [
      coordenadasSitioSeleccionado,
      [vivienda.latitud, vivienda.longitud]
    ],
    {
      color: "#008c95",
      weight: 3,
      opacity: 0.9,
      dashArray: "5, 6"
    }
  ).addTo(mapa);

  lineaVivienda.bindTooltip(
    formatearDistancia(vivienda.distancia),
    {
      permanent: true,
      direction: "center",
      className: "tooltip-vivienda"
    }
  );

  mapa.fitBounds(
    L.latLngBounds([
      coordenadasSitioSeleccionado,
      [vivienda.latitud, vivienda.longitud]
    ]),
    {
      padding: [60, 60],
      maxZoom: 19
    }
  );

  marcadorVivienda.openPopup();
}

export function limpiarResultadoViviendaMapa(incluirCirculo = true) {
  if (marcadorVivienda) {
    mapa.removeLayer(marcadorVivienda);
    marcadorVivienda = null;
  }

  if (lineaVivienda) {
    mapa.removeLayer(lineaVivienda);
    lineaVivienda = null;
  }

  if (incluirCirculo && circuloVivienda) {
    mapa.removeLayer(circuloVivienda);
    circuloVivienda = null;
  }
}


export function reiniciarMapa() {
  limpiarMarcadoresPti();
  limpiarResultadoViviendaMapa(true);
  limpiarLineaConexion();

  if (marcadorSeleccionado) {
    mapa.removeLayer(marcadorSeleccionado);
    marcadorSeleccionado = null;
  }

  if (circuloBusqueda) {
    mapa.removeLayer(circuloBusqueda);
    circuloBusqueda = null;
  }

  coordenadasSitioSeleccionado = null;
  mapa.closePopup();

  mapa.flyTo(
    [-33.45, -70.66],
    5,
    {
      animate: true,
      duration: 0.9
    }
  );
}
