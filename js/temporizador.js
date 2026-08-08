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
            displayTemporizador.classList.remove("pausado");
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
                // Reanudar
                estaPausado = false;
                botonPausar.innerHTML = '<span class="iconoTimerAction">⏸️</span><span class="textoTimerAction">Pausar</span>';
                botonPausar.setAttribute("data-tooltip", "Pausar temporizador");
                botonPausar.classList.remove("enPausa");
                displayTemporizador.classList.remove("pausado");
                temporizadorInterval = setInterval(tick, 1000);
            } else {
                // Pausar
                estaPausado = true;
                botonPausar.innerHTML = '<span class="iconoTimerAction">▶️</span><span class="textoTimerAction">Reanudar</span>';
                botonPausar.setAttribute("data-tooltip", "Reanudar temporizador");
                botonPausar.classList.add("enPausa");
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

    function finalizarTemporizador() {
        if (temporizadorInterval) clearInterval(temporizadorInterval);
        sonarAlarma();

        const app = document.getElementById("app");
        const estaEnParalelo = app && app.classList.contains("modo-paralelo");

        if (estaEnParalelo) {
            // Reiniciar internamente pero mantener display visible con alerta
            if (temporizadorInterval) clearInterval(temporizadorInterval);
            tiempoRestanteEnSegundos = 0;
            estaPausado = false;
            if (botonPausar) {
                botonPausar.innerHTML = '<span class="iconoTimerAction">⏸️</span><span class="textoTimerAction">Pausar</span>';
                botonPausar.setAttribute("data-tooltip", "Pausar temporizador");
                botonPausar.classList.remove("enPausa");
            }
            const contenedorConfig = document.getElementById("configuracionTiempoContenedor");
            if (contenedorConfig) contenedorConfig.style.display = "none";
            const divAcciones = document.getElementById("accionesTemporizadorEnCurso");
            if (divAcciones) divAcciones.style.display = "none";

            if (displayTemporizador) {
                displayTemporizador.classList.remove("pausado");
                displayTemporizador.classList.add("tiempoAgotadoAlerta");
                displayTemporizador.style.display = "block";
                const elTexto = document.getElementById("textoTiempoDigital");
                if (elTexto) elTexto.textContent = "¡TIEMPO AGOTADO!";
            }

            // Emitir estado de alerta a OBS
            if (typeof window.capturarYEmitirEstadoOBS === "function") {
                // Emitir el estado especial directamente
                setTimeout(() => {
                    if (typeof emitirEstadoEnVivoOBS === "function") {
                        const displayTemp = document.getElementById("displayTemporizador");
                        const configTemp = document.getElementById("configuracionTiempoContenedor");
                        const accionesTemp = document.getElementById("accionesTemporizadorEnCurso");
                        // emitirEstadoEnVivoOBS not accessible here; use capturarYEmitirEstadoOBS
                    }
                    window.capturarYEmitirEstadoOBS("ventanaTemporizador");
                }, 50);
            }

            // Tras 4s volver al estado inicial
            setTimeout(() => {
                if (displayTemporizador) {
                    displayTemporizador.classList.remove("tiempoAgotadoAlerta");
                    displayTemporizador.style.display = "none";
                }
                if (contenedorConfig) contenedorConfig.style.display = "block";
                if (botonIniciar) botonIniciar.parentElement.style.display = "flex";
                const elTexto = document.getElementById("textoTiempoDigital");
                if (elTexto) elTexto.textContent = "00:00";
                if (typeof window.capturarYEmitirEstadoOBS === "function") {
                    window.capturarYEmitirEstadoOBS("ventanaTemporizador");
                }
            }, 4000);
        } else {
            reiniciarUI();
            cerrarVentana("ventanaTemporizador");
            abrirVentana("ventanaTiempoAgotado");
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
        botonIniciar.parentElement.style.display = "flex";
        displayTemporizador.style.display = "none";
        displayTemporizador.classList.remove("pausado");
        divAccionesTemporizador.style.display = "none";
        
        const elTexto = document.getElementById("textoTiempoDigital");
        if (elTexto) elTexto.textContent = "00:00";
        else displayTemporizador.textContent = "00:00";
    }
});
