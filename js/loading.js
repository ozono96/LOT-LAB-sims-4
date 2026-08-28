const FRASES_CARGA = [
    "Cargando tiras reticuladas",
    "Equilibrando coeficientes domésticos",
    "Creando retos",
    "Creando buscador de solares",
    "No quiero auriculares gratis",
    "Buscando apartamentos",
    "Sintonizando el continuo espacio-tiempo"
];

const DURACION_TRANSICION_FRASE = 350; // ms (entrada y salida)
const TIEMPO_VISIBLE_FRASE = 1300;     // ms visible en el centro

// ── Bloqueo de scroll mientras se muestra la pantalla de carga ──
// Cubre los tres métodos de scroll: rueda del ratón, barra del navegador
// (overflow hidden en el body) y gesto táctil en móvil.
function prevenirScrollCarga(e) {
    e.preventDefault();
}

function bloquearScrollCarga() {
    document.documentElement.classList.add("bloqueoScrollCarga");
    document.body.classList.add("bloqueoScrollCarga");
    document.addEventListener("wheel", prevenirScrollCarga, { passive: false });
    document.addEventListener("touchmove", prevenirScrollCarga, { passive: false });
}

function desbloquearScrollCarga() {
    document.documentElement.classList.remove("bloqueoScrollCarga");
    document.body.classList.remove("bloqueoScrollCarga");
    document.removeEventListener("wheel", prevenirScrollCarga, { passive: false });
    document.removeEventListener("touchmove", prevenirScrollCarga, { passive: false });
}

bloquearScrollCarga();

function mezclarArrayCarga(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function iniciarPantallaCarga() {

    const pantalla = document.getElementById("pantallaCarga");
    const barra = document.getElementById("barraCargaProgreso");
    const fraseEl = document.getElementById("fraseCarga");
    const fondo = document.getElementById("pantallaCargaFondo");

    if (!pantalla || !barra) {
        console.warn("[Pantalla de carga] No se encontraron los elementos en el HTML.");
        return;
    }

    // ── Imagen de fondo según modo día / noche ──
    if (fondo) {
        const modoTema = localStorage.getItem("modoTema");
        const imgNoche = "img/pantalla%20carga/carga%20Noche.png";
        const imgDia   = "img/pantalla%20carga/carga%20Dia.png";
        const imgFallback = "img/pantalla%20carga/Pantalla%20carga%20inicio.png";

        const rutaElegida = (modoTema === "dia") ? imgDia : imgNoche;

        const testImg = new Image();
        testImg.onload = () => {
            fondo.style.backgroundImage = `url('${rutaElegida}')`;
        };
        testImg.onerror = () => {
            fondo.style.backgroundImage = `url('${imgFallback}')`;
        };
        testImg.src = rutaElegida;
    }

    let paginaCargada = (document.readyState === "complete");
    let datosCargados = false;
    let progresoActual = 0;
    let intervaloBarra = null;
    let timeoutFrase = null;
    let colaFrases = [];
    let cargaTerminada = false;

    function actualizarBarra(porcentaje) {
        progresoActual = porcentaje;
        barra.style.width = porcentaje + "%";

        // Efecto progresivo de desenfoque / pixelado (de 25px a 0px conforme sube el porcentaje)
        const blurVal = Math.max(0, (1 - (porcentaje / 100)) * 25);
        const contrastVal = 100 + ((1 - (porcentaje / 100)) * 35);
        const fondo = document.getElementById("pantallaCargaFondo");
        if (fondo) {
            fondo.style.setProperty("--pixel-blur", blurVal + "px");
            fondo.style.setProperty("--pixel-contrast", contrastVal + "%");
        }
    }

    function programarSiguienteFrase() {
        if (!fraseEl || cargaTerminada) return;

        if (colaFrases.length === 0) {
            colaFrases = mezclarArrayCarga(FRASES_CARGA);
        }

        const frase = colaFrases.shift();

        // Fase de salida de la frase anterior (si había alguna visible)
        fraseEl.classList.remove("fraseCargaVisible");

        timeoutFrase = setTimeout(() => {
            if (cargaTerminada) return;

            fraseEl.textContent = frase;
            void fraseEl.offsetWidth; // fuerza reflow para que la transición se dispare
            fraseEl.classList.add("fraseCargaVisible");

            timeoutFrase = setTimeout(programarSiguienteFrase, TIEMPO_VISIBLE_FRASE);

        }, DURACION_TRANSICION_FRASE);
    }

    const TIEMPO_MINIMO_PANTALLA = 4500; // ms — tiempo mínimo que se muestra la pantalla de carga
    const inicioCarga = Date.now();

    function comprobarFinCarga() {
        if (paginaCargada && datosCargados) {

            const tiempoTranscurrido = Date.now() - inicioCarga;
            const esperaRestante = Math.max(0, TIEMPO_MINIMO_PANTALLA - tiempoTranscurrido);

            setTimeout(() => {

                cargaTerminada = true;

                if (intervaloBarra) clearInterval(intervaloBarra);
                if (timeoutFrase) clearTimeout(timeoutFrase);

                actualizarBarra(100);

                setTimeout(() => {
                    pantalla.classList.add("oculta");
                    desbloquearScrollCarga();
                    setTimeout(() => {
                        pantalla.style.display = "none";
                    }, 600);
                }, 700);

            }, esperaRestante);

        }
    }

    function forzarFinCargaPreLaunch() {
        if (cargaTerminada) return;

        const tiempoTranscurrido = Date.now() - inicioCarga;
        const esperaRestante = Math.max(0, TIEMPO_MINIMO_PANTALLA - tiempoTranscurrido);

        setTimeout(() => {
            if (cargaTerminada) return;
            cargaTerminada = true;
            if (intervaloBarra) clearInterval(intervaloBarra);
            if (timeoutFrase) clearTimeout(timeoutFrase);
            actualizarBarra(100);
            setTimeout(() => {
                pantalla.classList.add("oculta");
                desbloquearScrollCarga();
                setTimeout(() => {
                    pantalla.style.display = "none";
                }, 600);
            }, 600);
        }, esperaRestante);
    }
    window.forzarFinCargaPreLaunch = forzarFinCargaPreLaunch;

    // ── Barra de progreso fluida (se frena según se acerca al límite simulado) ──
    intervaloBarra = setInterval(() => {
        if (progresoActual < 90) {
            const distanciaRestante = 90 - progresoActual;
            const incremento = Math.max(0.3, distanciaRestante * 0.04);
            actualizarBarra(Math.min(90, progresoActual + incremento));
        }
    }, 60);

    // ── Frases rotativas ──
    programarSiguienteFrase();

    window.addEventListener("load", () => {
        paginaCargada = true;
        comprobarFinCarga();
    });

    document.addEventListener("datosCargados", () => {
        datosCargados = true;
        comprobarFinCarga();
    });

    comprobarFinCarga();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPantallaCarga);
} else {
    iniciarPantallaCarga();
}