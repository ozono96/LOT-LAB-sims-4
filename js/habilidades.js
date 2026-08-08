/* ==========================================================
   RANDOMIZADOR DE HABILIDADES
   habilidades.js
   Col A: Habilidad | Col B: Pack Requerido | Col C: ID (foto)
========================================================== */

const HAB = {
    packsSeleccionados: new Set(),
    habilidadesFiltradas: [],
    cantidad: 1,
    animacionActiva: false,
    _packsIniciados: false,
};

document.addEventListener("DOMContentLoaded", () => {
    const btnMenu = document.getElementById("botonHabilidades");
    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            abrirVentana("ventanaHabilidadesPacks", true);
            _habInicializarPacks();
        });
    }

    document.getElementById("aceptarPacksHabilidades")?.addEventListener("click", () => {
        if (HAB.packsSeleccionados.size === 0) {
            alert("Debes seleccionar al menos un pack para continuar.");
            return;
        }
        _habFiltrarHabilidades();
        abrirVentana("ventanaHabilidadesGenerador", true);
        _habInicializarGenerador();
    });

    document.getElementById("habBtnVolver")?.addEventListener("click", () => {
        abrirVentana("ventanaHabilidadesPacks", true);
        _habInicializarPacks();
    });

    document.getElementById("habNumeroMenos")?.addEventListener("click", () => _habCambiarCantidad(-1));
    document.getElementById("habNumeroMas")?.addEventListener("click", () => _habCambiarCantidad(1));

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
    _habInicializarSetPacks();
});

// ── Inicializar Set de packs (todos por defecto) ──────────
function _habInicializarSetPacks() {
    if (HAB._packsIniciados) return;
    HAB._packsIniciados = true;
    if (window.PACKS_SELECCIONADOS_SET && window.PACKS_SELECCIONADOS_SET.size > 0) {
        HAB.packsSeleccionados = new Set(window.PACKS_SELECCIONADOS_SET);
    } else if (typeof database !== "undefined" && database.packs) {
        database.packs.forEach(fila => {
            if (fila[0] && fila[0].trim()) HAB.packsSeleccionados.add(fila[0].trim());
            if (fila[2] && fila[2].trim()) HAB.packsSeleccionados.add(fila[2].trim());
            if (fila[4] && fila[4].trim()) HAB.packsSeleccionados.add(fila[4].trim());
            if (fila[6] && fila[6].trim()) {
                const kitId = (fila[7] || "").trim().toUpperCase();
                if (!kitId.includes("CAS")) HAB.packsSeleccionados.add(fila[6].trim());
            }
            if (fila[8] && fila[8].trim()) HAB.packsSeleccionados.add(fila[8].trim());
            if (fila[10] && fila[10].trim()) HAB.packsSeleccionados.add(fila[10].trim());
        });
    }
}

