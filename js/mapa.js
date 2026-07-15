// Mapa y capas Leaflet

import { crearContenidoSitio } from "./ui.js";
import {
  escaparHtml,
  textoSeguro,
  formatearDistancia
} from "./utilidades.js";

export const mapa = L.map("map", {
  zoomControl: true
}).setView([-33.45, -70.66], 5);

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

L.control.layers(
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

const controlLeyenda = L.control({ position: "bottomright" });

controlLeyenda.onAdd = function () {
  const div = L.DomUtil.create("div", "leyenda-mapa");

  div.innerHTML = `
    <strong>Leyenda</strong>
    <div><span class="punto-leyenda punto-wom"></span>Sitio WOM</div>
    <div><span class="punto-leyenda punto-sitio"></span>Sitio seleccionado</div>
    <div><span class="punto-leyenda punto-pti"></span>PTI dentro del radio</div>
    <div><span class="punto-leyenda punto-cercano"></span>PTI más cercano</div>
  `;

  return div;
};

controlLeyenda.addTo(mapa);

export function crearCapaSitios(geojson, alSeleccionar) {
  const sitiosPorId = {};

  const capa = L.geoJSON(geojson, {
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

      layer.on("click", () => {
        alSeleccionar({ feature, layer });
      });
    }
  });

  capa.addTo(mapa);

  if (capa.getBounds().isValid()) {
    mapa.fitBounds(capa.getBounds());
  }

  return { capa, sitiosPorId };
}

export function marcarSitioSeleccionado(registroSitio) {
  coordenadasSitioSeleccionado = registroSitio.layer.getLatLng();

  if (marcadorSeleccionado) {
    mapa.removeLayer(marcadorSeleccionado);
  }

  limpiarLineaConexion();

  marcadorSeleccionado = L.circleMarker(
    coordenadasSitioSeleccionado,
    {
      radius: 10,
      color: "#ffffff",
      weight: 3,
      fillColor: "#d00000",
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
  marcadoresPti.forEach(marcador => {
    mapa.removeLayer(marcador);
  });

  marcadoresPti = [];
  limpiarLineaConexion();
}

function crearTablaDatosPti(pti) {
  const datos = {
    ...pti.datosOriginales,
    "Distancia calculada": formatearDistancia(pti.distancia)
  };

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

  marcador.bindPopup(crearTablaDatosPti(pti));
  marcadoresPti.push(marcador);

  return marcador;
}

export function dibujarLineaConexion(pti) {
  limpiarLineaConexion();

  if (!coordenadasSitioSeleccionado) {
    return;
  }

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
  if (!coordenadasSitioSeleccionado) {
    return;
  }

  if (circuloBusqueda) {
    mapa.fitBounds(circuloBusqueda.getBounds(), {
      padding: [40, 40],
      maxZoom: 18
    });
    return;
  }

  mapa.setView(coordenadasSitioSeleccionado, 18);
}
