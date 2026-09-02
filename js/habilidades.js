/* ==========================================================
   RANDOMIZADOR DE HABILIDADES
   habilidades.js
   Col A: Habilidad | Col B: Pack Requerido | Col C: ID (foto)
========================================================== */

const HAB = {
    habilidadesFiltradas: [],
    cantidad: 1,
    animacionActiva: false,
    acelerado: false,
    animTimer: null
};

document.addEventListener("DOMContentLoaded", () => {
    const btnMenu = document.getElementById("botonHabilidades");
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
            if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
        });
    }

    document.getElementById("habBtnVolver")?.addEventListener("click", () => {
        window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
        if (typeof abrirVentana === "function") abrirVentana("ventanaRetos", true);
    });

    const habWrap = document.querySelector("#ventanaHabilidadesGenerador .habNumeroWrap");
    if (habWrap) {
        habWrap.addEventListener("wheel", (e) => {
            e.preventDefault();
            _habCambiarCantidad(e.deltaY < 0 ? 1 : -1);
        }, { passive: false });
    }

    document.getElementById("habBtnTirar")?.addEventListener("click", () => {
        if (!HAB.animacionActiva) _habTirar();
    });

    document.getElementById("habBtnAcelerar")?.addEventListener("click", () => {
        _habAlternarAcelerar();
    });
});

document.addEventListener("datosCargados", () => {
    _habFiltrarHabilidades();
});

// ── Filtrar habilidades por packs seleccionados (Set único común) ───────
function _habFiltrarHabilidades() {
    if (!database || !database.habilidades) { HAB.habilidadesFiltradas = []; return; }
    const packsSet = window.PACKS_SELECCIONADOS_SET;
    HAB.habilidadesFiltradas = database.habilidades.filter(fila => {
        const nombre = (fila[0] || "").trim();
        const id = (fila[2] || "").trim();
        if (!nombre && !id) return false;
        const packReq = (fila[1] || "").trim();
        if (!packReq || packReq.toLowerCase() === "base" || packReq.toLowerCase() === "juego base") return true;
        return packsSet && packsSet instanceof Set ? packsSet.has(packReq) : true;
    });
}

// ── Inicializar ventana generadora ────────────────────────
function _habInicializarGenerador() {
    HAB.cantidad = 1;
    HAB.animacionActiva = false;
    HAB.acelerado = false;
    if (HAB.animTimer) { clearTimeout(HAB.animTimer); HAB.animTimer = null; }

    const input = document.getElementById("habCantidad");
    if (input) input.value = 1;
    const wrap = document.getElementById("habResultadoWrap");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    const pista = document.getElementById("habAnimacionPista");
    const progresoEl = document.getElementById("habProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("habAcelerarWrap");

    if (wrap) wrap.style.display = "none";
    if (final) final.style.display = "none";
    if (animacion) animacion.style.display = "block";
    if (progresoEl) progresoEl.style.display = "none";
    if (acelerarWrap) acelerarWrap.style.display = "none";
    _habActualizarUIAcelerar(false);

    if (pista) {
        pista.style.transition = "none";
        pista.style.transform = "translateX(0)";
        pista.innerHTML = "";
    }
    const btn = document.getElementById("habBtnTirar");
    if (btn) {
        btn.disabled = HAB.habilidadesFiltradas.length === 0;
        if (HAB.habilidadesFiltradas.length === 0) {
            btn.innerHTML = "⚠️ Sin habilidades disponibles";
        } else {
            btn.innerHTML = "<span class='habBtnIcono'>🎲</span><span>¡Tirar!</span>";
        }
    }
}

// ── Control numérico ──────────────────────────────────────
function _habCambiarCantidad(delta) {
    const input = document.getElementById("habCantidad");
    if (!input) return;
    let val = Math.max(1, Math.min(10, parseInt(input.value, 10) + delta));
    HAB.cantidad = val;
    input.value = val;

    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "HAB_CANTIDAD_STATE",
            payload: { cantidad: val }
        });
    }
}

window.actualizarCantidadHabilidadesObs = function (payload) {
    if (!payload || payload.cantidad === undefined) return;
    const input = document.getElementById("habCantidad");
    if (!input) return;
    const val = Math.max(1, Math.min(10, parseInt(payload.cantidad, 10) || 1));
    HAB.cantidad = val;
    input.value = val;
};

