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

        const destino = window.proximaVentanaTrasPacks || "ventanaRetosOpciones";
        window.proximaVentanaTrasPacks = null;

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
                tooltip.style.left = e.pageX + "px";
                tooltip.style.top = (e.pageY - 10) + "px";
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
        });
    }

    // Eventos del modal flotante (solo una vez)
    document.getElementById("cerrarModalPacksBtn")?.addEventListener("click", cerrarModalPacksFlotante);
    document.getElementById("overlayPacksCategoria")?.addEventListener("click", cerrarModalPacksFlotante);
    document.getElementById("listoModalPacksBtn")?.addEventListener("click", cerrarModalPacksFlotante);
}

function actualizarEstadoToggleModal(packsList, cuerpo) {
    const btnToggle = document.getElementById("toggleTodosModalBtn");
    if (!btnToggle) return;
    const todosSeleccionados = packsList.every(p => PACKS_SELECCIONADOS_SET.has(p));
    if (todosSeleccionados) {
        btnToggle.setAttribute("data-estado", "marcado");
        btnToggle.textContent = "❌ Desmarcar todos";
    } else {
        btnToggle.setAttribute("data-estado", "desmarcado");
        btnToggle.textContent = "✔️ Marcar todos";
    }
}

function abrirModalPacksFlotante(titulo, packsList) {
    const modal = document.getElementById("modalPacksCategoria");
    const tituloEl = document.getElementById("tituloModalPacks");
    const cuerpo = document.getElementById("cuerpoModalPacks");
    if (!modal || !cuerpo) return;

    if (tituloEl) tituloEl.textContent = titulo;

    // Renderizar iconos de packs con estado actual del Set
    let html = "";
    packsList.forEach(pack => {
        const esSel = PACKS_SELECCIONADOS_SET.has(pack);
        html += htmlBotonPackIcono(pack, esSel ? "seleccionada" : "", `data-pack="${pack}"`);
    });
    cuerpo.innerHTML = html;

    // Eventos de toggle individual en el modal
    cuerpo.querySelectorAll(".opcionFiltro[data-pack]").forEach(btn => {
        btn.addEventListener("click", function () {
            const packName = this.getAttribute("data-pack");
            if (!packName) return;
            if (PACKS_SELECCIONADOS_SET.has(packName)) {
                PACKS_SELECCIONADOS_SET.delete(packName);
                this.classList.remove("seleccionada");
            } else {
                PACKS_SELECCIONADOS_SET.add(packName);
                this.classList.add("seleccionada");
            }
            // Actualizar el texto del botón toggle al cambiar selección individual
            actualizarEstadoToggleModal(packsList, cuerpo);
        });
    });

    // Botón único de toggle Marcar/Desmarcar todos
    const btnToggle = document.getElementById("toggleTodosModalBtn");
    if (btnToggle) {
        btnToggle.onclick = () => {
            const estado = btnToggle.getAttribute("data-estado");
            if (estado === "marcado") {
                // Desmarcar todos
                packsList.forEach(p => PACKS_SELECCIONADOS_SET.delete(p));
                cuerpo.querySelectorAll(".opcionFiltro").forEach(b => b.classList.remove("seleccionada"));
                btnToggle.setAttribute("data-estado", "desmarcado");
                btnToggle.textContent = "✔️ Marcar todos";
            } else {
                // Marcar todos
                packsList.forEach(p => PACKS_SELECCIONADOS_SET.add(p));
                cuerpo.querySelectorAll(".opcionFiltro").forEach(b => b.classList.add("seleccionada"));
                btnToggle.setAttribute("data-estado", "marcado");
                btnToggle.textContent = "❌ Desmarcar todos";
            }
        };
    }

    // Estado inicial del botón toggle
    actualizarEstadoToggleModal(packsList, cuerpo);

    modal.classList.add("activo");
}

