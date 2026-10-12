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

let pantallaCargaIniciada = false;

function iniciarPantallaCarga() {
    if (pantallaCargaIniciada) return;
    pantallaCargaIniciada = true;

    const pantalla = document.getElementById("pantallaCarga");
    const barra = document.getElementById("barraCargaProgreso");
    const fraseEl = document.getElementById("fraseCarga");
    const fondo = document.getElementById("pantallaCargaFondo");

    if (!pantalla || !barra) {
        console.warn("[Pantalla de carga] No se encontraron los elementos en el HTML.");
        desbloquearScrollCarga();
        return;
    }

    // ── Determinación de recursos visuales y de color del tema activo ──
    function obtenerRecursosActuales() {
        if (window.TemasEstacionales && typeof window.TemasEstacionales.obtenerRecursosPantallaCarga === "function") {
            return window.TemasEstacionales.obtenerRecursosPantallaCarga();
        }
        const urlParams = new URLSearchParams(window.location.search);
        const pModo = urlParams.get("previewModo");
        const modoTema = pModo || localStorage.getItem("modoTema") || "noche";
        const esDia = (modoTema === "dia");
        return {
            temaId: "base",
            esDia: esDia,
            colorReserva: esDia ? "#F3EEE3" : "#242868",
            imagen: esDia ? "img/pantalla%20carga/carga%20Dia.webp" : "img/pantalla%20carga/carga%20Noche.webp"
        };
    }

    function aplicarFondoCarga(recursos) {
        if (!recursos) return;

        // 1. Color de reserva del tema y modo activos
        if (pantalla && recursos.colorReserva) {
            pantalla.style.backgroundColor = recursos.colorReserva;
            document.documentElement.style.setProperty("--color-fondo-carga", recursos.colorReserva);
        }

        // 2. Imagen de fondo temática (si está configurada)
        if (fondo) {
            if (recursos.imagen) {
                const imgUri = recursos.imagen;
                document.documentElement.style.setProperty("--imagen-fondo-carga", `url('${imgUri}')`);
                // Asignar de inmediato para permitir el efecto de desenfoque desde el inicio
                fondo.style.backgroundImage = `url('${imgUri}')`;

                // Verificación asíncrona no bloqueante: si la imagen no existe o falla, se retira limpiamente
                // para mostrar el color de reserva sin bloquear en ningún momento la carga
                const testImg = new Image();
                testImg.onload = () => {
                    fondo.style.backgroundImage = `url('${imgUri}')`;
                };
                testImg.onerror = () => {
                    console.warn(`[Pantalla de carga] Imagen '${imgUri}' no disponible. Utilizando color de reserva.`);
                    fondo.style.backgroundImage = "none";
                };
                testImg.src = imgUri;
            } else {
                fondo.style.backgroundImage = "none";
                document.documentElement.style.setProperty("--imagen-fondo-carga", "none");
            }
        }
    }

    const recursosIniciales = obtenerRecursosActuales();
    aplicarFondoCarga(recursosIniciales);

    // Permite actualizar en vivo si cambia tema o modo durante pruebas
    window.actualizarRecursosPantallaCarga = function() {
        if (!cargaTerminada) {
            aplicarFondoCarga(obtenerRecursosActuales());
        }
    };

    let paginaCargada = (document.readyState !== "loading");
    let datosCargados = (typeof window.database !== "undefined" && Array.isArray(window.database.solares) && window.database.solares.length > 0);
    let progresoActual = 0;
    let intervaloBarra = null;
    let timeoutFrase = null;
    let colaFrases = [];
    let cargaTerminada = false;
    let cierreIniciado = false;

    function actualizarBarra(porcentaje) {
        progresoActual = porcentaje;
        barra.style.width = porcentaje + "%";

        // Efecto progresivo original de desenfoque / nitidez (de 25px a 0px conforme sube el porcentaje)
        // Se respeta prefers-reduced-motion
        const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (fondo && !reducedMotion) {
            const blurVal = Math.max(0, (1 - (porcentaje / 100)) * 25);
            const contrastVal = 100 + ((1 - (porcentaje / 100)) * 35);
            fondo.style.setProperty("--pixel-blur", blurVal + "px");
            fondo.style.setProperty("--pixel-contrast", contrastVal + "%");
        }
    }

    // Inicializar barra y estado de desenfoque en 0%
    actualizarBarra(0);

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

    const TIEMPO_MINIMO_PANTALLA = 2000; // ms — tiempo mínimo estético de carga fluida
    const inicioCarga = Date.now();

    function cerrarPantallaCarga() {
        if (cargaTerminada) return;
        cargaTerminada = true;
        cierreIniciado = true;

        if (intervaloBarra) clearInterval(intervaloBarra);
        if (timeoutFrase) clearTimeout(timeoutFrase);

        actualizarBarra(100);

        setTimeout(() => {
            pantalla.classList.add("oculta");
            desbloquearScrollCarga();
            setTimeout(() => {
                pantalla.style.display = "none";
            }, 500);
        }, 150);
    }

    function comprobarFinCarga() {
        if (cierreIniciado) return;

        const domListo = (document.readyState === "interactive" || document.readyState === "complete" || paginaCargada);
        const datosListos = (datosCargados || (typeof window.database !== "undefined" && Array.isArray(window.database.solares) && window.database.solares.length > 0));

        if (domListo && datosListos) {
            cierreIniciado = true;
            const tiempoTranscurrido = Date.now() - inicioCarga;
            const esperaRestante = Math.max(0, TIEMPO_MINIMO_PANTALLA - tiempoTranscurrido);

            setTimeout(cerrarPantallaCarga, esperaRestante);
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            paginaCargada = true;
            comprobarFinCarga();
        });
    }

    window.addEventListener("load", () => {
        paginaCargada = true;
        comprobarFinCarga();
    });

    document.addEventListener("datosCargados", () => {
        datosCargados = true;
        comprobarFinCarga();
    });

    // Verificación inmediata por si datos o DOM ya estuviesen listos
    comprobarFinCarga();

    // ── Mecanismo de recuperación ante errores imprevistos (idempotente) ──
    // Asegura que un recurso externo lento o bloqueado no impida el acceso a la web
    setTimeout(() => {
        if (!cargaTerminada) {
            console.warn("[Pantalla de carga] Cierre por rescate de seguridad.");
            cerrarPantallaCarga();
        }
    }, 6000);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarPantallaCarga);
} else {
    iniciarPantallaCarga();
}