// ── Renderizar selector de packs ─────────────────────────
function _habInicializarPacks() {
    _habInicializarSetPacks();
    const contenedor = document.getElementById("listaPacksHabilidades");
    if (!contenedor) return;

    if (!database || !database.packs || database.packs.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center;opacity:0.7;'>Cargando packs...</p>";
        return;
    }

    const packsExpansion = [];
    const packsContenido = [];
    const packsAccesorios = [];
    const packsKits = [];
    const packsGratis = [];
    const juegoBase = [];

    database.packs.forEach(fila => {
        if (fila[0] && fila[0].trim()) packsExpansion.push(fila[0].trim());
        if (fila[2] && fila[2].trim()) packsContenido.push(fila[2].trim());
        if (fila[4] && fila[4].trim()) packsAccesorios.push(fila[4].trim());
        if (fila[6] && fila[6].trim()) {
            const kitId = (fila[7] || "").trim().toUpperCase();
            if (!kitId.includes("CAS")) packsKits.push(fila[6].trim());
        }
        if (fila[8] && fila[8].trim()) packsGratis.push(fila[8].trim());
        if (fila[10] && fila[10].trim()) juegoBase.push(fila[10].trim());
    });

    contenedor.innerHTML = "";

    // Juego Base + Gratuitos en la parte superior
    if (juegoBase.length > 0 || packsGratis.length > 0) {
        let seccion = "<div style='display:flex;gap:40px;justify-content:center;align-items:flex-start;flex-wrap:wrap;margin-bottom:30px;'>";
        if (juegoBase.length > 0) {
            const nb = juegoBase[0];
            const sel = HAB.packsSeleccionados.has(nb) ? "seleccionada" : "";
            seccion += "<div style='width:220px;text-align:center;'><h3 style='text-align:center;margin-bottom:15px;'>Juego Base</h3><div class='listaOpciones' style='justify-content:center;'>" + _habBtnPack(nb, sel) + "</div></div>";
        }
        if (packsGratis.length > 0) {
            const btns = packsGratis.map(p => _habBtnPack(p, HAB.packsSeleccionados.has(p) ? "seleccionada" : "")).join("");
            seccion += "<div style='width:220px;text-align:center;'><h3 style='text-align:center;margin-bottom:15px;'>Packs Gratuitos</h3><div class='listaOpciones' style='justify-content:center;'>" + btns + "</div></div>";
        }
        seccion += "</div>";
        contenedor.innerHTML += seccion;
    }

    // Categorías desplegables
    const cSel = arr => arr.filter(p => HAB.packsSeleccionados.has(p)).length;
    const gridHTML = [
        { id: "habBtnCatExp",  icono: "📦", texto: "Packs de Expansion", lista: packsExpansion },
        { id: "habBtnCatCont", icono: "💎", texto: "Packs de Contenido",  lista: packsContenido },
        { id: "habBtnCatAcc",  icono: "🎨", texto: "Packs de Accesorios", lista: packsAccesorios },
        { id: "habBtnCatKits", icono: "🎁", texto: "Kits",                lista: packsKits },
    ].map(cat =>
        "<button type='button' class='btnCategoriaDesplegable' id='" + cat.id + "'>" +
        "<span>" + cat.icono + " " + cat.texto + "</span>" +
        "<span class='badgeConteoPacks'>" + cSel(cat.lista) + " de " + cat.lista.length + " seleccionados</span>" +
        "</button>"
    ).join("");

    contenedor.innerHTML += "<div class='gridCategoriasDesplegables'>" + gridHTML + "</div>";

    document.getElementById("habBtnCatExp")?.addEventListener("click", () => _habAbrirModalPacks("📦 Packs de Expansion", packsExpansion, () => _habInicializarPacks()));
    document.getElementById("habBtnCatCont")?.addEventListener("click", () => _habAbrirModalPacks("💎 Packs de Contenido", packsContenido, () => _habInicializarPacks()));
    document.getElementById("habBtnCatAcc")?.addEventListener("click", () => _habAbrirModalPacks("🎨 Packs de Accesorios", packsAccesorios, () => _habInicializarPacks()));
    document.getElementById("habBtnCatKits")?.addEventListener("click", () => _habAbrirModalPacks("🎁 Kits", packsKits, () => _habInicializarPacks()));

    // Eventos de toggle en Juego Base / Gratuitos inline
    contenedor.querySelectorAll(".opcionFiltro[data-hab-pack]").forEach(btn => {
        btn.addEventListener("click", function () {
            const p = this.getAttribute("data-hab-pack");
            if (!p) return;
            if (HAB.packsSeleccionados.has(p)) {
                HAB.packsSeleccionados.delete(p);
                this.classList.remove("seleccionada");
            } else {
                HAB.packsSeleccionados.add(p);
                this.classList.add("seleccionada");
            }
        });
    });
}

