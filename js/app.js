// ======================================================
// ANÁLISIS MASIVO DE SITIOS WOM
// ======================================================
console.log("APP.JS INICIADO - V11");
import {
    calcularDistanciaMetros
} from "./utilidades.js";

import {
    buscarViviendaMasCercana
} from "./viviendas.js";


let cancelarSolicitado = false;
let resultadosMasivos = [];


// ------------------------------------------------------
// Espera entre consultas
// ------------------------------------------------------

function esperar(milisegundos) {
    return new Promise(resolve => {
        window.setTimeout(
            resolve,
            milisegundos
        );
    });
}


// ------------------------------------------------------
// Formato compatible con Excel Chile
// ------------------------------------------------------

function formatearNumeroChile(
    valor,
    decimales = 6
) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "";
    }

    return numero
        .toFixed(decimales)
        .replace(".", ",");
}


// ------------------------------------------------------
// Escapar valores CSV
// ------------------------------------------------------

function escaparCsv(valor) {
    const texto = String(
        valor ?? ""
    );

    return `"${texto.replaceAll('"', '""')}"`;
}


// ------------------------------------------------------
// Calcular PTI más cercano
// ------------------------------------------------------

function obtenerPtiMasCercano(
    coordenadasSitio,
    datosPti
) {
    if (
        !Array.isArray(datosPti) ||
        datosPti.length === 0
    ) {
        return null;
    }

    let masCercano = null;

    for (const pti of datosPti) {
        const distancia =
            calcularDistanciaMetros(
                coordenadasSitio.lat,
                coordenadasSitio.lng,
                pti.latitud,
                pti.longitud
            );

        if (
            !masCercano ||
            distancia < masCercano.distancia
        ) {
            masCercano = {
                ...pti,
                distancia
            };
        }
    }

    return masCercano;
}


// ------------------------------------------------------
// Buscar vivienda con reintentos
// ------------------------------------------------------

async function buscarViviendaConReintentos(
    latitud,
    longitud,
    radioMetros,
    maxIntentos = 2
) {
    let ultimoError = null;

    for (
        let intento = 1;
        intento <= maxIntentos;
        intento += 1
    ) {
        try {
            return await buscarViviendaMasCercana(
                latitud,
                longitud,
                radioMetros
            );
        } catch (error) {
            ultimoError = error;

            if (intento < maxIntentos) {
                await esperar(1800);
            }
        }
    }

    throw ultimoError;
}


// ------------------------------------------------------
// Cancelar análisis
// ------------------------------------------------------

export function cancelarAnalisisMasivo() {
    cancelarSolicitado = true;
}


// ------------------------------------------------------
// Recuperar resultados
// ------------------------------------------------------

export function obtenerResultadosMasivos() {
    return [
        ...resultadosMasivos
    ];
}


// ------------------------------------------------------
// Ejecutar análisis masivo
// ------------------------------------------------------

export async function ejecutarAnalisisMasivo({
    sitiosPorId,
    datosPti,
    radioPti,
    radioVivienda,
    alProgreso
}) {
    cancelarSolicitado = false;
    resultadosMasivos = [];

    const registros =
        Object.entries(
            sitiosPorId || {}
        );

    let errores = 0;

    for (
        let indice = 0;
        indice < registros.length;
        indice += 1
    ) {
        if (cancelarSolicitado) {
            break;
        }

        const [
            id,
            registro
        ] = registros[indice];

        const propiedades =
            registro.feature.properties || {};

        const coordenadas =
            registro.layer.getLatLng();


        // ----------------------------------------------
        // Calcular PTI más cercano
        // ----------------------------------------------

        alProgreso?.({
            procesados: indice,
            total: registros.length,
            idSitio: id,
            etapa: "Calculando PTI"
        });

        const pti =
            obtenerPtiMasCercano(
                coordenadas,
                datosPti
            );


        // ----------------------------------------------
        // Buscar vivienda o edificio cercano
        // ----------------------------------------------

        let vivienda = null;

        let estadoVivienda =
            "Sin edificio dentro del radio";

        let errorVivienda = "";

        alProgreso?.({
            procesados: indice,
            total: registros.length,
            idSitio: id,
            etapa: "Consultando vivienda"
        });

        try {
            vivienda =
                await buscarViviendaConReintentos(
                    coordenadas.lat,
                    coordenadas.lng,
                    radioVivienda,
                    2
                );

            if (vivienda) {
                estadoVivienda =
                    vivienda.metodo === "ampliada"
                        ? "Edificio encontrado con búsqueda ampliada"
                        : "Vivienda residencial encontrada";
            }
        } catch (error) {
            errores += 1;

            estadoVivienda =
                "Error de consulta";

            errorVivienda =
                error?.message ||
                "Error desconocido";
        }


        // ----------------------------------------------
        // Guardar resultado
        // ----------------------------------------------

        resultadosMasivos.push({
            idSitio: id,

            region:
                propiedades["Región"] || "",

            comuna:
                propiedades["Comuna"] || "",

            proyecto:
                propiedades[
                    "Proyecto unico Portafolio"
                ] || "",

            etapaOoee:
                propiedades["Etapa OOEE"] || "",

            estadoContrato:
                propiedades[
                    "Estatus Contrato"
                ] || "",

            latitudSitio:
                coordenadas.lat,

            longitudSitio:
                coordenadas.lng,


            // PTI
            radioPti,

            nombrePti:
                pti?.nombre || "",

            distanciaPti:
                pti?.distancia ?? NaN,

            ptiDentroRadio:
                pti &&
                pti.distancia <= radioPti
                    ? "Sí"
                    : "No",

            latitudPti:
                pti?.latitud ?? NaN,

            longitudPti:
                pti?.longitud ?? NaN,


            // Vivienda
            radioVivienda,

            tipoVivienda:
                vivienda?.tipoVisible || "",

            tipoBuilding:
                vivienda?.tipoBuilding || "",

            distanciaVivienda:
                vivienda?.distancia ?? NaN,

            viviendaDentroRadio:
                vivienda
                    ? "Sí"
                    : "No",

            metodoVivienda:
                vivienda?.metodo || "",

            latitudVivienda:
                vivienda?.latitud ?? NaN,

            longitudVivienda:
                vivienda?.longitud ?? NaN,

            idOsm:
                vivienda
                    ? (
                        `${vivienda.tipoElemento}/` +
                        `${vivienda.id}`
                    )
                    : "",

            estadoVivienda,

            errorVivienda
        });


        // ----------------------------------------------
        // Actualizar progreso
        // ----------------------------------------------

        alProgreso?.({
            procesados:
                indice + 1,

            total:
                registros.length,

            idSitio:
                id,

            etapa:
                "Sitio completado"
        });


        // Pausa para no saturar Overpass.
        if (
            indice < registros.length - 1 &&
            !cancelarSolicitado
        ) {
            await esperar(1200);
        }
    }


    return {
        resultados: [
            ...resultadosMasivos
        ],

        errores,

        cancelado:
            cancelarSolicitado,

        totalEsperado:
            registros.length
    };
}


