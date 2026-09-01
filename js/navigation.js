// Garantizar que en cada carga/recarga se inicie en el tope (0,0) con título grande y menú normal
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
document.addEventListener('DOMContentLoaded', () => { window.scrollTo(0, 0); });
window.addEventListener('load', () => { window.scrollTo(0, 0); });

let cargaInicialCompleta = false;
window.addEventListener('load', () => {
    setTimeout(() => {
        cargaInicialCompleta = true;
    }, 150);
});

// ─── DICCIONARIOS DE RUTAS Y SLUGS POR VENTANA ─────────────────────────
const MAPA_RUTAS = {
    "acercade": "ventanaAcercaDe",
    "acerca-de": "ventanaAcercaDe",
    "inicio": "ventanaAcercaDe",
    "home": "ventanaAcercaDe",
    "about": "ventanaAcercaDe",

    "buscador": "ventanaBuscador",
    "filtrador": "ventanaBuscador",
    "solares": "ventanaBuscador",
    "buscar": "ventanaBuscador",

    "retos": "ventanaRetos",
    "modo-retos": "ventanaRetos",
    "modo-reto": "ventanaRetos",
    "desafios": "ventanaRetos",
    "retos-opciones": "ventanaRetosOpciones",
    "retos-resultado": "ventanaRetoResultado",

    "ruleta-desastres": "ventanaRuletaDesastres",
    "ruleta-desastre": "ventanaRuletaDesastres",
    "desastres": "ventanaRuletaDesastres",

    "ruleta-color": "ventanaRuletaColor",
    "ruleta-colores": "ventanaRuletaColor",
    "colores": "ventanaRuletaColor",

    "temporizador": "ventanaTemporizador",
    "timer": "ventanaTemporizador",
    "tiempo": "ventanaTemporizador",

    "habilidades": "ventanaRetos",
    "habilidad": "ventanaRetos",
    "habilidades-packs": "ventanaRetos",
    "habilidades-generador": "ventanaHabilidadesGenerador",

    "packs-azar": "ventanaRetos",
    "packs-generador": "ventanaPacksGenerador",

    "mundos-azar": "ventanaRetos",
    "mundos-generador": "ventanaMundosGenerador",

    "trucos": "ventanaTrucos",
    "truco": "ventanaTrucos",
    "cheats": "ventanaTrucos",
    "trucos-construir": "ventanaTrucosConstruir",
    "trucos-cas": "ventanaTrucosCAS",
    "trucos-vivir": "ventanaTrucosVivir",
    "trucos-packs": "ventanaTrucosPacks",

    "estadisticas": "ventanaEstadisticas",
    "stats": "ventanaEstadisticas",

    "resultados": "ventanaResultados",
    "listado": "ventanaListado",
    "aleatorio": "ventanaAleatorio",
    "ficha-solar": "ventanaFichaSolar"
};

const VENTANA_A_SLUG = {
    "ventanaAcercaDe": "acercade",
    "ventanaBuscador": "buscador",
    "ventanaRetos": "retos",
    "ventanaRetosOpciones": "retos-opciones",
    "ventanaRetoResultado": "retos-resultado",
    "ventanaRuletaDesastres": "ruleta-desastres",
    "ventanaRuletaColor": "ruleta-color",
    "ventanaTemporizador": "temporizador",
    "ventanaHabilidadesGenerador": "habilidades-generador",
    "ventanaPacksGenerador": "packs-generador",
    "ventanaMundosGenerador": "mundos-generador",
    "ventanaTrucos": "trucos",
    "ventanaTrucosConstruir": "trucos-construir",
    "ventanaTrucosCAS": "trucos-cas",
    "ventanaTrucosVivir": "trucos-vivir",
    "ventanaTrucosPacks": "trucos-packs",
    "ventanaEstadisticas": "estadisticas",
    "ventanaResultados": "resultados",
    "ventanaListado": "listado",
    "ventanaAleatorio": "aleatorio",
    "ventanaFichaSolar": "ficha-solar"
};

window.ventanaAnterior = "ventanaAcercaDe";
window.ventanaActual = "ventanaAcercaDe";
let estaNavegandoInternamente = false;

function actualizarHashURL(slug) {
    if (!slug) return;
    const hashDeseado = "#" + slug;
    if (window.location.hash === hashDeseado) return;

    estaNavegandoInternamente = true;
    try {
        if (window.location.protocol !== "file:" && history.replaceState) {
            history.replaceState(null, "", hashDeseado);
        } else {
            window.location.hash = hashDeseado;
        }
    } catch (e) {
        try {
            window.location.hash = hashDeseado;
        } catch (err) {
            // Silencioso en entornos locales estrictos
        }
    } finally {
        setTimeout(() => {
            estaNavegandoInternamente = false;
        }, 60);
    }
}

