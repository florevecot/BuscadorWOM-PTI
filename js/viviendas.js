import {
  calcularDistanciaMetros
} from "./utilidades.js";

const ENDPOINTS_OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

const TIPOS_RESIDENCIALES = [
  "house",
  "residential",
  "apartments",
  "detached",
  "semidetached_house",
  "terrace",
  "bungalow",
  "cabin",
  "static_caravan"
];

const cache = new Map();

function crearConsulta(latitud, longitud, radioMetros, modo) {
  const filtro = modo === "residencial"
    ? `["building"~"^(${TIPOS_RESIDENCIALES.join("|")})$"]`
    : `["building"]`;

  return `
    [out:json][timeout:25];
    (
      nwr(around:${radioMetros},${latitud},${longitud})${filtro};
    );
    out center tags;
  `;
}

async function consultarEndpoint(endpoint, consulta) {
  const controlador = new AbortController();
  const temporizador = window.setTimeout(
    () => controlador.abort(),
    30000
  );

  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: new URLSearchParams({ data: consulta }),
      signal: controlador.signal
    });

    if (!respuesta.ok) {
      throw new Error(`Overpass respondió HTTP ${respuesta.status}`);
    }

    return await respuesta.json();
  } finally {
    window.clearTimeout(temporizador);
  }
}

async function consultarOverpass(consulta) {
  let ultimoError = null;

  for (const endpoint of ENDPOINTS_OVERPASS) {
    try {
      return await consultarEndpoint(endpoint, consulta);
    } catch (error) {
      ultimoError = error;
      console.warn(`Falló ${endpoint}:`, error);
    }
  }

  throw ultimoError || new Error("No fue posible consultar Overpass API.");
}

function obtenerCoordenadasElemento(elemento) {
  if (
    Number.isFinite(elemento.lat) &&
    Number.isFinite(elemento.lon)
  ) {
    return {
      latitud: elemento.lat,
      longitud: elemento.lon
    };
  }

  if (
    Number.isFinite(elemento.center?.lat) &&
    Number.isFinite(elemento.center?.lon)
  ) {
    return {
      latitud: elemento.center.lat,
      longitud: elemento.center.lon
    };
  }

  return null;
}

function transformarResultados(
  elementos,
  latitudSitio,
  longitudSitio,
  radioMetros,
  metodo
) {
  return (elementos || [])
    .map(elemento => {
      const coordenadas = obtenerCoordenadasElemento(elemento);

      if (!coordenadas) return null;

      const tipoBuilding = elemento.tags?.building || "building";

      return {
        id: elemento.id,
        tipoElemento: elemento.type,
        latitud: coordenadas.latitud,
        longitud: coordenadas.longitud,
        distancia: calcularDistanciaMetros(
          latitudSitio,
          longitudSitio,
          coordenadas.latitud,
          coordenadas.longitud
        ),
        tipoBuilding,
        tipoVisible:
          elemento.tags?.name ||
          elemento.tags?.["addr:housename"] ||
          elemento.tags?.["addr:housenumber"] ||
          tipoBuilding,
        tags: elemento.tags || {},
        radioMetros,
        metodo
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distancia - b.distancia);
}

async function ejecutarModo(
  latitud,
  longitud,
  radioMetros,
  modo
) {
  const clave = [
    latitud.toFixed(6),
    longitud.toFixed(6),
    radioMetros,
    modo
  ].join("|");

  if (cache.has(clave)) {
    return cache.get(clave);
  }

  const consulta = crearConsulta(
    latitud,
    longitud,
    radioMetros,
    modo
  );

  const respuesta = await consultarOverpass(consulta);

  const resultados = transformarResultados(
    respuesta.elements,
    latitud,
    longitud,
    radioMetros,
    modo === "residencial" ? "residencial" : "ampliada"
  );

  cache.set(clave, resultados);
  return resultados;
}

export async function buscarViviendaMasCercana(
  latitud,
  longitud,
  radioMetros
) {
  const residenciales = await ejecutarModo(
    latitud,
    longitud,
    radioMetros,
    "residencial"
  );

  if (residenciales.length > 0) {
    return residenciales[0];
  }

  const ampliados = await ejecutarModo(
    latitud,
    longitud,
    radioMetros,
    "ampliada"
  );

  return ampliados[0] || null;
}

export function limpiarCacheViviendas() {
  cache.clear();
}
