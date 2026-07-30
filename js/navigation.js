document.addEventListener("DOMContentLoaded", function () {





    document.getElementById("botonBuscador")
        ?.addEventListener("click", function () {



            abrirVentana(
                "ventanaBuscador"
            );



        });








    document.getElementById("botonRetos")
        ?.addEventListener("click", function () {



            abrirVentana(
                "ventanaRetos"
            );



        });








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
                        abrirVentana(window.ventanaAnterior || "ventanaRetos");
                        return;
                    }
                    if (ventana.id === "ventanaRetoResultado") {
                        cerrarTemporizadorAcoplado();
                        abrirVentana("ventanaRetosOpciones");
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
                tooltipGlobal.style.left = e.pageX + "px";
                tooltipGlobal.style.top = (e.pageY - 10) + "px";
            }
        }, true);
        document.body.addEventListener("mouseleave", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, true);

        // Versión táctil: el tooltip solo se muestra mientras se mantiene pulsado
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







});









window.ventanaAnterior = "ventanaBuscador";
window.ventanaActual = "ventanaBuscador";

function abrirVentana(id) {

    if (window.ventanaActual !== id) {
        window.ventanaAnterior = window.ventanaActual;
        window.ventanaActual = id;
    }

    if (id !== "ventanaRetoResultado" && id !== "ventanaTemporizador") {
        cerrarTemporizadorAcoplado();
    }

    document.querySelectorAll(".ventana")
        .forEach(ventana => {
            if (!(id === "ventanaTemporizador" && ventana.id === "ventanaRetoResultado" && document.getElementById("app")?.classList.contains("modo-paralelo"))) {
                ventana.style.display = "none";
            }
        });

    const ventana = document.getElementById(id);
    if (ventana) {
        ventana.style.display = "block";
    }
}

function toggleTemporizadorReto() {
    const ventanaReto = document.getElementById("ventanaRetoResultado");
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggle = document.getElementById("toggleTemporizadorRetoBtn");

    if (!ventanaReto || !ventanaTemp || !btnToggle) return;

    const estaAbierto = ventanaTemp.style.display === "block" && app && app.classList.contains("modo-paralelo");

    if (!estaAbierto) {
        if (typeof window.sincronizarTemporizadorConReto === "function") {
            window.sincronizarTemporizadorConReto();
        }
        ventanaTemp.style.display = "block";
        if (app) app.classList.add("modo-paralelo");
        btnToggle.innerHTML = "⏱️ Cerrar temporizador";
    } else {
        cerrarTemporizadorAcoplado();
    }
}

function cerrarTemporizadorAcoplado() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggle = document.getElementById("toggleTemporizadorRetoBtn");

    if (ventanaTemp) ventanaTemp.style.display = "none";
    if (app) app.classList.remove("modo-paralelo");
    if (btnToggle) btnToggle.innerHTML = "⏱️ Abrir temporizador";
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