// ======================================================
// BUSCADOR WOM-PTI
// APLICACIÓN PRINCIPAL
// ======================================================

import {
    cargarSitios,
    cargarPti
} from "./data.js";

import {
    crearCapaSitios,
    crearCapaTodosPti,
    marcarSitioSeleccionado,
    dibujarCirculo,
    volverAlSitio
} from "./mapa.js";

import {
    elementos,
    mostrarMensaje,
    mostrarDetalleSitio,
    mostrarCargaPti,
    mostrarPtiCargados,
    mostrarErrorPti
} from "./ui.js";

import {
    actualizarResultadosPti
} from "./pti.js";

import {
    configurarAutocompletado
} from "./buscador.js";

import {
    exportarResultadosCsv
} from "./exportar.js";


// ------------------------------------------------------
// Estado general
// ------------------------------------------------------

const sitiosPorId = {};

let sitioSeleccionado = null;
let datosPti = [];
let resultadosActuales = null;


// ------------------------------------------------------
// Actualizar URL compartible
// ------------------------------------------------------

function actualizarUrl(id) {
    const url = new URL(
        window.location.href
    );

    if (id) {
        url.searchParams.set(
            "id",
            id
        );
    } else {
        url.searchParams.delete("id");
    }

    window.history.replaceState(
        {},
        "",
        url
    );
}


// ------------------------------------------------------
// Recalcular resultados PTI
// ------------------------------------------------------

function recalcularResultados() {
    if (
        !sitioSeleccionado ||
        datosPti.length === 0
    ) {
        resultadosActuales = null;
        elementos.botonExportar.disabled = true;

        return;
    }

    resultadosActuales =
        actualizarResultadosPti(
            sitioSeleccionado,
            datosPti,
            Number(
                elementos.inputRadio.value
            )
        );

    elementos.botonExportar.disabled =
        !resultadosActuales;
}


// ------------------------------------------------------
// Seleccionar sitio WOM
// ------------------------------------------------------

function seleccionarSitio(
    registroSitio
) {
    sitioSeleccionado =
        registroSitio;

    const propiedades =
        registroSitio.feature.properties || {};

    const coordenadas =
        registroSitio.layer.getLatLng();

    const radioMetros =
        Number(
            elementos.inputRadio.value
        );

    const id = String(
        propiedades.ID || ""
    )
        .trim()
        .toUpperCase();

    elementos.inputId.value =
        id;

    mostrarDetalleSitio(
        propiedades,
        coordenadas
    );

    marcarSitioSeleccionado(
        registroSitio
    );

    dibujarCirculo(
        coordenadas,
        radioMetros
    );

    recalcularResultados();

    elementos.botonVolverSitio.disabled =
        false;

    elementos.botonCopiarEnlace.disabled =
        false;

    actualizarUrl(id);

    mostrarMensaje(
        `Sitio ${id} encontrado.`,
        "exito"
    );
}


// ------------------------------------------------------
// Buscar por ID
// ------------------------------------------------------

function buscarPorId() {
    const consulta =
        elementos.inputId.value
            .trim()
            .toUpperCase();

    if (!consulta) {
        mostrarMensaje(
            "Escribe un ID, comuna o región " +
            "para realizar la búsqueda.",
            "error"
        );

        elementos.inputId.focus();

        return;
    }

    const registroExacto =
        sitiosPorId[consulta];

    if (registroExacto) {
        seleccionarSitio(
            registroExacto
        );

        return;
    }

    mostrarMensaje(
        `No existe una coincidencia exacta ` +
        `para ${consulta}. Usa las sugerencias.`,
        "error"
    );
}


// ------------------------------------------------------
// Cambiar radio
// ------------------------------------------------------

function actualizarRadio() {
    const radioMetros =
        Number(
            elementos.inputRadio.value
        );

    elementos.valorRadio.textContent =
        radioMetros;

    if (!sitioSeleccionado) {
        return;
    }

    dibujarCirculo(
        sitioSeleccionado.layer.getLatLng(),
        radioMetros
    );

    recalcularResultados();
}


// ------------------------------------------------------
// Exportar resultados
// ------------------------------------------------------