// ── Control de Aceleración ────────────────────────────────
function _habAlternarAcelerar() {
    HAB.acelerado = true;
    _habActualizarUIAcelerar(true);

    if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "HAB_ACELERAR_STATE",
            payload: { acelerado: true }
        });
    }
}

function _habActualizarUIAcelerar(activo) {
    const btn = document.getElementById("habBtnAcelerar");
    const txt = document.getElementById("habTextoAcelerar");
    if (btn) btn.classList.toggle("habBtnAcelerar--activo", !!activo);
    if (txt) txt.textContent = activo ? "Acelerado" : "Acelerar";
}

window.setAceleradoHabilidadesObs = function (payload) {
    const activo = payload && payload.acelerado !== undefined ? payload.acelerado : true;
    HAB.acelerado = !!activo;
    _habActualizarUIAcelerar(HAB.acelerado);
};

function _habActualizarBotonesNumero() {}

// ── Tirar: animación + resultado ──────────────────────────
function _habTirar() {
    if (HAB.habilidadesFiltradas.length === 0 || HAB.animacionActiva) return;
    if (window.esSincronizacionOBS) return;
    HAB.animacionActiva = true;

    const cantidad = Math.min(HAB.cantidad, HAB.habilidadesFiltradas.length);
    const shuffled = [...HAB.habilidadesFiltradas].sort(() => Math.random() - 0.5);
    const elegidas = shuffled.slice(0, cantidad);

    HAB.acelerado = false;

    if (typeof window.emitirEventoOBS === 'function') {
        window.emitirEventoOBS('TIRAR_HABILIDADES', {
            elegidas: elegidas,
            cantidad: cantidad,
            acelerado: false
        });
    }

    _habAnimarTirada(elegidas);
}

// ── Animación horizontal secuencial delegada al engine común ───────
function _habAnimarTirada(elegidas) {
    HAB.animacionActiva = true;
    if (HAB.animTimer) { clearTimeout(HAB.animTimer); HAB.animTimer = null; }

    const wrap = document.getElementById("habResultadoWrap");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    const progresoEl = document.getElementById("habProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("habAcelerarWrap");

    if (!wrap || !final || !animacion) { HAB.animacionActiva = false; return; }

    wrap.style.display = "block";
    final.style.display = "none";
    animacion.style.display = "block";

    if (elegidas.length > 1) {
        if (progresoEl) progresoEl.style.display = "flex";
        if (acelerarWrap) acelerarWrap.style.display = "flex";
        _habActualizarUIAcelerar(HAB.acelerado);
    } else {
        if (progresoEl) progresoEl.style.display = "none";
        if (acelerarWrap) acelerarWrap.style.display = "none";
    }

    const fuenteAnim = (HAB.habilidadesFiltradas && HAB.habilidadesFiltradas.length > 0)
        ? HAB.habilidadesFiltradas
        : elegidas;

    window.ejecutarGiroSecuencialSlot({
        estado: HAB,
        elegidas: elegidas,
        index: 0,
        fuentePool: fuenteAnim,
        ids: {
            animacion: "habAnimacion",
            pista: "habAnimacionPista",
            progresoWrap: "habProgresoSeleccionWrap",
            progresoTexto: "habProgresoTexto",
            acelerarWrap: "habAcelerarWrap",
            final: "habResultadoFinal",
            grid: "habResultadoGrid"
        },
        renderItemTrackHTML: (fila, idx) => {
            const nombre = (fila[0] || "").trim();
            const id = (fila[2] || "").trim();
            const imgHTML = id
                ? "<img src='img/Habilidades/" + id + ".webp' alt='" + nombre + "' loading='lazy' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\"><span class='habAnim-fallback' style='display:none;font-size:1.6rem;'>🧠</span>"
                : "<span class='habAnim-fallback' style='font-size:1.6rem;'>🧠</span>";
            return "<div class='habAnim-item' data-idx='" + idx + "'>" +
                imgHTML +
                "<span class='habAnim-nombre' title='" + nombre + "'>" + nombre + "</span>" +
            "</div>";
        },
        renderCardFinal: (fila, i) => {
            const nombre = (fila[0] || "").trim();
            const packReq = (fila[1] || "").trim();
            const id = (fila[2] || "").trim();
            const esBase = !packReq || packReq.toLowerCase() === "base" || packReq.toLowerCase() === "juego base";
            const nombrePackNormalizado = esBase ? "Juego Base" : packReq;
            const imgSrc = id ? "img/Habilidades/" + id + ".webp" : "";

            const rutaIcono = typeof rutaIconoPack === "function" ? rutaIconoPack(nombrePackNormalizado) : null;

            const card = document.createElement("div");
            card.className = "habResultadoCard";
            card.style.animationDelay = (i * 0.08) + "s";

            let packBadgeHTML = "";
            if (rutaIcono) {
                packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                    "<img src='" + rutaIcono + "' alt='" + nombrePackNormalizado + "' title='" + nombrePackNormalizado + "' class='iconoPackMini' style='width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;' onerror=\"this.style.display='none'\">" +
                    "<span>" + nombrePackNormalizado + "</span>" +
                "</div>";
            } else {
                packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                    (esBase ? "🎮 Juego Base" : "📦 " + packReq) +
                "</div>";
            }

            card.innerHTML =
                "<div class='habResultadoCardImg'>" +
                    (imgSrc
                        ? "<img src='" + imgSrc + "' alt='" + nombre + "' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">"
                        : "") +
                    "<div class='habResultadoCardFallback' style='" + (imgSrc ? "display:none" : "display:flex") + "'>🧠</div>" +
                "</div>" +
                "<div class='habResultadoCardNombre'>" + nombre + "</div>" +
                packBadgeHTML;

            return card;
        }
    });
}

// ── Ejecutar tirada precalculada desde OBS ─────────────────
window.ejecutarTiradaHabilidadesObs = function (data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaHabilidadesGenerador", false);
    }
    if (!HAB.habilidadesFiltradas || HAB.habilidadesFiltradas.length === 0) {
        _habFiltrarHabilidades();
    }
    if (data.acelerado !== undefined) {
        HAB.acelerado = !!data.acelerado;
        _habActualizarUIAcelerar(HAB.acelerado);
    }
    _habAnimarTirada(data.elegidas);
};

