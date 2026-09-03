// Estado global del módulo (mismo patrón que habilidades.js / packs-azar.js)
const RULETA_COLOR = {
    acelerado: false
};

document.addEventListener("DOMContentLoaded", () => {
    const botonRuleta = document.getElementById("botonRuletaColor");
    if (botonRuleta) {
        botonRuleta.addEventListener("click", () => {
            abrirVentana("ventanaRuletaColor");
            inicializarRuletaColor(true);
        });
    }

    // Botón Acelerar (igual que habBtnAcelerar en habilidades.js)
    document.getElementById("ruletaColorBtnAcelerar")?.addEventListener("click", () => {
        _ruletaColorAlternarAcelerar();
    });

    document.addEventListener("datosCargados", () => {
        inicializarRuletaColor(false);
    });
});

function inicializarRuletaColor(forzarLimpieza = false) {
    const wheel = document.getElementById("ruletaColorWheel");
    const mensaje = document.getElementById("mensajeRuletaColor");
    const resultados = document.getElementById("resultadoRuletaColor");
    const inputTiradas = document.getElementById("inputTiradasRuleta");
    const botonGirar = document.getElementById("botonGirarRuleta");

    if (!wheel || !mensaje || !resultados || !inputTiradas || !botonGirar) return;

    const colores = obtenerColoresRuleta();

    inputTiradas.setAttribute("step", "1");
    inputTiradas.setAttribute("inputmode", "numeric");
    inputTiradas.value = String(clampTiradas(parseInt(inputTiradas.value, 10) || 1));

    if (!inputTiradas.dataset.ruletaWheelBound) {
        inputTiradas.addEventListener("wheel", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const delta = event.deltaY > 0 ? -1 : 1;
            const valorActual = clampTiradas(parseInt(inputTiradas.value, 10) || 1);
            actualizarTiradasRuletaColor(valorActual + delta, true);
        }, { passive: false });

        inputTiradas.addEventListener("input", () => {
            const raw = inputTiradas.value;
            if (raw === "") return; // Permite borrar el campo para escribir un número nuevo
            const val = parseInt(raw, 10);
            if (isNaN(val)) return;
            actualizarTiradasRuletaColor(val, true);
        });

        inputTiradas.addEventListener("change", () => {
            actualizarTiradasRuletaColor(inputTiradas.value, true);
        });

        inputTiradas.dataset.ruletaWheelBound = "true";
    }

    if (colores.length === 0) {
        wheel.innerHTML = '<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="90" fill="#7f8c8d" stroke="rgba(255,255,255,0.8)" stroke-width="3"/></svg>';
        mensaje.textContent = "No hay colores disponibles para mostrar en la ruleta.";
        resultados.innerHTML = "";
        botonGirar.disabled = true;
        return;
    }

    wheel.innerHTML = construirSVGRuleta(colores);
    botonGirar.disabled = false;
    botonGirar.onclick = () => girarRuletaColor(colores, inputTiradas, mensaje, resultados, botonGirar, wheel);

    const wrapper = wheel.closest(".ruletaColorWheelWrapper") || wheel.parentElement;
    if (wrapper) {
        wrapper.classList.remove("ruletaColorWheelWrapper--girando", "ruletaColorWheelWrapper--acelerado");
    }

    const hayResultado = resultados.children.length > 0 || (window.coloresUltimoResultado && window.coloresUltimoResultado.colores && window.coloresUltimoResultado.colores.length > 0);
    if (forzarLimpieza || !hayResultado) {
        mensaje.textContent = `Listo para girar con ${colores.length} colores disponibles.`;
        resultados.innerHTML = "";
    }
}

function girarRuletaColor(colores, inputTiradas, mensaje, resultados, botonGirar, wheel) {
    if (!colores.length) return;

    const cantidad = clampTiradas(parseInt(inputTiradas.value, 10) || 1);
    const tiradas = [];
    let pool = [...colores];

    for (let i = 0; i < cantidad; i++) {
        const wheelColors = [...pool];
        const indiceAleatorio = Math.floor(Math.random() * wheelColors.length);
        const resultado = wheelColors[indiceAleatorio];
        tiradas.push({ resultado, wheelColors });
        pool = wheelColors.filter((_, index) => index !== indiceAleatorio);
    }
    
    // Emitir a OBS (Master)
    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", { 
            accion: "GIRAR_RULETA_COLOR", 
            payload: { tiradas, cantidad } 
        });
    }

    animarRuletaColor(tiradas, cantidad, mensaje, resultados, botonGirar, wheel);
}

