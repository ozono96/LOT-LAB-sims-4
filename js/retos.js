document.addEventListener("datosCargados", () => {
    inicializarSetPacks(); // Aseguramos que el Set esté listo antes de cualquier renderizado
    renderizarPacksRetos();
});

document.addEventListener("DOMContentLoaded", () => {

    // Botón Aceptar para ir a las opciones de reto o ruleta desastres
    document.getElementById("aceptarPacksRetos")?.addEventListener("click", () => {
        const packsSeleccionados = typeof obtenerPacksSeleccionadosUsuario === "function"
            ? obtenerPacksSeleccionadosUsuario()
            : [];
        if (packsSeleccionados.length === 0) {
            alert("Debes tener al menos un pack seleccionado para jugar.");
            return;
        }

        cerrarModalPacksFlotante();

        const destino = window.proximaVentanaTrasPacks || "ventanaRetosOpciones";
        window.proximaVentanaTrasPacks = null;

        // Si el destino es el generador de Habilidades, Packs o Mundos, actualizar sus filtros
        if (destino === "ventanaHabilidadesGenerador") {
            if (typeof window._habFiltrarHabilidades === "function") window._habFiltrarHabilidades();
            if (typeof window._habInicializarGenerador === "function") window._habInicializarGenerador();
        } else if (destino === "ventanaPacksGenerador") {
            if (typeof window._packsFiltrarPacks === "function") window._packsFiltrarPacks();
            if (typeof window._packsInicializarGenerador === "function") window._packsInicializarGenerador();
        } else if (destino === "ventanaMundosGenerador") {
            if (typeof window._mundosFiltrarMundos === "function") window._mundosFiltrarMundos();
            if (typeof window._mundosInicializarGenerador === "function") window._mundosInicializarGenerador();
        }

        if (typeof abrirVentana === "function") {
            abrirVentana(destino, true);
        }

        // Comprobar disponibilidad de recursos al entrar a las opciones
        setTimeout(() => {
            if (typeof window.actualizarAvisoDisponibilidadReto === "function") window.actualizarAvisoDisponibilidadReto();
        }, 100);
    });

    // Opciones excluyentes: Reto con solar / Reto sin solar
    const botonesTipoReto = document.querySelectorAll("#tipoRetoOpciones .opcionFiltro");
    botonesTipoReto.forEach(boton => {
        boton.addEventListener("click", function () {
            botonesTipoReto.forEach(b => b.classList.remove("seleccionada"));
            this.classList.add("seleccionada");
            if (typeof actualizarDificultadUI === "function") actualizarDificultadUI();
            if (typeof window.actualizarAvisoDisponibilidadReto === "function") window.actualizarAvisoDisponibilidadReto();
        });
    });

    // Helper para emitir el estado de packs seleccionados a OBS
    function sincronizarPacksRetosOBS() {
        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            const packsArr = (PACKS_SELECCIONADOS_SET && PACKS_SELECCIONADOS_SET instanceof Set)
                ? Array.from(PACKS_SELECCIONADOS_SET)
                : [];
            // Usar el estado persistido: si _modoPacksAzarActivo está seteado úsalo,
            // si no, fallback a proximaVentanaTrasPacks o estado de Permitir Kits CAS
            const esModoAzar = (window._modoPacksAzarActivo === true) ||
                (typeof window !== "undefined" && window.proximaVentanaTrasPacks === "ventanaPacksGenerador") ||
                (window.PERMITIR_KITS_CAS === true);
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "RETOS_PACKS_UPDATE",
                payload: {
                    packs: packsArr,
                    modoVista: MODO_VISTA_PACKS,
                    modoPacksAzar: esModoAzar,
                    permitirKitsCAS: (window.PERMITIR_KITS_CAS === true)
                }
            });
        }
    }
    window.sincronizarPacksRetosOBS = sincronizarPacksRetosOBS;

    function obtenerEstadoOpcionesRetoCompleto() {
        const btnTipo = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
        const tipoReto = btnTipo ? (btnTipo.getAttribute("data-tipo") || "con-solar") : "con-solar";

        const opcionesExtra = [];
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltroReto.seleccionada").forEach(btn => {
            const op = btn.getAttribute("data-opcion");
            if (op) opcionesExtra.push(op);
        });

        const limitantesExtra = [];
        document.querySelectorAll("#limitantesExtraOpciones .opcionFiltro.seleccionada").forEach(btn => {
            const lim = btn.getAttribute("data-limitante");
            if (lim) limitantesExtra.push(lim);
        });

        const submenusConfig = typeof obtenerConfigSubmenus === "function" ? obtenerConfigSubmenus() : null;
        const dificultadText = document.getElementById("valDificultadUI")?.textContent || "0";

        const btnTipoSolarSel = document.querySelector("#tipoSolarOpciones .opcionSubmenuTipoSolar.seleccionada, #tipoSolarOpciones .opcionFiltro.seleccionada");
        const tipoSolar = btnTipoSolarSel ? (btnTipoSolarSel.getAttribute("data-opcion") || "tipo-solar-aleatorio") : "tipo-solar-aleatorio";

        return {
            tipoReto,
            opcionesExtra,
            limitantesExtra,
            submenusConfig,
            tipoSolar,
            dificultadText
        };
    }

    function sincronizarOpcionesRetoOBS() {
        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "RETOS_OPCIONES_STATE",
                payload: obtenerEstadoOpcionesRetoCompleto()
            });
        }
    }
    window.sincronizarOpcionesRetoOBS = sincronizarOpcionesRetoOBS;

    function obtenerDificultadActualReto() {
        let dificultad = 0;

        // "Reto con solar" suma 1
        const btnConSolar = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
        if (btnConSolar && btnConSolar.getAttribute("data-tipo") === "con-solar") {
            dificultad++;
        }

        // Opciones extra suman 1 cada una, excepto tamaño solar si área <= 900 (30x30)
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltroReto.seleccionada").forEach(btn => {
            const op = btn.getAttribute("data-opcion");
            if (op === "tamano-solar") {
                const valTamano = document.getElementById("valTamanoSolar");
                if (valTamano && valTamano.textContent) {
                    const match = valTamano.textContent.match(/(\d+)\s*x\s*(\d+)/i);
                    if (match) {
                        const area = parseInt(match[1]) * parseInt(match[2]);
                        if (area > 900) {
                            dificultad++;
                        }
                    }
                }
            } else {
                dificultad++;
            }
        });

        // Limitantes extra (Construir / Comprar): suman tantos puntos como limitantes se vayan a sacar
        const btnConstruir = document.querySelector('#limitantesExtraOpciones .opcionFiltro[data-limitante="construir"]');
        if (btnConstruir && btnConstruir.classList.contains("seleccionada")) {
            const sliderConstruir = document.getElementById("sliderLimitanteConstruir");
            dificultad += sliderConstruir ? (parseInt(sliderConstruir.value, 10) || 1) : 1;
        }

        const btnComprar = document.querySelector('#limitantesExtraOpciones .opcionFiltro[data-limitante="comprar"]');
        if (btnComprar && btnComprar.classList.contains("seleccionada")) {
            const sliderComprar = document.getElementById("sliderLimitanteComprar");
            dificultad += sliderComprar ? (parseInt(sliderComprar.value, 10) || 1) : 1;
        }

        return dificultad;
    }
    window.obtenerDificultadActualReto = obtenerDificultadActualReto;

    // Función para actualizar el contador de dificultad en tiempo real
    function actualizarDificultadUI() {
        const valUI = document.getElementById("valDificultadUI");
        if (!valUI) return;

        const dificultad = obtenerDificultadActualReto();

        // Opciones de ayuda seleccionadas (indica ± al generar según el resultado de cada ayuda)
        const numAyudas = document.querySelectorAll("#opcionesAyudaRetos .opcionFiltro.seleccionada").length;
        if (numAyudas > 0) {
            valUI.textContent = `${dificultad} (±${numAyudas} ayuda${numAyudas > 1 ? "s" : ""})`;
        } else {
            valUI.textContent = dificultad;
        }

        sincronizarOpcionesRetoOBS();
    }

    // Exportar para que pueda ser llamada desde reto-submenus.js
    window.actualizarDificultadUI = actualizarDificultadUI;

    // Opciones extra (checkboxes múltiples)
    const botonesOpcionesExtra = document.querySelectorAll("#opcionesExtraRetos .opcionFiltroReto");
    botonesOpcionesExtra.forEach(boton => {
        boton.addEventListener("click", function () {
            this.classList.toggle("seleccionada");
            actualizarDificultadUI();
            if (typeof window.actualizarAvisoDisponibilidadReto === "function") window.actualizarAvisoDisponibilidadReto();
        });
    });

    // Opciones de ayuda (checkboxes múltiples)
    const botonesOpcionesAyuda = document.querySelectorAll("#opcionesAyudaRetos .opcionFiltro");
    botonesOpcionesAyuda.forEach(boton => {
        boton.addEventListener("click", function () {
            this.classList.toggle("seleccionada");
            actualizarDificultadUI();
        });
    });

    // Actualizar nada más abrir la página por si hay algo marcado por defecto
    actualizarDificultadUI();
    // Lanzar comprobación inicial de disponibilidad de recursos
    setTimeout(() => {
        if (typeof window.actualizarAvisoDisponibilidadReto === "function") window.actualizarAvisoDisponibilidadReto();
    }, 200);

    // Lógica para el Tooltip Flotante
    const tooltip = document.getElementById("tooltipOpciones");
    const botonesConTooltip = document.querySelectorAll(".opcionFiltro[data-tooltip]");

    if (tooltip) {
        botonesConTooltip.forEach(boton => {
            boton.addEventListener("mouseenter", function (e) {
                tooltip.textContent = this.getAttribute("data-tooltip");
                tooltip.style.display = "block";
            });
            boton.addEventListener("mousemove", function (e) {
                tooltip.style.left = e.clientX + "px";
                tooltip.style.top = (e.clientY - 10) + "px";
            });
            boton.addEventListener("mouseleave", function () {
                tooltip.style.display = "none";
            });
        });
    }

    // Botón Generar Reto
    document.getElementById("generarRetoBtn")?.addEventListener("click", () => {
        if (typeof generarReto === "function") {
            generarReto(false);
        }
    });

    // Botón Reto Aleatorio
    document.getElementById("retoAleatorioBtn")?.addEventListener("click", () => {
        if (typeof generarReto === "function") {
            generarReto(true);
        }
    });

    // Botón Volver a Modo Retos
    document.getElementById("volverModoRetosBtn")?.addEventListener("click", () => {
        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaRetos");
        }
    });

    // Botón Aceptar en aviso de dificultad insuficiente
    document.getElementById("cerrarAvisoDificultadReto")?.addEventListener("click", () => {
        if (typeof cerrarVentana === "function") {
            cerrarVentana("ventanaAvisoDificultadReto");
        }
        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaRetosOpciones", true);
        }
    });

    // Switch de modo de vista (se inicializa una sola vez aquí, no dentro de renderizarPacksRetos)
    inicializarSelectorModoVistaPacks();
});

