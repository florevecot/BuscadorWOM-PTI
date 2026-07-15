import {
  escaparHtml,
  normalizarTexto
} from "./utilidades.js";

export function configurarAutocompletado({
  input,
  contenedor,
  obtenerRegistros,
  alSeleccionar,
  limite = 10
}) {
  let resultadosActuales = [];
  let indiceActivo = -1;

  function cerrarSugerencias() {
    contenedor.innerHTML = "";
    contenedor.classList.add("oculto");
    resultadosActuales = [];
    indiceActivo = -1;
  }

  function seleccionarIndice(indice) {
    if (indice < 0 || indice >= resultadosActuales.length) return;

    const resultado = resultadosActuales[indice];
    input.value = resultado.id;
    cerrarSugerencias();
    alSeleccionar(resultado.registro);
  }

  function actualizarElementoActivo() {
    const items = contenedor.querySelectorAll(".sugerencia-item[data-indice]");

    items.forEach((item, indice) => {
      item.classList.toggle("activa", indice === indiceActivo);
    });

    items[indiceActivo]?.scrollIntoView({ block: "nearest" });
  }

  function renderizarSugerencias(resultados) {
    resultadosActuales = resultados;
    indiceActivo = -1;

    if (resultados.length === 0) {
      contenedor.innerHTML = `<div class="sugerencia-item">Sin coincidencias</div>`;
      contenedor.classList.remove("oculto");
      return;
    }

    contenedor.innerHTML = resultados
      .map((resultado, indice) => {
        const p = resultado.registro.feature.properties || {};
        const contexto = [p["Comuna"], p["Región"]].filter(Boolean).join(" · ");

        return `
          <div class="sugerencia-item" data-indice="${indice}">
            <div class="sugerencia-id">${escaparHtml(resultado.id)}</div>
            <div class="sugerencia-contexto">${escaparHtml(contexto || "Sin información territorial")}</div>
          </div>
        `;
      })
      .join("");

    contenedor.classList.remove("oculto");

    contenedor
      .querySelectorAll(".sugerencia-item[data-indice]")
      .forEach(item => {
        item.addEventListener("mousedown", evento => {
          evento.preventDefault();
          seleccionarIndice(Number(item.dataset.indice));
        });
      });
  }

  function buscarCoincidencias() {
    const consulta = normalizarTexto(input.value);

    if (!consulta) {
      cerrarSugerencias();
      return;
    }

    const resultados = Object.entries(obtenerRegistros())
      .filter(([id, registro]) => {
        const p = registro.feature.properties || {};

        return [id, p["Comuna"], p["Región"]].some(valor =>
          normalizarTexto(valor).includes(consulta)
        );
      })
      .sort((a, b) => {
        const aComienza = normalizarTexto(a[0]).startsWith(consulta);
        const bComienza = normalizarTexto(b[0]).startsWith(consulta);

        if (aComienza && !bComienza) return -1;
        if (!aComienza && bComienza) return 1;
        return a[0].localeCompare(b[0]);
      })
      .slice(0, limite)
      .map(([id, registro]) => ({ id, registro }));

    renderizarSugerencias(resultados);
  }

  input.addEventListener("input", buscarCoincidencias);

  input.addEventListener("keydown", evento => {
    const estaOculto = contenedor.classList.contains("oculto");

    if (evento.key === "Escape" && !estaOculto) {
      cerrarSugerencias();
      return;
    }

    if (estaOculto || resultadosActuales.length === 0) return;

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      indiceActivo = Math.min(indiceActivo + 1, resultadosActuales.length - 1);
      actualizarElementoActivo();
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      indiceActivo = Math.max(indiceActivo - 1, 0);
      actualizarElementoActivo();
    } else if (evento.key === "Enter" && indiceActivo >= 0) {
      evento.preventDefault();
      seleccionarIndice(indiceActivo);
    }
  });

  input.addEventListener("blur", () => {
    window.setTimeout(cerrarSugerencias, 150);
  });
}