// ── Genera HTML botón de pack para habilidades ───────────
function _habBtnPack(nombrePack, extraClases) {
    const ruta = typeof rutaIconoPack === "function" ? rutaIconoPack(nombrePack) : null;
    if (ruta) {
        return "<button class='opcionFiltro btnPackIcono " + extraClases + "' data-hab-pack='" + nombrePack + "' title='" + nombrePack + "'>" +
               "<img src='" + ruta + "' alt='" + nombrePack + "' class='iconoPack' onerror=\"this.style.display='none';this.nextElementSibling.style.display='inline'\">" +
               "<span class='iconoPackFallback' style='display:none;'>📦</span></button>";
    }
    return "<button class='opcionFiltro " + extraClases + "' data-hab-pack='" + nombrePack + "'><span>📦 " + nombrePack + "</span></button>";
}

// ── Modal de selección reutilizando el modal global ───────
function _habAbrirModalPacks(titulo, packsList, callbackCerrar) {
    const modal = document.getElementById("modalPacksCategoria");
    const tituloEl = document.getElementById("tituloModalPacks");
    const cuerpo = document.getElementById("cuerpoModalPacks");
    if (!modal || !cuerpo) return;
    if (tituloEl) tituloEl.textContent = titulo;

    let html = "";
    packsList.forEach(pack => {
        const esSel = HAB.packsSeleccionados.has(pack);
        const ruta = typeof rutaIconoPack === "function" ? rutaIconoPack(pack) : null;
        if (ruta) {
            html += "<button class='opcionFiltro btnPackIcono " + (esSel ? "seleccionada" : "") + "' data-pack='" + pack + "' title='" + pack + "'>" +
                    "<img src='" + ruta + "' alt='" + pack + "' class='iconoPack' onerror=\"this.style.display='none';this.nextElementSibling.style.display='inline'\">" +
                    "<span class='iconoPackFallback' style='display:none;'>📦</span></button>";
        } else {
            html += "<button class='opcionFiltro " + (esSel ? "seleccionada" : "") + "' data-pack='" + pack + "'><span>📦 " + pack + "</span></button>";
        }
    });
    cuerpo.innerHTML = html;

    cuerpo.querySelectorAll(".opcionFiltro[data-pack]").forEach(btn => {
        btn.addEventListener("click", function () {
            const p = this.getAttribute("data-pack");
            if (!p) return;
            if (HAB.packsSeleccionados.has(p)) {
                HAB.packsSeleccionados.delete(p);
                this.classList.remove("seleccionada");
            } else {
                HAB.packsSeleccionados.add(p);
                this.classList.add("seleccionada");
            }
            _habActualizarToggleModal(packsList);
        });
    });

    const btnToggle = document.getElementById("toggleTodosModalBtn");
    if (btnToggle) {
        _habActualizarToggleModal(packsList);
        btnToggle.onclick = () => {
            const estado = btnToggle.getAttribute("data-estado");
            if (estado === "marcado") {
                packsList.forEach(p => HAB.packsSeleccionados.delete(p));
                cuerpo.querySelectorAll(".opcionFiltro").forEach(b => b.classList.remove("seleccionada"));
                btnToggle.setAttribute("data-estado", "desmarcado");
                btnToggle.textContent = "✔️ Marcar todos";
            } else {
                packsList.forEach(p => HAB.packsSeleccionados.add(p));
                cuerpo.querySelectorAll(".opcionFiltro").forEach(b => b.classList.add("seleccionada"));
                btnToggle.setAttribute("data-estado", "marcado");
                btnToggle.textContent = "❌ Desmarcar todos";
            }
        };
    }

    const cerrarYRegen = () => { modal.classList.remove("activo"); if (callbackCerrar) callbackCerrar(); };

    const reemplazar = (id) => {
        const el = document.getElementById(id);
        if (el) { const n = el.cloneNode(true); el.parentNode.replaceChild(n, el); n.addEventListener("click", cerrarYRegen); }
    };
    reemplazar("listoModalPacksBtn");
    reemplazar("cerrarModalPacksBtn");
    reemplazar("overlayPacksCategoria");

    modal.classList.add("activo");
}