function exportarResultados() {
    if (
        !sitioSeleccionado ||
        !resultadosActuales
    ) {
        mostrarMensaje(
            "Primero selecciona un sitio.",
            "error"
        );

        return;
    }

    try {
        exportarResultadosCsv({
            sitio:
                sitioSeleccionado,

            radioMetros:
                Number(
                    elementos.inputRadio.value
                ),

            ptiMasCercano:
                resultadosActuales
                    .ptiMasCercano,

            ptiDentroDelRadio:
                resultadosActuales
                    .ptiDentroDelRadio
        });

        mostrarMensaje(
            "Archivo CSV generado correctamente.",
            "exito"
        );
    } catch (error) {
        console.error(error);

        mostrarMensaje(
            "No fue posible exportar " +
            "los resultados.",
            "error"
        );
    }
}


// ------------------------------------------------------
// Copiar enlace
// ------------------------------------------------------

async function copiarEnlace() {
    try {
        await navigator.clipboard.writeText(
            window.location.href
        );

        mostrarMensaje(
            "Enlace copiado al portapapeles.",
            "exito"
        );
    } catch (error) {
        console.error(error);

        mostrarMensaje(
            "No fue posible copiar el enlace. " +
            "Cópialo desde la barra del navegador.",
            "error"
        );
    }
}


// ------------------------------------------------------
// Abrir sitio desde URL
// ------------------------------------------------------

function abrirSitioDesdeUrl() {
    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id = String(
        parametros.get("id") || ""
    )
        .trim()
        .toUpperCase();

    if (!id) {
        return;
    }

    const registro =
        sitiosPorId[id];

    if (!registro) {
        mostrarMensaje(
            `El ID ${id} de la URL no existe.`,
            "error"
        );

        return;
    }

    seleccionarSitio(registro);
}


// ------------------------------------------------------
// Inicialización
// ------------------------------------------------------

async function iniciarAplicacion() {
    mostrarCargaPti();

    try {
        const geojson =
            await cargarSitios();

        const resultadoSitios =
            crearCapaSitios(
                geojson,
                seleccionarSitio
            );

        Object.assign(
            sitiosPorId,
            resultadoSitios.sitiosPorId
        );

        configurarAutocompletado({
            input:
                elementos.inputId,

            contenedor:
                elementos.sugerencias,

            obtenerRegistros:
                () => sitiosPorId,

            alSeleccionar:
                seleccionarSitio,

            limite: 10
        });

        mostrarMensaje(
            `${Object.keys(sitiosPorId).length} ` +
            `sitios cargados.`,
            "exito"
        );
    } catch (error) {
        console.error(
            "Error al cargar sitios:",
            error
        );

        mostrarMensaje(
            "No fue posible cargar " +
            "Sitios.geojson.",
            "error"
        );

        return;
    }

    try {
        datosPti =
            await cargarPti();

        mostrarPtiCargados(
            datosPti.length
        );

        crearCapaTodosPti(
            datosPti
        );
    } catch (error) {
        console.error(
            "Error al cargar PTI:",
            error
        );

        mostrarErrorPti(
            error.message ||
            "No fue posible cargar PTI.csv."
        );
    }

    abrirSitioDesdeUrl();
}


// ------------------------------------------------------
// Eventos
// ------------------------------------------------------

elementos.botonBuscar.addEventListener(
    "click",
    buscarPorId
);


elementos.inputId.addEventListener(
    "keydown",
    function(evento) {
        if (
            evento.key !== "Enter"
        ) {
            return;
        }

        const sugerenciaActiva =
            elementos.sugerencias.querySelector(
                ".sugerencia-item.activa"
            );

        if (!sugerenciaActiva) {
            buscarPorId();
        }
    }
);


elementos.inputRadio.addEventListener(
    "input",
    actualizarRadio
);


elementos.botonVolverSitio.addEventListener(
    "click",
    volverAlSitio
);


elementos.botonCopiarEnlace.addEventListener(
    "click",
    copiarEnlace
);


elementos.botonExportar.addEventListener(
    "click",
    exportarResultados
);


// ------------------------------------------------------
// Inicio
// ------------------------------------------------------

iniciarAplicacion();