function animarRuletaColor(tiradas, cantidad, mensaje, resultados, botonGirar, wheel) {
    if (!mensaje || !resultados || !botonGirar || !wheel) return;

    mensaje.textContent = "Girando...";
    resultados.innerHTML = "";
    botonGirar.disabled = true;

    // Resetear acelerador al comenzar cada secuencia de tiradas
    RULETA_COLOR.acelerado = false;
    _ruletaColorActualizarUIAcelerar(false);

    // Activar halo verde de giro en el wrapper de la rueda
    const wrapper = wheel.closest(".ruletaColorWheelWrapper") || wheel.parentElement;
    if (wrapper) {
        wrapper.classList.add("ruletaColorWheelWrapper--girando");
        wrapper.classList.remove("ruletaColorWheelWrapper--acelerado");
    }

    // Mostrar botón Acelerar si hay más de una tirada (igual que habilidades.js)
    const acelerarWrap = document.getElementById("ruletaColorAcelerarWrap");
    if (acelerarWrap) acelerarWrap.style.display = cantidad > 1 ? "flex" : "none";

    let indice = 0;
    let rotacionActual = parseFloat(wheel.dataset.rotacion || "0");

    function siguienteTirada() {
        if (indice >= tiradas.length) {
            if (wrapper) wrapper.classList.remove("ruletaColorWheelWrapper--girando", "ruletaColorWheelWrapper--acelerado");
            botonGirar.disabled = false;
            mensaje.textContent = `¡Listo! Has tirado ${cantidad} vez/veces.`;
            return;
        }

        const tirada = tiradas[indice];
        const wheelColors = tirada.wheelColors;
        const resultado = tirada.resultado;
        const sectorIndex = wheelColors.findIndex(color => color === resultado);
        const total = wheelColors.length || 1;
        const segmento = 360 / total;
        const sectorCenter = (sectorIndex * segmento) % 360;
        // Pequeño margen aleatorio DENTRO del sector, lejos de sus bordes,
        // para que nunca quede justo en el límite entre dos colores.
        const margenSeguro = segmento * 0.30;
        const jitter = (Math.random() * 2 - 1) * margenSeguro;
        const pointerAngle = 0;
        const targetRotation = (pointerAngle - (sectorCenter + jitter) + 360) % 360;
        const currentNormalized = ((rotacionActual % 360) + 360) % 360;
        const deltaToTarget = (targetRotation - currentNormalized + 360) % 360;
        const rotacionObjetivo = rotacionActual + (360 * 6) + deltaToTarget;

        // Duración condicionada por el flag acelerado (mismo criterio que carrusel-random.js)
        const esAcel = RULETA_COLOR.acelerado;
        const duracionCss  = esAcel ? "0.6s" : "4.2s";
        const duracionMs   = esAcel ? 650   : 4300;
        const pausaEntreMs = esAcel ? 220   : 900;

        wheel.innerHTML = construirSVGRuleta(wheelColors);
        wheel.style.transition = `transform ${duracionCss} cubic-bezier(0.22, 1, 0.36, 1)`;
        wheel.style.transform = `rotate(${rotacionObjetivo}deg)`;
        rotacionActual = rotacionObjetivo;
        wheel.dataset.rotacion = String(rotacionActual);

        window.setTimeout(() => {
            const chip = document.createElement("div");
            chip.className = "chipColorRuleta";
            chip.innerHTML = `
                <span class="chipColorRuleta__muestra" style="background:${resultado.hex}" data-tooltip="${resultado.nombre}"></span>
            `;
            resultados.appendChild(chip);

            mensaje.textContent = `Ha salido: ${resultado.nombre}`;
            indice += 1;

            if (indice < tiradas.length) {
                window.setTimeout(siguienteTirada, pausaEntreMs);
            } else {
                // Desactivar halo al finalizar todas las tiradas
                if (wrapper) wrapper.classList.remove("ruletaColorWheelWrapper--girando", "ruletaColorWheelWrapper--acelerado");
                // Ocultar botón Acelerar al terminar
                if (acelerarWrap) acelerarWrap.style.display = "none";
                botonGirar.disabled = false;
                mensaje.textContent = `¡Resultados listos!`;

                // Guardar resultado y actualizar URL
                const coloresElegidos = tiradas.map(t => t.resultado);
                window.coloresUltimoResultado = { cantidad, colores: coloresElegidos };
                if (typeof actualizarHashURL === "function" && typeof serializarRuletaColoresV1 === "function") {
                    const token = serializarRuletaColoresV1(window.coloresUltimoResultado);
                    if (token) actualizarHashURL("ruleta-colores/v1/" + token);
                }
            }
        }, duracionMs);
    }

    siguienteTirada();
}