function _habActualizarToggleModal(packsList) {
    const btnToggle = document.getElementById("toggleTodosModalBtn");
    if (!btnToggle) return;
    const todos = packsList.every(p => HAB.packsSeleccionados.has(p));
    btnToggle.setAttribute("data-estado", todos ? "marcado" : "desmarcado");
    btnToggle.textContent = todos ? "❌ Desmarcar todos" : "✔️ Marcar todos";
}

// ── Filtrar habilidades por packs seleccionados ───────────
function _habFiltrarHabilidades() {
    if (!database || !database.habilidades) { HAB.habilidadesFiltradas = []; return; }
    const packsSet = HAB.packsSeleccionados;
    HAB.habilidadesFiltradas = database.habilidades.filter(fila => {
        const nombre = (fila[0] || "").trim();
        const id = (fila[2] || "").trim();
        if (!nombre && !id) return false;
        const packReq = (fila[1] || "").trim();
        if (!packReq || packReq.toLowerCase() === "base" || packReq.toLowerCase() === "juego base") return true;
        return packsSet.has(packReq);
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
    _habActualizarBotonesNumero();
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
    _habActualizarBotonesNumero();
}

function _habActualizarBotonesNumero() {
    const btnMenos = document.getElementById("habNumeroMenos");
    const btnMas = document.getElementById("habNumeroMas");
    if (btnMenos) btnMenos.disabled = HAB.cantidad <= 1;
    if (btnMas) btnMas.disabled = HAB.cantidad >= 10;
}

// ── Tirar: animación + resultado ──────────────────────────
function _habTirar() {
    if (HAB.habilidadesFiltradas.length === 0 || HAB.animacionActiva) return;
    HAB.animacionActiva = true;

    const cantidad = Math.min(HAB.cantidad, HAB.habilidadesFiltradas.length);
    const shuffled = [...HAB.habilidadesFiltradas].sort(() => Math.random() - 0.5);
    const elegidas = shuffled.slice(0, cantidad);

    const wrap = document.getElementById("habResultadoWrap");
    const pista = document.getElementById("habAnimacionPista");
    const final = document.getElementById("habResultadoFinal");
    const animacion = document.getElementById("habAnimacion");
    if (!wrap || !pista || !final || !animacion) { HAB.animacionActiva = false; return; }

    wrap.style.display = "block";
    final.style.display = "none";
    animacion.style.display = "block";

    // Construir pista de animación
    const todasAnim = [...HAB.habilidadesFiltradas].sort(() => Math.random() - 0.5);
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

    const itemW = 130;
    const numItems = pista.children.length;
    const margen = Math.max(0, numItems * itemW - animacion.offsetWidth - elegidas.length * itemW - 10);

    // Emitir animación en tiempo real a OBS
    if (typeof window.emitirEstadoEnVivoOBS === "function") {
        window.emitirEstadoEnVivoOBS("ventanaHabilidadesGenerador", {
            animacionGiro: true,
            pistaHTML: pistaHTML,
            margen: margen,
            cantidadVal: HAB.cantidad
        });
    }

    // Animación con requestAnimationFrame
    requestAnimationFrame(() => {
        pista.style.transition = "none";
        pista.style.transform = "translateX(0)";
        requestAnimationFrame(() => {
            pista.style.transition = "transform 3s cubic-bezier(0.17, 0.67, 0.12, 1)";
            pista.style.transform = "translateX(-" + margen + "px)";
            setTimeout(() => {
                animacion.style.display = "none";
                _habMostrarResultado(elegidas, final);
                HAB.animacionActiva = false;

                if (typeof window.capturarYEmitirEstadoOBS === "function") {
                    window.capturarYEmitirEstadoOBS("ventanaHabilidadesGenerador");
                }
            }, 3150);
        });
    });
}

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