let MODO_VISTA_PACKS = "desplegable"; // "desplegable" | "lista"
let PACKS_SELECCIONADOS_SET = null;
let PERMITIR_KITS_CAS = false;
window.PERMITIR_KITS_CAS = false;

function obtenerSetKitsCAS() {
    const setCAS = new Set();
    if (typeof database !== "undefined" && Array.isArray(database.packs)) {
        database.packs.forEach(fila => {
            const idPack = fila[7] ? String(fila[7]).trim().toUpperCase() : "";
            // Columna 6 es el nombre del kit; Columna 7 es el ID
            // Excluir ESPECIAL (que contiene contenido de Construir y sí es elegible por defecto)
            if (idPack.includes("CAS") && !idPack.includes("ESPECIAL")) {
                if (fila[6] && fila[6].trim()) {
                    setCAS.add(fila[6].trim().toLowerCase());
                }
            }
        });
    }
    return setCAS;
}
window.obtenerSetKitsCAS = obtenerSetKitsCAS;

function inicializarSetPacks() {
    if (PACKS_SELECCIONADOS_SET !== null && PACKS_SELECCIONADOS_SET.size > 0) return;
    PACKS_SELECCIONADOS_SET = new Set();
    if (typeof database !== "undefined" && database.packs && database.packs.length > 0) {
        database.packs.forEach(fila => {
            if (fila[0] && fila[0].trim()) PACKS_SELECCIONADOS_SET.add(fila[0].trim());
            if (fila[2] && fila[2].trim()) PACKS_SELECCIONADOS_SET.add(fila[2].trim());
            if (fila[4] && fila[4].trim()) PACKS_SELECCIONADOS_SET.add(fila[4].trim());
            // Todos los kits se marcan por defecto (incluidos CAS y Especial)
            if (fila[6] && fila[6].trim()) PACKS_SELECCIONADOS_SET.add(fila[6].trim());
            if (fila[8] && fila[8].trim()) PACKS_SELECCIONADOS_SET.add(fila[8].trim());
            if (fila[10] && fila[10].trim()) PACKS_SELECCIONADOS_SET.add(fila[10].trim());
        });
    }
    window.PACKS_SELECCIONADOS_SET = PACKS_SELECCIONADOS_SET;
}

