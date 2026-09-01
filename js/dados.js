/* =========================================================
   TIRADOR DE DADOS
   ========================================================= */

const CARAS_DADO_UNICODE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

document.addEventListener("DOMContentLoaded", () => {
    const botonMenu = document.getElementById("botonDados");
    if (botonMenu) {
        botonMenu.addEventListener("click", () => {
            abrirVentana("ventanaDados");
            inicializarDados();
        });
    }

    inicializarDados();
});

function inicializarDados() {
    const botonesCantidad = document.querySelectorAll("#cantidadDadosOpciones .opcionFiltro");
    const inputTiradas = document.getElementById("inputTiradasDados");
    const botonTirar = document.getElementById("botonTirarDados");
    const mensaje = document.getElementById("mensajeDados");
    const resultado = document.getElementById("resultadoDados");

    if (!botonesCantidad.length || !inputTiradas || !botonTirar || !mensaje || !resultado) return;

    // Selección exclusiva de cantidad de dados (1 o 2)
    if (!botonesCantidad[0].dataset.dadosBound) {
        botonesCantidad.forEach(boton => {
            boton.addEventListener("click", () => {
                botonesCantidad.forEach(b => b.classList.remove("seleccionada"));
                boton.classList.add("seleccionada");
            });
            boton.dataset.dadosBound = "true";
        });
    }

    inputTiradas.setAttribute("step", "1");
    inputTiradas.setAttribute("inputmode", "numeric");
    inputTiradas.value = String(clampTiradasDados(parseInt(inputTiradas.value, 10) || 1));

    if (!inputTiradas.dataset.dadosWheelBound) {
        inputTiradas.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 1 : -1;
            const valorActual = clampTiradasDados(parseInt(inputTiradas.value, 10) || 1);
            actualizarTiradasDados(valorActual + delta, true);
        }, { passive: false });

        inputTiradas.addEventListener("input", () => {
            const raw = inputTiradas.value;
            if (raw === "") return;
            const val = parseInt(raw, 10);
            if (isNaN(val)) return;
            actualizarTiradasDados(val, true);
        });
        inputTiradas.addEventListener("change", () => {
            actualizarTiradasDados(inputTiradas.value, true);
        });

        inputTiradas.dataset.dadosWheelBound = "true";
    }

    mensaje.textContent = "Pulsa Tirar para lanzar los dados.";
    resultado.innerHTML = "";

    botonTirar.onclick = () => tirarDados();
}

function tirarDados() {
    const cantidadDadosBtn = document.querySelector("#cantidadDadosOpciones .opcionFiltro.seleccionada");
    const numDados = cantidadDadosBtn ? parseInt(cantidadDadosBtn.dataset.dados, 10) : 1;

    const inputTiradas = document.getElementById("inputTiradasDados");
    const numTiradas = clampTiradasDados(parseInt(inputTiradas.value, 10) || 1);

    const mensaje = document.getElementById("mensajeDados");
    const resultado = document.getElementById("resultadoDados");
    const botonTirar = document.getElementById("botonTirarDados");

    botonTirar.disabled = true;
    mensaje.textContent = "Tirando...";
    resultado.innerHTML = "";
    resultado.classList.toggle("dosColumnas", numTiradas > 1);

    let tiradaActual = 0;
    
    // Pre-generar todos los valores
    const valoresTotales = [];
    for (let t = 0; t < numTiradas; t++) {
        const valores = [];
        for (let i = 0; i < numDados; i++) {
            valores.push(Math.floor(Math.random() * 6) + 1);
        }
        valoresTotales.push(valores);
    }
    
    // Emitir a OBS (Master)
    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", { 
            accion: "TIRAR_DADOS", 
            payload: { valoresTotales, numDados, numTiradas } 
        });
    }

    animarTiradaDados(valoresTotales, numDados, numTiradas, mensaje, resultado, botonTirar);
}

function animarTiradaDados(valoresTotales, numDados, numTiradas, mensaje, resultado, botonTirar) {
    if (!mensaje || !resultado || !botonTirar) return;
    
    let tiradaActual = 0;

    function siguienteTirada() {
        if (tiradaActual >= numTiradas) {
            botonTirar.disabled = false;
            mensaje.textContent = `¡Listo! Has tirado ${numTiradas} vez/veces.`;
            return;
        }

        const valores = valoresTotales[tiradaActual];

        const fila = document.createElement("div");
        fila.className = "filaTiradaDados";

        const dadosEnFila = document.createElement("div");
        dadosEnFila.className = "dadosEnFila";

        valores.forEach(valor => {
            const dado = document.createElement("div");
            dado.className = "dadoCara rodando";
            dado.textContent = CARAS_DADO_UNICODE[valor];
            dadosEnFila.appendChild(dado);

            // Pequeña animación de "rodando" antes de fijar el número final
            let contador = 0;
            const intervalo = setInterval(() => {
                dado.textContent = CARAS_DADO_UNICODE[Math.floor(Math.random() * 6) + 1];
                contador++;
                if (contador >= 6) {
                    clearInterval(intervalo);
                    dado.textContent = CARAS_DADO_UNICODE[valor];
                    dado.classList.remove("rodando");
                }
            }, 60);
        });

        fila.appendChild(dadosEnFila);

        const suma = valores.reduce((a, b) => a + b, 0);
        const etiqueta = document.createElement("div");
        etiqueta.className = "etiquetaTiradaDados";
        etiqueta.textContent = numDados > 1 ? `Total: ${suma}` : `Resultado: ${suma}`;
        fila.appendChild(etiqueta);

        resultado.appendChild(fila);

        mensaje.textContent = numDados > 1
            ? `Tirada ${tiradaActual + 1}: ${valores.join(" + ")} = ${suma}`
            : `Tirada ${tiradaActual + 1}: ${suma}`;

        tiradaActual++;

        window.setTimeout(siguienteTirada, 650);
    }

    siguienteTirada();
}

function clampTiradasDados(valor) {
    return Math.min(10, Math.max(1, Number.isFinite(valor) ? valor : 1));
}

function actualizarTiradasDados(nuevoValor, emitir = true) {
    const inputTiradas = document.getElementById("inputTiradasDados");
    if (!inputTiradas) return;
    const valorClampeado = clampTiradasDados(parseInt(nuevoValor, 10) || 1);
    inputTiradas.value = String(valorClampeado);

    if (emitir && typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "DADOS_TIRADAS_STATE",
            payload: { cantidad: valorClampeado }
        });
    }
}

// Función ejecutada remotamente por OBS Viewer para sincronizar el valor del selector
window.actualizarTiradasDadosObs = function(payload) {
    if (!payload || payload.cantidad === undefined) return;
    actualizarTiradasDados(payload.cantidad, false);
};

// Función ejecutada remotamente por OBS Viewer
window.ejecutarTiradaDadosObs = function(payload) {
    if (!payload || !payload.valoresTotales) return;
    const mensaje = document.getElementById("mensajeDados");
    const resultado = document.getElementById("resultadoDados");
    const botonTirar = document.getElementById("botonTirarDados");
    
    if (botonTirar) botonTirar.disabled = true;
    if (mensaje) mensaje.textContent = "Tirando...";
    if (resultado) {
        resultado.innerHTML = "";
        resultado.classList.toggle("dosColumnas", payload.numTiradas > 1);
    }
    
    animarTiradaDados(payload.valoresTotales, payload.numDados, payload.numTiradas, mensaje, resultado, botonTirar);
};

console.log("✔ dados cargado");