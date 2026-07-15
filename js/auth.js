// ======================================================
// AUTENTICACIÓN BÁSICA — BUSCADOR WOM-PTI
// ======================================================

// Esta autenticación ocurre en el navegador.
// No debe considerarse seguridad profesional.

const USUARIO_VALIDO = "OOEEWOM";
const CONTRASENA_VALIDA = "PTI2026";

const CLAVE_SESION = "buscadorWomPtiAutenticado";

const pantallaLogin =
    document.getElementById("pantalla-login");

const aplicacion =
    document.getElementById("aplicacion");

const formularioLogin =
    document.getElementById("form-login");

const inputUsuario =
    document.getElementById("login-usuario");

const inputContrasena =
    document.getElementById("login-contrasena");

const checkboxRecordar =
    document.getElementById("login-recordar");

const mensajeLogin =
    document.getElementById("mensaje-login");

const botonMostrarContrasena =
    document.getElementById("btn-mostrar-contrasena");

const botonCerrarSesion =
    document.getElementById("btn-cerrar-sesion");

let aplicacionIniciada = false;


// ------------------------------------------------------
// Revisar sesión guardada
// ------------------------------------------------------

function sesionActiva() {
    return (
        sessionStorage.getItem(CLAVE_SESION) === "true" ||
        localStorage.getItem(CLAVE_SESION) === "true"
    );
}


// ------------------------------------------------------
// Cargar aplicación principal
// ------------------------------------------------------

async function iniciarAplicacionPrincipal() {
    if (aplicacionIniciada) {
        return;
    }

    aplicacionIniciada = true;

    try {
        await import("./app.js");
    } catch (error) {
        console.error(
            "No fue posible iniciar la aplicación:",
            error
        );

        mensajeLogin.textContent =
            "Ocurrió un error al iniciar la aplicación.";

        mensajeLogin.className =
            "mensaje-login error-login";
    }
}


// ------------------------------------------------------
// Mostrar aplicación
// ------------------------------------------------------

async function mostrarAplicacion() {
    pantallaLogin.classList.add("login-oculto");
    aplicacion.classList.remove("aplicacion-bloqueada");

    await iniciarAplicacionPrincipal();

    // Leaflet necesita recalcular el tamaño después
    // de que el mapa deja de estar oculto.
    window.setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
    }, 150);
}


// ------------------------------------------------------
// Mostrar login
// ------------------------------------------------------

function mostrarLogin() {
    aplicacion.classList.add("aplicacion-bloqueada");
    pantallaLogin.classList.remove("login-oculto");

    inputUsuario.focus();
}


// ------------------------------------------------------
// Guardar sesión
// ------------------------------------------------------

function guardarSesion(recordar) {
    sessionStorage.removeItem(CLAVE_SESION);
    localStorage.removeItem(CLAVE_SESION);

    if (recordar) {
        localStorage.setItem(CLAVE_SESION, "true");
    } else {
        sessionStorage.setItem(CLAVE_SESION, "true");
    }
}


// ------------------------------------------------------
// Procesar login
// ------------------------------------------------------

formularioLogin.addEventListener(
    "submit",
    async function(evento) {
        evento.preventDefault();

        const usuario =
            inputUsuario.value.trim();

        const contrasena =
            inputContrasena.value;

        const usuarioCorrecto =
            usuario === USUARIO_VALIDO;

        const contrasenaCorrecta =
            contrasena === CONTRASENA_VALIDA;

        if (!usuarioCorrecto || !contrasenaCorrecta) {
            mensajeLogin.textContent =
                "Usuario o contraseña incorrectos.";

            mensajeLogin.className =
                "mensaje-login error-login";

            inputContrasena.value = "";
            inputContrasena.focus();

            return;
        }

        mensajeLogin.textContent = "";
        mensajeLogin.className = "mensaje-login";

        guardarSesion(
            checkboxRecordar.checked
        );

        await mostrarAplicacion();
    }
);


// ------------------------------------------------------
// Mostrar u ocultar contraseña
// ------------------------------------------------------

botonMostrarContrasena.addEventListener(
    "click",
    function() {
        const mostrar =
            inputContrasena.type === "password";

        inputContrasena.type =
            mostrar ? "text" : "password";

        botonMostrarContrasena.textContent =
            mostrar ? "Ocultar" : "Mostrar";

        botonMostrarContrasena.setAttribute(
            "aria-label",
            mostrar
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
        );
    }
);


// ------------------------------------------------------
// Cerrar sesión
// ------------------------------------------------------

botonCerrarSesion.addEventListener(
    "click",
    function() {
        sessionStorage.removeItem(CLAVE_SESION);
        localStorage.removeItem(CLAVE_SESION);

        // Recargar limpia completamente el mapa y sus capas.
        window.location.reload();
    }
);


// ------------------------------------------------------
// Inicio
// ------------------------------------------------------

if (sesionActiva()) {
    mostrarAplicacion();
} else {
    mostrarLogin();
}