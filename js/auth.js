const USUARIO_VALIDO = "OOEEWOM";
const CONTRASENA_VALIDA = "PTI2026";
const CLAVE_SESION = "buscadorWomPtiAutenticado";

const pantallaLogin = document.getElementById("pantalla-login");
const aplicacion = document.getElementById("aplicacion");
const formularioLogin = document.getElementById("form-login");
const inputUsuario = document.getElementById("login-usuario");
const inputContrasena = document.getElementById("login-contrasena");
const checkboxRecordar = document.getElementById("login-recordar");
const mensajeLogin = document.getElementById("mensaje-login");
const botonMostrarContrasena = document.getElementById("btn-mostrar-contrasena");
const botonCerrarSesion = document.getElementById("btn-cerrar-sesion");

let aplicacionIniciada = false;

function sesionActiva() {
  return (
    sessionStorage.getItem(CLAVE_SESION) === "true" ||
    localStorage.getItem(CLAVE_SESION) === "true"
  );
}

async function iniciarAplicacionPrincipal() {
  if (aplicacionIniciada) return;

  aplicacionIniciada = true;
  await import("./app.js");
}

async function mostrarAplicacion() {
  pantallaLogin.classList.add("login-oculto");
  aplicacion.classList.remove("aplicacion-bloqueada");

  try {
    await iniciarAplicacionPrincipal();
    window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
  } catch (error) {
    console.error(error);
    pantallaLogin.classList.remove("login-oculto");
    aplicacion.classList.add("aplicacion-bloqueada");
    mensajeLogin.textContent = "Ocurrió un error al iniciar la aplicación.";
    mensajeLogin.className = "mensaje-login error-login";
  }
}

function guardarSesion(recordar) {
  sessionStorage.removeItem(CLAVE_SESION);
  localStorage.removeItem(CLAVE_SESION);

  if (recordar) {
    localStorage.setItem(CLAVE_SESION, "true");
  } else {
    sessionStorage.setItem(CLAVE_SESION, "true");
  }
}

formularioLogin.addEventListener("submit", async evento => {
  evento.preventDefault();

  if (
    inputUsuario.value.trim() !== USUARIO_VALIDO ||
    inputContrasena.value !== CONTRASENA_VALIDA
  ) {
    mensajeLogin.textContent = "Usuario o contraseña incorrectos.";
    mensajeLogin.className = "mensaje-login error-login";
    inputContrasena.value = "";
    inputContrasena.focus();
    return;
  }

  mensajeLogin.textContent = "";
  guardarSesion(checkboxRecordar.checked);
  await mostrarAplicacion();
});

botonMostrarContrasena.addEventListener("click", () => {
  const mostrar = inputContrasena.type === "password";
  inputContrasena.type = mostrar ? "text" : "password";
  botonMostrarContrasena.textContent = mostrar ? "Ocultar" : "Mostrar";
});

botonCerrarSesion.addEventListener("click", () => {
  sessionStorage.removeItem(CLAVE_SESION);
  localStorage.removeItem(CLAVE_SESION);
  window.location.reload();
});

if (sesionActiva()) {
  mostrarAplicacion();
} else {
  inputUsuario.focus();
}
