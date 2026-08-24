/* ==========================================================
   RANDOMIZADOR DE PACKS
   packs-azar.js
   Fuente: database.packs filtrado por PACKS_SELECCIONADOS_SET
========================================================== */

const PACKS_AZAR = {
    packsFiltrados: [],
    cantidad: 1,
    animacionActiva: false,
    acelerado: false,
    animTimer: null
};

document.addEventListener("DOMContentLoaded", () => {
    const btnMenu = document.getElementById("botonPacks");
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
            if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
        });
    }

    document.getElementById("packsBtnVolver")?.addEventListener("click", () => {
        window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
        if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
    });

    const packsWrap = document.querySelector("#ventanaPacksGenerador .habNumeroWrap");
    if (packsWrap) {
        packsWrap.addEventListener("wheel", (e) => {
            e.preventDefault();
            _packsCambiarCantidad(e.deltaY < 0 ? 1 : -1);
        }, { passive: false });
    }

    document.getElementById("packsBtnTirar")?.addEventListener("click", () => {
        if (!PACKS_AZAR.animacionActiva) _packsTirar();
    });

    document.getElementById("packsBtnAcelerar")?.addEventListener("click", () => {
        _packsAlternarAcelerar();
    });
});

document.addEventListener("datosCargados", () => {
    _packsFiltrarPacks();
});

// ── Filtrar packs por packs seleccionados en el selector común ───────
function _packsFiltrarPacks() {
    if (!database || !database.packs) { PACKS_AZAR.packsFiltrados = []; return; }
    const packsSet = window.PACKS_SELECCIONADOS_SET;
    const pares = [
        [0, 1, "Expansión"],
        [2, 3, "Contenido"],
        [4, 5, "Accesorios"],
        [6, 7, "Kits"],
        [8, 9, "Gratis"],
        [10, 11, "Juego Base"]
    ];
    const mapPacks = new Map();

    database.packs.forEach(fila => {
        pares.forEach(([colNombre, colId, tipoNombre]) => {
            const nombre = (fila[colNombre] || "").trim();
            const id = (fila[colId] || "").trim();
            if (!nombre) return;
            if (tipoNombre === "Kits") {
                const kitId = id.toUpperCase();
                if (kitId.includes("CAS")) return; // Excluir kits CAS
            }
            const esBase = tipoNombre === "Juego Base" || nombre.toLowerCase() === "base" || nombre.toLowerCase() === "juego base";
            const pasaFiltro = esBase || (packsSet && packsSet instanceof Set ? packsSet.has(nombre) : true);
            if (pasaFiltro && !mapPacks.has(nombre.toLowerCase())) {
                const rutaIcono = typeof rutaIconoPack === "function" ? rutaIconoPack(nombre) : null;
                mapPacks.set(nombre.toLowerCase(), {
                    nombre,
                    id,
                    tipo: tipoNombre,
                    rutaIcono,
                    esBase
                });
            }
        });
    });

    PACKS_AZAR.packsFiltrados = Array.from(mapPacks.values());
}

// ── Inicializar ventana generadora ────────────────────────
function _packsInicializarGenerador() {
    PACKS_AZAR.cantidad = 1;
    PACKS_AZAR.animacionActiva = false;
    PACKS_AZAR.acelerado = false;
    if (PACKS_AZAR.animTimer) { clearTimeout(PACKS_AZAR.animTimer); PACKS_AZAR.animTimer = null; }

    const input = document.getElementById("packsCantidad");
    if (input) input.value = 1;
    const wrap = document.getElementById("packsResultadoWrap");
    const final = document.getElementById("packsResultadoFinal");
    const animacion = document.getElementById("packsAnimacion");
    const pista = document.getElementById("packsAnimacionPista");
    const progresoEl = document.getElementById("packsProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("packsAcelerarWrap");

    if (wrap) wrap.style.display = "none";
    if (final) final.style.display = "none";
    if (animacion) animacion.style.display = "block";
    if (progresoEl) progresoEl.style.display = "none";
    if (acelerarWrap) acelerarWrap.style.display = "none";
    _packsActualizarUIAcelerar(false);

    if (pista) {
        pista.style.transition = "none";
        pista.style.transform = "translateX(0)";
        pista.innerHTML = "";
    }
    const btn = document.getElementById("packsBtnTirar");
    if (btn) {
        btn.disabled = PACKS_AZAR.packsFiltrados.length === 0;
        if (PACKS_AZAR.packsFiltrados.length === 0) {
            btn.innerHTML = "⚠️ Sin packs seleccionados";
        } else {
            btn.innerHTML = "<span class='habBtnIcono'>🎲</span><span>¡Tirar!</span>";
        }
    }
}

// ── Control numérico ──────────────────────────────────────
function _packsCambiarCantidad(delta) {
    const input = document.getElementById("packsCantidad");
    if (!input) return;
    const maxVal = Math.min(10, Math.max(1, PACKS_AZAR.packsFiltrados.length || 10));
    let val = Math.max(1, Math.min(maxVal, parseInt(input.value, 10) + delta));
    PACKS_AZAR.cantidad = val;
    input.value = val;

    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "PACKS_CANTIDAD_STATE",
            payload: { cantidad: val }
        });
    }
}

