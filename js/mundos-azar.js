/* ==========================================================
   RANDOMIZADOR DE MUNDOS
   mundos-azar.js
   Fuente: database.mundos filtrado por PACKS_SELECCIONADOS_SET
========================================================== */

const MUNDOS_AZAR = {
    mundosFiltrados: [],
    cantidad: 1,
    animacionActiva: false,
    acelerado: false,
    animTimer: null
};

document.addEventListener("DOMContentLoaded", () => {
    const btnMenu = document.getElementById("botonMundos");
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
            if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
        });
    }

    document.getElementById("mundosBtnVolver")?.addEventListener("click", () => {
        window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
        if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
    });

    const mundosWrap = document.querySelector("#ventanaMundosGenerador .habNumeroWrap");
    if (mundosWrap) {
        mundosWrap.addEventListener("wheel", (e) => {
            e.preventDefault();
            _mundosCambiarCantidad(e.deltaY < 0 ? 1 : -1);
        }, { passive: false });
    }

    document.getElementById("mundosBtnTirar")?.addEventListener("click", () => {
        if (!MUNDOS_AZAR.animacionActiva) _mundosTirar();
    });

    document.getElementById("mundosBtnAcelerar")?.addEventListener("click", () => {
        _mundosAlternarAcelerar();
    });
});

document.addEventListener("datosCargados", () => {
    _mundosFiltrarMundos();
});

// ── Filtrar mundos por packs seleccionados en el selector común ───────
function _mundosFiltrarMundos() {
    if (!database || !database.mundos) { MUNDOS_AZAR.mundosFiltrados = []; return; }
    const packsSet = window.PACKS_SELECCIONADOS_SET;

    // Mapa de mundo -> nombrePack a partir de los solares
    const mundoToPack = new Map();
    if (database.solares && Array.isArray(database.solares)) {
        database.solares.forEach(solar => {
            const m = (solar.mundo || "").trim().toLowerCase();
            const np = (solar.nombrePack || "").trim();
            if (m && np && !mundoToPack.has(m)) {
                mundoToPack.set(m, np);
            }
        });
    }

    const mapMundos = new Map();

    database.mundos.forEach(fila => {
        const nombre = (fila[0] || "").trim();
        const id = (fila[1] || "").trim();
        if (!nombre) return;

        const nombreLower = nombre.toLowerCase();
        let nombrePack = mundoToPack.get(nombreLower) || "Juego Base";

        // Mundos base conocidos
        if (nombreLower === "willow creek" || nombreLower === "oasis springs" || nombreLower === "newcrest") {
            nombrePack = "Juego Base";
        }

        const esBase = !nombrePack || nombrePack.toLowerCase() === "base" || nombrePack.toLowerCase() === "juego base";
        const pasaFiltro = esBase || (packsSet && packsSet instanceof Set ? packsSet.has(nombrePack) : true);

        if (pasaFiltro && !mapMundos.has(nombreLower)) {
            const rutaIcono = typeof rutaIconoMundo === "function" ? rutaIconoMundo(nombre) : null;
            mapMundos.set(nombreLower, {
                nombre,
                id,
                nombrePack,
                rutaIcono,
                esBase
            });
        }
    });

    MUNDOS_AZAR.mundosFiltrados = Array.from(mapMundos.values());
}

