document.addEventListener("DOMContentLoaded", () => {
    const botonRuleta = document.getElementById("botonRuletaColor");
    if (botonRuleta) {
        botonRuleta.addEventListener("click", () => {
            abrirVentana("ventanaRuletaColor");
            inicializarRuletaColor();
        });
    }

    document.addEventListener("datosCargados", () => {
        inicializarRuletaColor();
    });
});

function inicializarRuletaColor() {
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
            inputTiradas.value = String(clampTiradas(valorActual + delta));
        }, { passive: false });
        inputTiradas.dataset.ruletaWheelBound = "true";
    }

    inputTiradas.addEventListener("input", () => {
        const raw = inputTiradas.value;
        if (raw === "") return; // Permite borrar el campo para escribir un número nuevo
        const val = parseInt(raw, 10);
        if (isNaN(val)) return;
        if (val > 10) inputTiradas.value = "10";
    });
    inputTiradas.addEventListener("change", () => {
        inputTiradas.value = String(clampTiradas(parseInt(inputTiradas.value, 10) || 1));
    });

    if (colores.length === 0) {
        wheel.innerHTML = '<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="90" fill="#7f8c8d" stroke="rgba(255,255,255,0.8)" stroke-width="3"/></svg>';
        mensaje.textContent = "No hay colores disponibles para mostrar en la ruleta.";
        resultados.innerHTML = "";
        botonGirar.disabled = true;
        return;
    }

    wheel.innerHTML = construirSVGRuleta(colores);
    mensaje.textContent = `Listo para girar con ${colores.length} colores disponibles.`;
    resultados.innerHTML = "";
    botonGirar.disabled = false;

    botonGirar.onclick = () => girarRuletaColor(colores, inputTiradas, mensaje, resultados, botonGirar, wheel);
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

    mensaje.textContent = "Girando...";
    resultados.innerHTML = "";
    botonGirar.disabled = true;

    let indice = 0;
    let rotacionActual = parseFloat(wheel.dataset.rotacion || "0");

    function siguienteTirada() {
        if (indice >= tiradas.length) {
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

        wheel.innerHTML = construirSVGRuleta(wheelColors);
        wheel.style.transition = "transform 4.2s cubic-bezier(0.22, 1, 0.36, 1)";
        wheel.style.transform = `rotate(${rotacionObjetivo}deg)`;
        rotacionActual = rotacionObjetivo;
        wheel.dataset.rotacion = String(rotacionActual);

        if (typeof window.emitirEstadoEnVivoOBS === "function") {
            window.emitirEstadoEnVivoOBS("ventanaRuletaColor", {
                giroAnimacion: true,
                wheelColors: wheelColors,
                rotacionObjetivo: rotacionObjetivo,
                mensajeHTML: "Girando..."
            });
        }

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
                window.setTimeout(siguienteTirada, 900);
            } else {
                botonGirar.disabled = false;
                mensaje.textContent = `¡Resultados listos!`;
            }
        }, 4300);
    }

    siguienteTirada();
}

function obtenerColoresRuleta() {
    const fallback = [
        { nombre: "Azul", hex: "#2E86DE" },
        { nombre: "Rojo", hex: "#E74C3C" },
        { nombre: "Verde", hex: "#2ECC71" },
        { nombre: "Amarillo", hex: "#F1C40F" },
        { nombre: "Morado", hex: "#9B59B6" },
        { nombre: "Naranja", hex: "#E67E22" }
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
        return {
            nombre: nombre || `Color ${index + 1}`,
            hex: normalizarHex(hex) || "#CCCCCC",
            index
        };
    }

    const texto = fila.toString().trim();
    return {
        nombre: texto || `Color ${index + 1}`,
        hex: "#CCCCCC",
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
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function clampTiradas(valor) {
    return Math.min(10, Math.max(1, Number.isFinite(valor) ? valor : 1));
}