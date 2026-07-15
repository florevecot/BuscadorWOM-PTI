function escaparCsv(valor) {
  const texto = String(valor ?? "");
  return `"${texto.replaceAll('"', '""')}"`;
}

export function exportarResultadosCsv({
  sitio,
  radioMetros,
  ptiMasCercano,
  ptiDentroDelRadio
}) {
  if (!sitio || !ptiMasCercano) {
    throw new Error("No existen resultados para exportar.");
  }

  const p = sitio.feature.properties || {};
  const coordenadasSitio = sitio.layer.getLatLng();

  const columnasBase = [
    "ID sitio WOM",
    "Región",
    "Comuna",
    "Latitud sitio WOM",
    "Longitud sitio WOM",
    "Radio utilizado (m)",
    "Nombre PTI",
    "Distancia (m)",
    "Dentro del radio",
    "Latitud PTI",
    "Longitud PTI"
  ];

  const columnasExtra = Array.from(
    new Set(
      [ptiMasCercano, ...ptiDentroDelRadio]
        .flatMap(pti => Object.keys(pti.datosOriginales || {}))
    )
  );

  const filas = [[...columnasBase, ...columnasExtra]];

  const resultados = ptiDentroDelRadio.length > 0
    ? ptiDentroDelRadio
    : [ptiMasCercano];

  resultados.forEach(pti => {
    filas.push([
      p.ID || "",
      p["Región"] || "",
      p["Comuna"] || "",
      coordenadasSitio.lat,
      coordenadasSitio.lng,
      radioMetros,
      pti.nombre || "",
      Math.round(pti.distancia),
      pti.distancia <= radioMetros ? "Sí" : "No",
      pti.latitud,
      pti.longitud,
      ...columnasExtra.map(columna => pti.datosOriginales?.[columna] ?? "")
    ]);
  });

  const contenido = filas
    .map(fila => fila.map(escaparCsv).join(";"))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF", contenido],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = `Resultados_${p.ID || "WOM"}_${radioMetros}m.csv`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