// ── Inicializar ventana generadora ────────────────────────
function _mundosInicializarGenerador() {
    MUNDOS_AZAR.cantidad = 1;
    MUNDOS_AZAR.animacionActiva = false;
    MUNDOS_AZAR.acelerado = false;
    if (MUNDOS_AZAR.animTimer) { clearTimeout(MUNDOS_AZAR.animTimer); MUNDOS_AZAR.animTimer = null; }

    const input = document.getElementById("mundosCantidad");
    if (input) input.value = 1;
    const wrap = document.getElementById("mundosResultadoWrap");
    const final = document.getElementById("mundosResultadoFinal");
    const animacion = document.getElementById("mundosAnimacion");
    const pista = document.getElementById("mundosAnimacionPista");
    const progresoEl = document.getElementById("mundosProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("mundosAcelerarWrap");

    if (wrap) wrap.style.display = "none";
    if (final) final.style.display = "none";
    if (animacion) animacion.style.display = "block";
    if (progresoEl) progresoEl.style.display = "none";
    if (acelerarWrap) acelerarWrap.style.display = "none";
    _mundosActualizarUIAcelerar(false);

    if (pista) {
        pista.style.transition = "none";
        pista.style.transform = "translateX(0)";
        pista.innerHTML = "";
    }
    const btn = document.getElementById("mundosBtnTirar");
    if (btn) {
        btn.disabled = MUNDOS_AZAR.mundosFiltrados.length === 0;
        if (MUNDOS_AZAR.mundosFiltrados.length === 0) {
            btn.innerHTML = "⚠️ Sin mundos disponibles";
        } else {
            btn.innerHTML = "<span class='habBtnIcono'>🎲</span><span>¡Tirar!</span>";
        }
    }
}

// ── Control numérico ──────────────────────────────────────
function _mundosCambiarCantidad(delta) {
    const input = document.getElementById("mundosCantidad");
    if (!input) return;
    const maxVal = Math.min(10, Math.max(1, MUNDOS_AZAR.mundosFiltrados.length || 10));
    let val = Math.max(1, Math.min(maxVal, parseInt(input.value, 10) + delta));
    MUNDOS_AZAR.cantidad = val;
    input.value = val;

    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "MUNDOS_CANTIDAD_STATE",
            payload: { cantidad: val }
        });
    }
}

window.actualizarCantidadMundosObs = function (payload) {
    if (!payload || payload.cantidad === undefined) return;
    const input = document.getElementById("mundosCantidad");
    if (!input) return;
    const val = Math.max(1, Math.min(10, parseInt(payload.cantidad, 10) || 1));
    MUNDOS_AZAR.cantidad = val;
    input.value = val;
};

// ── Control de Aceleración ────────────────────────────────
function _mundosAlternarAcelerar() {
    MUNDOS_AZAR.acelerado = true;
    _mundosActualizarUIAcelerar(true);

    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "MUNDOS_ACELERAR_STATE",
            payload: { acelerado: true }
        });
    }
}

function _mundosActualizarUIAcelerar(activo) {
    const btn = document.getElementById("mundosBtnAcelerar");
    const txt = document.getElementById("mundosTextoAcelerar");
    if (btn) btn.classList.toggle("habBtnAcelerar--activo", !!activo);
    if (txt) txt.textContent = activo ? "Acelerado" : "Acelerar";
}

window.setAceleradoMundosObs = function (payload) {
    const activo = payload && payload.acelerado !== undefined ? payload.acelerado : true;
    MUNDOS_AZAR.acelerado = !!activo;
    _mundosActualizarUIAcelerar(MUNDOS_AZAR.acelerado);
};

// ── Tirar: animación + resultado ──────────────────────────
function _mundosTirar() {
    if (MUNDOS_AZAR.mundosFiltrados.length === 0 || MUNDOS_AZAR.animacionActiva) return;
    if (window.esSincronizacionOBS) return;
    MUNDOS_AZAR.animacionActiva = true;

    const cantidad = Math.min(MUNDOS_AZAR.cantidad, MUNDOS_AZAR.mundosFiltrados.length);
    const shuffled = [...MUNDOS_AZAR.mundosFiltrados].sort(() => Math.random() - 0.5);
    const elegidas = shuffled.slice(0, cantidad);

    MUNDOS_AZAR.acelerado = false;

    if (typeof window.emitirEventoOBS === 'function') {
        window.emitirEventoOBS('TIRAR_MUNDOS', {
            elegidas: elegidas,
            cantidad: cantidad,
            acelerado: false
        });
    }

    _mundosAnimarTirada(elegidas);
}