function procesarRutaURL() {
    if (estaNavegandoInternamente) return;

    let rawHash = window.location.hash || "";
    let slug = rawHash.replace(/^[#/]+/, "").trim().toLowerCase();

    if (!slug) {
        let isObs = window.location.search.includes('obs=1') || window.location.hash.includes('obs=1');
        let initialWindow = "ventanaAcercaDe";
        
        if (isObs) {
            let urlParams = new URLSearchParams(window.location.search);
            let urlWindow = urlParams.get('window');
            if (urlWindow) {
                initialWindow = urlWindow;
            } else {
                try {
                    let saved = localStorage.getItem("lotlab_current_window");
                    if (saved) initialWindow = saved;
                } catch(e) {}
            }
        }
        
        abrirVentana(initialWindow, false);
        return;
    }

    const idVentana = MAPA_RUTAS[slug];

    if (idVentana) {
        if (window.ventanaActual !== idVentana || document.getElementById(idVentana)?.style.display !== "block") {
            abrirVentana(idVentana, false);
            if (idVentana === "ventanaEstadisticas" && typeof abrirEstadisticas === "function") {
                abrirEstadisticas();
            }
        }
    } else {
        mostrarError404(slug);
    }
}

function mostrarError404(slugInvalido) {
    const spanRuta = document.getElementById("rutaInvalida404");

    if (spanRuta) {
        spanRuta.textContent = (slugInvalido && slugInvalido !== "404") ? "#" + slugInvalido : "dirección web";
    }

    abrirVentana("ventana404", false);
}

function abrirVentana(id, esClickUsuario = false) {
    const ventanaEl = document.getElementById(id);

    if (window.ventanaActual !== id) {
        window.ventanaAnterior = window.ventanaActual;
        window.ventanaActual = id;
        try {
            localStorage.setItem("lotlab_current_window", id);
        } catch (e) {}
    }

    if (id !== "ventanaRetoResultado" && id !== "ventanaRuletaDesastres" && id !== "ventanaTemporizador") {
        if (typeof cerrarTemporizadorAcoplado === "function") {
            cerrarTemporizadorAcoplado();
        }
    }

    // 1. Mostrar ventana objetivo en el DOM (PRIMERO Y SIEMPRE)
    document.querySelectorAll(".ventana").forEach(ventana => {
        const esTemporizadorAcoplado = ventana.id === "ventanaTemporizador" && document.getElementById("app")?.classList.contains("modo-paralelo") && (id === "ventanaRetoResultado" || id === "ventanaRuletaDesastres" || id === "ventanaTemporizador");
        const esVentanaAcopladaAlTemp = (ventana.id === "ventanaRetoResultado" || ventana.id === "ventanaRuletaDesastres") && document.getElementById("app")?.classList.contains("modo-paralelo") && id === "ventanaTemporizador";

        if (!esTemporizadorAcoplado && !esVentanaAcopladaAlTemp) {
            ventana.style.display = "none";
        }
    });

    if (ventanaEl) {
        const VENTANAS_FLEX = ["ventanaTemporizador", "ventanaTiempoAgotado"];
        ventanaEl.style.display = VENTANAS_FLEX.includes(id) ? "flex" : "block";
    }

    if (typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_ABRIR_VENTANA", { idVentana: id });
    }

    if (id === "ventanaAcercaDe" && typeof window.inicializarCarruselAcercaDe === "function") {
        window.inicializarCarruselAcercaDe();
    }

    if (id === "ventanaListado" && typeof window.mostrarListadoCompleto === "function") {
        window.mostrarListadoCompleto();
    }

    if (id === "ventanaAleatorio" && typeof window.mostrarAleatorio === "function") {
        window.mostrarAleatorio();
    }

    // 2. Sincronizar URL hash de forma segura
    if (id !== "ventana404" && VENTANA_A_SLUG[id]) {
        actualizarHashURL(VENTANA_A_SLUG[id]);
    }

    // 3. Ajuste visual de cabecera y posicionamiento del scroll
    if (!cargaInicialCompleta && !esClickUsuario) {
        const headerEl = document.querySelector("header");
        const menuEl = document.getElementById("menuPrincipal");
        if (headerEl) headerEl.classList.remove("headerCompacto");
        if (menuEl) menuEl.classList.remove("menuFlotante");
        window.scrollTo(0, 0);
        return;
    }

    const headerEl = document.querySelector("header");
    const menuEl   = document.getElementById("menuPrincipal");
    const placeholder = document.getElementById("placeholderMenuPrincipal");

    if (!headerEl || !menuEl || !placeholder) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    document.body.classList.add("sin-transicion-nav");

    const estabaFlotante = menuEl.classList.contains("menuFlotante");
    if (!estabaFlotante) {
        const alturaMenuNormal = menuEl.offsetHeight;
        placeholder.style.height = alturaMenuNormal + "px";
        menuEl.classList.add("menuFlotante");
    }
    headerEl.classList.add("headerCompacto");

    void headerEl.offsetHeight;

    const SEPARACION = 10;
    menuEl.style.top = (headerEl.offsetHeight + SEPARACION) + "px";

    requestAnimationFrame(() => {
        document.body.classList.remove("sin-transicion-nav");

        if (ventanaEl) {
            const menuBCR    = menuEl.getBoundingClientRect();
            const ventanaBCR = ventanaEl.getBoundingClientRect();
            const GAP_PX = 20;
            const scrollAjuste = ventanaBCR.top - (menuBCR.bottom + GAP_PX);
            window.scrollBy({ top: scrollAjuste, behavior: "smooth" });
        }
    });
}

function toggleTemporizadorReto() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggleReto = document.getElementById("toggleTemporizadorRetoBtn");
    const btnToggleRuleta = document.getElementById("toggleTemporizadorRuletaBtn");

    if (!ventanaTemp) return;

    const estaAbierto = (ventanaTemp.style.display === "block" || ventanaTemp.style.display === "flex") && app && app.classList.contains("modo-paralelo");

    if (!estaAbierto) {
        if (typeof window.sincronizarTemporizadorConReto === "function") {
            window.sincronizarTemporizadorConReto();
        }
        ventanaTemp.style.display = "flex";
        if (app) app.classList.add("modo-paralelo");
        if (btnToggleReto) btnToggleReto.innerHTML = "⏱️ Cerrar temporizador";
        if (btnToggleRuleta) btnToggleRuleta.innerHTML = "⏱️ Cerrar temporizador";

        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "TEMPORIZADOR_ACOPLADO_STATE",
                payload: { acopladoAbierto: true }
            });
        }
    } else {
        cerrarTemporizadorAcoplado();
    }
}