function aplicarEstadoSwitchModoVista(esLista) {
    const switchInput = document.getElementById("toggleModoVistaInput");
    const lblDesplegable = document.getElementById("lblModoDesplegable");
    const lblLista = document.getElementById("lblModoLista");
    if (switchInput) switchInput.checked = esLista;
    const thumb = switchInput?.parentElement?.querySelector(".thumbSwitch");
    const slider = switchInput?.parentElement?.querySelector(".sliderSwitch");
    if (thumb) thumb.style.left = esLista ? "25px" : "3px";
    if (slider) {
        slider.style.background = esLista
            ? "rgba(52,152,219,0.3)"
            : "rgba(0,0,0,0.22)";
        slider.style.borderColor = esLista ? "var(--color-resaltado)" : "var(--borde)";
    }
    if (lblDesplegable) {
        lblDesplegable.style.opacity = esLista ? "0.6" : "1";
        lblDesplegable.style.fontWeight = esLista ? "normal" : "bold";
    }
    if (lblLista) {
        lblLista.style.opacity = esLista ? "1" : "0.6";
        lblLista.style.fontWeight = esLista ? "bold" : "normal";
    }
}
window.aplicarEstadoSwitchModoVista = aplicarEstadoSwitchModoVista;

function aplicarEstadoSwitchPermitirKitsCAS(activado) {
    const switchInput = document.getElementById("togglePermitirKitsCASInput");
    const lblEstado = document.getElementById("lblEstadoKitsCAS");
    if (switchInput) switchInput.checked = Boolean(activado);
    const thumb = switchInput?.parentElement?.querySelector(".thumbSwitchCAS");
    const slider = switchInput?.parentElement?.querySelector(".sliderSwitchCAS");
    if (thumb) thumb.style.left = activado ? "25px" : "3px";
    if (slider) {
        slider.style.background = activado
            ? "rgba(217, 70, 239, 0.3)"
            : "rgba(0, 0, 0, 0.22)";
        slider.style.borderColor = activado ? "#d946ef" : "var(--borde)";
    }
    if (lblEstado) {
        lblEstado.textContent = activado ? "ON" : "OFF";
        lblEstado.style.opacity = activado ? "1" : "0.6";
        lblEstado.style.color = activado ? "#d946ef" : "inherit";
    }
}
window.aplicarEstadoSwitchPermitirKitsCAS = aplicarEstadoSwitchPermitirKitsCAS;