// ── Restaurar resultado estático en FULL_STATE sin animación ─
window.restaurarResultadoHabilidadesObs = function (data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaHabilidadesGenerador", false);
    }
    const wrap = document.getElementById("habResultadoWrap");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    const progresoEl = document.getElementById("habProgresoSeleccionWrap");
    const acelerarWrap = document.getElementById("habAcelerarWrap");
    const grid = document.getElementById("habResultadoGrid");
    if (!wrap || !final || !grid) return;

    wrap.style.display = "block";
    if (animacion) animacion.style.display = "none";
    if (progresoEl) progresoEl.style.display = "none";
    if (acelerarWrap) acelerarWrap.style.display = "none";

    grid.innerHTML = "";
    data.elegidas.forEach((fila, i) => {
        const nombre = (fila[0] || "").trim();
        const packReq = (fila[1] || "").trim();
        const id = (fila[2] || "").trim();
        const esBase = !packReq || packReq.toLowerCase() === "base" || packReq.toLowerCase() === "juego base";
        const nombrePackNormalizado = esBase ? "Juego Base" : packReq;
        const imgSrc = id ? "img/Habilidades/" + id + ".webp" : "";
        const rutaIcono = typeof rutaIconoPack === "function" ? rutaIconoPack(nombrePackNormalizado) : null;

        const card = document.createElement("div");
        card.className = "habResultadoCard";
        card.style.animationDelay = (i * 0.08) + "s";

        let packBadgeHTML = "";
        if (rutaIcono) {
            packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                "<img src='" + rutaIcono + "' alt='" + nombrePackNormalizado + "' title='" + nombrePackNormalizado + "' class='iconoPackMini' style='width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px;' onerror=\"this.style.display='none'\">" +
                "<span>" + nombrePackNormalizado + "</span>" +
            "</div>";
        } else {
            packBadgeHTML = "<div class='habResultadoCardPack" + (esBase ? " habResultadoCardPackBase" : "") + "'>" +
                (esBase ? "🎮 Juego Base" : "📦 " + packReq) +
            "</div>";
        }

        card.innerHTML =
            "<div class='habResultadoCardImg'>" +
                (imgSrc
                    ? "<img src='" + imgSrc + "' alt='" + nombre + "' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\">"
                    : "") +
                "<div class='habResultadoCardFallback' style='" + (imgSrc ? "display:none" : "display:flex") + "'>🧠</div>" +
            "</div>" +
            "<div class='habResultadoCardNombre'>" + nombre + "</div>" +
            packBadgeHTML;

        grid.appendChild(card);
    });

    final.style.display = "block";
};

window._habFiltrarHabilidades = _habFiltrarHabilidades;
window._habInicializarGenerador = _habInicializarGenerador;