function cerrarTemporizadorAcoplado() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggleReto = document.getElementById("toggleTemporizadorRetoBtn");
    const btnToggleRuleta = document.getElementById("toggleTemporizadorRuletaBtn");

    if (ventanaTemp) ventanaTemp.style.display = "none";
    if (app) app.classList.remove("modo-paralelo");
    if (btnToggleReto) btnToggleReto.innerHTML = "⏱️ Abrir temporizador";
    if (btnToggleRuleta) btnToggleRuleta.innerHTML = "⏱️ Abrir temporizador";

    if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "TEMPORIZADOR_ACOPLADO_STATE",
            payload: { acopladoAbierto: false }
        });
    }
}

function cerrarVentana(id) {
    const ventana = document.getElementById(id);

    if (ventana) {
        if (id === "ventanaTemporizador" && document.getElementById("app")?.classList.contains("modo-paralelo")) {
            cerrarTemporizadorAcoplado();
        } else {
            ventana.style.display = "none";
        }
        comprobarVentanaVisible();
        if (typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_CERRAR_VENTANA", { idVentana: id });
        }
    }
}

function comprobarVentanaVisible() {
    const hayAlgunaVisible = Array.from(document.querySelectorAll(".ventana"))
        .some(v => (v.style.display === "block" || v.style.display === "flex") && v.id !== "ventanaAcercaDe");

    if (!hayAlgunaVisible) {
        abrirVentana("ventanaAcercaDe", true);
    }
}

// Exponer funciones globales explícitamente en window por seguridad
window.abrirVentana = abrirVentana;
window.cerrarVentana = cerrarVentana;
window.procesarRutaURL = procesarRutaURL;
window.mostrarError404 = mostrarError404;
window.toggleTemporizadorReto = toggleTemporizadorReto;
window.cerrarTemporizadorAcoplado = cerrarTemporizadorAcoplado;
window.comprobarVentanaVisible = comprobarVentanaVisible;

