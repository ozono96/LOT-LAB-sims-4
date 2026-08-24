/* ==========================================================
   RANDOMIZADOR DE HABILIDADES
   habilidades.js
   Col A: Habilidad | Col B: Pack Requerido | Col C: ID (foto)
========================================================== */

const HAB = {
    habilidadesFiltradas: [],
    cantidad: 1,
    animacionActiva: false
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
    const input = document.getElementById("habCantidad");
    if (input) input.value = 1;
    const wrap = document.getElementById("habResultadoWrap");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    if (wrap) wrap.style.display = "none";
    if (final) final.style.display = "none";
    if (animacion) animacion.style.display = "block";
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

// Función ejecutada remotamente por OBS Viewer para sincronizar el valor del selector
window.actualizarCantidadHabilidadesObs = function(payload) {
    if (!payload || payload.cantidad === undefined) return;
    const input = document.getElementById("habCantidad");
    if (!input) return;
    const val = Math.max(1, Math.min(10, parseInt(payload.cantidad, 10) || 1));
    HAB.cantidad = val;
    input.value = val;
};

function _habActualizarBotonesNumero() {
    // Botones eliminados; función conservada por compatibilidad con llamadas existentes
}

// ── Tirar: animación + resultado ──────────────────────────
function _habTirar() {
    if (HAB.habilidadesFiltradas.length === 0 || HAB.animacionActiva) return;
    if (window.esSincronizacionOBS) return; // Viewer no debe tirar por su cuenta
    HAB.animacionActiva = true;

    const cantidad = Math.min(HAB.cantidad, HAB.habilidadesFiltradas.length);
    const shuffled = [...HAB.habilidadesFiltradas].sort(() => Math.random() - 0.5);
    const elegidas = shuffled.slice(0, cantidad);

    if (typeof window.emitirEventoOBS === 'function') {
        window.emitirEventoOBS('TIRAR_HABILIDADES', {
            elegidas: elegidas,
            cantidad: cantidad
        });
    }

    _habAnimarTirada(elegidas);
}

// ── Animación extraída para ser reutilizable por OBS ───────
function _habAnimarTirada(elegidas) {
    HAB.animacionActiva = true;
    const wrap = document.getElementById("habResultadoWrap");
    const pista = document.getElementById("habAnimacionPista");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    if (!wrap || !pista || !final || !animacion) { HAB.animacionActiva = false; return; }

    wrap.style.display = "block";
    final.style.display = "none";
    animacion.style.display = "block";

    // Construir pista de animación (usar elegidas como fallback si habilidadesFiltradas está vacío)
    const fuenteAnim = (HAB.habilidadesFiltradas && HAB.habilidadesFiltradas.length > 0)
        ? HAB.habilidadesFiltradas
        : elegidas;
    const todasAnim = [...fuenteAnim].sort(() => Math.random() - 0.5);
    let pistaHTML = "";

    const crearItemHTML = (fila, claseExtra) => {
        const nombre = (fila[0] || "").trim();
        const id = (fila[2] || "").trim();
        const imgHTML = id
            ? "<img src='img/Habilidades/" + id + ".png' alt='" + nombre + "' loading='lazy' onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex'\"><span class='habAnim-fallback' style='display:none;font-size:1.6rem;'>🧠</span>"
            : "<span class='habAnim-fallback' style='font-size:1.6rem;'>🧠</span>";
        return "<div class='habAnim-item" + (claseExtra ? " " + claseExtra : "") + "'>" + imgHTML + "<span class='habAnim-nombre'>" + nombre + "</span></div>";
    };

    for (let r = 0; r < 3; r++) {
        todasAnim.forEach(fila => { pistaHTML += crearItemHTML(fila, ""); });
    }
    elegidas.forEach(fila => { pistaHTML += crearItemHTML(fila, "habAnim-item--elegida"); });

    pista.innerHTML = pistaHTML;

    // Animación con requestAnimationFrame
    requestAnimationFrame(() => {
        const itemW = 130;
        const numItems = pista.children.length;
        const animWidth = animacion.offsetWidth || 400;
        const margen = Math.max(0, numItems * itemW - animWidth - elegidas.length * itemW - 10);
        pista.style.transition = "none";
        pista.style.transform = "translateX(0)";
        requestAnimationFrame(() => {
            pista.style.transition = "transform 3s cubic-bezier(0.17, 0.67, 0.12, 1)";
            pista.style.transform = "translateX(-" + margen + "px)";
            setTimeout(() => {
                animacion.style.display = "none";
                _habMostrarResultado(elegidas, final);
                HAB.animacionActiva = false;
            }, 3150);
        });
    });
}

// ── Ejecutar tirada precalculada desde OBS ─────────────────
window.ejecutarTiradaHabilidadesObs = function(data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaHabilidadesGenerador", false);
    }
    if (!HAB.habilidadesFiltradas || HAB.habilidadesFiltradas.length === 0) {
        _habFiltrarHabilidades();
    }
    _habAnimarTirada(data.elegidas);
};

// ── Restaurar resultado estático en FULL_STATE sin animación ─
window.restaurarResultadoHabilidadesObs = function(data) {
    if (!data || !data.elegidas) return;
    if (typeof window.abrirVentana === "function") {
        window.abrirVentana("ventanaHabilidadesGenerador", false);
    }
    const wrap = document.getElementById("habResultadoWrap");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    if (!wrap || !final) return;

    wrap.style.display = "block";
    if (animacion) animacion.style.display = "none";
    _habMostrarResultado(data.elegidas, final);
};

window._habFiltrarHabilidades = _habFiltrarHabilidades;
window._habInicializarGenerador = _habInicializarGenerador;

// ── Mostrar resultado final ───────────────────────────────
function _habMostrarResultado(elegidas, finalEl) {
    const grid = document.getElementById("habResultadoGrid");
    if (!grid) return;

    // Eliminar botón tirar otra vez si existía anteriormente
    const oldBtn = finalEl.querySelector(".habBtnTirarOtraVez");
    if (oldBtn) oldBtn.remove();

    grid.innerHTML = "";

    elegidas.forEach((fila, i) => {
        const nombre = (fila[0] || "").trim();
        const packReq = (fila[1] || "").trim();
        const id = (fila[2] || "").trim();
        const esBase = !packReq || packReq.toLowerCase() === "base" || packReq.toLowerCase() === "juego base";
        const nombrePackNormalizado = esBase ? "Juego Base" : packReq;
        const imgSrc = id ? "img/Habilidades/" + id + ".png" : "";

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

    finalEl.style.display = "block";
}