function inicializarSelectorModoVistaPacks() {
    const switchInput = document.getElementById("toggleModoVistaInput");
    aplicarEstadoSwitchModoVista(MODO_VISTA_PACKS === "lista");

    if (switchInput) {
        switchInput.addEventListener("change", () => {
            MODO_VISTA_PACKS = switchInput.checked ? "lista" : "desplegable";
            aplicarEstadoSwitchModoVista(switchInput.checked);
            renderizarPacksRetos();
            sincronizarPacksRetosOBS();
        });
    }

    const switchCAS = document.getElementById("togglePermitirKitsCASInput");
    aplicarEstadoSwitchPermitirKitsCAS(PERMITIR_KITS_CAS);

    if (switchCAS) {
        switchCAS.addEventListener("change", () => {
            PERMITIR_KITS_CAS = switchCAS.checked;
            window.PERMITIR_KITS_CAS = PERMITIR_KITS_CAS;
            aplicarEstadoSwitchPermitirKitsCAS(PERMITIR_KITS_CAS);
            if (PERMITIR_KITS_CAS && typeof asegurarKitsCASInicializados === "function") {
                asegurarKitsCASInicializados();
            }
            renderizarPacksRetos();
            sincronizarPacksRetosOBS();
        });
    }
}

// --- COMPONENTES GENÉRICOS DE UI PARA SELECTORES DE PACKS ---

function actualizarEstadoToggleModalUI(packsList, setPacks) {
    const btnToggle = document.getElementById("toggleTodosModalBtn");
    if (!btnToggle) return;
    const todosSeleccionados = packsList.every(p => setPacks.has(p));
    if (todosSeleccionados) {
        btnToggle.setAttribute("data-estado", "marcado");
        btnToggle.textContent = "❌ Desmarcar todos";
    } else {
        btnToggle.setAttribute("data-estado", "desmarcado");
        btnToggle.textContent = "✔️ Marcar todos";
    }
}

function abrirModalPacksFlotanteUI(config) {
    const { titulo, packsList, setPacks, onChange, onClose, origen = "retos" } = config;
    const modal = document.getElementById("modalPacksCategoria");
    const tituloEl = document.getElementById("tituloModalPacks");
    const cuerpo = document.getElementById("cuerpoModalPacks");
    if (!modal || !cuerpo) return;

    if (tituloEl) tituloEl.textContent = titulo;

    let html = "";
    packsList.forEach(pack => {
        const esSel = setPacks.has(pack);
        html += htmlBotonPackIcono(pack, esSel ? "seleccionada" : "", `data-pack="${pack}"`);
    });
    cuerpo.innerHTML = html;

    cuerpo.querySelectorAll(".opcionFiltro[data-pack]").forEach(btn => {
        btn.addEventListener("click", function () {
            const packName = this.getAttribute("data-pack");
            if (!packName) return;
            if (setPacks.has(packName)) {
                setPacks.delete(packName);
                this.classList.remove("seleccionada");
            } else {
                setPacks.add(packName);
                this.classList.add("seleccionada");
            }
            actualizarEstadoToggleModalUI(packsList, setPacks);
            if (onChange) onChange();
        });
    });

    const btnToggle = document.getElementById("toggleTodosModalBtn");
    if (btnToggle) {
        btnToggle.onclick = () => {
            const estado = btnToggle.getAttribute("data-estado");
            if (estado === "marcado") {
                packsList.forEach(p => setPacks.delete(p));
                cuerpo.querySelectorAll(".opcionFiltro").forEach(b => b.classList.remove("seleccionada"));
            } else {
                packsList.forEach(p => setPacks.add(p));
                cuerpo.querySelectorAll(".opcionFiltro").forEach(b => b.classList.add("seleccionada"));
            }
            actualizarEstadoToggleModalUI(packsList, setPacks);
            if (onChange) onChange();
        };
    }
    actualizarEstadoToggleModalUI(packsList, setPacks);

    const cerrarYLimpiar = () => {
        modal.classList.remove("activo");
        if (onClose) onClose();
        if (typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_MODAL_PACKS", { visible: false, origen });
        }
    };
    
    const reemplazarListener = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const nuevoEl = el.cloneNode(true);
            el.parentNode.replaceChild(nuevoEl, el);
            nuevoEl.addEventListener("click", cerrarYLimpiar);
        }
    };
    reemplazarListener("cerrarModalPacksBtn");
    reemplazarListener("overlayPacksCategoria");
    reemplazarListener("listoModalPacksBtn");

    modal.classList.add("activo");
    if (typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_MODAL_PACKS", { visible: true, titulo, packs: packsList, origen });
    }
}
window.abrirModalPacksFlotanteUI = abrirModalPacksFlotanteUI;

function asegurarKitsCASInicializados() {
    if (window._kitsCASInicializados) return;
    window._kitsCASInicializados = true;
    if (typeof database !== "undefined" && database.packs && PACKS_SELECCIONADOS_SET) {
        database.packs.forEach(fila => {
            if (fila[6] && fila[6].trim()) {
                const kitId = (fila[7] || "").trim().toUpperCase();
                if (kitId.includes("CAS")) {
                    PACKS_SELECCIONADOS_SET.add(fila[6].trim());
                }
            }
        });
    }
}