// ── Animación horizontal secuencial delegada al engine común ───────
function _mundosAnimarTirada(elegidas) {
    MUNDOS_AZAR.animacionActiva = true;
    if (MUNDOS_AZAR.animTimer) { clearTimeout(MUNDOS_AZAR.animTimer); MUNDOS_AZAR.animTimer = null; }

    const wrap = document.getElementById("mundosResultadoWrap");
    const final = document.getElementById("mundosResultadoFinal");
    const animacion = document.getElementById("mundosAnimacion");
    const progresoEl = document.getElementById("mundosProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("mundosAcelerarWrap");

    if (!wrap || !final || !animacion) { MUNDOS_AZAR.animacionActiva = false; return; }

    wrap.style.display = "block";
    final.style.display = "none";
    animacion.style.display = "block";

    if (elegidas.length > 1) {
        if (progresoEl) progresoEl.style.display = "flex";
        if (acelerarWrap) acelerarWrap.style.display = "flex";
        _mundosActualizarUIAcelerar(MUNDOS_AZAR.acelerado);
    } else {
        if (progresoEl) progresoEl.style.display = "none";
        if (acelerarWrap) acelerarWrap.style.display = "none";
    }

    const fuenteAnim = (MUNDOS_AZAR.mundosFiltrados && MUNDOS_AZAR.mundosFiltrados.length > 0)
        ? MUNDOS_AZAR.mundosFiltrados
        : elegidas;

    window.ejecutarGiroSecuencialSlot({
        estado: MUNDOS_AZAR,
        elegidas: elegidas,
        index: 0,
        fuentePool: fuenteAnim,
        ids: {
            animacion: "mundosAnimacion",
            pista: "mundosAnimacionPista",
            progresoWrap: "mundosProgresoSeleccionWrap",
            progresoTexto: "mundosProgresoTexto",
            acelerarWrap: "mundosAcelerarWrap",
            final: "mundosResultadoFinal",
            grid: "mundosResultadoGrid"
        },
        renderItemTrackHTML: (item, idx) => {
            const nombre = item.nombre || "";
            const imgSrc = item.rutaIcono || (typeof rutaIconoMundo === "function" ? rutaIconoMundo(nombre) : "");
            return "<div class='habAnim-item' data-idx='" + idx + "'>" +
                (imgSrc ? "<img src='" + imgSrc + "' alt='" + nombre + "' loading='lazy' decoding='async' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">" : "") +
                "<span class='habAnim-fallback' style='" + (imgSrc ? "display:none;" : "") + "font-size:1.6rem;'>🌎</span>" +
                "<span class='habAnim-nombre' title='" + nombre + "'>" + nombre + "</span>" +
            "</div>";
        },
        renderCardFinal: (item, i) => {
            const card = document.createElement("div");
            card.className = "habResultadoCard";
            card.style.animationDelay = (i * 0.08) + "s";
            const imgSrc = item.rutaIcono || (typeof rutaIconoMundo === "function" ? rutaIconoMundo(item.nombre) : null);
            const nombrePackNormalizado = item.nombrePack || "Juego Base";
            const esBase = !item.nombrePack || item.nombrePack.toLowerCase() === "base" || item.nombrePack.toLowerCase() === "juego base";
            const rutaIconoP = typeof rutaIconoPack === "function" ? rutaIconoPack(nombrePackNormalizado) : null;

            let packBadgeHTML = "";
            if (rutaIconoP) {
                packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                    "<img src='" + rutaIconoP + "' alt='" + nombrePackNormalizado + "' title='" + nombrePackNormalizado + "' class='iconoPackMini' loading='lazy' decoding='async' style='width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;' onerror=\"this.style.display='none'\">" +
                    "<span>" + nombrePackNormalizado + "</span>" +
                "</div>";
            } else {
                packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                    (esBase ? "🎮 Juego Base" : "📦 " + nombrePackNormalizado) +
                "</div>";
            }

            card.innerHTML =
                "<div class='habResultadoCardImg'>" +
                    (imgSrc
                        ? "<img src='" + imgSrc + "' alt='" + item.nombre + "' loading='lazy' decoding='async' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">"
                        : "") +
                    "<div class='habResultadoCardFallback' style='" + (imgSrc ? "display:none" : "display:flex") + "'>🌎</div>" +
                "</div>" +
                "<div class='habResultadoCardNombre'>" + item.nombre + "</div>" +
                packBadgeHTML;

            return card;
        }
    });
}

// ── Ejecutar tirada precalculada desde OBS ─────────────────
window.ejecutarTiradaMundosObs = function (data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaMundosGenerador", false);
    }
    if (!MUNDOS_AZAR.mundosFiltrados || MUNDOS_AZAR.mundosFiltrados.length === 0) {
        _mundosFiltrarMundos();
    }
    if (data.acelerado !== undefined) {
        MUNDOS_AZAR.acelerado = !!data.acelerado;
        _mundosActualizarUIAcelerar(MUNDOS_AZAR.acelerado);
    }
    _mundosAnimarTirada(data.elegidas);
};

// ── Restaurar resultado estático en FULL_STATE sin animación ─
window.restaurarResultadoMundosObs = function (data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaMundosGenerador", false);
    }
    const wrap = document.getElementById("mundosResultadoWrap");
    const final = document.getElementById("mundosResultadoFinal");
    const animacion = document.getElementById("mundosAnimacion");
    const progresoEl = document.getElementById("mundosProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("mundosAcelerarWrap");
    const grid = document.getElementById("mundosResultadoGrid");
    if (!wrap || !final || !grid) return;

    wrap.style.display = "block";
    if (animacion) animacion.style.display = "none";
    if (progresoEl) progresoEl.style.display = "none";
    if (acelerarWrap) acelerarWrap.style.display = "none";

    grid.innerHTML = "";
    data.elegidas.forEach((item, i) => {
        const card = document.createElement("div");
        card.className = "habResultadoCard";
        card.style.animationDelay = (i * 0.08) + "s";
        const imgSrc = item.rutaIcono || (typeof rutaIconoMundo === "function" ? rutaIconoMundo(item.nombre) : null);
        const nombrePackNormalizado = item.nombrePack || "Juego Base";
        const esBase = !item.nombrePack || item.nombrePack.toLowerCase() === "base" || item.nombrePack.toLowerCase() === "juego base";
        const rutaIconoP = typeof rutaIconoPack === "function" ? rutaIconoPack(nombrePackNormalizado) : null;

        let packBadgeHTML = "";
        if (rutaIconoP) {
            packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                "<img src='" + rutaIconoP + "' alt='" + nombrePackNormalizado + "' title='" + nombrePackNormalizado + "' class='iconoPackMini' loading='lazy' decoding='async' style='width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;' onerror=\"this.style.display='none'\">" +
                "<span>" + nombrePackNormalizado + "</span>" +
            "</div>";
        } else {
            packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                (esBase ? "🎮 Juego Base" : "📦 " + nombrePackNormalizado) +
            "</div>";
        }

        card.innerHTML =
            "<div class='habResultadoCardImg'>" +
                (imgSrc
                    ? "<img src='" + imgSrc + "' alt='" + item.nombre + "' loading='lazy' decoding='async' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">"
                    : "") +
                "<div class='habResultadoCardFallback' style='" + (imgSrc ? "display:none" : "display:flex") + "'>🌎</div>" +
            "</div>" +
            "<div class='habResultadoCardNombre'>" + item.nombre + "</div>" +
            packBadgeHTML;

        grid.appendChild(card);
    });

    final.style.display = "block";
};

window._mundosFiltrarMundos = _mundosFiltrarMundos;
window._mundosInicializarGenerador = _mundosInicializarGenerador;