// ------------------------------------------------------
// Descargar CSV masivo
// ------------------------------------------------------

export function descargarAnalisisMasivoCsv(
    resultados
) {
    if (
        !Array.isArray(resultados) ||
        resultados.length === 0
    ) {
        throw new Error(
            "No existen resultados masivos para descargar."
        );
    }


    const encabezados = [
        "ID sitio WOM",
        "Región",
        "Comuna",
        "Proyecto",
        "Etapa OOEE",
        "Estado contrato",
        "Latitud sitio WOM",
        "Longitud sitio WOM",

        "Radio PTI (m)",
        "PTI más cercano",
        "Distancia PTI (m)",
        "PTI dentro del radio",
        "Latitud PTI",
        "Longitud PTI",

        "Radio vivienda (m)",
        "Vivienda/edificio más cercano",
        "Tipo building OSM",
        "Distancia vivienda/edificio (m)",
        "Vivienda/edificio dentro del radio",
        "Método búsqueda vivienda",
        "Latitud vivienda/edificio",
        "Longitud vivienda/edificio",
        "ID OSM",
        "Estado análisis vivienda",
        "Detalle error"
    ];


    const filas = [
        encabezados
    ];


    resultados.forEach(resultado => {
        filas.push([
            resultado.idSitio,
            resultado.region,
            resultado.comuna,
            resultado.proyecto,
            resultado.etapaOoee,
            resultado.estadoContrato,

            formatearNumeroChile(
                resultado.latitudSitio
            ),

            formatearNumeroChile(
                resultado.longitudSitio
            ),

            resultado.radioPti,

            resultado.nombrePti,

            Number.isFinite(
                resultado.distanciaPti
            )
                ? Math.round(
                    resultado.distanciaPti
                )
                : "",

            resultado.ptiDentroRadio,

            formatearNumeroChile(
                resultado.latitudPti
            ),

            formatearNumeroChile(
                resultado.longitudPti
            ),

            resultado.radioVivienda,

            resultado.tipoVivienda,

            resultado.tipoBuilding,

            Number.isFinite(
                resultado.distanciaVivienda
            )
                ? Math.round(
                    resultado.distanciaVivienda
                )
                : "",

            resultado.viviendaDentroRadio,

            resultado.metodoVivienda,

            formatearNumeroChile(
                resultado.latitudVivienda
            ),

            formatearNumeroChile(
                resultado.longitudVivienda
            ),

            resultado.idOsm,

            resultado.estadoVivienda,

            resultado.errorVivienda
        ]);
    });


    const contenido =
        filas
            .map(fila =>
                fila
                    .map(escaparCsv)
                    .join(";")
            )
            .join("\r\n");


    const blob = new Blob(
        [
            "\uFEFF",
            contenido
        ],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );


    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");


    const fecha =
        new Date()
            .toISOString()
            .slice(0, 10);


    enlace.href = url;

    enlace.download =
        `Analisis_completo_WOM_` +
        `PTI_viviendas_${fecha}.csv`;


    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(url);
}