window.renderizarSelectorPacksUI = function(config) {
    const { contenedorId, setPacks, modoVista, onChange } = config;
    const modoPacksAzar = Boolean(
        config.modoPacksAzar ||
        (typeof window !== "undefined" && window.proximaVentanaTrasPacks === "ventanaPacksGenerador") ||
        (typeof window !== "undefined" && window._modoPacksAzarActivo === true)
    );

    if (modoPacksAzar) {
        asegurarKitsCASInicializados();
    }

    const contenedor = document.getElementById(contenedorId);
    if (!contenedor || !setPacks) return;

    contenedor.innerHTML = "";

    const packsExpansion = [];
    const packsContenido = [];
    const packsAccesorios = [];
    const packsKitsNormales = [];
    const packsKitsConstruir = [];
    const packsKitsCAS = [];
    const packsKitsEspeciales = [];
    const packsGratis = [];
    let juegoBaseEntradas = [];

    if (typeof database !== "undefined" && database.packs) {
        database.packs.forEach(fila => {
            if (fila[0] && fila[0].trim() !== "") packsExpansion.push(fila[0].trim());
            if (fila[2] && fila[2].trim() !== "") packsContenido.push(fila[2].trim());
            if (fila[4] && fila[4].trim() !== "") packsAccesorios.push(fila[4].trim());

            if (fila[6] && fila[6].trim() !== "") {
                const kitId = (fila[7] || "").trim().toUpperCase();
                const nombreKit = fila[6].trim();
                if (kitId.includes("CAS")) {
                    packsKitsCAS.push(nombreKit);
                } else if (kitId.includes("ESPECIAL")) {
                    packsKitsEspeciales.push(nombreKit);
                    packsKitsNormales.push(nombreKit);
                } else {
                    packsKitsConstruir.push(nombreKit);
                    packsKitsNormales.push(nombreKit);
                }
            }

            if (fila[8] && fila[8].trim() !== "") packsGratis.push(fila[8].trim());
            if (fila[10] && fila[10].trim() !== "") juegoBaseEntradas.push(fila[10].trim());
        });
    }

    const tieneJuegoBase = juegoBaseEntradas.length > 0;

    if (tieneJuegoBase || packsGratis.length > 0) {
        let seccionSuperior = '<div style="display: flex; gap: 40px; justify-content: center; align-items: flex-start; flex-wrap: wrap; margin-bottom: 35px;">';

        if (tieneJuegoBase) {
            const nombreJB = juegoBaseEntradas[0];
            const esSelJB = setPacks.has(nombreJB);
            const iconoJB = htmlBotonPackIcono(nombreJB, esSelJB ? "seleccionada" : "", `data-pack="${nombreJB}" data-tipo-pack="Juego Base"`);
            seccionSuperior +=
                '<div style="width: 220px; text-align: center;">'
                + '<h3 style="text-align: center; margin-bottom: 15px;">Juego Base</h3>'
                + '<div class="listaOpciones" style="justify-content: center;">'
                + iconoJB
                + '</div>'
                + '</div>';
        }

        if (packsGratis.length > 0) {
            let botonesGratis = "";
            packsGratis.forEach(pack => {
                const esSel = setPacks.has(pack);
                botonesGratis += htmlBotonPackIcono(pack, esSel ? "seleccionada" : "", `data-pack="${pack}"`);
            });
            seccionSuperior +=
                '<div style="width: 220px; text-align: center;">'
                + '<h3 style="text-align: center; margin-bottom: 15px;">Packs Gratuitos</h3>'
                + '<div class="listaOpciones" style="justify-content: center;">' + botonesGratis + '</div>'
                + '</div>';
        }

        seccionSuperior += '</div>';
        contenedor.innerHTML += seccionSuperior;
    }

    if (modoVista === "desplegable") {
        const contarSel = (arr) => arr.filter(p => setPacks.has(p)).length;

        const selExp = contarSel(packsExpansion);
        const selCont = contarSel(packsContenido);
        const selAcc = contarSel(packsAccesorios);

        if (modoPacksAzar) {
            const selKitsConstruir = contarSel(packsKitsConstruir);
            const selKitsCAS = contarSel(packsKitsCAS);
            const selKitsEspeciales = contarSel(packsKitsEspeciales);

            // Dos filas: fila superior = packs normales, fila inferior = kits
            let htmlDesplegable = `<div class="gridCategoriasDesplegablesAzar">
                <div class="filaCategoriasDesplegables">
                    <button type="button" class="btnCategoriaDesplegable" data-cat="exp">
                        <span>📦 Packs de Expansión</span>
                        <span class="badgeConteoPacks">${selExp} de ${packsExpansion.length} seleccionados</span>
                    </button>
                    <button type="button" class="btnCategoriaDesplegable" data-cat="cont">
                        <span>💎 Packs de Contenido</span>
                        <span class="badgeConteoPacks">${selCont} de ${packsContenido.length} seleccionados</span>
                    </button>
                    <button type="button" class="btnCategoriaDesplegable" data-cat="acc">
                        <span>🎨 Packs de Accesorios</span>
                        <span class="badgeConteoPacks">${selAcc} de ${packsAccesorios.length} seleccionados</span>
                    </button>
                </div>
                <div class="filaCategoriasDesplegables">
                    <button type="button" class="btnCategoriaDesplegable" data-cat="kits-construir">
                        <span>🔨 Kits de Construir</span>
                        <span class="badgeConteoPacks">${selKitsConstruir} de ${packsKitsConstruir.length} seleccionados</span>
                    </button>
                    <button type="button" class="btnCategoriaDesplegable" data-cat="kits-cas">
                        <span>💇 Kits CAS</span>
                        <span class="badgeConteoPacks">${selKitsCAS} de ${packsKitsCAS.length} seleccionados</span>
                    </button>
                    <button type="button" class="btnCategoriaDesplegable" data-cat="kits-especiales">
                        <span>⭐ Kits Especiales</span>
                        <span class="badgeConteoPacks">${selKitsEspeciales} de ${packsKitsEspeciales.length} seleccionados</span>
                    </button>
                </div>
            </div>`;
            contenedor.innerHTML += htmlDesplegable;
        } else {
            // Modo normal: 4 categorías en grid plano
            let htmlDesplegable = '<div class="gridCategoriasDesplegables">';
            htmlDesplegable += `
                <button type="button" class="btnCategoriaDesplegable" data-cat="exp">
                    <span>📦 Packs de Expansión</span>
                    <span class="badgeConteoPacks">${selExp} de ${packsExpansion.length} seleccionados</span>
                </button>
                <button type="button" class="btnCategoriaDesplegable" data-cat="cont">
                    <span>💎 Packs de Contenido</span>
                    <span class="badgeConteoPacks">${selCont} de ${packsContenido.length} seleccionados</span>
                </button>
                <button type="button" class="btnCategoriaDesplegable" data-cat="acc">
                    <span>🎨 Packs de Accesorios</span>
                    <span class="badgeConteoPacks">${selAcc} de ${packsAccesorios.length} seleccionados</span>
                </button>
            `;
            const selKits = contarSel(packsKitsNormales);
            htmlDesplegable += `
                <button type="button" class="btnCategoriaDesplegable" data-cat="kits">
                    <span>🎁 Kits</span>
                    <span class="badgeConteoPacks">${selKits} de ${packsKitsNormales.length} seleccionados</span>
                </button>
            `;
            htmlDesplegable += '</div>';
            contenedor.innerHTML += htmlDesplegable;
        }

        const origen = config.origen || (config.contenedorId === "listaPacksHabilidades" ? "habilidades" : "retos");
        const abrirModal = (titulo, lista) => {
            abrirModalPacksFlotanteUI({
                titulo, 
                packsList: lista, 
                setPacks, 
                onChange,
                origen,
                onClose: () => { window.renderizarSelectorPacksUI(config); }
            });
        };

        contenedor.querySelector(".btnCategoriaDesplegable[data-cat='exp']")?.addEventListener("click", () => abrirModal("📦 Packs de Expansión", packsExpansion));
        contenedor.querySelector(".btnCategoriaDesplegable[data-cat='cont']")?.addEventListener("click", () => abrirModal("💎 Packs de Contenido", packsContenido));
        contenedor.querySelector(".btnCategoriaDesplegable[data-cat='acc']")?.addEventListener("click", () => abrirModal("🎨 Packs de Accesorios", packsAccesorios));

        if (modoPacksAzar) {
            contenedor.querySelector(".btnCategoriaDesplegable[data-cat='kits-construir']")?.addEventListener("click", () => abrirModal("🔨 Kits de Construir", packsKitsConstruir));
            contenedor.querySelector(".btnCategoriaDesplegable[data-cat='kits-cas']")?.addEventListener("click", () => abrirModal("💇 Kits CAS", packsKitsCAS));
            contenedor.querySelector(".btnCategoriaDesplegable[data-cat='kits-especiales']")?.addEventListener("click", () => abrirModal("⭐ Kits Especiales", packsKitsEspeciales));
        } else {
            contenedor.querySelector(".btnCategoriaDesplegable[data-cat='kits']")?.addEventListener("click", () => abrirModal("🎁 Kits", packsKitsNormales));
        }

    } else {
        function crearSeccion(titulo, listaPacks, idTarget) {
            if (listaPacks.length === 0) return "";
            let botonesPacks = "";
            let numSel = 0;
            listaPacks.forEach(function (pack) {
                const esSel = setPacks.has(pack);
                if (esSel) numSel++;
                botonesPacks += htmlBotonPackIcono(pack, esSel ? "seleccionada" : "", `data-pack="${pack}"`);
            });
            const estadoInicial = numSel === listaPacks.length ? "marcado" : "desmarcado";
            const textoBtn = numSel === listaPacks.length ? "❌ Desmarcar todos" : "✔️ Marcar todos";

            return '<div class="seccionPacksRetos" style="margin-bottom: 40px;">'
                + '<h3 style="text-align: center; margin-bottom: 12px;">' + titulo + '</h3>'
                + '<div style="display: flex; justify-content: center; margin-bottom: 14px;">'
                + '<button class="botonReto toggleSeccionBtn" data-target="' + idTarget + '" data-estado="' + estadoInicial + '">' + textoBtn + '</button>'
                + '</div>'
                + '<div id="' + idTarget + '" class="listaOpciones" style="justify-content: center; gap: 8px; flex-wrap: wrap;">' + botonesPacks + '</div>'
                + '</div>';
        }

        let gridSecciones = '<div class="gridPacksRetos">';
        gridSecciones += crearSeccion("Packs de Expansión", packsExpansion, "packs-expansion");
        gridSecciones += crearSeccion("Packs de Contenido", packsContenido, "packs-contenido");
        gridSecciones += crearSeccion("Packs de Accesorios", packsAccesorios, "packs-accesorios");

        if (modoPacksAzar) {
            gridSecciones += crearSeccion("Kits de Construir", packsKitsConstruir, "packs-kits-construir");
            gridSecciones += crearSeccion("Kits CAS", packsKitsCAS, "packs-kits-cas");
            gridSecciones += crearSeccion("Kits Especiales", packsKitsEspeciales, "packs-kits-especiales");
        } else {
            gridSecciones += crearSeccion("Kits", packsKitsNormales, "packs-kits");
        }

        gridSecciones += '</div>';
        contenedor.innerHTML += gridSecciones;

        contenedor.querySelectorAll(".toggleSeccionBtn").forEach(btn => {
            btn.addEventListener("click", function () {
                const idTarget = this.getAttribute("data-target");
                const estado = this.getAttribute("data-estado");
                const opciones = contenedor.querySelectorAll(`#${idTarget} .opcionFiltro`);

                let targetArray = [];
                if (idTarget === "packs-expansion") targetArray = packsExpansion;
                if (idTarget === "packs-contenido") targetArray = packsContenido;
                if (idTarget === "packs-accesorios") targetArray = packsAccesorios;
                if (idTarget === "packs-kits") targetArray = packsKitsNormales;
                if (idTarget === "packs-kits-construir") targetArray = packsKitsConstruir;
                if (idTarget === "packs-kits-cas") targetArray = packsKitsCAS;
                if (idTarget === "packs-kits-especiales") targetArray = packsKitsEspeciales;

                if (estado === "marcado") {
                    targetArray.forEach(p => setPacks.delete(p));
                    opciones.forEach(op => op.classList.remove("seleccionada"));
                    this.setAttribute("data-estado", "desmarcado");
                    this.textContent = "✔️ Marcar todos";
                } else {
                    targetArray.forEach(p => setPacks.add(p));
                    opciones.forEach(op => op.classList.add("seleccionada"));
                    this.setAttribute("data-estado", "marcado");
                    this.textContent = "❌ Desmarcar todos";
                }
                if (onChange) onChange();
            });
        });
    }

    contenedor.querySelectorAll(".opcionFiltro[data-pack]").forEach(boton => {
        boton.addEventListener("click", function () {
            const packName = this.getAttribute("data-pack");
            if (!packName) return;
            if (setPacks.has(packName)) {
                setPacks.delete(packName);
                this.classList.remove("seleccionada");
            } else {
                setPacks.add(packName);
                this.classList.add("seleccionada");
            }
            if (onChange) onChange();
        });
    });
}

