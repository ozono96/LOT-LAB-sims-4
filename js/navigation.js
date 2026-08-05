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
                        abrirVentana("ventanaHabilidadesPacks", true);
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

                    ventana.style.display = "none";
                    comprobarVentanaVisible();
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
                    tooltipGlobal.style.left = e.pageX + "px";
                    tooltipGlobal.style.top = (e.pageY - 10) + "px";
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
                tooltipGlobal.style.left = touch.pageX + "px";
                tooltipGlobal.style.top = (touch.pageY - 10) + "px";
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

    // Ventana inicial por defecto
    abrirVentana("ventanaAcercaDe", false);
});

window.ventanaAnterior = "ventanaAcercaDe";
window.ventanaActual = "ventanaAcercaDe";

function abrirVentana(id, esClickUsuario = false) {
    if (window.ventanaActual !== id) {
        window.ventanaAnterior = window.ventanaActual;
        window.ventanaActual = id;
    }

    if (id !== "ventanaRetoResultado" && id !== "ventanaRuletaDesastres" && id !== "ventanaTemporizador") {
        cerrarTemporizadorAcoplado();
    }

    document.querySelectorAll(".ventana").forEach(ventana => {
        if (!(id === "ventanaTemporizador" && (ventana.id === "ventanaRetoResultado" || ventana.id === "ventanaRuletaDesastres") && document.getElementById("app")?.classList.contains("modo-paralelo"))) {
            ventana.style.display = "none";
        }
    });

    const ventanaEl = document.getElementById(id);
    if (ventanaEl) ventanaEl.style.display = "block";

    // ── Carga/recarga inicial: vista completa (título grande, menú normal, Y=0) ──
    // Solo la llamada explícita de carga (!cargaInicialCompleta && !esClickUsuario) queda excluida.
    // Todas las demás — desde otros módulos, con o sin esClickUsuario — activan modo compacto.
    if (!cargaInicialCompleta && !esClickUsuario) {
        const headerEl = document.querySelector("header");
        const menuEl = document.getElementById("menuPrincipal");
        if (headerEl) headerEl.classList.remove("headerCompacto");
        if (menuEl) menuEl.classList.remove("menuFlotante");
        window.scrollTo(0, 0);
        return;
    }

    // Si la carga inicial aún no terminó (p.ej. llamadas internas muy tempranas) no scrollear
    if (!cargaInicialCompleta) return;

    // ── Botón pulsado o navegación interna: posicionar la ventana a GAP_PX de la barra ──
    //
    // ESTRATEGIA: activamos compact+flotante INSTANTÁNEAMENTE (sin transición CSS) para
    // poder leer las posiciones reales del DOM y hacer después un scrollBy suave exacto.

    const headerEl = document.querySelector("header");
    const menuEl   = document.getElementById("menuPrincipal");
    const placeholder = document.getElementById("placeholderMenuPrincipal");

    if (!headerEl || !menuEl || !placeholder) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    // Fase 1: activar compact + flotante INSTANTÁNEAMENTE (sin transiciones CSS)
    document.body.classList.add("sin-transicion-nav");

    const estabaFlotante = menuEl.classList.contains("menuFlotante");
    if (!estabaFlotante) {
        // Medir la altura normal del menú ANTES de hacerlo flotante
        const alturaMenuNormal = menuEl.offsetHeight;
        placeholder.style.height = alturaMenuNormal + "px";
        menuEl.classList.add("menuFlotante");
    }
    headerEl.classList.add("headerCompacto");

    void headerEl.offsetHeight; // forzar reflow → layout ya en estado final

    // Actualizar top del menú flotante con la altura compacta ya aplicada
    const SEPARACION = 10;
    menuEl.style.top = (headerEl.offsetHeight + SEPARACION) + "px";

    // Fase 2: en el siguiente frame (transiciones ya restauradas) → smooth scroll exacto
    requestAnimationFrame(() => {
        document.body.classList.remove("sin-transicion-nav");

        // Leer posiciones REALES en el estado compacto+flotante ya establecido
        const menuBCR    = menuEl.getBoundingClientRect();
        const ventanaBCR = ventanaEl.getBoundingClientRect();

        const GAP_PX = 20; // separación fija entre la barra flotante y la ventana

        // ¿Cuánto hay que desplazar el scroll para que el top de la ventana
        // quede exactamente a GAP_PX por debajo del bottom de la barra flotante?
        const scrollAjuste = ventanaBCR.top - (menuBCR.bottom + GAP_PX);
        window.scrollBy({ top: scrollAjuste, behavior: "smooth" });
    });
}


function toggleTemporizadorReto() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggleReto = document.getElementById("toggleTemporizadorRetoBtn");
    const btnToggleRuleta = document.getElementById("toggleTemporizadorRuletaBtn");

    if (!ventanaTemp) return;

    const estaAbierto = ventanaTemp.style.display === "block" && app && app.classList.contains("modo-paralelo");

    if (!estaAbierto) {
        if (typeof window.sincronizarTemporizadorConReto === "function") {
            window.sincronizarTemporizadorConReto();
        }
        ventanaTemp.style.display = "block";
        if (app) app.classList.add("modo-paralelo");
        if (btnToggleReto) btnToggleReto.innerHTML = "⏱️ Cerrar temporizador";
        if (btnToggleRuleta) btnToggleRuleta.innerHTML = "⏱️ Cerrar temporizador";
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
    }
}

// Si ninguna ventana está visible, muestra la de "Acerca de..."
function comprobarVentanaVisible() {
    const hayAlgunaVisible = Array.from(document.querySelectorAll(".ventana"))
        .some(v => v.style.display === "block");

    if (!hayAlgunaVisible) {
        const acerca = document.getElementById("ventanaAcercaDe");
        if (acerca) acerca.style.display = "block";
    }
}