document.addEventListener("DOMContentLoaded", function () {
    // Botones principales del menú
    document.getElementById("botonBuscador")
        ?.addEventListener("click", function () {
            abrirVentana("ventanaBuscador", true);
        });

    document.getElementById("botonModsSimfile")
        ?.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
        });

    document.getElementById("botonEstadisticas")
        ?.addEventListener("click", function () {
            abrirVentana("ventanaEstadisticas", true);
            if (typeof abrirEstadisticas === "function") {
                abrirEstadisticas();
            }
        });

    document.getElementById("botonRetos")
        ?.addEventListener("click", function () {
            window.proximaVentanaTrasPacks = "ventanaRetosOpciones";
            abrirVentana("ventanaRetos", true);
        });

    document.getElementById("botonRuletaDesastres")
        ?.addEventListener("click", function () {
            window.proximaVentanaTrasPacks = "ventanaRuletaDesastres";
            abrirVentana("ventanaRetos", true);
        });

    // Botones de cerrar en ventanas
    document.querySelectorAll(".cerrar")
        .forEach(boton => {
            boton.addEventListener("click", function () {
                const ventana = this.closest(".ventana");
                if (ventana) {
                    if (ventana.id === "ventanaTemporizador" && document.getElementById("app")?.classList.contains("modo-paralelo")) {
                        cerrarTemporizadorAcoplado();
                        return;
                    }
                    if (ventana.id === "ventanaRetosOpciones") {
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaHabilidadesGenerador") {
                        window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaPacksGenerador") {
                        window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaMundosGenerador") {
                        window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaRetoResultado") {
                        cerrarTemporizadorAcoplado();
                        abrirVentana("ventanaRetosOpciones", true);
                        return;
                    }
                    if (ventana.id === "ventanaRuletaDesastres") {
                        window.proximaVentanaTrasPacks = "ventanaRuletaDesastres";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaFichaSolar") {
                        const destino = window.ventanaOrigenFicha || window.ventanaAnterior || "ventanaBuscador";
                        cerrarVentana("ventanaFichaSolar");
                        abrirVentana(destino, true);
                        if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
                            window.emitirEventoOBS("SYNC_CERRAR_FICHA_SOLAR", { ventanaDestino: destino });
                        }
                        return;
                    }

                    cerrarVentana(ventana.id);
                }
            });
        });

    // Tooltip global para cualquier elemento con data-tooltip
    const tooltipGlobal = document.getElementById("tooltipOpciones");
    if (tooltipGlobal) {
        document.body.addEventListener("mouseenter", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.textContent = el.getAttribute("data-tooltip");
                tooltipGlobal.style.display = "block";
            }
        }, true);
        document.body.addEventListener("mousemove", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                const text = el.getAttribute("data-tooltip");
                if (text) {
                    tooltipGlobal.textContent = text;
                    tooltipGlobal.style.display = "block";
                    // position:fixed usa coordenadas del viewport (clientX/clientY), NO pageX/pageY
                    tooltipGlobal.style.left = e.clientX + "px";
                    tooltipGlobal.style.top = (e.clientY - 10) + "px";
                } else {
                    tooltipGlobal.style.display = "none";
                }
            } else {
                tooltipGlobal.style.display = "none";
            }
        }, true);
        document.body.addEventListener("mouseleave", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, true);

        // Versión táctil
        document.body.addEventListener("touchstart", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                const touch = e.touches[0];
                tooltipGlobal.textContent = el.getAttribute("data-tooltip");
                tooltipGlobal.style.left = touch.clientX + "px";
                tooltipGlobal.style.top = (touch.clientY - 10) + "px";
                tooltipGlobal.style.display = "block";
            }
        }, { capture: true, passive: true });

        document.body.addEventListener("touchend", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, { capture: true, passive: true });

        document.body.addEventListener("touchcancel", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, { capture: true, passive: true });
    }

    // Escuchar cambios de URL en la barra de navegación del navegador (Atrás/Adelante)
    window.addEventListener("hashchange", function () {
        procesarRutaURL();
    });

    // Botones de la ventana 404
    document.getElementById("btnVolverInicio404")?.addEventListener("click", function () {
        abrirVentana("ventanaAcercaDe", true);
    });

    document.getElementById("btnIrBuscador404")?.addEventListener("click", function () {
        abrirVentana("ventanaBuscador", true);
    });
});

// Procesar la ruta inicial al cargar la web - fuera del DOMContentLoaded para
// garantizar que todos los scripts IIFE (como acercade.js) ya han definido sus
// funciones globales antes de que intentemos abrir la primera ventana.
function initNavigation() {
    if (window._navigationInitialized) return;
    window._navigationInitialized = true;
    // Dar un pequeño respiro extra (10ms) para asegurar que acercade.js
    // asignó la función window.inicializarCarruselAcercaDe
    setTimeout(() => {
        procesarRutaURL();
    }, 10);
}

if (document.readyState === "complete") {
    initNavigation();
} else {
    window.addEventListener("load", initNavigation);
    // Fallback por si acaso
    setTimeout(initNavigation, 1000);
}