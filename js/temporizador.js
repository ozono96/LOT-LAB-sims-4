/* =========================================================
   TEMPORIZADOR PARA RETOS
   ========================================================= */

let temporizadorInterval = null;
let tiempoRestanteEnSegundos = 0;
let estaPausado = false;

document.addEventListener("DOMContentLoaded", () => {
    const botonTemporizadorMenu = document.getElementById("botonTemporizador");
    const botonIniciar = document.getElementById("iniciarTemporizador");
    const botonPausar = document.getElementById("pausarTemporizador");
    const botonDetener = document.getElementById("detenerTemporizador");
    const inputMinutos = document.getElementById("inputMinutosTemporizador");
    const displayTemporizador = document.getElementById("displayTemporizador");
    const divAccionesTemporizador = document.getElementById("accionesTemporizadorEnCurso");

    // Contexto de audio compartido para el tic-tac (se crea una sola vez)
    let audioCtx = null;
    function obtenerAudioCtx() {
        if (!audioCtx || audioCtx.state === "closed") {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function sonarTicTac() {
        try {
            const ctx = obtenerAudioCtx();
            const esTic = tiempoRestanteEnSegundos % 2 === 0; // alterna tic/tac

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.value = esTic ? 800 : 670; // tic más agudo, tac más grave

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.008);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + (esTic ? 0.06 : 0.09));

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.10);
        } catch (e) { /* silencioso si no hay soporte */ }
    }

    function tick() {
        tiempoRestanteEnSegundos--;
        actualizarDisplay();

        if (tiempoRestanteEnSegundos <= 0) {
            finalizarTemporizador();
        } else if (tiempoRestanteEnSegundos <= 30) {
            sonarTicTac();
        }
    }

    // Botones + / - para ajustar los minutos
    const btnRestar = document.getElementById("btnRestarMinuto");
    const btnSumar = document.getElementById("btnSumarMinuto");

    if (btnRestar && inputMinutos) {
        btnRestar.addEventListener("click", () => {
            let val = parseInt(inputMinutos.value, 10) || 15;
            if (val > 1) {
                inputMinutos.value = val - 1;
            }
        });
    }

    if (btnSumar && inputMinutos) {
        btnSumar.addEventListener("click", () => {
            let val = parseInt(inputMinutos.value, 10) || 15;
            if (val < 60) {
                inputMinutos.value = val + 1;
            }
        });
    }

    // Controlar el input con la rueda del ratón en todo el contenedor del selector
    const tempWrap = document.querySelector("#ventanaTemporizador .habNumeroWrap") || inputMinutos;
    if (tempWrap && inputMinutos) {
        tempWrap.addEventListener("wheel", (e) => {
            e.preventDefault(); // Evita que la página entera haga scroll
            let val = parseInt(inputMinutos.value, 10);
            if (isNaN(val)) val = 15;

            if (e.deltaY < 0) {
                val++;
            } else {
                val--;
            }

            const max = parseInt(inputMinutos.max, 10) || 60;
            const min = parseInt(inputMinutos.min, 10) || 1;

            if (val > max) val = max;
            if (val < min) val = min;

            inputMinutos.value = val;
        }, { passive: false });
    }

    // Abrir ventana desde el menú
    if (botonTemporizadorMenu) {
        botonTemporizadorMenu.addEventListener("click", () => {
            reiniciarUI();
            abrirVentana("ventanaTemporizador");
        });
    }

    function autoAjustarTextoTiempoAgotado(el) {
        if (!el) return;
        el.style.fontSize = "";
        const parent = el.parentElement || el;
        const maxW = parent.clientWidth - 12;
        let size = parseFloat(window.getComputedStyle(el).fontSize);
        while (el.scrollWidth > maxW && size > 9) {
            size -= 0.5;
            el.style.fontSize = size + "px";
        }
    }

    // Iniciar el temporizador
    if (botonIniciar) {
        botonIniciar.addEventListener("click", () => {
            const minutos = parseInt(inputMinutos.value, 10);
            if (isNaN(minutos) || minutos <= 0) return;

            tiempoRestanteEnSegundos = minutos * 60;
            estaPausado = false;
            
            if (botonPausar) {
                botonPausar.innerHTML = '<span class="iconoTimerAction">⏸️</span><span class="textoTimerAction">Pausar</span>';
                botonPausar.setAttribute("data-tooltip", "Pausar temporizador");
                botonPausar.classList.remove("enPausa");
            }

            const contenedorConfig = document.getElementById("configuracionTiempoContenedor");
            if (contenedorConfig) contenedorConfig.style.display = "none";
            botonIniciar.parentElement.style.display = "none";
            displayTemporizador.style.display = "flex";
            displayTemporizador.classList.remove("pausado", "tiempoAgotado");
            displayTemporizador.classList.add("enMarcha");
            divAccionesTemporizador.style.display = "flex";

            actualizarDisplay();

            if (temporizadorInterval) clearInterval(temporizadorInterval);

            temporizadorInterval = setInterval(tick, 1000);
        });
    }

    // Pausar / Reanudar temporizador
    if (botonPausar) {
        botonPausar.addEventListener("click", () => {
            if (estaPausado) {
                // Reanudar -> Verde
                estaPausado = false;
                botonPausar.innerHTML = '<span class="iconoTimerAction">⏸️</span><span class="textoTimerAction">Pausar</span>';
                botonPausar.setAttribute("data-tooltip", "Pausar temporizador");
                botonPausar.classList.remove("enPausa");
                displayTemporizador.classList.remove("pausado", "tiempoAgotado");
                displayTemporizador.classList.add("enMarcha");
                temporizadorInterval = setInterval(tick, 1000);
            } else {
                // Pausar -> Naranja
                estaPausado = true;
                botonPausar.innerHTML = '<span class="iconoTimerAction">▶️</span><span class="textoTimerAction">Reanudar</span>';
                botonPausar.setAttribute("data-tooltip", "Reanudar temporizador");
                botonPausar.classList.add("enPausa");
                displayTemporizador.classList.remove("enMarcha", "tiempoAgotado");
                displayTemporizador.classList.add("pausado");
                if (temporizadorInterval) clearInterval(temporizadorInterval);
            }
        });
    }

    // Detener temporizador manualmente
    if (botonDetener) {
        botonDetener.addEventListener("click", () => {
            if (temporizadorInterval) clearInterval(temporizadorInterval);
            reiniciarUI();
        });
    }

    function actualizarDisplay() {
        const minutos = Math.floor(tiempoRestanteEnSegundos / 60);
        const segundos = tiempoRestanteEnSegundos % 60;
        const formatoMinutos = minutos < 10 ? "0" + minutos : minutos;
        const formatoSegundos = segundos < 10 ? "0" + segundos : segundos;
        const texto = `${formatoMinutos}:${formatoSegundos}`;

        const elTexto = document.getElementById("textoTiempoDigital");
        if (elTexto) {
            elTexto.textContent = texto;
            elTexto.style.fontSize = "";
        } else {
            displayTemporizador.textContent = texto;
        }
    }

    // Genera la alarma de fin de tiempo con Web Audio API (sin archivos externos)
    function sonarAlarma() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Tres pitidos cortos tipo despertador
            const pitidos = [0, 0.35, 0.70]; // tiempos de inicio de cada pitido (segundos)
            pitidos.forEach(inicio => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.type = "sine";
                osc.frequency.setValueAtTime(880, ctx.currentTime + inicio);        // La5 (880 Hz)
                osc.frequency.setValueAtTime(1046, ctx.currentTime + inicio + 0.1); // Do6 (1046 Hz)

                gain.gain.setValueAtTime(0, ctx.currentTime + inicio);
                gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + inicio + 0.02);
                gain.gain.setValueAtTime(0.4, ctx.currentTime + inicio + 0.20);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + inicio + 0.28);

                osc.start(ctx.currentTime + inicio);
                osc.stop(ctx.currentTime + inicio + 0.30);
            });
        } catch (e) {
            // Si el navegador no soporta Web Audio API, silencioso
        }
    }

    // Botones para configurar un nuevo temporizador tras finalizar
    const btnNuevo = document.getElementById("btnNuevoTemporizador");
    if (btnNuevo) {
        btnNuevo.addEventListener("click", () => {
            reiniciarUI();
        });
    }

    const btnNuevoModal = document.getElementById("btnNuevoTemporizadorModal");
    if (btnNuevoModal) {
        btnNuevoModal.addEventListener("click", () => {
            cerrarVentana("ventanaTiempoAgotado");
            reiniciarUI();
            abrirVentana("ventanaTemporizador");
        });
    }

    function finalizarTemporizador() {
        if (temporizadorInterval) clearInterval(temporizadorInterval);
        sonarAlarma();

        const esModoParalelo = document.getElementById("app")?.classList.contains("modo-paralelo");

        if (esModoParalelo) {
            // En modo paralelo (Retos o Ruleta desastres), no cerramos la otra ventana ni el temporizador
            divAccionesTemporizador.style.display = "none";
            displayTemporizador.classList.remove("enMarcha", "pausado");
            displayTemporizador.classList.add("tiempoAgotado");
            
            const elTexto = document.getElementById("textoTiempoDigital");
            if (elTexto) {
                elTexto.textContent = "¡TIEMPO AGOTADO!";
                autoAjustarTextoTiempoAgotado(elTexto);
            } else {
                displayTemporizador.textContent = "¡TIEMPO AGOTADO!";
                autoAjustarTextoTiempoAgotado(displayTemporizador);
            }

            const contenedorNuevo = document.getElementById("contenedorNuevoTemporizador");
            if (contenedorNuevo) contenedorNuevo.style.display = "flex";
        } else {
            reiniciarUI();
            cerrarVentana("ventanaTemporizador");
            abrirVentana("ventanaTiempoAgotado");
            const txtAgotado = document.querySelector("#ventanaTiempoAgotado .tiempoAgotadoTexto");
            if (txtAgotado) autoAjustarTextoTiempoAgotado(txtAgotado);
        }
    }


    function reiniciarUI() {
        if (temporizadorInterval) clearInterval(temporizadorInterval);
        tiempoRestanteEnSegundos = 0;
        estaPausado = false;

        if (botonPausar) {
            botonPausar.innerHTML = '<span class="iconoTimerAction">⏸️</span><span class="textoTimerAction">Pausar</span>';
            botonPausar.setAttribute("data-tooltip", "Pausar temporizador");
            botonPausar.classList.remove("enPausa");
        }

        const contenedorConfig = document.getElementById("configuracionTiempoContenedor");
        if (contenedorConfig) contenedorConfig.style.display = "block";

        if (botonIniciar && botonIniciar.parentElement) {
            botonIniciar.parentElement.style.display = "flex";
        }

        displayTemporizador.style.display = "none";
        displayTemporizador.classList.remove("enMarcha", "tiempoAgotado");
        displayTemporizador.classList.add("pausado");

        divAccionesTemporizador.style.display = "none";

        const contenedorNuevo = document.getElementById("contenedorNuevoTemporizador");
        if (contenedorNuevo) contenedorNuevo.style.display = "none";

        const elTexto = document.getElementById("textoTiempoDigital");
        if (elTexto) {
            elTexto.textContent = "00:00";
            elTexto.style.fontSize = "";
        } else {
            displayTemporizador.textContent = "00:00";
        }
    }
});