// --- WRAPPERS PARA RETOS ---

function renderizarPacksRetos(modoAzar) {
    inicializarSetPacks();
    const contenedorToggleCAS = document.getElementById("contenedorToggleKitsCAS");
    const esGeneradorPacks = (typeof window !== "undefined" && window.proximaVentanaTrasPacks === "ventanaPacksGenerador");

    // Ocultar toggle en Packs al Azar (siempre incluye todas las categorías), mostrarlo en Retos y Ruleta Desastres
    if (contenedorToggleCAS) {
        contenedorToggleCAS.style.display = esGeneradorPacks ? "none" : "flex";
    }

    let esModoAzar;
    if (typeof modoAzar === "boolean") {
        esModoAzar = modoAzar;
    } else if (esGeneradorPacks) {
        esModoAzar = true;
    } else {
        esModoAzar = (window.PERMITIR_KITS_CAS === true);
    }

    // Persiste para que OBS y otras llamadas posteriores conozcan el modo activo
    window._modoPacksAzarActivo = esModoAzar;

    window.renderizarSelectorPacksUI({
        contenedorId: "listaPacksRetos",
        setPacks: PACKS_SELECCIONADOS_SET,
        modoVista: MODO_VISTA_PACKS,
        modoPacksAzar: esModoAzar,
        onChange: () => {
            sincronizarPacksRetosOBS();
            if (typeof window.actualizarAvisoTipoSolar === "function") window.actualizarAvisoTipoSolar();
        }
    });

    if (!window.esSincronizacionOBS && typeof sincronizarPacksRetosOBS === "function") {
        sincronizarPacksRetosOBS();
    }
}
window.renderizarPacksRetos = renderizarPacksRetos;