// ── Control de Aceleración (mismo patrón que habilidades.js) ──────────────
function _ruletaColorAlternarAcelerar() {
    RULETA_COLOR.acelerado = true;
    _ruletaColorActualizarUIAcelerar(true);
    // Cambiar halo de verde a naranja inmediatamente
    const wrapper = document.querySelector(".ruletaColorWheelWrapper");
    if (wrapper) {
        wrapper.classList.remove("ruletaColorWheelWrapper--girando");
        wrapper.classList.add("ruletaColorWheelWrapper--acelerado");
    }
    // El botón es puramente local: no emite evento OBS adicional.
    // Los resultados ya fueron precalculados y emitidos en girarRuletaColor.
}

function _ruletaColorActualizarUIAcelerar(activo) {
    const btn = document.getElementById("ruletaColorBtnAcelerar");
    const txt = document.getElementById("ruletaColorTextoAcelerar");
    if (btn) btn.classList.toggle("habBtnAcelerar--activo", !!activo);
    if (txt) txt.textContent = activo ? "Acelerado" : "Acelerar";
}

function obtenerColoresRuleta() {
    const fallback = [
        { id: "C001", nombre: "Azul", hex: "#2E86DE" },
        { id: "C002", nombre: "Rojo", hex: "#E74C3C" },
        { id: "C003", nombre: "Verde", hex: "#2ECC71" },
        { id: "C004", nombre: "Amarillo", hex: "#F1C40F" },
        { id: "C005", nombre: "Morado", hex: "#9B59B6" },
        { id: "C006", nombre: "Naranja", hex: "#E67E22" }
    ];

    const filas = Array.isArray(database?.colores) ? database.colores : [];
    const colores = (filas.length ? filas : fallback)
        .map((fila, index) => normalizarColor(fila, index))
        .filter(color => color && color.nombre && color.hex);

    return colores;
}

function normalizarColor(fila, index) {
    if (!fila) return null;

    if (Array.isArray(fila)) {
        const nombre = (fila[0] || "").toString().trim();
        const hex = (fila[1] || "").toString().trim();
        const id = (fila[2] || "").toString().trim() || `C${index + 1}`;
        return {
            id: id,
            nombre: nombre || `Color ${index + 1}`,
            hex: normalizarHex(hex) || "#CCCCCC",
            index
        };
    }

    const texto = fila.toString().trim();
    return {
        id: fila.id || `C${index + 1}`,
        nombre: texto || `Color ${index + 1}`,
        hex: normalizarHex(fila.hex) || "#CCCCCC",
        index
    };
}