window.actualizarCantidadPacksObs = function (payload) {
    if (!payload || payload.cantidad === undefined) return;
    const input = document.getElementById("packsCantidad");
    if (!input) return;
    const val = Math.max(1, Math.min(10, parseInt(payload.cantidad, 10) || 1));
    PACKS_AZAR.cantidad = val;
    input.value = val;
};

// ── Control de Aceleración ────────────────────────────────
function _packsAlternarAcelerar() {
    PACKS_AZAR.acelerado = true;
    _packsActualizarUIAcelerar(true);

    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "PACKS_ACELERAR_STATE",
            payload: { acelerado: true }
        });
    }
}

function _packsActualizarUIAcelerar(activo) {
    const btn = document.getElementById("packsBtnAcelerar");
    const txt = document.getElementById("packsTextoAcelerar");
    if (btn) btn.classList.toggle("habBtnAcelerar--activo", !!activo);
    if (txt) txt.textContent = activo ? "Acelerado" : "Acelerar";
}

window.setAceleradoPacksObs = function (payload) {
    const activo = payload && payload.acelerado !== undefined ? payload.acelerado : true;
    PACKS_AZAR.acelerado = !!activo;
    _packsActualizarUIAcelerar(PACKS_AZAR.acelerado);
};

// ── Tirar: animación + resultado ──────────────────────────
function _packsTirar() {
    if (PACKS_AZAR.packsFiltrados.length === 0 || PACKS_AZAR.animacionActiva) return;
    if (window.esSincronizacionOBS) return;
    PACKS_AZAR.animacionActiva = true;

    const cantidad = Math.min(PACKS_AZAR.cantidad, PACKS_AZAR.packsFiltrados.length);
    const shuffled = [...PACKS_AZAR.packsFiltrados].sort(() => Math.random() - 0.5);
    const elegidas = shuffled.slice(0, cantidad);

    PACKS_AZAR.acelerado = false;

    if (typeof window.emitirEventoOBS === 'function') {
        window.emitirEventoOBS('TIRAR_PACKS', {
            elegidas: elegidas,
            cantidad: cantidad,
            acelerado: false
        });
    }

    _packsAnimarTirada(elegidas);
}