function cerrarModalPacksFlotante() {
    const modal = document.getElementById("modalPacksCategoria");
    if (modal) modal.classList.remove("activo");
    renderizarPacksRetos();
}

function renderizarPacksRetos() {
    const contenedor = document.getElementById("listaPacksRetos");
    if (!contenedor) return;

    inicializarSetPacks();

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

    // ── Sección superior: Juego Base + Gratuitos ──
    if (tieneJuegoBase || packsGratis.length > 0) {
        let seccionSuperior = '<div style="display: flex; gap: 40px; justify-content: center; align-items: flex-start; flex-wrap: wrap; margin-bottom: 35px;">';

        if (tieneJuegoBase) {
            const nombreJB = juegoBaseEntradas[0];
            const esSelJB = PACKS_SELECCIONADOS_SET.has(nombreJB);
            const iconoJB = htmlBotonPackIcono(nombreJB, esSelJB ? "seleccionada" : "", `id="btnJuegoBase" data-pack="${nombreJB}" data-tipo-pack="Juego Base"`);
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
                const esSel = PACKS_SELECCIONADOS_SET.has(pack);
                botonesGratis += htmlBotonPackIcono(pack, esSel ? "seleccionada" : "", `data-pack="${pack}"`);
            });
            seccionSuperior +=
                '<div style="width: 220px; text-align: center;">'
                + '<h3 style="text-align: center; margin-bottom: 15px;">Packs Gratuitos</h3>'
                + '<div id="packs-gratis" class="listaOpciones" style="justify-content: center;">' + botonesGratis + '</div>'
                + '</div>';
        }

        seccionSuperior += '</div>';
        contenedor.innerHTML += seccionSuperior;
    }

    if (MODO_VISTA_PACKS === "desplegable") {
        // ── Modo Ventana Desplegable: Botones de categorías principales ──
        const contarSel = (arr) => arr.filter(p => PACKS_SELECCIONADOS_SET.has(p)).length;

        const selExp = contarSel(packsExpansion);
        const selCont = contarSel(packsContenido);
        const selAcc = contarSel(packsAccesorios);
        const selKits = contarSel(packsKits);

        let htmlDesplegable = '<div class="gridCategoriasDesplegables">';

        htmlDesplegable += `
            <button type="button" class="btnCategoriaDesplegable" id="btnCatExpansion">
                <span>📦 Packs de Expansión</span>
                <span class="badgeConteoPacks">${selExp} de ${packsExpansion.length} seleccionados</span>
            </button>
            <button type="button" class="btnCategoriaDesplegable" id="btnCatContenido">
                <span>💎 Packs de Contenido</span>
                <span class="badgeConteoPacks">${selCont} de ${packsContenido.length} seleccionados</span>
            </button>
            <button type="button" class="btnCategoriaDesplegable" id="btnCatAccesorios">
                <span>🎨 Packs de Accesorios</span>
                <span class="badgeConteoPacks">${selAcc} de ${packsAccesorios.length} seleccionados</span>
            </button>
            <button type="button" class="btnCategoriaDesplegable" id="btnCatKits">
                <span>🎁 Kits</span>
                <span class="badgeConteoPacks">${selKits} de ${packsKits.length} seleccionados</span>
            </button>
        `;

        htmlDesplegable += '</div>';
        contenedor.innerHTML += htmlDesplegable;

        document.getElementById("btnCatExpansion")?.addEventListener("click", () => abrirModalPacksFlotante("📦 Packs de Expansión", packsExpansion));
        document.getElementById("btnCatContenido")?.addEventListener("click", () => abrirModalPacksFlotante("💎 Packs de Contenido", packsContenido));
        document.getElementById("btnCatAccesorios")?.addEventListener("click", () => abrirModalPacksFlotante("🎨 Packs de Accesorios", packsAccesorios));
        document.getElementById("btnCatKits")?.addEventListener("click", () => abrirModalPacksFlotante("🎁 Kits", packsKits));

    } else {
        // ── Modo Lista: Secciones completas inline ──
        function crearSeccion(titulo, listaPacks, idSeccion) {
            if (listaPacks.length === 0) return "";

            let botonesPacks = "";
            let numSel = 0;
            listaPacks.forEach(function (pack) {
                const esSel = PACKS_SELECCIONADOS_SET.has(pack);
                if (esSel) numSel++;
                botonesPacks += htmlBotonPackIcono(pack, esSel ? "seleccionada" : "", `data-pack="${pack}"`);
            });

            const estadoInicial = numSel === listaPacks.length ? "marcado" : "desmarcado";
            const textoBtn = numSel === listaPacks.length ? "❌ Desmarcar todos" : "✔️ Marcar todos";

            return '<div class="seccionPacksRetos" style="margin-bottom: 40px;">'
                + '<h3 style="text-align: center; margin-bottom: 12px;">' + titulo + '</h3>'
                + '<div style="display: flex; justify-content: center; margin-bottom: 14px;">'
                + '<button class="botonReto toggleSeccionBtn" data-target="' + idSeccion + '" data-estado="' + estadoInicial + '">' + textoBtn + '</button>'
                + '</div>'
                + '<div id="' + idSeccion + '" class="listaOpciones" style="justify-content: center; gap: 8px; flex-wrap: wrap;">' + botonesPacks + '</div>'
                + '</div>';
        }

        let gridSecciones = '<div class="gridPacksRetos">';
        gridSecciones += crearSeccion("Packs de Expansión", packsExpansion, "packs-expansion");
        gridSecciones += crearSeccion("Packs de Contenido", packsContenido, "packs-contenido");
        gridSecciones += crearSeccion("Packs de Accesorios", packsAccesorios, "packs-accesorios");
        gridSecciones += crearSeccion("Kits", packsKits, "packs-kits");
        gridSecciones += '</div>';

        contenedor.innerHTML += gridSecciones;

        // Evento toggle marcar/desmarcar todos
        document.querySelectorAll(".toggleSeccionBtn").forEach(btn => {
            btn.addEventListener("click", function () {
                const idTarget = this.getAttribute("data-target");
                const estado = this.getAttribute("data-estado");
                const opciones = document.querySelectorAll(`#${idTarget} .opcionFiltro`);

                let targetArray = [];
                if (idTarget === "packs-expansion") targetArray = packsExpansion;
                if (idTarget === "packs-contenido") targetArray = packsContenido;
                if (idTarget === "packs-accesorios") targetArray = packsAccesorios;
                if (idTarget === "packs-kits") targetArray = packsKits;

                if (estado === "marcado") {
                    targetArray.forEach(p => PACKS_SELECCIONADOS_SET.delete(p));
                    opciones.forEach(op => op.classList.remove("seleccionada"));
                    this.setAttribute("data-estado", "desmarcado");
                    this.textContent = "✔️ Marcar todos";
                } else {
                    targetArray.forEach(p => PACKS_SELECCIONADOS_SET.add(p));
                    opciones.forEach(op => op.classList.add("seleccionada"));
                    this.setAttribute("data-estado", "marcado");
                    this.textContent = "❌ Desmarcar todos";
                }
            });
        });
    }

    // Eventos click en botones de pack inline (Juego Base y Gratuitos o lista)
    contenedor.querySelectorAll(".opcionFiltro[data-pack]").forEach(boton => {
        boton.addEventListener("click", function () {
            const packName = this.getAttribute("data-pack");
            if (!packName) return;
            if (PACKS_SELECCIONADOS_SET.has(packName)) {
                PACKS_SELECCIONADOS_SET.delete(packName);
                this.classList.remove("seleccionada");
            } else {
                PACKS_SELECCIONADOS_SET.add(packName);
                this.classList.add("seleccionada");
            }
        });
    });
}

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
