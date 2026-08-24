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
    });

    // Opciones excluyentes: Reto con solar / Reto sin solar
    const botonesTipoReto = document.querySelectorAll("#tipoRetoOpciones .opcionFiltro");
    botonesTipoReto.forEach(boton => {
        boton.addEventListener("click", function () {
            botonesTipoReto.forEach(b => b.classList.remove("seleccionada"));
            this.classList.add("seleccionada");
            if (typeof actualizarDificultadUI === "function") actualizarDificultadUI();
        });
    });

    // Helper para emitir el estado de packs seleccionados a OBS
    function sincronizarPacksRetosOBS() {
        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            const packsArr = (PACKS_SELECCIONADOS_SET && PACKS_SELECCIONADOS_SET instanceof Set)
                ? Array.from(PACKS_SELECCIONADOS_SET)
                : [];
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "RETOS_PACKS_UPDATE",
                payload: { packs: packsArr, modoVista: MODO_VISTA_PACKS }
            });
        }
    }
    window.sincronizarPacksRetosOBS = sincronizarPacksRetosOBS;

    function obtenerEstadoOpcionesRetoCompleto() {
        const btnTipo = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
        const tipoReto = btnTipo ? (btnTipo.getAttribute("data-tipo") || "con-solar") : "con-solar";

        const opcionesExtra = [];
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltro.seleccionada").forEach(btn => {
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

        return {
            tipoReto,
            opcionesExtra,
            limitantesExtra,
            submenusConfig,
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

    // Función para actualizar el contador de dificultad en tiempo real
    function actualizarDificultadUI() {
        const valUI = document.getElementById("valDificultadUI");
        if (!valUI) return;

        let dificultad = 0;

        // "Reto con solar" suma 1
        const btnConSolar = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
        if (btnConSolar && btnConSolar.getAttribute("data-tipo") === "con-solar") {
            dificultad++;
        }

        // Opciones extra suman 1 cada una, excepto tamaño solar si área <= 900 (30x30)
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltro.seleccionada").forEach(btn => {
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

        // Opciones de tipo de solar: si hay una seleccionada y NO es "sin-tipo-solar", suma 1
        const tipoSolarSel = document.querySelector("#tipoSolarOpciones .opcionFiltro.seleccionada");
        if (tipoSolarSel) {
            if (tipoSolarSel.getAttribute("data-opcion") !== "sin-tipo-solar") {
                dificultad++;
            }
        }

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
    const botonesOpcionesExtra = document.querySelectorAll("#opcionesExtraRetos .opcionFiltro");
    botonesOpcionesExtra.forEach(boton => {
        boton.addEventListener("click", function () {
            this.classList.toggle("seleccionada");
            actualizarDificultadUI();
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

    // Opciones excluyentes: Tipo de solar (Aleatorio, Comunitarios, Residenciales, Sin tipo)
    const botonesTipoSolar = document.querySelectorAll("#tipoSolarOpciones .opcionFiltro");
    botonesTipoSolar.forEach(boton => {
        boton.addEventListener("click", function () {
            if (this.classList.contains("seleccionada")) {
                this.classList.remove("seleccionada");
            } else {
                botonesTipoSolar.forEach(b => b.classList.remove("seleccionada"));
                this.classList.add("seleccionada");
            }
            actualizarDificultadUI();
        });
    });

    // Actualizar nada más abrir la página por si hay algo marcado por defecto
    actualizarDificultadUI();

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

    // Switch de modo de vista (se inicializa una sola vez aquí, no dentro de renderizarPacksRetos)
    inicializarSelectorModoVistaPacks();
});

let MODO_VISTA_PACKS = "desplegable"; // "desplegable" | "lista"
let PACKS_SELECCIONADOS_SET = null;

function inicializarSetPacks() {
    if (PACKS_SELECCIONADOS_SET !== null) return;
    PACKS_SELECCIONADOS_SET = new Set();
    if (typeof database !== "undefined" && database.packs) {
        database.packs.forEach(fila => {
            if (fila[0] && fila[0].trim()) PACKS_SELECCIONADOS_SET.add(fila[0].trim());
            if (fila[2] && fila[2].trim()) PACKS_SELECCIONADOS_SET.add(fila[2].trim());
            if (fila[4] && fila[4].trim()) PACKS_SELECCIONADOS_SET.add(fila[4].trim());
            if (fila[6] && fila[6].trim()) {
                const kitId = (fila[7] || "").trim().toUpperCase();
                if (!kitId.includes("CAS")) PACKS_SELECCIONADOS_SET.add(fila[6].trim());
            }
            if (fila[8] && fila[8].trim()) PACKS_SELECCIONADOS_SET.add(fila[8].trim());
            if (fila[10] && fila[10].trim()) PACKS_SELECCIONADOS_SET.add(fila[10].trim());
        });
    }
    window.PACKS_SELECCIONADOS_SET = PACKS_SELECCIONADOS_SET;
}

function inicializarSelectorModoVistaPacks() {

    const switchInput = document.getElementById("toggleModoVistaInput");
    const lblDesplegable = document.getElementById("lblModoDesplegable");
    const lblLista = document.getElementById("lblModoLista");

    if (switchInput) {
        const thumb = switchInput.parentElement?.querySelector(".thumbSwitch");
        const slider = switchInput.parentElement?.querySelector(".sliderSwitch");

        function aplicarEstadoSwitch(esLista) {
            switchInput.checked = esLista;
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

        // Estado inicial
        aplicarEstadoSwitch(MODO_VISTA_PACKS === "lista");

        switchInput.addEventListener("change", () => {
            MODO_VISTA_PACKS = switchInput.checked ? "lista" : "desplegable";
            aplicarEstadoSwitch(switchInput.checked);
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

window.renderizarSelectorPacksUI = function(config) {
    const { contenedorId, setPacks, modoVista, onChange } = config;
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor || !setPacks) return;

    contenedor.innerHTML = "";

    const packsExpansion = [];
    const packsContenido = [];
    const packsAccesorios = [];
    const packsKits = [];
    const packsGratis = [];
    let juegoBaseEntradas = [];

    database.packs.forEach(fila => {
        if (fila[0] && fila[0].trim() !== "") packsExpansion.push(fila[0].trim());
        if (fila[2] && fila[2].trim() !== "") packsContenido.push(fila[2].trim());
        if (fila[4] && fila[4].trim() !== "") packsAccesorios.push(fila[4].trim());

        if (fila[6] && fila[6].trim() !== "") {
            const kitId = (fila[7] || "").trim().toUpperCase();
            if (!kitId.includes("CAS")) {
                packsKits.push(fila[6].trim());
            }
        }

        if (fila[8] && fila[8].trim() !== "") packsGratis.push(fila[8].trim());
        if (fila[10] && fila[10].trim() !== "") juegoBaseEntradas.push(fila[10].trim());
    });

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
        const selKits = contarSel(packsKits);

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
            <button type="button" class="btnCategoriaDesplegable" data-cat="kits">
                <span>🎁 Kits</span>
                <span class="badgeConteoPacks">${selKits} de ${packsKits.length} seleccionados</span>
            </button>
        `;
        htmlDesplegable += '</div>';
        contenedor.innerHTML += htmlDesplegable;

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
        contenedor.querySelector(".btnCategoriaDesplegable[data-cat='kits']")?.addEventListener("click", () => abrirModal("🎁 Kits", packsKits));

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
        gridSecciones += crearSeccion("Kits", packsKits, "packs-kits");
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
                if (idTarget === "packs-kits") targetArray = packsKits;

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

function renderizarPacksRetos() {
    inicializarSetPacks();
    window.renderizarSelectorPacksUI({
        contenedorId: "listaPacksRetos",
        setPacks: PACKS_SELECCIONADOS_SET,
        modoVista: MODO_VISTA_PACKS,
        onChange: sincronizarPacksRetosOBS
    });
}

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
    // Acepta tanto array (legado) como objeto { packs, modoVista }
    const packsArr = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.packs) ? payload.packs : null);
    const modoVista = (!Array.isArray(payload) && payload && payload.modoVista) ? payload.modoVista : null;

    if (packsArr !== null) {
        PACKS_SELECCIONADOS_SET = new Set(packsArr);
        window.PACKS_SELECCIONADOS_SET = PACKS_SELECCIONADOS_SET;
    }

    // Actualizar switch de modo de vista si difiere
    if (modoVista && modoVista !== MODO_VISTA_PACKS) {
        MODO_VISTA_PACKS = modoVista;
        const switchInput = document.getElementById("toggleModoVistaInput");
        if (switchInput) {
            switchInput.checked = (modoVista === "lista");
            switchInput.dispatchEvent(new Event("change"));
        } else if (typeof renderizarPacksRetos === "function") {
            renderizarPacksRetos();
        }
    } else if (MODO_VISTA_PACKS === "lista") {
        // En modo Lista sin cambio de vista: actualizar directamente las clases .seleccionada de los botones inline y el estado de los .toggleSeccionBtn sin reescribir innerHTML
        const contenedor = document.getElementById("listaPacksRetos");
        if (contenedor) {
            contenedor.querySelectorAll(".opcionFiltro[data-pack]").forEach(btn => {
                const packName = btn.getAttribute("data-pack");
                if (!packName) return;
                if (PACKS_SELECCIONADOS_SET.has(packName)) {
                    btn.classList.add("seleccionada");
                } else {
                    btn.classList.remove("seleccionada");
                }
            });

            // Actualizar botones de toggle de sección ("Marcar todos / Desmarcar todos")
            contenedor.querySelectorAll(".toggleSeccionBtn").forEach(btn => {
                const idTarget = btn.getAttribute("data-target");
                if (!idTarget) return;
                const opciones = contenedor.querySelectorAll(`#${idTarget} .opcionFiltro[data-pack]`);
                if (opciones.length === 0) return;
                let todosSeleccionados = true;
                opciones.forEach(op => {
                    const pk = op.getAttribute("data-pack");
                    if (pk && !PACKS_SELECCIONADOS_SET.has(pk)) {
                        todosSeleccionados = false;
                    }
                });
                if (todosSeleccionados) {
                    btn.setAttribute("data-estado", "marcado");
                    btn.textContent = "❌ Desmarcar todos";
                } else {
                    btn.setAttribute("data-estado", "desmarcado");
                    btn.textContent = "✔️ Marcar todos";
                }
            });
        }
    } else {
        // En modo Desplegable sin cambio de vista: re-renderizar badges / botones principales
        if (typeof renderizarPacksRetos === "function") renderizarPacksRetos();
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