// ── Animación horizontal secuencial delegada al engine común ───────
function _packsAnimarTirada(elegidas) {
    PACKS_AZAR.animacionActiva = true;
    if (PACKS_AZAR.animTimer) { clearTimeout(PACKS_AZAR.animTimer); PACKS_AZAR.animTimer = null; }

    const wrap = document.getElementById("packsResultadoWrap");
    const final = document.getElementById("packsResultadoFinal");
    const animacion = document.getElementById("packsAnimacion");
    const progresoEl = document.getElementById("packsProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("packsAcelerarWrap");

    if (!wrap || !final || !animacion) { PACKS_AZAR.animacionActiva = false; return; }

    wrap.style.display = "block";
    final.style.display = "none";
    animacion.style.display = "block";

    if (elegidas.length > 1) {
        if (progresoEl) progresoEl.style.display = "flex";
        if (acelerarWrap) acelerarWrap.style.display = "flex";
        _packsActualizarUIAcelerar(PACKS_AZAR.acelerado);
    } else {
        if (progresoEl) progresoEl.style.display = "none";
        if (acelerarWrap) acelerarWrap.style.display = "none";
    }

    const fuenteAnim = (PACKS_AZAR.packsFiltrados && PACKS_AZAR.packsFiltrados.length > 0)
        ? PACKS_AZAR.packsFiltrados
        : elegidas;

    window.ejecutarGiroSecuencialSlot({
        estado: PACKS_AZAR,
        elegidas: elegidas,
        index: 0,
        fuentePool: fuenteAnim,
        ids: {
            animacion: "packsAnimacion",
            pista: "packsAnimacionPista",
            progresoWrap: "packsProgresoSeleccionWrap",
            progresoTexto: "packsProgresoTexto",
            acelerarWrap: "packsAcelerarWrap",
            final: "packsResultadoFinal",
            grid: "packsResultadoGrid"
        },
        renderItemTrackHTML: (item, idx) => {
            const nombre = item.nombre || "";
            const imgSrc = item.rutaIcono || (typeof rutaIconoPack === "function" ? rutaIconoPack(nombre) : "");
            return "<div class='habAnim-item' data-idx='" + idx + "'>" +
                (imgSrc ? "<img src='" + imgSrc + "' alt='" + nombre + "' loading='lazy' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">" : "") +
                "<span class='habAnim-fallback' style='" + (imgSrc ? "display:none;" : "") + "font-size:1.6rem;'>📦</span>" +
                "<span class='habAnim-nombre' title='" + nombre + "'>" + nombre + "</span>" +
            "</div>";
        },
        renderCardFinal: (item, i) => {
            const card = document.createElement("div");
            card.className = "habResultadoCard";
            card.style.animationDelay = (i * 0.08) + "s";
            const imgSrc = item.rutaIcono || (typeof rutaIconoPack === "function" ? rutaIconoPack(item.nombre) : null);
            const esBase = item.esBase || item.tipo === "Juego Base";
            const tipoBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                (esBase ? "🎮 Juego Base" : "📦 " + item.tipo) +
            "</div>";

            card.innerHTML =
                "<div class='habResultadoCardImg'>" +
                    (imgSrc
                        ? "<img src='" + imgSrc + "' alt='" + item.nombre + "' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">"
                        : "") +
                    "<div class='habResultadoCardFallback' style='" + (imgSrc ? "display:none" : "display:flex") + "'>📦</div>" +
                "</div>" +
                "<div class='habResultadoCardNombre'>" + item.nombre + "</div>" +
                tipoBadgeHTML;

            return card;
        }
    });
}

// ── Ejecutar tirada precalculada desde OBS ─────────────────
window.ejecutarTiradaPacksObs = function (data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaPacksGenerador", false);
    }
    if (!PACKS_AZAR.packsFiltrados || PACKS_AZAR.packsFiltrados.length === 0) {
        _packsFiltrarPacks();
    }
    if (data.acelerado !== undefined) {
        PACKS_AZAR.acelerado = !!data.acelerado;
        _packsActualizarUIAcelerar(PACKS_AZAR.acelerado);
    }
    _packsAnimarTirada(data.elegidas);
};

// ── Restaurar resultado estático en FULL_STATE sin animación ─
window.restaurarResultadoPacksObs = function (data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaPacksGenerador", false);
    }
    const wrap = document.getElementById("packsResultadoWrap");
    const final = document.getElementById("packsResultadoFinal");
    const animacion = document.getElementById("packsAnimacion");
    const progresoEl = document.getElementById("packsProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("packsAcelerarWrap");
    const grid = document.getElementById("packsResultadoGrid");
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
        const imgSrc = item.rutaIcono || (typeof rutaIconoPack === "function" ? rutaIconoPack(item.nombre) : null);
        const esBase = item.esBase || item.tipo === "Juego Base";
        const tipoBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
            (esBase ? "🎮 Juego Base" : "📦 " + item.tipo) +
        "</div>";

        card.innerHTML =
            "<div class='habResultadoCardImg'>" +
                (imgSrc
                    ? "<img src='" + imgSrc + "' alt='" + item.nombre + "' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">"
                    : "") +
                "<div class='habResultadoCardFallback' style='" + (imgSrc ? "display:none" : "display:flex") + "'>📦</div>" +
            "</div>" +
            "<div class='habResultadoCardNombre'>" + item.nombre + "</div>" +
            tipoBadgeHTML;

        grid.appendChild(card);
    });

    final.style.display = "block";
};

window._packsFiltrarPacks = _packsFiltrarPacks;
window._packsInicializarGenerador = _packsInicializarGenerador;