// Wrappers de compatibilidad para Retos (usados en obs.js y en el botón Aceptar)
function cerrarModalPacksFlotante() {
    const modal = document.getElementById("modalPacksCategoria");
    if (modal) modal.classList.remove("activo");
    renderizarPacksRetos();
    if (typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_MODAL_PACKS", { visible: false });
    }
}
window.cerrarModalPacksFlotante = cerrarModalPacksFlotante;

function abrirModalPacksFlotante(titulo, packsList) {
    abrirModalPacksFlotanteUI({
        titulo,
        packsList,
        setPacks: PACKS_SELECCIONADOS_SET,
        onChange: sincronizarPacksRetosOBS,
        onClose: renderizarPacksRetos
    });
}
window.abrirModalPacksFlotante = abrirModalPacksFlotante;

// Retorna true si el usuario tiene el Juego Base marcado
function juegoBaseMarcado() {
    if (PACKS_SELECCIONADOS_SET && PACKS_SELECCIONADOS_SET instanceof Set) {
        if (database && database.packs) {
            const filaJB = database.packs.find(f => f[10] && f[10].trim());
            if (filaJB) return PACKS_SELECCIONADOS_SET.has(filaJB[10].trim());
        }
    }
    const btn = document.getElementById("btnJuegoBase");
    return btn ? btn.classList.contains("seleccionada") : true;
}

