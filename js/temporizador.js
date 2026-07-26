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

    function tick() {
        tiempoRestanteEnSegundos--;
        actualizarDisplay();

        if (tiempoRestanteEnSegundos <= 0) {
            finalizarTemporizador();
        }
    }

    // Controlar el input con la rueda del ratón
    if (inputMinutos) {
        inputMinutos.addEventListener("wheel", (e) => {
            e.preventDefault(); // Evita que la página entera haga scroll
            let val = parseInt(inputMinutos.value, 10);
            if (isNaN(val)) val = 15;
            
            if (e.deltaY < 0) {
                val++;
            } else {
                val--;
            }

            const max = parseInt(inputMinutos.max, 10);
            const min = parseInt(inputMinutos.min, 10);
            
            if (val > max) val = max;
            if (val < min) val = min;
            
            inputMinutos.value = val;
        });
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
            if(botonPausar) botonPausar.textContent = "⏸️";
            
            // Cambiar UI a modo activo
            inputMinutos.parentElement.style.display = "none";
            botonIniciar.parentElement.style.display = "none";
            displayTemporizador.style.display = "block";
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
                botonPausar.textContent = "⏸️";
                temporizadorInterval = setInterval(tick, 1000);
            } else {
                // Pausar
                estaPausado = true;
                botonPausar.textContent = "▶️";
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
        displayTemporizador.textContent = `${formatoMinutos}:${formatoSegundos}`;
    }

    function finalizarTemporizador() {
        if (temporizadorInterval) clearInterval(temporizadorInterval);
        reiniciarUI();
        cerrarVentana("ventanaTemporizador");
        abrirVentana("ventanaTiempoAgotado");
    }

    function reiniciarUI() {
        if (temporizadorInterval) clearInterval(temporizadorInterval);
        tiempoRestanteEnSegundos = 0;
        estaPausado = false;
        if(botonPausar) botonPausar.textContent = "⏸️";
        inputMinutos.parentElement.style.display = "block";
        botonIniciar.parentElement.style.display = "flex";
        displayTemporizador.style.display = "none";
        divAccionesTemporizador.style.display = "none";
        displayTemporizador.textContent = "00:00";
    }
});
