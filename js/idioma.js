/* =========================================================
   SELECTOR DE IDIOMA (GOOGLE TRANSLATE)
   ========================================================= */

// Código de idioma -> código de país para la bandera (flagcdn.com)
const BANDERAS_IDIOMA = {
    es: "es",
    en: "gb",
    fr: "fr",
    de: "de",
    it: "it"
};

function rutaBandera(lang) {
    const pais = BANDERAS_IDIOMA[lang] || "es";
    return `https://flagcdn.com/24x18/${pais}.png`;
}

// Callback que exige el script de Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: "es",
            includedLanguages: "es,en,fr,de,it",
            autoDisplay: false
        },
        "google_translate_element"
    );
}

function obtenerIdiomaActual() {
    const match = document.cookie.match(/googtrans=\/es\/([a-zA-Z-]+)/);
    return match ? match[1] : "es";
}

function establecerCookieIdioma(lang) {
    const valor = `/es/${lang}`;
    document.cookie = `googtrans=${valor}; path=/`;
    document.cookie = `googtrans=${valor}; domain=.${location.hostname}; path=/`;
}

function borrarCookieIdioma() {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${location.hostname}; path=/;`;
}

function cambiarIdioma(lang) {
    if (lang === "es") {
        // Restaurar el idioma original (español)
        borrarCookieIdioma();
    } else {
        establecerCookieIdioma(lang);
    }
    // Marcamos que el usuario ya ha elegido idioma de forma manual,
    // para que la detección automática no vuelva a intervenir nunca más.
    localStorage.setItem("idiomaConfigurado", "true");
    location.reload();
}

/* =========================================================
   DETECCIÓN AUTOMÁTICA DEL IDIOMA DEL NAVEGADOR
   Solo se ejecuta la primera vez que alguien visita la web
   (o si nunca ha elegido idioma manualmente ni tiene cookie).
   Si el idioma del navegador no está entre los soportados,
   se usa inglés por defecto.
   ========================================================= */

function detectarIdiomaNavegador() {
    const idiomasSoportados = ["es", "en", "fr", "de", "it"];
    const idiomaCrudo = (navigator.language || navigator.userLanguage || "es");
    const idiomaNavegador = idiomaCrudo.slice(0, 2).toLowerCase();
    return idiomasSoportados.includes(idiomaNavegador) ? idiomaNavegador : "en";
}

function inicializarIdiomaPorDefecto() {
    // Si ya se gestionó antes (auto o manualmente), no volvemos a tocar nada:
    // respetamos el estado actual (incluida la elección de volver a Español).
    const yaConfigurado = localStorage.getItem("idiomaConfigurado");
    if (yaConfigurado) return;

    const idiomaDetectado = detectarIdiomaNavegador();

    // Si el navegador está en español no hace falta cookie,
    // la web ya está en español de serie.
    if (idiomaDetectado !== "es") {
        establecerCookieIdioma(idiomaDetectado);
    }

    localStorage.setItem("idiomaConfigurado", "true");
}

// Se ejecuta inmediatamente (antes de que se inicialice el widget de
// Google Translate) para que la cookie ya esté puesta cuando el script
// de Google traduzca la página, evitando parpadeos o recargas extra.
inicializarIdiomaPorDefecto();

// ── Elimina por la fuerza la barra superior que inyecta Google Translate ──
// Google añade dinámicamente un iframe y desplaza el body con "top: 40px".
// Como lo hace después de que se cargue nuestro CSS, forzamos su eliminación
// de forma continua para que nunca llegue a mostrarse.
function bloquearBarraGoogle() {

    // Quita el desplazamiento que Google aplica al body/html
    if (document.body && document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
    }
    if (document.documentElement && document.documentElement.style.top && document.documentElement.style.top !== "0px") {
        document.documentElement.style.top = "0px";
    }

    // Oculta el iframe de la barra si llega a existir
    document
        .querySelectorAll("iframe.goog-te-banner-frame, .goog-te-banner-frame")
        .forEach(el => {
            el.style.display = "none";
            el.style.visibility = "hidden";
            el.style.height = "0";
        });

    // Quita también el contenedor genérico que usa Google para el banner
    document
        .querySelectorAll("body > .skiptranslate")
        .forEach(el => {
            el.style.display = "none";
        });
}

document.addEventListener("DOMContentLoaded", () => {

    // Revisamos constantemente por si Google intenta reinsertar la barra
    setInterval(bloquearBarraGoogle, 250);

    const botonIdioma = document.getElementById("botonIdioma");
    const listaIdiomas = document.getElementById("listaIdiomas");
    const banderaActual = document.getElementById("banderaActual");

    if (!botonIdioma || !listaIdiomas) return;

    // Mostrar la bandera del idioma activo actualmente
    const idiomaActivo = obtenerIdiomaActual();
    if (banderaActual) {
        banderaActual.src = rutaBandera(idiomaActivo);
    }

    document.querySelectorAll(".opcionIdioma").forEach(boton => {

        if (boton.dataset.lang === idiomaActivo) {
            boton.classList.add("activo");
        }

        boton.addEventListener("click", () => {
            listaIdiomas.classList.remove("abierta");
            cambiarIdioma(boton.dataset.lang);
        });

    });

    botonIdioma.addEventListener("click", (e) => {
        e.stopPropagation();
        listaIdiomas.classList.toggle("abierta");
    });

    // Cerrar la lista si se hace click fuera
    document.addEventListener("click", (e) => {
        if (!listaIdiomas.contains(e.target) && e.target !== botonIdioma) {
            listaIdiomas.classList.remove("abierta");
        }
    });

});

console.log("✔ idioma cargado");