window.actualizarPacksRetosObs = function(payload) {
    // Acepta tanto array (legado) como objeto { packs, modoVista, modoPacksAzar, permitirKitsCAS }
    const packsArr = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.packs) ? payload.packs : null);
    const modoVista = (!Array.isArray(payload) && payload && payload.modoVista) ? payload.modoVista : null;
    const modoPacksAzar = (!Array.isArray(payload) && payload && payload.modoPacksAzar) ? true : false;
    const permitirKitsCAS = (!Array.isArray(payload) && payload && typeof payload.permitirKitsCAS === "boolean") ? payload.permitirKitsCAS : null;

    if (permitirKitsCAS !== null) {
        PERMITIR_KITS_CAS = permitirKitsCAS;
        window.PERMITIR_KITS_CAS = permitirKitsCAS;
        if (typeof window.aplicarEstadoSwitchPermitirKitsCAS === "function") {
            window.aplicarEstadoSwitchPermitirKitsCAS(permitirKitsCAS);
        }
    }

    // Persistir el modo para que renderizarPacksRetos funcione correctamente en el viewer
    window._modoPacksAzarActivo = modoPacksAzar;

    if (packsArr !== null) {
        PACKS_SELECCIONADOS_SET = new Set(packsArr);
        window.PACKS_SELECCIONADOS_SET = PACKS_SELECCIONADOS_SET;
    }

    // Actualizar switch de modo de vista si difiere
    if (modoVista) {
        MODO_VISTA_PACKS = modoVista;
        if (typeof window.aplicarEstadoSwitchModoVista === "function") {
            window.aplicarEstadoSwitchModoVista(modoVista === "lista");
        }
    }

    // Siempre re-renderizar en OBS viewer con el modo explícito (sea desplegable o lista)
    if (typeof renderizarPacksRetos === "function") {
        renderizarPacksRetos(modoPacksAzar);
    }

    // Si el modal de categoría está abierto, refrescar sus botones según PACKS_SELECCIONADOS_SET
    const modal = document.getElementById("modalPacksCategoria");
    if (modal && modal.classList.contains("activo")) {
        modal.querySelectorAll(".opcionFiltro[data-pack]").forEach(btn => {
            const packName = btn.getAttribute("data-pack");
            if (!packName) return;
            if (PACKS_SELECCIONADOS_SET.has(packName)) {
                btn.classList.add("seleccionada");
            } else {
                btn.classList.remove("seleccionada");
            }
        });
    }
};

// Re-check tipo solar availability whenever packs change via OBS
const _origActualizarPacksRetosObs = window.actualizarPacksRetosObs;
window.actualizarPacksRetosObs = function(payload) {
    _origActualizarPacksRetosObs(payload);
    if (typeof window.actualizarAvisoTipoSolar === "function") {
        setTimeout(window.actualizarAvisoTipoSolar, 50);
    }
};

window.actualizarOpcionesRetoObs = function(state) {
    if (!state) return;
    window.esSincronizacionOBS = true;
    try {
        if (state.tipoReto) {
            document.querySelectorAll("#tipoRetoOpciones .opcionFiltro").forEach(b => {
                if (b.getAttribute("data-tipo") === state.tipoReto) {
                    b.classList.add("seleccionada");
                } else {
                    b.classList.remove("seleccionada");
                }
            });
        }
        if (Array.isArray(state.opcionesExtra)) {
            document.querySelectorAll("#opcionesExtraRetos .opcionFiltro").forEach(b => {
                const op = b.getAttribute("data-opcion");
                if (state.opcionesExtra.includes(op)) {
                    b.classList.add("seleccionada");
                } else {
                    b.classList.remove("seleccionada");
                }
            });
        }
        if (Array.isArray(state.limitantesExtra)) {
            document.querySelectorAll("#limitantesExtraOpciones .opcionFiltro").forEach(b => {
                const lim = b.getAttribute("data-limitante");
                if (state.limitantesExtra.includes(lim)) {
                    b.classList.add("seleccionada");
                } else {
                    b.classList.remove("seleccionada");
                }
            });
        }
        if (state.tipoSolar) {
            document.querySelectorAll("#tipoSolarOpciones .opcionSubmenuTipoSolar, #tipoSolarOpciones .opcionFiltro").forEach(b => {
                if (b.getAttribute("data-opcion") === state.tipoSolar) {
                    b.classList.add("seleccionada");
                } else {
                    b.classList.remove("seleccionada");
                }
            });
        }
        if (state.submenusConfig && typeof window.submenusConfig !== "undefined") {
            Object.assign(window.submenusConfig, state.submenusConfig);
        }
        if (typeof actualizarDificultadUI === "function") {
            actualizarDificultadUI();
        }
        if (state.dificultadText) {
            const valUI = document.getElementById("valDificultadUI");
            if (valUI) valUI.textContent = state.dificultadText;
        }
    } finally {
        setTimeout(() => { window.esSincronizacionOBS = false; }, 50);
    }
};
