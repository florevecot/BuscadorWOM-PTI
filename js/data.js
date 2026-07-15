import {
  convertirNumero,
  encontrarNombreColumna,
  textoSeguro
} from "./utilidades.js";

export async function cargarSitios() {
  const respuesta = await fetch("data/Sitios.geojson");

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar Sitios.geojson. HTTP ${respuesta.status}`);
  }

  const geojson = await respuesta.json();

  if (!geojson || geojson.type !== "FeatureCollection") {
    throw new Error("Sitios.geojson no es un FeatureCollection válido.");
  }

  return geojson;
}

export function cargarPti() {
  return new Promise((resolve, reject) => {
    Papa.parse("data/PTI.csv", {
      download: true,
      header: true,
      skipEmptyLines: "greedy",

      complete(resultado) {
        try {
          const filas = resultado.data || [];

          if (filas.length === 0) {
            throw new Error("PTI.csv está vacío.");
          }

          const columnas = Object.keys(filas[0]);

          const columnaNombre = encontrarNombreColumna(
            columnas,
            ["Nombre", "Name", "PTI", "Sitio"]
          );

          const columnaLatitud = encontrarNombreColumna(
            columnas,
            ["Latitud", "Latitude", "Lat"]
          );

          const columnaLongitud = encontrarNombreColumna(
            columnas,
            ["Longitud", "Longuitud", "Longitude", "Lon", "Lng"]
          );

          if (!columnaNombre || !columnaLatitud || !columnaLongitud) {
            throw new Error(
              `No se encontraron las columnas requeridas. Columnas detectadas: ${columnas.join(", ")}`
            );
          }

          const datos = filas
            .map(fila => ({
              nombre: textoSeguro(fila[columnaNombre]),
              latitud: convertirNumero(fila[columnaLatitud]),
              longitud: convertirNumero(fila[columnaLongitud]),
              datosOriginales: fila
            }))
            .filter(pti =>
              Number.isFinite(pti.latitud) &&
              Number.isFinite(pti.longitud)
            );

          if (datos.length === 0) {
            throw new Error("PTI.csv no contiene coordenadas válidas.");
          }

          resolve(datos);
        } catch (error) {
          reject(error);
        }
      },

      error(error) {
        reject(error);
      }
    });
  });
}