function normalizarHex(hex) {
    const valor = (hex || "").toString().trim();
    if (!valor) return null;
    const limpio = valor.replace(/^#/, "");
    if (/^[0-9A-Fa-f]{6}$/.test(limpio)) {
        return `#${limpio.toUpperCase()}`;
    }
    return null;
}

function construirSVGRuleta(colores) {
    const size = 200;
    const center = size / 2;
    const radius = 88;
    const total = colores.length || 1;
    const segmento = 360 / total;

    const paths = colores.map((color, index) => {
        const startAngle = (index * segmento) - (segmento / 2);
        const endAngle = ((index + 1) * segmento) - (segmento / 2);
        const start = polarToCartesian(center, center, radius, startAngle);
        const end = polarToCartesian(center, center, radius, endAngle);
        const largeArcFlag = (endAngle - startAngle) <= 180 ? 0 : 1;

        return `<path d="M ${center} ${center} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z" fill="${color.hex}" stroke="rgba(255,255,255,0.75)" stroke-width="2"></path>`;
    }).join("");

    return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <circle cx="${center}" cy="${center}" r="${radius}" fill="transparent" stroke="rgba(255,255,255,0.8)" stroke-width="3"></circle>
        ${paths}
    </svg>`;
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function clampTiradas(valor) {
    return Math.min(10, Math.max(1, Number.isFinite(valor) ? valor : 1));
}

function actualizarTiradasRuletaColor(nuevoValor, emitir = true) {
    const inputTiradas = document.getElementById("inputTiradasRuleta");
    if (!inputTiradas) return;
    const valorClampeado = clampTiradas(parseInt(nuevoValor, 10) || 1);
    inputTiradas.value = String(valorClampeado);

    if (emitir && typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "RULETA_COLOR_TIRADAS_STATE",
            payload: { cantidad: valorClampeado }
        });
    }
}

// Función ejecutada remotamente por OBS Viewer para sincronizar el valor del selector
window.actualizarTiradasRuletaColorObs = function(payload) {
    if (!payload || payload.cantidad === undefined) return;
    actualizarTiradasRuletaColor(payload.cantidad, false);
};

// Función ejecutada remotamente por OBS Viewer para animar el giro
window.ejecutarGiroRuletaColorObs = function(payload) {
    if (!payload || !payload.tiradas) return;
    const wheel = document.getElementById("ruletaColorWheel");
    const mensaje = document.getElementById("mensajeRuletaColor");
    const resultados = document.getElementById("resultadoRuletaColor");
    const botonGirar = document.getElementById("botonGirarRuleta");
    
    animarRuletaColor(payload.tiradas, payload.cantidad, mensaje, resultados, botonGirar, wheel);
};

// =========================================================
// SERIALIZACIÓN Y RESTAURACIÓN DE TOKEN v1 (#ruleta-colores/v1/<token>)
// =========================================================

function serializarRuletaColoresV1(estado) {
    if (!estado || !estado.colores || !Array.isArray(estado.colores)) return null;
    try {
        const payload = {
            v: 1,
            c: estado.cantidad || estado.colores.length || 1,
            ids: estado.colores.map(col => col.id || col.nombre)
        };
        const jsonStr = JSON.stringify(payload);
        return typeof window.codificarBase64URL === "function"
            ? window.codificarBase64URL(jsonStr)
            : null;
    } catch (e) {
        console.error("Error al serializar ruleta de colores a token:", e);
        return null;
    }
}
window.serializarRuletaColoresV1 = serializarRuletaColoresV1;

function restaurarRuletaColoresV1(token) {
    if (!token || typeof token !== "string") return false;
    try {
        if (typeof window.decodificarBase64URL !== "function") return false;
        const jsonStr = window.decodificarBase64URL(token.trim());
        const payload = JSON.parse(jsonStr);

        if (!payload || payload.v !== 1 || !Array.isArray(payload.ids)) return false;

        const cantidad = payload.c || payload.ids.length;
        const ids = payload.ids;

        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaRuletaColor", false);
        }

        // Inicializar ruleta SVG y botón sin limpiar resultados
        inicializarRuletaColor(false);

        // 1. Ajustar input de tiradas
        actualizarTiradasRuletaColor(cantidad, false);

        // 2. Resolver colores desde database.colores
        const coloresDisponibles = obtenerColoresRuleta();
        const coloresRecuperados = ids.map((id, idx) => {
            const encontrado = coloresDisponibles.find(c => c.id === id || c.nombre.toLowerCase() === id.toLowerCase());
            if (encontrado) return encontrado;
            // Buscar en filas crudas de database.colores si existiera
            const fila = (database?.colores || []).find(f => (Array.isArray(f) && (f[2] === id || f[0] === id)));
            if (fila && Array.isArray(fila)) {
                return {
                    id: fila[2] || id,
                    nombre: fila[0] || `Color ${idx + 1}`,
                    hex: normalizarHex(fila[1]) || "#CCCCCC"
                };
            }
            return {
                id: id,
                nombre: `Color (${id})`,
                hex: "#CCCCCC"
            };
        });

        // 3. Renderizar resultado estático en el DOM sin animación
        const resultados = document.getElementById("resultadoRuletaColor");
        const mensaje = document.getElementById("mensajeRuletaColor");
        const botonGirar = document.getElementById("botonGirarRuleta");

        if (resultados) {
            resultados.innerHTML = "";
            coloresRecuperados.forEach(col => {
                const chip = document.createElement("div");
                chip.className = "chipColorRuleta";
                chip.innerHTML = `<span class="chipColorRuleta__muestra" style="background:${col.hex}" data-tooltip="${col.nombre}"></span>`;
                resultados.appendChild(chip);
            });
        }

        if (mensaje) {
            mensaje.textContent = `¡Resultados listos!`;
        }

        if (botonGirar) {
            botonGirar.disabled = false;
        }

        window.coloresUltimoResultado = { cantidad, colores: coloresRecuperados };
        return true;
    } catch (e) {
        console.error("Error al restaurar ruleta de colores:", e);
        return false;
    }
}
window.restaurarRuletaColoresV1 = restaurarRuletaColoresV1;