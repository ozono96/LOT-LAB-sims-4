/* =========================================================
   LOT-LAB SIMS 4 - TIER LIST (INTERFAZ Y RENDERIZADO)
   js/tier-list-ui.js
   ========================================================= */

(function () {
    "use strict";

    let _dragActivo = null;
    let _tierEditandoColor = null;
    let _itemEditandoEncuadre = null;
    let _encuadreTemp = { x: 0, y: 0, zoom: 1 };
    let _eventosCabeceraVinculados = false;
    let _snapshotDeshacer = null;

    // ── UTILIDADES DE COLOR Y DEGRADADOS DINÁMICOS ────────────
    function parsearColorRGBA(colorStr) {
        if (!colorStr) return { r: 255, g: 77, b: 77, a: 1 };

        if (colorStr.startsWith("#")) {
            let hex = colorStr.slice(1);
            if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
            if (hex.length === 6) hex += "ff";
            const num = parseInt(hex, 16);
            return {
                r: (num >> 24) & 255,
                g: (num >> 16) & 255,
                b: (num >> 8) & 255,
                a: +(((num & 255) / 255).toFixed(2))
            };
        }

        const match = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
        }

        return { r: 255, g: 77, b: 77, a: 1 };
    }

    function calcularDegradadoFila(colorStr) {
        const { r, g, b, a } = parsearColorRGBA(colorStr);
        const opacidadIni = Math.min(1, Math.max(0.15, a * 0.42));
        const opacidadFin = Math.max(0.02, a * 0.04);
        return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, ${opacidadIni}) 0%, rgba(${r}, ${g}, ${b}, ${opacidadFin}) 85%, transparent 100%)`;
    }

    function calcularContrasteTexto(colorStr) {
        const { r, g, b } = parsearColorRGBA(colorStr);
        const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminancia > 0.62 ? "#1a1a1a" : "#ffffff";
    }

    // ── VINCULAR BOTONES DE LA CABECERA ESTÁNDAR ───────────────
    function vincularEventosCabecera() {
        if (_eventosCabeceraVinculados) return;
        _eventosCabeceraVinculados = true;

        const btnCerrar = document.getElementById("tierlistBtnCerrar");
        btnCerrar?.addEventListener("click", (e) => {
            const estado = window.EstadoTierList;
            if (estado && estado.pantalla === "tablero") {
                e.stopPropagation();
                e.stopImmediatePropagation();
                _snapshotDeshacer = null;
                estado.pantalla = "selector";
                if (window.TierListCore && typeof window.TierListCore.notificarCambioEstado === "function") {
                    window.TierListCore.notificarCambioEstado();
                }
                renderizarTierList();
                if (typeof window.actualizarHashURL === "function") {
                    window.actualizarHashURL("tier-list", false);
                }
                return;
            }

            if (typeof window.cerrarVentana === "function") {
                window.cerrarVentana("ventanaTierList");
            }
            if (typeof window.sincronizarCierreVentanaExperimental === "function") {
                window.sincronizarCierreVentanaExperimental("ventanaTierList");
            }
        }, true);

        const btnCompartir = document.getElementById("tierlistBtnCompartir");
        btnCompartir?.addEventListener("click", (e) => {
            const token = window.TierListCore.serializarEstadoURL();
            if (token) {
                const urlCompleta = window.location.origin + window.location.pathname + "#tier-list/v1/" + token;
                navigator.clipboard.writeText(urlCompleta).then(() => {
                    if (typeof window.mostrarTooltipFeedback === "function") {
                        window.mostrarTooltipFeedback(e, e.currentTarget, "¡Enlace copiado!");
                    }
                }).catch(() => {
                    prompt("Copia el siguiente enlace para compartir tu Tier List:", urlCompleta);
                });
            }
        });

        const btnCapturar = document.getElementById("tierlistBtnCapturar");
        btnCapturar?.addEventListener("click", async (e) => {
            e.stopPropagation();
            const ventana = document.getElementById("ventanaTierList");
            if (!ventana || typeof window.capturarElemento !== "function") return;

            ventana.classList.add("tierlist-modo-captura");
            try {
                await window.capturarElemento(ventana, "LOT-LAB_TierList");
            } finally {
                ventana.classList.remove("tierlist-modo-captura");
            }
        });
    }

    // ── INICIALIZACIÓN DE LA HERRAMIENTA ───────────────────────
    async function inicializarTierList(forzarReinicio = false) {
        const estado = window.EstadoTierList;

        let tieneTokenURL = false;
        const hash = (window.location.hash || "").replace(/^[#/]+/, "").trim();
        if (hash.startsWith("tier-list/v1/") || hash.startsWith("tierlist/v1/")) {
            const token = hash.replace(/^tier-?list\/v1\//, "").trim();
            if (token && window.TierListCore.deserializarEstadoURL(token)) {
                tieneTokenURL = true;
            }
        }

        if (!tieneTokenURL && !forzarReinicio && !window.TierListCore.borradorResuelto && window.TierListCore.hayBorradorRecuperable()) {
            // Guard: no crear un segundo modal si ya hay uno abierto
            if (!document.getElementById("tierlistRecuperarModal")) {
                mostrarModalRecuperacion();
            }
            return;
        }

        window.TierListCore.borradorResuelto = true;

        if (!tieneTokenURL) {
            if (window.TierListCore && typeof window.TierListCore.sincronizarModosConPreferencias === "function") {
                window.TierListCore.sincronizarModosConPreferencias();
            }
            if (!window.database || !Array.isArray(window.database.mundos) || window.database.mundos.length === 0) {
                document.addEventListener("datosCargados", () => {
                    inicializarTierList(forzarReinicio);
                }, { once: true });
            }
            if (estado.pantalla === "tablero") {
                window.TierListCore.sincronizarElementosDisponibles(estado.modo);
            }
        }

        renderizarTierList();
    }

    // ── RENDERIZADO PRINCIPAL ─────────────────────────────────
    function renderizarTierList() {
        const contenedorDinamico = document.getElementById("tierlistContenidoDinamico");
        if (!contenedorDinamico) return;

        const estado = window.EstadoTierList;
        const esOBSViewer = document.body.classList.contains("modo-obs");

        vincularEventosCabecera();

        // Control de visibilidad de botones en la cabecera estándar
        const btnCompartir = document.getElementById("tierlistBtnCompartir");
        const btnCapturar = document.getElementById("tierlistBtnCapturar");
        const btnCerrar = document.getElementById("tierlistBtnCerrar");

        if (btnCompartir) {
            btnCompartir.style.display = (estado.pantalla === "tablero" && estado.modo !== "personalizada" && !esOBSViewer) ? "" : "none";
        }
        if (btnCapturar) {
            btnCapturar.style.display = (estado.pantalla === "tablero" && !esOBSViewer) ? "" : "none";
        }
        if (btnCerrar) {
            btnCerrar.style.display = esOBSViewer ? "none" : "";
        }

        // En OBS Viewer siempre forzamos pantalla de tablero
        if (esOBSViewer) {
            estado.pantalla = "tablero";
        }

        if (estado.pantalla === "selector") {
            renderizarPantallaSelector(contenedorDinamico);
        } else {
            renderizarPantallaTablero(contenedorDinamico, esOBSViewer);
        }
    }

    // ── PANTALLA 1: SELECTOR DE MODO Y CONFIGURACIÓN PREVIA ───
    function renderizarPantallaSelector(contenedor) {
        const estado = window.EstadoTierList;
        const modoSel = estado.modo || "mundos";

        const filtrosMundos = estado.modos.mundos.filtros || [];
        const filtrosPacks = estado.modos.packs.filtros || [];

        const todosMundos = ["base", "expansion", "contenido"].every(k => filtrosMundos.includes(k));
        const todosPacks = ["base", "expansion", "contenido", "accesorios", "kits", "gratuitos"].every(k => filtrosPacks.includes(k));

        contenedor.innerHTML = `
        <div class="tierlist-selector-pantalla" id="tierlistSelectorPantalla">
            <div class="tierlist-selector-hero">
                <h3 class="tierlist-selector-titulo">Elige el tipo de Tier List</h3>
                <p class="tierlist-selector-subtitulo">Selecciona qué contenido quieres clasificar y configúralo antes de entrar al tablero</p>
            </div>

            <!-- 3 Tarjetas de Modo -->
            <div class="tierlist-selector-modos">
                <div class="tierlist-card-modo ${modoSel === 'mundos' ? 'seleccionado' : ''}" data-modo="mundos">
                    <div class="tierlist-card-icono">🌍</div>
                    <div class="tierlist-card-titulo">Mundos</div>
                    <div class="tierlist-card-desc">Clasifica los mundos oficiales de Los Sims 4</div>
                </div>

                <div class="tierlist-card-modo ${modoSel === 'packs' ? 'seleccionado' : ''}" data-modo="packs">
                    <div class="tierlist-card-icono">📦</div>
                    <div class="tierlist-card-titulo">Packs</div>
                    <div class="tierlist-card-desc">Expansiones, contenido, accesorios, kits y packs gratuitos</div>
                </div>

                <div class="tierlist-card-modo ${modoSel === 'personalizada' ? 'seleccionado' : ''}" data-modo="personalizada">
                    <div class="tierlist-card-icono">✨</div>
                    <div class="tierlist-card-titulo">Personalizada</div>
                    <div class="tierlist-card-desc">Sube tus propias imágenes y recórtalas a tu gusto</div>
                </div>
            </div>

            <!-- Panel de opciones según el modo seleccionado -->
            <div class="tierlist-selector-config">
                <!-- Modo Mundos -->
                <div class="tierlist-config-seccion" id="tierlistConfigMundos" style="${modoSel === 'mundos' ? '' : 'display:none;'}">
                    <div class="tierlist-config-titulo">¿Qué mundos quieres incluir?</div>
                    <div class="tierlist-filtros-chips">
                        <label class="tierlist-chip-filtro ${todosMundos ? 'activo' : ''}">
                            <input type="checkbox" id="checkMundos_todos" ${todosMundos ? 'checked' : ''}>
                            <span>Todos</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosMundos.includes('base') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-mundo" value="base" ${filtrosMundos.includes('base') ? 'checked' : ''}>
                            <span>Juego base</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosMundos.includes('expansion') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-mundo" value="expansion" ${filtrosMundos.includes('expansion') ? 'checked' : ''}>
                            <span>Expansiones</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosMundos.includes('contenido') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-mundo" value="contenido" ${filtrosMundos.includes('contenido') ? 'checked' : ''}>
                            <span>Contenido</span>
                        </label>
                    </div>
                </div>

                <!-- Modo Packs -->
                <div class="tierlist-config-seccion" id="tierlistConfigPacks" style="${modoSel === 'packs' ? '' : 'display:none;'}">
                    <div class="tierlist-config-titulo">¿Qué packs quieres incluir?</div>
                    <div class="tierlist-filtros-chips">
                        <label class="tierlist-chip-filtro ${todosPacks ? 'activo' : ''}">
                            <input type="checkbox" id="checkPacks_todos" ${todosPacks ? 'checked' : ''}>
                            <span>Todos</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosPacks.includes('base') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-pack" value="base" ${filtrosPacks.includes('base') ? 'checked' : ''}>
                            <span>Juego base</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosPacks.includes('expansion') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-pack" value="expansion" ${filtrosPacks.includes('expansion') ? 'checked' : ''}>
                            <span>Expansiones</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosPacks.includes('contenido') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-pack" value="contenido" ${filtrosPacks.includes('contenido') ? 'checked' : ''}>
                            <span>Contenido</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosPacks.includes('accesorios') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-pack" value="accesorios" ${filtrosPacks.includes('accesorios') ? 'checked' : ''}>
                            <span>Accesorios</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosPacks.includes('kits') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-pack" value="kits" ${filtrosPacks.includes('kits') ? 'checked' : ''}>
                            <span>Kits</span>
                        </label>
                        <label class="tierlist-chip-filtro ${filtrosPacks.includes('gratuitos') ? 'activo' : ''}">
                            <input type="checkbox" class="check-filtro-pack" value="gratuitos" ${filtrosPacks.includes('gratuitos') ? 'checked' : ''}>
                            <span>Packs gratuitos</span>
                        </label>
                    </div>
                </div>

                <!-- Modo Personalizada -->
                <div class="tierlist-config-seccion" id="tierlistConfigPersonalizada" style="${modoSel === 'personalizada' ? '' : 'display:none;'}">
                    <p class="tierlist-personalizada-intro">
                        📸 Podrás subir tus propias imágenes desde tu dispositivo directamente en el área "Sin clasificar". Para cada imagen podrás elegir individualmente si se verá en formato cuadrado o circular y ajustar su encuadre 1:1.
                    </p>
                </div>
            </div>

            <div class="tierlist-selector-error" id="tierlistSelectorError" style="display:none;"></div>

            <!-- Botón Destacado de Entrada -->
            <div class="tierlist-selector-footer">
                <button type="button" class="tierlist-btn-entrar" id="btnEntrarTierList">
                    <span>🚀</span> ENTRAR A LA TIER LIST
                </button>
            </div>
        </div>
        `;

        vincularEventosSelector(contenedor);
    }

    function vincularEventosSelector(contenedor) {
        const estado = window.EstadoTierList;

        // Selección de tarjeta de modo
        contenedor.querySelectorAll(".tierlist-card-modo").forEach(card => {
            card.addEventListener("click", () => {
                const modo = card.dataset.modo;
                if (modo === estado.modo) return;

                estado.modo = modo;

                contenedor.querySelectorAll(".tierlist-card-modo").forEach(c => {
                    c.classList.toggle("seleccionado", c.dataset.modo === modo);
                });

                const cfgMundos = contenedor.querySelector("#tierlistConfigMundos");
                const cfgPacks = contenedor.querySelector("#tierlistConfigPacks");
                const cfgPers = contenedor.querySelector("#tierlistConfigPersonalizada");

                if (cfgMundos) cfgMundos.style.display = modo === "mundos" ? "" : "none";
                if (cfgPacks) cfgPacks.style.display = modo === "packs" ? "" : "none";
                if (cfgPers) cfgPers.style.display = modo === "personalizada" ? "" : "none";

                contenedor.querySelector("#tierlistSelectorError").style.display = "none";
            });
        });

        // ── Lógica bidireccional Mundos ──
        const checkTodosMundos = contenedor.querySelector("#checkMundos_todos");
        const checksMundos = contenedor.querySelectorAll(".check-filtro-mundo");

        function actualizarFiltrosMundosDesdeChecks() {
            const vals = [];
            checksMundos.forEach(c => {
                c.parentElement.classList.toggle("activo", c.checked);
                if (c.checked) vals.push(c.value);
            });
            const todos = vals.length === checksMundos.length;
            if (checkTodosMundos) {
                checkTodosMundos.checked = todos;
                checkTodosMundos.parentElement.classList.toggle("activo", todos);
            }
            estado.modos.mundos.filtros = vals;
        }

        checkTodosMundos?.addEventListener("change", (e) => {
            const marcar = e.target.checked;
            checksMundos.forEach(c => { c.checked = marcar; });
            actualizarFiltrosMundosDesdeChecks();
        });

        checksMundos.forEach(c => {
            c.addEventListener("change", () => {
                actualizarFiltrosMundosDesdeChecks();
            });
        });

        // ── Lógica bidireccional Packs ──
        const checkTodosPacks = contenedor.querySelector("#checkPacks_todos");
        const checksPacks = contenedor.querySelectorAll(".check-filtro-pack");

        function actualizarFiltrosPacksDesdeChecks() {
            const vals = [];
            checksPacks.forEach(c => {
                c.parentElement.classList.toggle("activo", c.checked);
                if (c.checked) vals.push(c.value);
            });
            const todos = vals.length === checksPacks.length;
            if (checkTodosPacks) {
                checkTodosPacks.checked = todos;
                checkTodosPacks.parentElement.classList.toggle("activo", todos);
            }
            estado.modos.packs.filtros = vals;
        }

        checkTodosPacks?.addEventListener("change", (e) => {
            const marcar = e.target.checked;
            checksPacks.forEach(c => { c.checked = marcar; });
            actualizarFiltrosPacksDesdeChecks();
        });

        checksPacks.forEach(c => {
            c.addEventListener("change", () => {
                actualizarFiltrosPacksDesdeChecks();
            });
        });

        // Botón ENTRAR
        contenedor.querySelector("#btnEntrarTierList")?.addEventListener("click", () => {
            const errEl = contenedor.querySelector("#tierlistSelectorError");
            if (estado.modo === "mundos" && estado.modos.mundos.filtros.length === 0) {
                if (errEl) {
                    errEl.textContent = "Debes seleccionar al menos una categoría de mundos para entrar.";
                    errEl.style.display = "block";
                }
                return;
            }
            if (estado.modo === "packs" && estado.modos.packs.filtros.length === 0) {
                if (errEl) {
                    errEl.textContent = "Debes seleccionar al menos una categoría de packs para entrar.";
                    errEl.style.display = "block";
                }
                return;
            }

            // Sincronizar y pasar a tablero
            window.TierListCore.sincronizarElementosDisponibles(estado.modo);
            estado.pantalla = "tablero";
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();
            if (typeof window.actualizarHashURL === "function") {
                window.actualizarHashURL("tier-list/" + estado.modo, false);
            }
        });
    }

    // ── PANTALLA 2: TABLERO DE TRABAJO ────────────────────────
    function renderizarPantallaTablero(contenedor, esOBSViewer) {
        const estado = window.EstadoTierList;
        const alcance = (window.TierListCore && typeof window.TierListCore.obtenerAlcanceCambios === "function")
            ? window.TierListCore.obtenerAlcanceCambios()
            : "todos";
        const alcanceEsTodos = alcance === "todos";

        let html = `
        <div class="tierlist-contenedor" id="tierlistContenedorPrincipal">
            <!-- Barra superior del Tablero -->
            ${!esOBSViewer ? `
            <div class="tierlist-tablero-topbar">
                <!-- Fila 1: botón volver (izquierda) + título (centrado) -->
                <div class="tierlist-topbar-fila1">
                    <button type="button" class="tierlist-btn-volver-selector" id="tierlistBtnVolverSelector" data-tooltip="Volver al selector de modo">
                        <span>←</span><span>Cambiar modo</span>
                    </button>

                    <div class="tierlist-titulo-wrap">
                        <input type="text" class="tierlist-titulo-input" id="tierlistTituloInput" value="${escapeHtml(estado.titulo)}" placeholder="Título de la Tier List" maxlength="80">
                    </div>

                    <!-- Espaciador invisible para equilibrar el botón izquierdo -->
                    <div class="tierlist-topbar-spacer" aria-hidden="true"></div>
                </div>

                <!-- Fila 2: botones de acción (centrados) -->
                <div class="tierlist-acciones-grupo">
                    <!-- Selector de Alcance de Cambios: Solo este / Todos -->
                    <div class="tierlist-control-alcance" data-tooltip="Elige si los cambios de los tiers se aplican solo a este Tier List o a todos">
                        <span class="tierlist-control-alcance-label">Aplicar cambios:</span>
                        <label class="switchModoVista tierlist-switch-alcance">
                            <span id="lblAlcanceSoloEste" class="tierlist-switch-label ${!alcanceEsTodos ? 'activo' : ''}">Solo este</span>
                            <input type="checkbox" id="tierlistToggleAlcanceInput" style="display: none;" ${alcanceEsTodos ? 'checked' : ''}>
                            <span class="sliderSwitch">
                                <span class="thumbSwitch"></span>
                            </span>
                            <span id="lblAlcanceTodos" class="tierlist-switch-label ${alcanceEsTodos ? 'activo' : ''}">Todos</span>
                        </label>
                    </div>

                    ${estado.modo === 'personalizada' ? `
                    <!-- Selector de Apariencia: Cuadrado / Libre / Redondo -->
                    <div class="tierlist-control-forma" id="tierlistControlForma" data-tooltip="Elige la apariencia global de las imágenes">
                        <span class="tierlist-control-forma-label">Apariencia:</span>
                        <div class="tierlist-forma3-track" id="tierlistForma3Track" role="slider" aria-label="Apariencia de imágenes">
                            <span class="tierlist-forma3-dot" data-forma="cuadrado" data-tooltip="Cuadrado"></span>
                            <span class="tierlist-forma3-dot" data-forma="libre" data-tooltip="Libre (individual)"></span>
                            <span class="tierlist-forma3-dot" data-forma="circulo" data-tooltip="Redondo"></span>
                            <span class="tierlist-forma3-thumb" id="tierlistForma3Thumb"></span>
                        </div>
                        <span class="tierlist-forma3-label" id="tierlistForma3Label">${
                            (estado.modos.personalizada._modoFormaGlobal || 'libre') === 'cuadrado' ? 'Cuadrado' :
                            (estado.modos.personalizada._modoFormaGlobal || 'libre') === 'circulo' ? 'Redondo' : 'Libre'
                        }</span>
                    </div>
                    ` : ''}

                    <button type="button" class="tierlist-btn-secundario" id="tierlistBtnExportarLab" data-tooltip="Guardar archivo .lotlab">
                        <span>💾</span><span>Guardar .lotlab</span>
                    </button>
                    <button type="button" class="tierlist-btn-secundario" id="tierlistBtnImportarLab" data-tooltip="Cargar archivo .lotlab">
                        <span>📂</span><span>Cargar .lotlab</span>
                    </button>
                    <input type="file" id="tierlistFileInputLab" accept=".lotlab,application/json" style="display:none;">

                    ${_snapshotDeshacer ? `
                    <button type="button" class="tierlist-btn-secundario tierlist-btn-deshacer" id="tierlistBtnDeshacer" data-tooltip="Deshacer última acción de limpieza o restauración">
                        <span>↶</span><span>Deshacer</span>
                    </button>
                    ` : ''}

                    <button type="button" class="tierlist-btn-secundario tierlist-btn-limpiar" id="tierlistBtnResetear" data-tooltip="Limpiar tablero">
                        <span>🔄</span><span>Limpiar</span>
                    </button>
                </div>
            </div>
            ` : `
            <div class="tierlist-titulo-wrap">
                <input type="text" class="tierlist-titulo-input" id="tierlistTituloInput" value="${escapeHtml(estado.titulo)}" placeholder="Título de la Tier List" readonly>
            </div>
            `}

            <!-- TABLERO DE TIERS (ÁREA CAPTURABLE) -->
            <div class="tierlist-tablero" id="tierlistTablero">
                ${renderizarFilasTiers(estado, esOBSViewer)}
            </div>

            <!-- ZONA SIN CLASIFICAR -->
            <div class="tierlist-sin-clasificar-wrap" id="tierlistSinClasificarWrap" data-vacia="${estado.sinClasificar.length === 0 ? 'true' : 'false'}">
                <div class="tierlist-sin-clasificar-header">
                    <div class="tierlist-sin-clasificar-titulo">
                        <span>📥</span><span>Sin clasificar</span>
                    </div>
                    <span class="tierlist-sin-clasificar-contador">${estado.sinClasificar.length}</span>
                </div>

                <div class="tierlist-sin-clasificar-zona" id="tierlistZonaSinClasificar" data-tier-id="sin_clasificar">
                    ${renderizarZonaSinClasificarContenido(estado, esOBSViewer)}
                </div>

                ${estado.modo === 'personalizada' && !esOBSViewer ? `
                <input type="file" id="tierlistFileInputImagenes" multiple accept="image/png,image/jpeg,image/webp,image/jpg,image/gif" style="display:none;">
                ` : ''}
            </div>

            ${estado.modo === 'personalizada' ? `
            <!-- Descargo de responsabilidad en Personalizada -->
            <div class="tierlist-descargo-responsabilidad">
                <div class="tierlist-descargo-titulo">Aviso sobre contenido personalizado</div>
                <div class="tierlist-descargo-texto">Las imágenes utilizadas en esta Tier List son proporcionadas por el usuario. LOT-LAB no se hace responsable del contenido de las imágenes mostradas ni del uso que se haga de ellas. El usuario es responsable de asegurarse de que dispone de los derechos y de que el uso del contenido cumple la legislación y las normas aplicables.</div>
            </div>
            ` : ''}
        </div>
        `;

        contenedor.innerHTML = html;
        ajustarDimensionesFichas(contenedor);
        vincularEventosTablero(contenedor, esOBSViewer);
    }

    // ── RENDERIZAR FILAS DE TIERS ─────────────────────────────
    function renderizarFilasTiers(estado, esOBSViewer) {
        const esMovil = typeof window !== "undefined" && window.innerWidth <= 768;
        const anchoMin = esMovil ? 85 : 110;
        const anchoMax = Math.round(anchoMin * 2.2);
        const prefs = window.TierListCore?.obtenerPreferenciasGlobales?.() || {};

        const tiers = estado.tiers.map((tier, idx) => {
            const degradado = calcularDegradadoFila(tier.color);
            const colorTexto = calcularContrasteTexto(tier.color);
            const anchoDeseado = tier.ancho || prefs.anchoGlobal || null;
            const anchoEfectivo = anchoDeseado ? Math.max(anchoMin, Math.min(anchoMax, Math.round(anchoDeseado))) : null;
            const anchoStyle = anchoEfectivo ? `width: ${anchoEfectivo}px; min-width: ${anchoEfectivo}px;` : '';

            return `
            <div class="tierlist-fila" data-tier-id="${tier.id}">
                <div class="tierlist-etiqueta-col" style="background-color: ${tier.color}; color: ${colorTexto}; ${anchoStyle}">
                    <span class="tierlist-etiqueta-texto" data-tooltip="Clic para renombrar tier">${escapeHtml(tier.nombre)}</span>

                    ${!esOBSViewer ? `
                    <div class="tierlist-etiqueta-controles">
                        <button type="button" class="tierlist-btn-config-tier btnColorTier" data-tier-id="${tier.id}" data-tooltip="Cambiar color y nombre">🎨</button>
                        <button type="button" class="tierlist-btn-config-tier btnEliminarTier" data-tier-id="${tier.id}" data-tooltip="Eliminar tier">🗑️</button>
                    </div>
                    ` : ''}
                </div>

                ${!esOBSViewer ? `
                <div class="tierlist-tier-drag-handle" data-tier-id="${tier.id}" data-tooltip="Arrastra verticalmente para reordenar&#10;Arrastra horizontalmente para redimensionar" aria-label="Arrastra verticalmente para reordenar. Arrastra horizontalmente para redimensionar">
                    <span>⋮</span>
                </div>
                ` : ''}

                <div class="tierlist-zona-drop" data-tier-id="${tier.id}" style="background: ${degradado};">
                    ${renderizarFichasHTML(tier.elementos, estado, esOBSViewer)}
                </div>
            </div>
            `;
        }).join("");

        // Botón + Añadir Tier al final de la tabla (solo cuando no es OBS Viewer)
        if (!esOBSViewer) {
            return tiers + `
            <div class="tierlist-add-tier-fila" id="tierlistFilaAddTier">
                <button type="button" class="tierlist-btn-add-tier" id="tierlistBtnAddTier" data-tooltip="Añadir una nueva fila de Tier">
                    <span class="tierlist-add-tier-icono">+</span>
                    <span>Añadir Tier</span>
                </button>
            </div>`;
        }
        return tiers;
    }

    // ── RENDERIZAR CONTENIDO DE SIN CLASIFICAR ────────────────
    function renderizarZonaSinClasificarContenido(estado, esOBSViewer) {
        if (estado.modo === "personalizada" && !esOBSViewer) {
            if (!estado.sinClasificar || estado.sinClasificar.length === 0) {
                return `
                <div class="tierlist-dropzone-personalizada" id="tierlistDropzoneVacia">
                    <div class="tierlist-dropzone-icono">📁</div>
                    <div class="tierlist-dropzone-texto">Arrastra tus fotos aquí o haz clic para subirlas</div>
                    <div class="tierlist-dropzone-sub">Formatos compatibles: JPG, PNG, WEBP, GIF</div>
                    <button type="button" class="tierlist-btn-secundario" id="btnSubirFotosVacia">➕ Añadir fotos</button>
                </div>
                `;
            }

            // Si hay fichas en personalizada, renderizar fichas + botón inline para añadir más
            return `
            ${renderizarFichasHTML(estado.sinClasificar, estado, esOBSViewer)}
            <button type="button" class="tierlist-ficha-add-inline" id="btnSubirFotosInline" data-tooltip="Añadir más fotos">
                <span class="tierlist-add-inline-icono">➕</span>
                <span class="tierlist-add-inline-texto">Añadir foto</span>
            </button>
            `;
        }

        // Modos Mundos / Packs o OBS Viewer
        if (!estado.sinClasificar || estado.sinClasificar.length === 0) {
            return `<span class="tierlist-vacio-msg">No hay elementos sin clasificar</span>`;
        }

        return renderizarFichasHTML(estado.sinClasificar, estado, esOBSViewer);
    }

    // ── AJUSTE DE DIMENSIÓN BASE DE FICHAS TRAS RENDER ────────
    // Corrige imágenes verticales para que `zoom = 1` equivalga
    // exactamente a la escala base del visor del editor (260×260).
    function ajustarDimensionesFichas(contenedor) {
        contenedor.querySelectorAll(".tierlist-ficha-img").forEach(img => {
            const aplicar = () => {
                if (img.naturalWidth > 0 && img.naturalHeight > 0 && img.naturalHeight > img.naturalWidth) {
                    img.style.width = "100%";
                    img.style.height = "auto";
                }
            };
            if (img.complete && img.naturalWidth > 0) {
                aplicar();
            } else {
                img.addEventListener("load", aplicar, { once: true });
            }
        });
    }

    // ── RENDERIZAR FICHAS HTML CON FORMA INDIVIDUAL ───────────
    function renderizarFichasHTML(listaIds, estado, esOBSViewer) {
        if (!listaIds || listaIds.length === 0) {
            return `<span class="tierlist-vacio-msg">Vacío</span>`;
        }

        return listaIds.map(id => {
            const item = estado.elementos[id];
            if (!item) return "";

            const enc = item.encuadre || { x: 0, y: 0, zoom: 1 };
            const pctX = (((enc.x || 0) / 260) * 100).toFixed(2);
            const pctY = (((enc.y || 0) / 260) * 100).toFixed(2);
            const estiloImg = `top: calc(50% + ${pctY}%); left: calc(50% + ${pctX}%); transform: translate(-50%, -50%) scale(${enc.zoom || 1});`;
            // Respetar modo global de apariencia si está activo
            const modoFormaGlobal = (estado.modo === 'personalizada' && estado.modos.personalizada._modoFormaGlobal) || 'libre';
            const formaItem = (modoFormaGlobal !== 'libre') ? modoFormaGlobal : (item.forma || 'cuadrado');

            return `
            <div class="tierlist-ficha forma-${formaItem}" data-item-id="${item.id}" data-tooltip="${escapeHtml(item.nombre)}">
                <div class="tierlist-ficha-cuerpo">
                    <img src="${item.rutaIcono}" alt="${escapeHtml(item.nombre)}" class="tierlist-ficha-img" style="${estiloImg}" onerror="this.src='img/icon-pack/juego base/BG.webp'">
                </div>
                ${estado.modo === 'personalizada' && !esOBSViewer ? `
                <button type="button" class="tierlist-ficha-eliminar btnEliminarItemCustom" data-item-id="${item.id}" data-tooltip="Eliminar imagen">✕</button>
                <button type="button" class="tierlist-ficha-encuadrar btnEncuadrarItemCustom" data-item-id="${item.id}" data-tooltip="Ajustar forma y encuadre">✂️</button>
                ` : ''}
            </div>
            `;
        }).join("");
    }

    // ── HELPERS MODO FORMA GLOBAL (3 estados: cuadrado/libre/circulo) ─

    let _forma3Dragging = false; // flag global para distinguir drag de click

    // Mueve el thumb verde al dot de la posición indicada
    function _posicionarThumbForma3(track, modo, conAnimacion) {
        const thumb = track.querySelector("#tierlistForma3Thumb");
        if (!thumb) return;
        const ORDEN = ["cuadrado", "libre", "circulo"];
        const idx = ORDEN.indexOf(modo);
        if (idx === -1) return;
        const dot = track.querySelectorAll(".tierlist-forma3-dot")[idx];
        if (!dot) return;
        const trackRect = track.getBoundingClientRect();
        const dotRect = dot.getBoundingClientRect();
        const thumbW = thumb.offsetWidth || 20;
        const newLeft = (dotRect.left - trackRect.left) + dotRect.width / 2 - thumbW / 2;
        if (conAnimacion === false) {
            thumb.style.transition = "none";
            thumb.style.left = newLeft + "px";
            // Forzar reflow y restaurar transición
            void thumb.offsetWidth;
            thumb.style.transition = "";
        } else {
            thumb.style.left = newLeft + "px";
        }
        // Marcar dot activo
        track.querySelectorAll(".tierlist-forma3-dot").forEach((d, i) => {
            d.classList.toggle("activo", i === idx);
        });
    }

    // Aplica el cambio de modo: estado + DOM + UI
    function _cambiarFormaGlobal3(contenedor, nuevaForma, estado) {
        const track = contenedor.querySelector("#tierlistForma3Track");
        const label = contenedor.querySelector("#tierlistForma3Label");
        const formaAnterior = estado.modos.personalizada._modoFormaGlobal || "libre";
        estado.modos.personalizada._modoFormaGlobal = nuevaForma;
        _aplicarModoFormaGlobalAlDOM(contenedor, nuevaForma, estado);
        if (track) _posicionarThumbForma3(track, nuevaForma);
        if (label) {
            const textos = { cuadrado: "Cuadrado", libre: "Libre", circulo: "Redondo" };
            label.textContent = textos[nuevaForma] || "Libre";
        }
        if (nuevaForma !== formaAnterior) window.TierListCore.notificarCambioEstado();
    }

    // Vincula el drag del thumb + click en dots/track
    function _vincularDragForma3(track, contenedor, estado) {
        const ORDEN = ["cuadrado", "libre", "circulo"];
        const thumb = track.querySelector("#tierlistForma3Thumb");
        if (!thumb) return;

        let isDragging = false;
        let startPointerX = 0;
        let startThumbLeft = 0;

        function getDotCenters() {
            const trackRect = track.getBoundingClientRect();
            return Array.from(track.querySelectorAll(".tierlist-forma3-dot")).map(dot => {
                const r = dot.getBoundingClientRect();
                return r.left - trackRect.left + r.width / 2;
            });
        }

        function nearestDotIndex(thumbCenterX) {
            const centers = getDotCenters();
            let minDist = Infinity, nearestIdx = 1;
            centers.forEach((cx, i) => {
                const d = Math.abs(cx - thumbCenterX);
                if (d < minDist) { minDist = d; nearestIdx = i; }
            });
            return nearestIdx;
        }

        // Pointerdown en thumb → inicio drag
        thumb.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
            _forma3Dragging = true;
            startPointerX = e.clientX;
            startThumbLeft = parseFloat(thumb.style.left) || 0;
            thumb.style.transition = "none";
            thumb.style.cursor = "grabbing";
            thumb.setPointerCapture(e.pointerId);
        });

        thumb.addEventListener("pointermove", (e) => {
            if (!isDragging) return;
            const trackRect = track.getBoundingClientRect();
            const thumbW = thumb.offsetWidth || 20;
            const maxLeft = trackRect.width - thumbW - 4;
            const dx = e.clientX - startPointerX;
            const newLeft = Math.max(4, Math.min(maxLeft, startThumbLeft + dx));
            thumb.style.left = newLeft + "px";

            // Highlight del dot más cercano durante el arrastre
            const thumbCenterX = newLeft + thumbW / 2;
            const centers = getDotCenters();
            const dots = track.querySelectorAll(".tierlist-forma3-dot");
            dots.forEach((dot, i) => {
                const dist = Math.abs(centers[i] - thumbCenterX);
                dot.classList.toggle("pasando", dist < 14);
            });
        });

        thumb.addEventListener("pointerup", (e) => {
            if (!isDragging) return;
            isDragging = false;
            thumb.style.cursor = "grab";
            thumb.style.transition = ""; // restaurar para animación de snap
            track.querySelectorAll(".tierlist-forma3-dot").forEach(d => d.classList.remove("pasando"));

            const thumbW = thumb.offsetWidth || 20;
            const thumbCenterX = parseFloat(thumb.style.left) + thumbW / 2;
            const idx = nearestDotIndex(thumbCenterX);
            const nuevaForma = ORDEN[idx];
            _cambiarFormaGlobal3(contenedor, nuevaForma, estado);

            // Soltar flag con pequeño delay para que el click no dispare
            setTimeout(() => { _forma3Dragging = false; }, 80);
        });

        // Click en dot o en el track (no en thumb)
        track.addEventListener("click", (e) => {
            if (_forma3Dragging) return;
            const dot = e.target.closest(".tierlist-forma3-dot");
            if (dot) {
                _cambiarFormaGlobal3(contenedor, dot.dataset.forma, estado);
            } else if (e.target === track) {
                // Click en el cuerpo del track: calcular posición más cercana
                const trackRect = track.getBoundingClientRect();
                const clickX = e.clientX - trackRect.left;
                const idx = nearestDotIndex(clickX);
                _cambiarFormaGlobal3(contenedor, ORDEN[idx], estado);
            }
        });
    }

    // Aplica el modo de forma al DOM sin re-render (animación CSS suave)
    function _aplicarModoFormaGlobalAlDOM(contenedor, modo, estado) {
        const fichas = contenedor.querySelectorAll(".tierlist-ficha");
        fichas.forEach(fichaEl => {
            const itemId = fichaEl.dataset.itemId;
            const item = estado.elementos[itemId];
            const formaDeseada = (modo !== "libre") ? modo : (item ? (item.forma || "cuadrado") : "cuadrado");
            fichaEl.classList.remove("forma-cuadrado", "forma-circulo");
            fichaEl.classList.add("forma-" + formaDeseada);
        });
    }

    // ── VINCULAR EVENTOS DEL TABLERO ──────────────────────────
    function vincularEventosTablero(contenedor, esOBSViewer) {
        if (esOBSViewer) return;

        const estado = window.EstadoTierList;

        // Volver a selector de modo
        contenedor.querySelector("#tierlistBtnVolverSelector")?.addEventListener("click", () => {
            _snapshotDeshacer = null;
            estado.pantalla = "selector";
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();
            if (typeof window.actualizarHashURL === "function") {
                window.actualizarHashURL("tier-list", false);
            }
        });

        // Igualar spacer al ancho del botón volver para centrar el título
        requestAnimationFrame(() => {
            const btnVolver = contenedor.querySelector("#tierlistBtnVolverSelector");
            const spacer = contenedor.querySelector(".tierlist-topbar-spacer");
            if (btnVolver && spacer) {
                spacer.style.width = btnVolver.offsetWidth + "px";
            }
        });

        // Botón Deshacer (última operación destructiva)
        contenedor.querySelector("#tierlistBtnDeshacer")?.addEventListener("click", async () => {
            await aplicarDeshacer();
        });

        // Título editable
        const inputTitulo = contenedor.querySelector("#tierlistTituloInput");
        if (inputTitulo) {
            inputTitulo.addEventListener("input", (e) => {
                estado.titulo = e.target.value;
                window.TierListCore.notificarCambioEstado();
            });
        }

        // Switch de Alcance de Cambios: Solo este / Todos
        const toggleAlcance = contenedor.querySelector("#tierlistToggleAlcanceInput");
        if (toggleAlcance) {
            toggleAlcance.addEventListener("change", (e) => {
                const nuevoAlcance = e.target.checked ? "todos" : "solo_este";
                if (window.TierListCore && typeof window.TierListCore.guardarAlcanceCambios === "function") {
                    window.TierListCore.guardarAlcanceCambios(nuevoAlcance);
                }

                const lblSolo = contenedor.querySelector("#lblAlcanceSoloEste");
                const lblTodos = contenedor.querySelector("#lblAlcanceTodos");
                if (lblSolo && lblTodos) {
                    lblSolo.classList.toggle("activo", !e.target.checked);
                    lblTodos.classList.toggle("activo", e.target.checked);
                }
            });
        }

        // ── SELECTOR DE APARIENCIA GLOBAL (solo Personalizada) ────
        if (estado.modo === "personalizada") {
            const track = contenedor.querySelector("#tierlistForma3Track");
            if (track) {
                // Posicionar thumb tras el primer paint
                requestAnimationFrame(() => {
                    _posicionarThumbForma3(track, estado.modos.personalizada._modoFormaGlobal || "libre", false);
                });
                // Vincular drag y clicks
                _vincularDragForma3(track, contenedor, estado);
            }
        }

        // Añadir nueva Tier — delegación en el tablero (el botón está dentro del área re-renderable)
        contenedor.querySelector("#tierlistTablero")?.addEventListener("click", (e) => {
            if (!e.target.closest("#tierlistBtnAddTier")) return;
            const nuevaId = "tier_" + Date.now();
            const nuevoIndice = estado.tiers.length;
            const coloresSugeridos = [
                "rgba(155, 89, 182, 1)",
                "rgba(52, 73, 94, 1)",
                "rgba(230, 126, 34, 1)",
                "rgba(26, 188, 156, 1)"
            ];
            const color = coloresSugeridos[nuevoIndice % coloresSugeridos.length];
            const letras = ["F", "E", "EX", "Z", "★"];
            const nombre = letras[nuevoIndice % letras.length] || `T${nuevoIndice + 1}`;

            const nuevoTier = {
                id: nuevaId,
                nombre: nombre,
                color: color,
                orden: nuevoIndice,
                elementos: []
            };

            window.TierListCore.agregarTierGlobal(nuevoTier);
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();
        });

        // Botón Limpiar con modal de opciones (Limpiar fichas / Restaurar de fábrica)
        contenedor.querySelector("#tierlistBtnResetear")?.addEventListener("click", () => {
            mostrarModalOpcionesLimpiar({
                onLimpiarFichas: () => {
                    mostrarModalAlcanceLimpiarFichas((alcance) => {
                        capturarSnapshotDeshacer(alcance);
                        window.TierListCore.limpiarFichas(alcance);
                        renderizarTierList();
                    });
                },
                onRestaurarFabrica: () => {
                    mostrarModalAlcanceRestaurarFabrica(async (alcance) => {
                        capturarSnapshotDeshacer(alcance);
                        await window.TierListCore.restaurarDeFabrica(alcance);
                        renderizarTierList();
                    });
                }
            });
        });

        // Eliminar Tier
        contenedor.querySelectorAll(".btnEliminarTier").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (estado.tiers.length <= 1) return;
                const tierId = btn.dataset.tierId;
                window.TierListCore.eliminarTierGlobal(tierId);
                window.TierListCore.notificarCambioEstado();
                renderizarTierList();
            });
        });

        // Drag & Drop de Tiers completos mediante asa de 3 puntos (⋮)
        iniciarPointerDragTiers(contenedor);

        // Configuración de Tier (color y renombrar)
        contenedor.querySelectorAll(".btnColorTier, .tierlist-etiqueta-texto").forEach(el => {
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                const fila = el.closest(".tierlist-fila");
                const tierId = fila ? fila.dataset.tierId : el.dataset.tierId;
                abrirSelectorColorModal(tierId);
            });
        });

        // Guardar .lotlab
        contenedor.querySelector("#tierlistBtnExportarLab")?.addEventListener("click", () => {
            window.TierListCore.exportarArchivoLotlab();
        });

        // Cargar .lotlab
        const fileInputLab = contenedor.querySelector("#tierlistFileInputLab");
        contenedor.querySelector("#tierlistBtnImportarLab")?.addEventListener("click", () => {
            fileInputLab?.click();
        });

        if (fileInputLab) {
            fileInputLab.addEventListener("change", async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    try {
                        await window.TierListCore.importarArchivoLotlab(file);
                        renderizarTierList();
                        mostrarModalPropagarLotlab();
                    } catch (err) {
                        renderizarTierList();
                        mostrarModalAvisoLotlab("Error al importar", err.message || "Error al procesar el archivo .lotlab");
                    }
                }
                fileInputLab.value = "";
            });
        }

        // Subida de fotos en Personalizada (dentro de Sin Clasificar)
        const fileInputImg = contenedor.querySelector("#tierlistFileInputImagenes");
        const btnSubirVacia = contenedor.querySelector("#btnSubirFotosVacia");
        const btnSubirInline = contenedor.querySelector("#btnSubirFotosInline");
        const dropzoneVacia = contenedor.querySelector("#tierlistDropzoneVacia");
        const zonaSinClasificar = contenedor.querySelector("#tierlistZonaSinClasificar");

        btnSubirVacia?.addEventListener("click", () => fileInputImg?.click());
        btnSubirInline?.addEventListener("click", () => fileInputImg?.click());
        dropzoneVacia?.addEventListener("click", (e) => {
            if (e.target !== btnSubirVacia) fileInputImg?.click();
        });

        if (fileInputImg) {
            fileInputImg.addEventListener("change", (e) => {
                if (e.target.files?.length) {
                    procesarSubidaArchivos(e.target.files);
                }
                fileInputImg.value = "";
            });
        }

        // Drag and drop de archivos desde el sistema operativo a Sin Clasificar
        if (zonaSinClasificar && estado.modo === "personalizada") {
            zonaSinClasificar.addEventListener("dragover", (e) => {
                if (e.dataTransfer?.types?.includes("Files")) {
                    e.preventDefault();
                    zonaSinClasificar.classList.add("drag-archivos-over");
                }
            });
            zonaSinClasificar.addEventListener("dragleave", (e) => {
                if (!zonaSinClasificar.contains(e.relatedTarget)) {
                    zonaSinClasificar.classList.remove("drag-archivos-over");
                }
            });
            zonaSinClasificar.addEventListener("drop", (e) => {
                if (e.dataTransfer?.files?.length) {
                    e.preventDefault();
                    zonaSinClasificar.classList.remove("drag-archivos-over");
                    procesarSubidaArchivos(e.dataTransfer.files);
                }
            });
        }

        // Eliminar imagen personalizada
        contenedor.querySelectorAll(".btnEliminarItemCustom").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.itemId;
                delete estado.elementos[itemId];
                delete estado.imagenesCustom[itemId];
                estado.sinClasificar = estado.sinClasificar.filter(id => id !== itemId);
                estado.tiers.forEach(t => {
                    t.elementos = t.elementos.filter(id => id !== itemId);
                });
                await window.TierListCore.eliminarImagenCustomDB(itemId);
                window.TierListCore.notificarCambioEstado();
                renderizarTierList();
            });
        });

        // Re-encuadrar y cambiar forma de imagen personalizada
        contenedor.querySelectorAll(".btnEncuadrarItemCustom").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.itemId;
                abrirEditorEncuadreModal(itemId);
            });
        });

        // Drag and drop con Pointer Events para las fichas
        iniciarPointerDragAndDrop(contenedor);
    }

    // ── PROCESAR SUBIDA DE ARCHIVOS LOCALES ────────────────────
    async function procesarSubidaArchivos(fileList) {
        if (!fileList || fileList.length === 0) return;

        const estado = window.EstadoTierList;
        const archivos = Array.from(fileList).filter(f => f.type.startsWith("image/"));
        if (archivos.length === 0) return;

        const idsCreados = [];

        for (const archivo of archivos) {
            try {
                const { dataUrl } = await window.TierListCore.convertirImagenAWebP(archivo, 800);
                const id = "custom_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
                const nombreLimpio = archivo.name.replace(/\.[^/.]+$/, "");

                await window.TierListCore.guardarImagenCustomDB(id, dataUrl);

                estado.modos.personalizada.imagenesCustom[id] = dataUrl;
                estado.modos.personalizada.elementos[id] = {
                    id: id,
                    nombre: nombreLimpio,
                    tipo: "personalizada",
                    forma: "cuadrado",
                    rutaIcono: dataUrl,
                    encuadre: { x: 0, y: 0, zoom: 1 }
                };
                estado.modos.personalizada.sinClasificar.push(id);
                idsCreados.push(id);
            } catch (err) {
                console.error("[TierList] Error procesando imagen subida:", err);
            }
        }

        if (idsCreados.length > 0) {
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();

            if (idsCreados.length === 1) {
                // Una sola imagen: abrir directamente el editor (flujo existente intacto)
                abrirEditorEncuadreModal(idsCreados[0]);
            } else {
                // Múltiples imágenes: abrir editor para la primera y ofrecer decisión tras confirmar
                const primerId = idsCreados[0];
                const idsRestantes = idsCreados.slice(1);
                abrirEditorEncuadreModal(primerId, (ajustes) => {
                    mostrarModalAplicarATodas(ajustes, idsRestantes);
                });
            }
        }
    }

    // ── DRAG & DROP MULTIPLATAFORMA (POINTER EVENTS) ───────────
    function iniciarPointerDragAndDrop(contenedor) {
        const fichas = contenedor.querySelectorAll(".tierlist-ficha");
        const estado = window.EstadoTierList;

        fichas.forEach(ficha => {
            ficha.addEventListener("pointerdown", (e) => {
                if (e.target.closest(".btnEliminarItemCustom, .btnEncuadrarItemCustom")) return;
                if (e.button !== 0 && e.pointerType === "mouse") return;

                e.preventDefault();

                const ttDown = document.getElementById("tooltipOpciones");
                if (ttDown) ttDown.style.display = "none";

                const itemId = ficha.dataset.itemId;
                const itemData = estado.elementos[itemId];
                const formaItem = (itemData && itemData.forma) || "cuadrado";

                const startX = e.clientX;
                const startY = e.clientY;
                let haIniciadoDrag = false;
                let ghostEl = null;
                let siguienteFichaTarget = null;

                const onPointerMove = (moveEvt) => {
                    const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);

                    if (!haIniciadoDrag && dist > 5) {
                        haIniciadoDrag = true;
                        document.body.classList.add("tierlist-arrastrando-activo");
                        const ttGlobal = document.getElementById("tooltipOpciones");
                        if (ttGlobal) ttGlobal.style.display = "none";

                        _dragActivo = {
                            itemId: itemId,
                            origenTierId: obtenerTierDeItem(itemId),
                            fichaOriginal: ficha
                        };

                        ficha.classList.add("arrastrando");

                        // Crear ghost limpio sin bordes ni sombras de contenedor exterior ni tooltip
                        ghostEl = ficha.cloneNode(true);
                        ghostEl.className = "tierlist-ficha tierlist-drag-ghost forma-" + formaItem;
                        ghostEl.removeAttribute("data-tooltip");
                        ghostEl.removeAttribute("title");
                        ghostEl.querySelector(".tierlist-ficha-eliminar")?.remove();
                        ghostEl.querySelector(".tierlist-ficha-encuadrar")?.remove();
                        document.body.appendChild(ghostEl);
                    }

                    if (haIniciadoDrag && ghostEl) {
                        ghostEl.style.left = moveEvt.clientX + "px";
                        ghostEl.style.top = moveEvt.clientY + "px";

                        siguienteFichaTarget = actualizarIndicadorInsercion(moveEvt.clientX, moveEvt.clientY);
                    }
                };

                const onPointerUp = (upEvt) => {
                    window.removeEventListener("pointermove", onPointerMove);
                    window.removeEventListener("pointerup", onPointerUp);
                    window.removeEventListener("pointercancel", onPointerUp);

                    document.body.classList.remove("tierlist-arrastrando-activo");
                    const ttUp = document.getElementById("tooltipOpciones");
                    if (ttUp) ttUp.style.display = "none";

                    if (ghostEl) {
                        ghostEl.remove();
                        ghostEl = null;
                    }
                    ficha.classList.remove("arrastrando");
                    limpiarResaltadosZonas();

                    if (!haIniciadoDrag) return;

                    const elemBajoPuntero = document.elementFromPoint(upEvt.clientX, upEvt.clientY);
                    const dropzone = elemBajoPuntero ? elemBajoPuntero.closest(".tierlist-zona-drop, .tierlist-sin-clasificar-zona") : null;

                    if (dropzone) {
                        const targetTierId = dropzone.dataset.tierId;
                        const insertBefore = siguienteFichaTarget ? siguienteFichaTarget.dataset.itemId : null;
                        moverItemATier(itemId, targetTierId, insertBefore);
                    } else {
                        moverItemATier(itemId, "sin_clasificar", null);
                    }

                    _dragActivo = null;
                    window.TierListCore.notificarCambioEstado();
                    renderizarTierList();
                };

                window.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);
                window.addEventListener("pointercancel", onPointerUp);
            });
        });
    }

    // ── DRAG & DROP DE TIERS COMPLETOS (ASA VERTICAL ⋮) ───────
    function iniciarPointerDragTiers(contenedor) {
        const handles = contenedor.querySelectorAll(".tierlist-tier-drag-handle");
        const estado = window.EstadoTierList;

        handles.forEach(handle => {
            handle.addEventListener("pointerdown", (e) => {
                if (e.button !== 0 && e.pointerType === "mouse") return;
                e.preventDefault();

                const tierId = handle.dataset.tierId;
                const fila = handle.closest(".tierlist-fila");
                if (!fila) return;

                const etiqueta = fila.querySelector(".tierlist-etiqueta-col");
                if (!etiqueta) return;

                const tier = estado.tiers.find(t => t.id === tierId);

                const startX = e.clientX;
                const startY = e.clientY;

                const esMovil = window.innerWidth <= 768;
                const anchoMin = esMovil ? 85 : 110;
                const anchoMax = Math.round(anchoMin * 2.2);

                const startWidth = (tier && tier.ancho)
                    ? tier.ancho
                    : (Math.round(etiqueta.getBoundingClientRect().width) || anchoMin);

                let gestoDeterminado = false;
                let tipoGesto = null; // "resize" | "reorder" | null
                let haIniciadoDrag = false;
                let ghostEl = null;
                let lineaIndicador = null;
                let targetIndex = estado.tiers.findIndex(t => t.id === tierId);
                let anchoFinal = startWidth;

                const ttGlobal = document.getElementById("tooltipOpciones");
                if (ttGlobal) ttGlobal.style.display = "none";

                const onPointerMove = (moveEvt) => {
                    const deltaX = moveEvt.clientX - startX;
                    const deltaY = moveEvt.clientY - startY;
                    const absX = Math.abs(deltaX);
                    const absY = Math.abs(deltaY);

                    // 1. Determinar el tipo de gesto tras un desplazamiento mínimo
                    if (!gestoDeterminado) {
                        const dist = Math.hypot(deltaX, deltaY);
                        if (dist >= 6) {
                            gestoDeterminado = true;
                            // Si predomina claramente el desplazamiento horizontal (X) frente a vertical (Y)
                            if (absX > absY * 1.2) {
                                tipoGesto = "resize";
                                document.body.style.cursor = "col-resize";
                                handle.style.cursor = "col-resize";
                            } else {
                                tipoGesto = "reorder";
                            }
                        }
                    }

                    if (!gestoDeterminado) return;

                    // MODO RESIZE: redimensionar ancho de la etiqueta horizontalmente
                    if (tipoGesto === "resize") {
                        const nuevoAncho = Math.round(startWidth + deltaX);
                        anchoFinal = Math.max(anchoMin, Math.min(anchoMax, nuevoAncho));
                        etiqueta.style.width = anchoFinal + "px";
                        etiqueta.style.minWidth = anchoFinal + "px";
                        return;
                    }

                    // MODO REORDER: reordenación vertical existente
                    if (!haIniciadoDrag) {
                        haIniciadoDrag = true;
                        document.body.classList.add("tierlist-arrastrando-activo");
                        if (ttGlobal) ttGlobal.style.display = "none";

                        fila.classList.add("arrastrando-tier");

                        // Crear ghost flotante de la etiqueta del tier
                        ghostEl = etiqueta.cloneNode(true);
                        ghostEl.className = "tierlist-etiqueta-col tierlist-tier-drag-ghost";
                        ghostEl.style.position = "fixed";
                        ghostEl.style.pointerEvents = "none";
                        ghostEl.style.zIndex = "100002";
                        ghostEl.style.opacity = "0.92";
                        ghostEl.style.transform = "translate(-50%, -50%) scale(1.05)";
                        ghostEl.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
                        ghostEl.style.borderRadius = "10px";
                        ghostEl.removeAttribute("data-tooltip");
                        ghostEl.querySelectorAll("[data-tooltip]").forEach(el => el.removeAttribute("data-tooltip"));
                        ghostEl.querySelector(".tierlist-etiqueta-controles")?.remove();
                        ghostEl.querySelector(".tierlist-tier-drag-handle")?.remove();
                        document.body.appendChild(ghostEl);

                        // Crear indicador de inserción
                        lineaIndicador = document.createElement("div");
                        lineaIndicador.className = "tierlist-tier-drop-indicador";
                        lineaIndicador.style.display = "none";
                        const tablero = contenedor.querySelector("#tierlistTablero");
                        if (tablero) tablero.appendChild(lineaIndicador);
                    }

                    if (haIniciadoDrag && ghostEl) {
                        ghostEl.style.left = moveEvt.clientX + "px";
                        ghostEl.style.top = moveEvt.clientY + "px";

                        // Calcular índice de inserción entre filas
                        const filas = Array.from(contenedor.querySelectorAll(".tierlist-fila"));
                        const tablero = contenedor.querySelector("#tierlistTablero");
                        if (tablero && filas.length > 0) {
                            const tabRect = tablero.getBoundingClientRect();
                            let nuevoTarget = filas.length - 1;
                            let dropY = 0;

                            for (let i = 0; i < filas.length; i++) {
                                const r = filas[i].getBoundingClientRect();
                                const midY = r.top + r.height / 2;
                                if (moveEvt.clientY < midY) {
                                    nuevoTarget = i;
                                    dropY = r.top;
                                    break;
                                } else if (i === filas.length - 1) {
                                    nuevoTarget = filas.length;
                                    dropY = r.bottom;
                                }
                            }

                            targetIndex = nuevoTarget;

                            if (lineaIndicador) {
                                lineaIndicador.style.display = "block";
                                lineaIndicador.style.top = (dropY - tabRect.top) + "px";
                            }
                        }
                    }
                };

                const onPointerUp = () => {
                    window.removeEventListener("pointermove", onPointerMove);
                    window.removeEventListener("pointerup", onPointerUp);
                    window.removeEventListener("pointercancel", onPointerUp);

                    document.body.style.cursor = "";
                    handle.style.cursor = "";

                    // Finalizar modo RESIZE
                    if (tipoGesto === "resize") {
                        if (anchoFinal !== startWidth) {
                            mostrarModalAnchoTier({
                                tierId: tierId,
                                nuevoAncho: anchoFinal,
                                anchoAnterior: startWidth,
                                onAplicarSoloEste: () => {
                                    window.TierListCore.aplicarAnchoIndividual(tierId, anchoFinal);
                                    window.TierListCore.notificarCambioEstado();
                                    renderizarTierList();
                                },
                                onAplicarTodos: () => {
                                    window.TierListCore.aplicarAnchoGlobal(anchoFinal);
                                    window.TierListCore.notificarCambioEstado();
                                    renderizarTierList();
                                },
                                onCancelar: () => {
                                    if (tier && tier.ancho) {
                                        etiqueta.style.width = tier.ancho + "px";
                                        etiqueta.style.minWidth = tier.ancho + "px";
                                    } else {
                                        const prefs = window.TierListCore?.obtenerPreferenciasGlobales?.();
                                        if (prefs && prefs.anchoGlobal) {
                                            etiqueta.style.width = prefs.anchoGlobal + "px";
                                            etiqueta.style.minWidth = prefs.anchoGlobal + "px";
                                        } else {
                                            etiqueta.style.width = "";
                                            etiqueta.style.minWidth = "";
                                        }
                                    }
                                }
                            });
                        }
                        return;
                    }

                    // Finalizar modo REORDER
                    document.body.classList.remove("tierlist-arrastrando-activo");
                    if (ttGlobal) ttGlobal.style.display = "none";

                    if (ghostEl) {
                        ghostEl.remove();
                        ghostEl = null;
                    }
                    if (lineaIndicador) {
                        lineaIndicador.remove();
                        lineaIndicador = null;
                    }

                    fila.classList.remove("arrastrando-tier");

                    if (!haIniciadoDrag) return;

                    const origenIndex = estado.tiers.findIndex(t => t.id === tierId);
                    if (origenIndex === -1) return;

                    let finalIdx = targetIndex;
                    if (finalIdx > origenIndex) finalIdx--; // Ajuste por extracción previa

                    if (finalIdx !== origenIndex && finalIdx >= 0 && finalIdx < estado.tiers.length) {
                        const [tierMovido] = estado.tiers.splice(origenIndex, 1);
                        estado.tiers.splice(finalIdx, 0, tierMovido);
                        estado.tiers.forEach((t, idx) => { t.orden = idx; });
                        window.TierListCore.sincronizarOrdenGlobalTiers(estado.modo);
                        window.TierListCore.notificarCambioEstado();
                        renderizarTierList();
                    }
                };

                window.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);
                window.addEventListener("pointercancel", onPointerUp);
            });
        });
    }

    function obtenerTierDeItem(itemId) {
        const estado = window.EstadoTierList;
        for (const tier of estado.tiers) {
            if (tier.elementos.includes(itemId)) return tier.id;
        }
        return "sin_clasificar";
    }

    function moverItemATier(itemId, targetTierId, insertBeforeItemId = null) {
        const estado = window.EstadoTierList;

        // 1. Quitar de origen
        estado.sinClasificar = estado.sinClasificar.filter(id => id !== itemId);
        estado.tiers.forEach(tier => {
            tier.elementos = tier.elementos.filter(id => id !== itemId);
        });

        // 2. Insertar en destino
        if (targetTierId === "sin_clasificar") {
            if (insertBeforeItemId && estado.sinClasificar.includes(insertBeforeItemId)) {
                const idx = estado.sinClasificar.indexOf(insertBeforeItemId);
                estado.sinClasificar.splice(idx, 0, itemId);
            } else {
                estado.sinClasificar.push(itemId);
            }
        } else {
            const destTier = estado.tiers.find(t => t.id === targetTierId);
            if (destTier) {
                if (insertBeforeItemId && destTier.elementos.includes(insertBeforeItemId)) {
                    const idx = destTier.elementos.indexOf(insertBeforeItemId);
                    destTier.elementos.splice(idx, 0, itemId);
                } else {
                    destTier.elementos.push(itemId);
                }
            } else {
                estado.sinClasificar.push(itemId);
            }
        }
    }

    function actualizarIndicadorInsercion(clientX, clientY) {
        limpiarResaltadosZonas();

        const elemBajoPuntero = document.elementFromPoint(clientX, clientY);
        const dropzone = elemBajoPuntero ? elemBajoPuntero.closest(".tierlist-zona-drop, .tierlist-sin-clasificar-zona") : null;

        if (!dropzone) return null;

        dropzone.classList.add("dropzone-activa");

        const fichasEnZona = Array.from(dropzone.querySelectorAll(".tierlist-ficha:not(.arrastrando):not(.tierlist-drag-ghost)"));

        let fichaMasCercana = null;
        let menorDist = Infinity;
        let esDespues = false;

        fichasEnZona.forEach(ficha => {
            const rect = ficha.getBoundingClientRect();
            const centroX = rect.left + rect.width / 2;
            const centroY = rect.top + rect.height / 2;
            const dist = Math.hypot(clientX - centroX, clientY - centroY);

            if (dist < menorDist) {
                menorDist = dist;
                fichaMasCercana = ficha;
                esDespues = clientX > centroX;
            }
        });

        let marcador = dropzone.querySelector(".tierlist-drop-indicador");
        if (!marcador) {
            marcador = document.createElement("div");
            marcador.className = "tierlist-drop-indicador";
        }

        if (fichaMasCercana) {
            if (esDespues) {
                fichaMasCercana.after(marcador);
                return fichaMasCercana.nextElementSibling && fichaMasCercana.nextElementSibling !== marcador
                    ? fichaMasCercana.nextElementSibling
                    : null;
            } else {
                fichaMasCercana.before(marcador);
                return fichaMasCercana;
            }
        } else {
            dropzone.appendChild(marcador);
            return null;
        }
    }

    function limpiarResaltadosZonas() {
        document.querySelectorAll(".dropzone-activa").forEach(el => el.classList.remove("dropzone-activa"));
        document.querySelectorAll(".tierlist-drop-indicador").forEach(el => el.remove());
    }

    // ── MODAL DE OPCIONES DE LIMPIEZA (LIMPIAR FICHAS / RESTAURAR DE FÁBRICA) ──
    function mostrarModalOpcionesLimpiar({ onLimpiarFichas, onRestaurarFabrica }) {
        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalOpcionesLimpiar";

        modal.innerHTML = `
        <div class="tierlist-confirm-card tierlist-limpiar-opciones-card">
            <div class="tierlist-modal-header" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 800; font-size: 1.15rem; color: var(--color-titulo, #EDEDED);">Reiniciar Tier List</span>
                <button type="button" class="tierlist-btn-cancelar btnCerrarModalLimpiar" style="border: none; font-size: 1.2rem; cursor: pointer; padding: 2px 8px;">✕</button>
            </div>
            <div class="tierlist-confirm-texto" style="text-align: left; margin-bottom: 2px;">
                Elige qué acción deseas realizar sobre la Tier List actual:
            </div>

            <div class="tierlist-opciones-grid">
                <button type="button" class="tierlist-opcion-limpiar-btn" id="btnOpcionLimpiarFichas">
                    <div class="tierlist-opcion-icono">🧹</div>
                    <div class="tierlist-opcion-info">
                        <div class="tierlist-opcion-titulo">Limpiar fichas</div>
                        <div class="tierlist-opcion-desc">Devuelve todas las fichas a SIN CLASIFICAR, manteniendo la configuración actual de la Tier List.</div>
                    </div>
                </button>

                <button type="button" class="tierlist-opcion-limpiar-btn tierlist-opcion-peligro" id="btnOpcionRestaurarFabrica">
                    <div class="tierlist-opcion-icono">↩️</div>
                    <div class="tierlist-opcion-info">
                        <div class="tierlist-opcion-titulo">Restaurar de fábrica</div>
                        <div class="tierlist-opcion-desc">Restablece completamente la Tier List a su configuración inicial.</div>
                    </div>
                </button>
            </div>

            <div class="tierlist-modal-botones" style="justify-content: flex-end; margin-top: 4px;">
                <button type="button" class="tierlist-btn-cancelar btnCerrarModalLimpiar">Cancelar</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        const cerrar = () => modal.remove();
        modal.querySelectorAll(".btnCerrarModalLimpiar").forEach(btn => btn.addEventListener("click", cerrar));

        modal.querySelector("#btnOpcionLimpiarFichas").addEventListener("click", () => {
            cerrar();
            if (typeof onLimpiarFichas === "function") onLimpiarFichas();
        });

        modal.querySelector("#btnOpcionRestaurarFabrica").addEventListener("click", () => {
            cerrar();
            if (typeof onRestaurarFabrica === "function") onRestaurarFabrica();
        });
    }

    // ── MODAL DE DECISIÓN DE ANCHO DE TIER TRAS RESIZE ────────
    function mostrarModalAnchoTier({ tierId, nuevoAncho, anchoAnterior, onAplicarSoloEste, onAplicarTodos, onCancelar }) {
        document.getElementById("tierlistModalAnchoTier")?.remove();

        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalAnchoTier";

        modal.innerHTML = `
        <div class="tierlist-confirm-card" role="dialog" aria-modal="true" aria-labelledby="modalAnchoTitulo">
            <div style="display: flex; justify-content: flex-end; margin: -6px -6px 0 0;">
                <button type="button" class="tierlist-btn-cancelar" id="btnCerrarModalAnchoX" aria-label="Cerrar" style="border:none; font-size:1.2rem; cursor:pointer; padding: 2px 8px; line-height: 1;">✕</button>
            </div>
            <div class="tierlist-confirm-icono">↔️</div>
            <div class="tierlist-confirm-titulo" id="modalAnchoTitulo">Tamaño del tier</div>
            <div class="tierlist-confirm-texto">¿Quieres aplicar este ancho a todos los tiers actuales y futuros?</div>
            <div class="tierlist-modal-botones" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                <button type="button" class="tierlist-btn-secundario" id="btnAnchoSoloEste">Solo este tier</button>
                <button type="button" class="tierlist-btn-confirmar" id="btnAnchoTodos">Todos los tiers</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        let resuelto = false;
        const cerrar = (cancelar = true) => {
            if (resuelto) return;
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (cancelar && typeof onCancelar === "function") {
                onCancelar();
            }
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                cerrar(true);
            }
        };
        document.addEventListener("keydown", onKeyDown);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                cerrar(true);
            }
        });

        modal.querySelector("#btnCerrarModalAnchoX")?.addEventListener("click", () => {
            cerrar(true);
        });

        modal.querySelector("#btnAnchoSoloEste")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (typeof onAplicarSoloEste === "function") {
                onAplicarSoloEste();
            }
        });

        modal.querySelector("#btnAnchoTodos")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (typeof onAplicarTodos === "function") {
                onAplicarTodos();
            }
        });
    }

    // ── MODAL DE PROPAGACIÓN TRAS IMPORTAR .LOTLAB ───────────
    // ── MODAL DE PROPAGACIÓN TRAS IMPORTAR .LOTLAB ───────────
    function mostrarModalPropagarLotlab() {
        document.getElementById("tierlistModalPropagarLotlab")?.remove();

        const estado = window.EstadoTierList;
        const modo = estado.modo || "personalizada";
        let otrosModosTexto = "Mundos y Packs";
        if (modo === "mundos") otrosModosTexto = "Packs y Personalizada";
        else if (modo === "packs") otrosModosTexto = "Mundos y Personalizada";

        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalPropagarLotlab";

        modal.innerHTML = `
        <div class="tierlist-confirm-card" role="dialog" aria-modal="true" aria-labelledby="modalPropagarTitulo">
            <div style="display: flex; justify-content: flex-end; margin: -6px -6px 0 0;">
                <button type="button" class="tierlist-btn-cancelar" id="btnCerrarModalPropagarX" aria-label="Cerrar" style="border:none; font-size:1.2rem; cursor:pointer; padding: 2px 8px; line-height: 1;">✕</button>
            </div>
            <div class="tierlist-confirm-icono">⚙️</div>
            <div class="tierlist-confirm-titulo" id="modalPropagarTitulo">Configuración de Tier List</div>
            <div class="tierlist-confirm-texto" style="font-weight: 600;">¿Quieres aplicar la configuración de este Tier List a ${otrosModosTexto}?</div>
            <div class="tierlist-confirm-texto" style="font-size: 0.85rem; opacity: 0.85; line-height: 1.4;">Solo se aplicarán los tiers, nombres, colores, orden y tamaños. Los iconos y elementos no se importarán.</div>
            <div class="tierlist-modal-botones" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                <button type="button" class="tierlist-btn-secundario" id="btnPropagarSoloAqui">Mantener solo aquí</button>
                <button type="button" class="tierlist-btn-confirmar" id="btnPropagarATodos">Aplicar a todos</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        let resuelto = false;
        const cerrar = () => {
            if (resuelto) return;
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                cerrar();
            }
        };
        document.addEventListener("keydown", onKeyDown);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                cerrar();
            }
        });

        modal.querySelector("#btnCerrarModalPropagarX")?.addEventListener("click", () => {
            cerrar();
        });

        modal.querySelector("#btnPropagarSoloAqui")?.addEventListener("click", () => {
            cerrar();
        });

        modal.querySelector("#btnPropagarATodos")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (window.TierListCore && typeof window.TierListCore.propagarConfiguracionModoATodos === "function") {
                window.TierListCore.propagarConfiguracionModoATodos(window.EstadoTierList.modo);
                window.TierListCore.notificarCambioEstado();
                renderizarTierList();
            }
        });
    }

    // ── MODAL DE ALCANCE: LIMPIAR FICHAS ──────────────────────
    function mostrarModalAlcanceLimpiarFichas(onConfirmar) {
        document.getElementById("tierlistModalAlcanceLimpiar")?.remove();

        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalAlcanceLimpiar";

        modal.innerHTML = `
        <div class="tierlist-confirm-card" role="dialog" aria-modal="true" aria-labelledby="modalAlcanceLimpiarTitulo">
            <div style="display: flex; justify-content: flex-end; margin: -6px -6px 0 0;">
                <button type="button" class="tierlist-btn-cancelar" id="btnCerrarModalAlcanceLimpiarX" aria-label="Cerrar" style="border:none; font-size:1.2rem; cursor:pointer; padding: 2px 8px; line-height: 1;">✕</button>
            </div>
            <div class="tierlist-confirm-icono">🧹</div>
            <div class="tierlist-confirm-titulo" id="modalAlcanceLimpiarTitulo">Limpiar fichas</div>
            <div class="tierlist-confirm-texto" style="font-weight: 600;">¿Dónde quieres limpiar las fichas?</div>
            <div class="tierlist-confirm-texto" style="font-size: 0.85rem; opacity: 0.85; line-height: 1.4;">Solo se devolverán las fichas a sin clasificar. Se mantendrán los tiers, nombres, colores y anchos.</div>
            <div class="tierlist-modal-botones" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                <button type="button" class="tierlist-btn-secundario" id="btnLimpiarSoloEste">Solo este Tier List</button>
                <button type="button" class="tierlist-btn-confirmar" id="btnLimpiarTodos">Todos los Tier Lists</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        let resuelto = false;
        const cerrar = () => {
            if (resuelto) return;
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                cerrar();
            }
        };
        document.addEventListener("keydown", onKeyDown);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                cerrar();
            }
        });

        modal.querySelector("#btnCerrarModalAlcanceLimpiarX")?.addEventListener("click", () => {
            cerrar();
        });

        modal.querySelector("#btnLimpiarSoloEste")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (typeof onConfirmar === "function") onConfirmar("actual");
        });

        modal.querySelector("#btnLimpiarTodos")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (typeof onConfirmar === "function") onConfirmar("todos");
        });
    }

    // Compatibilidad retroactiva
    function mostrarModalConfirmarLimpiarFichas(onConfirmar) {
        mostrarModalAlcanceLimpiarFichas((alcance) => {
            if (typeof onConfirmar === "function") onConfirmar(alcance);
        });
    }

    // ── MODAL DE ALCANCE: RESTAURAR DE FÁBRICA ────────────────
    function mostrarModalAlcanceRestaurarFabrica(onConfirmar) {
        document.getElementById("tierlistModalAlcanceRestaurar")?.remove();

        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalAlcanceRestaurar";

        modal.innerHTML = `
        <div class="tierlist-confirm-card" role="dialog" aria-modal="true" aria-labelledby="modalAlcanceRestaurarTitulo">
            <div style="display: flex; justify-content: flex-end; margin: -6px -6px 0 0;">
                <button type="button" class="tierlist-btn-cancelar" id="btnCerrarModalAlcanceRestaurarX" aria-label="Cerrar" style="border:none; font-size:1.2rem; cursor:pointer; padding: 2px 8px; line-height: 1;">✕</button>
            </div>
            <div class="tierlist-confirm-icono">↩️</div>
            <div class="tierlist-confirm-titulo" id="modalAlcanceRestaurarTitulo">Restaurar de fábrica</div>
            <div class="tierlist-confirm-texto" style="font-weight: 600;">¿Dónde quieres restaurar la configuración?</div>
            <div class="tierlist-confirm-texto" style="font-size: 0.85rem; opacity: 0.85; line-height: 1.4;">Se restablecerán los tiers a su configuración inicial de 5 filas (S, A, B, C, D) con sus nombres y colores predeterminados.</div>
            <div class="tierlist-modal-botones" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
                <button type="button" class="tierlist-btn-secundario" id="btnRestaurarSoloEste">Solo este Tier List</button>
                <button type="button" class="tierlist-btn-peligro" id="btnRestaurarTodos">Todos los Tier Lists</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        let resuelto = false;
        const cerrar = () => {
            if (resuelto) return;
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                cerrar();
            }
        };
        document.addEventListener("keydown", onKeyDown);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                cerrar();
            }
        });

        modal.querySelector("#btnCerrarModalAlcanceRestaurarX")?.addEventListener("click", () => {
            cerrar();
        });

        modal.querySelector("#btnRestaurarSoloEste")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (typeof onConfirmar === "function") onConfirmar("actual");
        });

        modal.querySelector("#btnRestaurarTodos")?.addEventListener("click", () => {
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
            if (typeof onConfirmar === "function") onConfirmar("todos");
        });
    }

    // Compatibilidad retroactiva
    function mostrarModalConfirmarRestaurar(onConfirmar) {
        mostrarModalAlcanceRestaurarFabrica((alcance) => {
            if (typeof onConfirmar === "function") onConfirmar(alcance);
        });
    }

    // ── MODAL DE AVISO GENÉRICO LOT-LAB ───────────────────────
    function mostrarModalAvisoLotlab(titulo, mensaje) {
        document.getElementById("tierlistModalAviso")?.remove();

        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalAviso";

        modal.innerHTML = `
        <div class="tierlist-confirm-card" role="dialog" aria-modal="true" aria-labelledby="modalAvisoTitulo">
            <div style="display: flex; justify-content: flex-end; margin: -6px -6px 0 0;">
                <button type="button" class="tierlist-btn-cancelar" id="btnCerrarModalAvisoX" aria-label="Cerrar" style="border:none; font-size:1.2rem; cursor:pointer; padding: 2px 8px; line-height: 1;">✕</button>
            </div>
            <div class="tierlist-confirm-icono">⚠️</div>
            <div class="tierlist-confirm-titulo" id="modalAvisoTitulo">${escapeHtml(titulo || "Aviso")}</div>
            <div class="tierlist-confirm-texto" style="line-height: 1.5;">${escapeHtml(mensaje || "")}</div>
            <div class="tierlist-modal-botones" style="justify-content: center; margin-top: 10px;">
                <button type="button" class="tierlist-btn-confirmar" id="btnAceptarAviso">Entendido</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        let resuelto = false;
        const cerrar = () => {
            if (resuelto) return;
            resuelto = true;
            document.removeEventListener("keydown", onKeyDown);
            modal.remove();
        };

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                cerrar();
            }
        };
        document.addEventListener("keydown", onKeyDown);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                cerrar();
            }
        });

        modal.querySelector("#btnCerrarModalAvisoX")?.addEventListener("click", cerrar);
        modal.querySelector("#btnAceptarAviso")?.addEventListener("click", cerrar);
    }

    // ── CAPTURAR SNAPSHOT PARA DESHACER ───────────────────────
    function capturarSnapshotDeshacer(alcance = "actual") {
        const estado = window.EstadoTierList;
        const modo = estado.modo;
        if (alcance === "todos") {
            _snapshotDeshacer = {
                alcance: "todos",
                modo: modo,
                modos: {
                    mundos: JSON.parse(JSON.stringify(estado.modos.mundos)),
                    packs: JSON.parse(JSON.stringify(estado.modos.packs)),
                    personalizada: JSON.parse(JSON.stringify(estado.modos.personalizada))
                }
            };
        } else {
            const activoClone = JSON.parse(JSON.stringify(estado.modos[modo]));
            _snapshotDeshacer = {
                alcance: "actual",
                modo: modo,
                modoData: activoClone
            };
        }
    }

    // ── APLICAR DESHACER ──────────────────────────────────────
    async function aplicarDeshacer() {
        if (!_snapshotDeshacer) return;
        try {
            const snap = _snapshotDeshacer;
            const estado = window.EstadoTierList;

            if (snap.alcance === "todos" && snap.modos) {
                estado.modos.mundos = JSON.parse(JSON.stringify(snap.modos.mundos));
                estado.modos.packs = JSON.parse(JSON.stringify(snap.modos.packs));
                estado.modos.personalizada = JSON.parse(JSON.stringify(snap.modos.personalizada));
                estado.modo = snap.modo;

                if (snap.modos.personalizada?.imagenesCustom) {
                    const imgs = snap.modos.personalizada.imagenesCustom;
                    for (const id of Object.keys(imgs)) {
                        await window.TierListCore.guardarImagenCustomDB(id, imgs[id]);
                    }
                }
            } else {
                estado.modos[snap.modo] = JSON.parse(JSON.stringify(snap.modoData));
                estado.modo = snap.modo;

                if (snap.modo === "personalizada" && snap.modoData.imagenesCustom) {
                    const imgs = snap.modoData.imagenesCustom;
                    for (const id of Object.keys(imgs)) {
                        await window.TierListCore.guardarImagenCustomDB(id, imgs[id]);
                    }
                }
            }

            _snapshotDeshacer = null;
            if (window.TierListCore && typeof window.TierListCore.actualizarEstructuraTiersDesdeModo === "function") {
                window.TierListCore.actualizarEstructuraTiersDesdeModo(estado.modo);
            }
            window.TierListCore.guardarBorradorLocal();
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();
        } catch (err) {
            console.error("[TierList] Error en aplicarDeshacer:", err);
        }
    }

    // ── SELECTOR DE COLOR Y NOMBRE DE TIER ────────────────────
    function abrirSelectorColorModal(tierId) {
        const estado = window.EstadoTierList;
        const tier = estado.tiers.find(t => t.id === tierId);
        if (!tier) return;

        _tierEditandoColor = tier;
        const parsed = parsearColorRGBA(tier.color);

        // Convertir RGB→HSL para inicializar los cuatro sliders desde el color real del tier
        const rN = parsed.r / 255, gN = parsed.g / 255, bN = parsed.b / 255;
        const maxC = Math.max(rN, gN, bN), minC = Math.min(rN, gN, bN), delta = maxC - minC;
        let initHue = 0, initSat = 0, initLight = (maxC + minC) / 2;
        if (delta > 0) {
            initSat = delta / (1 - Math.abs(2 * initLight - 1));
            if (maxC === rN) initHue = 60 * (((gN - bN) / delta) % 6);
            else if (maxC === gN) initHue = 60 * (((bN - rN) / delta) + 2);
            else initHue = 60 * (((rN - gN) / delta) + 4);
            if (initHue < 0) initHue += 360;
        }
        initHue = Math.round(initHue);
        initSat = Math.round(initSat * 100);
        initLight = Math.round(initLight * 100);

        const modal = document.createElement("div");
        modal.className = "tierlist-colorpicker-modal";
        modal.id = "tierlistColorModal";

        const paletaPresets = [
            "rgba(255, 77, 77, 1)", "rgba(255, 159, 67, 1)", "rgba(254, 211, 48, 1)",
            "rgba(38, 222, 129, 1)", "rgba(69, 170, 242, 1)", "rgba(155, 89, 182, 1)",
            "rgba(52, 73, 94, 1)", "rgba(235, 77, 75, 1)", "rgba(106, 176, 76, 1)",
            "rgba(34, 166, 179, 1)", "rgba(190, 46, 221, 1)", "rgba(149, 175, 192, 1)"
        ];

        modal.innerHTML = `
        <div class="tierlist-colorpicker-card">
            <div class="tierlist-colorpicker-header">
                <span>Configurar Tier</span>
                <button type="button" class="tierlist-btn-cancelar" id="cpBtnCerrarX" style="border:none; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>

            <div class="tierlist-cp-campo">
                <label for="cpInputNombre">Nombre del Tier:</label>
                <input type="text" id="cpInputNombre" class="tierlist-cp-input" value="${escapeHtml(tier.nombre)}" maxlength="15">
            </div>

            <div class="tierlist-cp-campo">
                <label>Color del Tier:</label>
                <div class="tierlist-cp-preview-bar">
                    <div class="tierlist-cp-swatch" id="cpSwatch" style="background-color: ${tier.color};"></div>
                    <span id="cpColorHex">${tier.color}</span>
                </div>
            </div>

            <div class="tierlist-cp-presets">
                ${paletaPresets.map(c => `
                    <button type="button" class="tierlist-preset-btn" data-color="${c}" style="background-color:${c};" data-tooltip="${c}"></button>
                `).join("")}
            </div>

            <div class="tierlist-cp-sliders">
                <div class="tierlist-slider-row">
                    <span>Tono (Hue):</span>
                    <input type="range" id="cpSliderHue" min="0" max="360" value="${initHue}">
                    <span id="cpValHue">${initHue}°</span>
                </div>
                <div class="tierlist-slider-row">
                    <span>Saturación:</span>
                    <input type="range" id="cpSliderSat" min="0" max="100" value="${initSat}">
                    <span id="cpValSat">${initSat}%</span>
                </div>
                <div class="tierlist-slider-row">
                    <span>Brillo:</span>
                    <input type="range" id="cpSliderLight" min="0" max="100" value="${initLight}">
                    <span id="cpValLight">${initLight}%</span>
                </div>
                <div class="tierlist-slider-row">
                    <span>Opacidad:</span>
                    <input type="range" id="cpSliderAlpha" min="10" max="100" value="${Math.round(parsed.a * 100)}">
                    <span id="cpValAlpha">${Math.round(parsed.a * 100)}%</span>
                </div>
            </div>

            <div class="tierlist-modal-botones">
                <button type="button" class="tierlist-btn-cancelar" id="cpBtnCancelar">Cancelar</button>
                <button type="button" class="tierlist-btn-confirmar" id="cpBtnGuardar">Guardar</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        let colorActualStr = tier.color;

        function actualizarColorSliders() {
            const hue = parseInt(modal.querySelector("#cpSliderHue").value, 10);
            const sat = parseInt(modal.querySelector("#cpSliderSat").value, 10) / 100;
            const light = parseInt(modal.querySelector("#cpSliderLight").value, 10) / 100;
            const alpha = parseInt(modal.querySelector("#cpSliderAlpha").value, 10) / 100;

            modal.querySelector("#cpValHue").textContent = `${hue}°`;
            modal.querySelector("#cpValSat").textContent = `${Math.round(sat * 100)}%`;
            modal.querySelector("#cpValLight").textContent = `${Math.round(light * 100)}%`;
            modal.querySelector("#cpValAlpha").textContent = `${Math.round(alpha * 100)}%`;

            const c = (1 - Math.abs(2 * light - 1)) * sat;
            const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
            const m = light - c / 2;
            let r1 = 0, g1 = 0, b1 = 0;
            if (hue < 60) { r1 = c; g1 = x; b1 = 0; }
            else if (hue < 120) { r1 = x; g1 = c; b1 = 0; }
            else if (hue < 180) { r1 = 0; g1 = c; b1 = x; }
            else if (hue < 240) { r1 = 0; g1 = x; b1 = c; }
            else if (hue < 300) { r1 = x; g1 = 0; b1 = c; }
            else { r1 = c; g1 = 0; b1 = x; }

            const rFinal = Math.round((r1 + m) * 255);
            const gFinal = Math.round((g1 + m) * 255);
            const bFinal = Math.round((b1 + m) * 255);

            colorActualStr = `rgba(${rFinal}, ${gFinal}, ${bFinal}, ${alpha.toFixed(2)})`;
            modal.querySelector("#cpSwatch").style.backgroundColor = colorActualStr;
            modal.querySelector("#cpColorHex").textContent = colorActualStr;
        }

        modal.querySelectorAll("#cpSliderHue, #cpSliderSat, #cpSliderLight, #cpSliderAlpha").forEach(input => {
            input.addEventListener("input", actualizarColorSliders);
        });

        modal.querySelectorAll(".tierlist-preset-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                colorActualStr = btn.dataset.color;
                modal.querySelector("#cpSwatch").style.backgroundColor = colorActualStr;
                modal.querySelector("#cpColorHex").textContent = colorActualStr;
                const p = parsearColorRGBA(colorActualStr);
                modal.querySelector("#cpSliderAlpha").value = Math.round(p.a * 100);
            });
        });

        const cerrar = () => modal.remove();

        modal.querySelector("#cpBtnCerrarX").addEventListener("click", cerrar);
        modal.querySelector("#cpBtnCancelar").addEventListener("click", cerrar);

        modal.querySelector("#cpBtnGuardar").addEventListener("click", () => {
            const nuevoNombre = (modal.querySelector("#cpInputNombre").value || tier.nombre).trim() || "Tier";
            window.TierListCore.actualizarTierGlobal(tier.id, {
                nombre: nuevoNombre,
                color: colorActualStr
            });

            cerrar();
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();
        });
    }

    // ── EDITOR DE ENCUADRE 1:1 Y FORMA INDIVIDUAL ─────────────
    function abrirEditorEncuadreModal(itemId, onConfirmar) {
        const estado = window.EstadoTierList;
        const item = estado.elementos[itemId];
        if (!item) return;

        _itemEditandoEncuadre = item;
        const encInicial = item.encuadre || { x: 0, y: 0, zoom: 1 };
        _encuadreTemp = { x: encInicial.x, y: encInicial.y, zoom: encInicial.zoom };
        let formaTemp = item.forma || "cuadrado";

        const modal = document.createElement("div");
        modal.className = "tierlist-encuadre-modal";
        modal.id = "tierlistEncuadreModal";

        modal.innerHTML = `
        <div class="tierlist-encuadre-card">
            <div class="tierlist-encuadre-header">
                <span>Ajustar encuadre y forma (1:1)</span>
                <button type="button" class="tierlist-btn-cancelar" id="encBtnCerrarX" style="border:none; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>

            <!-- Selector individual de Forma: Cuadrado / Redondo como Switch de Packs -->
            <div class="tierlist-encuadre-forma-selector">
                <span class="tierlist-encuadre-forma-label">Forma de la ficha:</span>
                <label class="switchModoVista" style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                    <span id="lblFormaCuadrado" style="font-size: 0.88rem; font-weight: ${formaTemp === 'cuadrado' ? 'bold' : 'normal'}; transition: all 0.25s; opacity: ${formaTemp === 'cuadrado' ? '1' : '0.55'};">Cuadrado</span>
                    <input type="checkbox" id="toggleFormaFichaInput" style="display: none;" ${formaTemp === 'circulo' ? 'checked' : ''}>
                    <span class="sliderSwitch">
                        <span class="thumbSwitch"></span>
                    </span>
                    <span id="lblFormaCirculo" style="font-size: 0.88rem; font-weight: ${formaTemp === 'circulo' ? 'bold' : 'normal'}; transition: all 0.25s; opacity: ${formaTemp === 'circulo' ? '1' : '0.55'};">Redondo</span>
                </label>
            </div>

            <!-- Visor con máscara cuadrada o circular según forma seleccionada -->
            <div class="tierlist-encuadre-visor ${formaTemp === 'circulo' ? 'es-circulo' : ''}" id="encVisor">
                <img src="${item.rutaIcono}" alt="Previsualización" class="tierlist-encuadre-img" id="encImg">
            </div>

            <div class="tierlist-encuadre-ayuda">
                🖐️ Arrastra la imagen para encuadrar • Usa el control o la rueda para zoom
            </div>

            <div class="tierlist-encuadre-zoom-wrap">
                <span>Zoom:</span>
                <input type="range" class="tierlist-encuadre-zoom-slider" id="encSliderZoom" min="1" max="3" step="0.05" value="${_encuadreTemp.zoom}">
                <span id="encValZoom">${Math.round(_encuadreTemp.zoom * 100)}%</span>
            </div>

            <div class="tierlist-modal-botones">
                <button type="button" class="tierlist-btn-cancelar" id="encBtnCentrar">Centrar</button>
                <button type="button" class="tierlist-btn-cancelar" id="encBtnCancelar">Cancelar</button>
                <button type="button" class="tierlist-btn-confirmar" id="encBtnGuardar">Confirmar</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        const visor = modal.querySelector("#encVisor");
        const img = modal.querySelector("#encImg");
        const sliderZoom = modal.querySelector("#encSliderZoom");
        const valZoom = modal.querySelector("#encValZoom");
        const toggleFormaInput = modal.querySelector("#toggleFormaFichaInput");
        const lblFormaCuadrado = modal.querySelector("#lblFormaCuadrado");
        const lblFormaCirculo = modal.querySelector("#lblFormaCirculo");

        // Alternar forma mediante switch y reflejar en la máscara del visor
        toggleFormaInput?.addEventListener("change", () => {
            formaTemp = toggleFormaInput.checked ? "circulo" : "cuadrado";
            if (lblFormaCuadrado) {
                lblFormaCuadrado.style.opacity = formaTemp === "cuadrado" ? "1" : "0.55";
                lblFormaCuadrado.style.fontWeight = formaTemp === "cuadrado" ? "bold" : "normal";
            }
            if (lblFormaCirculo) {
                lblFormaCirculo.style.opacity = formaTemp === "circulo" ? "1" : "0.55";
                lblFormaCirculo.style.fontWeight = formaTemp === "circulo" ? "bold" : "normal";
            }
            visor.classList.toggle("es-circulo", formaTemp === "circulo");
        });

        function aplicarTransformImg() {
            img.style.transform = `translate(${_encuadreTemp.x}px, ${_encuadreTemp.y}px) scale(${_encuadreTemp.zoom})`;
            valZoom.textContent = `${Math.round(_encuadreTemp.zoom * 100)}%`;
        }

        img.onload = () => {
            const naturalW = img.naturalWidth || 260;
            const naturalH = img.naturalHeight || 260;
            const scaleBase = Math.max(260 / naturalW, 260 / naturalH);
            img.style.width = `${Math.round(naturalW * scaleBase)}px`;
            img.style.height = `${Math.round(naturalH * scaleBase)}px`;
            img.style.left = `${(260 - Math.round(naturalW * scaleBase)) / 2}px`;
            img.style.top = `${(260 - Math.round(naturalH * scaleBase)) / 2}px`;
            aplicarTransformImg();
        };

        if (img.complete) img.onload();

        sliderZoom.addEventListener("input", (e) => {
            _encuadreTemp.zoom = parseFloat(e.target.value);
            aplicarTransformImg();
        });

        visor.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.05 : -0.05;
            _encuadreTemp.zoom = Math.max(1, Math.min(3, _encuadreTemp.zoom + delta));
            sliderZoom.value = _encuadreTemp.zoom;
            aplicarTransformImg();
        }, { passive: false });

        let arrastrando = false;
        let lastX = 0, lastY = 0;

        visor.addEventListener("pointerdown", (e) => {
            arrastrando = true;
            lastX = e.clientX;
            lastY = e.clientY;
            visor.setPointerCapture(e.pointerId);
        });

        visor.addEventListener("pointermove", (e) => {
            if (!arrastrando) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            _encuadreTemp.x += dx;
            _encuadreTemp.y += dy;
            aplicarTransformImg();
        });

        const finArrastre = () => { arrastrando = false; };
        visor.addEventListener("pointerup", finArrastre);
        visor.addEventListener("pointercancel", finArrastre);

        modal.querySelector("#encBtnCentrar").addEventListener("click", () => {
            _encuadreTemp.x = 0;
            _encuadreTemp.y = 0;
            _encuadreTemp.zoom = 1;
            sliderZoom.value = 1;
            aplicarTransformImg();
        });

        const cerrar = () => modal.remove();

        modal.querySelector("#encBtnCerrarX").addEventListener("click", cerrar);
        modal.querySelector("#encBtnCancelar").addEventListener("click", cerrar);

        modal.querySelector("#encBtnGuardar").addEventListener("click", () => {
            item.forma = formaTemp;
            item.encuadre = {
                x: Math.round(_encuadreTemp.x),
                y: Math.round(_encuadreTemp.y),
                zoom: +(_encuadreTemp.zoom.toFixed(2))
            };
            cerrar();
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();

            // Callback post-confirmación (usado para flujo multi-imagen)
            if (typeof onConfirmar === "function") {
                onConfirmar({ forma: item.forma, encuadre: { ...item.encuadre } });
            }
        });
    }

    // ── MODAL APLICAR AJUSTES A TODAS LAS IMÁGENES ────────────
    function mostrarModalAplicarATodas(ajustes, idsRestantes) {
        if (!idsRestantes || idsRestantes.length === 0) return;

        const modal = document.createElement("div");
        modal.className = "tierlist-modal-overlay";
        modal.id = "tierlistModalAplicarATodas";

        const cantRestantes = idsRestantes.length;
        const textoPlural = cantRestantes === 1 ? "la otra imagen" : `las otras ${cantRestantes} imágenes`;
        const formaTexto = ajustes.forma === "circulo" ? "redonda" : "cuadrada";

        modal.innerHTML = `
        <div class="tierlist-confirm-card" style="position: relative;">
            <button type="button" class="tierlist-btn-cancelar" id="btnCerrarModalAplicar" style="position: absolute; top: 12px; right: 12px; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; line-height: 1;">✕</button>
            <div class="tierlist-confirm-icono">✂️</div>
            <div class="tierlist-confirm-titulo">¿Aplicar estos ajustes a las demás imágenes?</div>
            <div class="tierlist-confirm-texto" style="line-height: 1.6;">
                Has configurado la primera imagen (forma <strong>${formaTexto}</strong>, zoom ${Math.round(ajustes.encuadre.zoom * 100)}%).<br>
                ¿Quieres aplicar estos mismos ajustes de forma, zoom y encuadre a ${textoPlural}, o prefieres configurarlas una a una?
            </div>
            <div class="tierlist-modal-botones" style="justify-content: center; gap: 12px; flex-wrap: wrap;">
                <button type="button" class="tierlist-btn-cancelar" id="btnConfigurarUnaAUna">Configurar una a una</button>
                <button type="button" class="tierlist-btn-confirmar" id="btnAplicarATodas">Aplicar a todas</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        const cerrar = () => modal.remove();

        modal.querySelector("#btnCerrarModalAplicar").addEventListener("click", cerrar);

        modal.querySelector("#btnAplicarATodas").addEventListener("click", () => {
            cerrar();
            const estado = window.EstadoTierList;
            idsRestantes.forEach(id => {
                const item = (estado.modos && estado.modos.personalizada && estado.modos.personalizada.elementos[id]) || (estado.elementos && estado.elementos[id]);
                if (item) {
                    item.forma = ajustes.forma;
                    item.encuadre = {
                        x: ajustes.encuadre.x,
                        y: ajustes.encuadre.y,
                        zoom: ajustes.encuadre.zoom
                    };
                }
            });
            window.TierListCore.notificarCambioEstado();
            renderizarTierList();
        });

        modal.querySelector("#btnConfigurarUnaAUna").addEventListener("click", () => {
            cerrar();
            abrirEditorSecuencial(idsRestantes, 0);
        });
    }

    // ── CONFIGURACIÓN SECUENCIAL UNA A UNA ────────────────────
    function abrirEditorSecuencial(ids, index) {
        if (!ids || index >= ids.length) {
            renderizarTierList();
            return;
        }
        abrirEditorEncuadreModal(ids[index], () => {
            abrirEditorSecuencial(ids, index + 1);
        });
    }

    // ── MODAL DE RECUPERACIÓN LOCAL ───────────────────────────
    function mostrarModalRecuperacion() {
        const modal = document.createElement("div");
        modal.className = "tierlist-recuperar-modal";
        modal.id = "tierlistRecuperarModal";

        modal.innerHTML = `
        <div class="tierlist-recuperar-card">
            <div class="tierlist-recuperar-icono">💾</div>
            <div class="tierlist-recuperar-titulo">Hemos encontrado una Tier List sin terminar</div>
            <div class="tierlist-recuperar-texto">
                Parece que tienes una Tier List guardada localmente de una sesión anterior. ¿Quieres recuperarla o empezar una nueva desde cero?
            </div>
            <div class="tierlist-recuperar-botones">
                <button type="button" class="tierlist-btn-recuperar" id="btnRecuperarDraft">RECUPERAR</button>
                <button type="button" class="tierlist-btn-empezar-nuevo" id="btnDescartarDraft">EMPEZAR DE NUEVO</button>
            </div>
        </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#btnRecuperarDraft").addEventListener("click", async () => {
            window.TierListCore.borradorResuelto = true;
            const resultado = await window.TierListCore.cargarBorradorLocal();
            // Cerrar el modal PRIMERO, antes de cualquier cambio de URL que
            // pudiera disparar hashchange/procesarRutaURL y reabrir el modal
            modal.remove();
            // Actualizar la URL según el resultado (después de eliminar el modal)
            if (resultado && resultado.token && typeof window.actualizarHashURL === "function") {
                window.actualizarHashURL("tier-list/v1/" + resultado.token, false);
            } else if (window.EstadoTierList && typeof window.TierListCore.actualizarURLDinamica === "function") {
                window.TierListCore.actualizarURLDinamica();
            }
            renderizarTierList();
        });

        modal.querySelector("#btnDescartarDraft").addEventListener("click", () => {
            window.TierListCore.borradorResuelto = true;
            window.TierListCore.descartarBorradorLocal();
            modal.remove();
            inicializarTierList(true);
        });
    }

    // ── SINCRONIZACIÓN CON OBS VIEWER ─────────────────────────
    window.restaurarTierListObs = function (estadoRecibido) {
        if (!estadoRecibido) return;
        const estado = window.EstadoTierList;
        estado.version = estadoRecibido.version || 1;
        estado.pantalla = "tablero";
        estado.modo = estadoRecibido.modo || "mundos";
        estado.titulo = estadoRecibido.titulo || "Tier List";
        if (estadoRecibido.filtros) {
            if (estado.modo === "mundos") estado.modos.mundos.filtros = estadoRecibido.filtros;
            else if (estado.modo === "packs") estado.modos.packs.filtros = estadoRecibido.filtros;
        }
        if (estadoRecibido.tiers) estado.tiers = estadoRecibido.tiers;
        if (estadoRecibido.sinClasificar) estado.sinClasificar = estadoRecibido.sinClasificar;
        if (estadoRecibido.elementos) estado.elementos = estadoRecibido.elementos;
        if (estadoRecibido.imagenesCustom) estado.imagenesCustom = estadoRecibido.imagenesCustom;

        const ventana = document.getElementById("ventanaTierList");
        if (ventana && (ventana.style.display === "none" || getComputedStyle(ventana).display === "none")) {
            if (typeof window.abrirVentana === "function") {
                window.abrirVentana("ventanaTierList", false);
            }
        }

        renderizarTierList();
    };

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ── EXPORTACIÓN GLOBAL ───────────────────────────────────
    window.TierListUI = {
        inicializarTierList,
        renderizarTierList,
        abrirSelectorColorModal,
        abrirEditorEncuadreModal,
        mostrarModalAplicarATodas,
        mostrarModalAnchoTier,
        mostrarModalPropagarLotlab,
        mostrarModalAlcanceLimpiarFichas,
        mostrarModalAlcanceRestaurarFabrica
    };

    window.inicializarTierList = inicializarTierList;

    console.log("✔ tier-list-ui.js cargado correctamente");
})();
