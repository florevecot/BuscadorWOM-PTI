export function textoSeguro(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === "") {
    return "Sin información";
  }
  return String(valor);
}

export function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function convertirNumero(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === "") {
    return NaN;
  }

  return Number(
    String(valor)
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".")
  );
}

export function encontrarNombreColumna(columnas, posiblesNombres) {
  for (const columna of columnas) {
    const normalizada = normalizarTexto(columna);

    for (const posible of posiblesNombres) {
      if (normalizada === normalizarTexto(posible)) {
        return columna;
      }
    }
  }

  return null;
}

export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const radioTierra = 6371000;
  const aRadianes = grados => grados * Math.PI / 180;

  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const lat1Rad = aRadianes(lat1);
  const lat2Rad = aRadianes(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) *
    Math.cos(lat2Rad) *
    Math.sin(dLon / 2) ** 2;

  return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatearDistancia(metros) {
  if (!Number.isFinite(metros)) {
    return "Sin información";
  }

  if (metros >= 1000) {
    return `${(metros / 1000).toFixed(2)} km`;
  }

  return `${Math.round(metros)} m`;
}
