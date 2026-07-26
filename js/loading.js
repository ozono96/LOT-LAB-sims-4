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

    if (!pantalla || !barra) {
        console.warn("[Pantalla de carga] No se encontraron los elementos en el HTML.");
        return;
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
                    setTimeout(() => {
                        pantalla.style.display = "none";
                    }, 600);
                }, 700);

            }, esperaRestante);

        }
    }

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