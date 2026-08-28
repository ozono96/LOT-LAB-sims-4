/* =========================================================
   LOT-LAB SIMS 4 - INTEGRACIÓN OBS STUDIO (BROWSER SOURCE - WebRTC)
   ========================================================= */

(function () {
    // ─── CONFIGURACIÓN E INICIALIZACIÓN ──────────────────────
    const OBS_STORAGE_KEY = 'lotlab_obs_settings';
    
    let obsConfig = { pos: 'right', theme: 'noche', bg: 'transparent', scale: 100 };
    try {
        const saved = localStorage.getItem(OBS_STORAGE_KEY);
        if (saved) obsConfig = Object.assign(obsConfig, JSON.parse(saved));
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
    
    const isObsMode = urlParams.get('obs') === '1' || hashParams.get('obs') === '1';
    const roomParam = urlParams.get('room') || hashParams.get('room');

    if (urlParams.has('pos')) obsConfig.pos = urlParams.get('pos');
    if (urlParams.has('theme')) obsConfig.theme = urlParams.get('theme');
    if (urlParams.has('bg')) obsConfig.bg = urlParams.get('bg');
    if (urlParams.has('scale')) obsConfig.scale = parseInt(urlParams.get('scale'), 10) || 100;

    // Obtener la escala del usuario como número decimal entre 0.20 y 1.00 (por defecto 1.00 = 100%)
    function obtenerEscalaUsuarioOBS() {
        const s = parseInt(obsConfig.scale, 10);
        if (isNaN(s) || s < 20) return 1;
        return Math.min(Math.max(s, 20), 100) / 100;
    }
    window.obtenerEscalaUsuarioOBS = obtenerEscalaUsuarioOBS;
    window.obsConfig = obsConfig;

    // Aplicar la escala global de OBS a las ventanas y variables CSS
    function aplicarEscalaOBSGlobal() {
        if (!isObsMode) return;
        const escalaUsuario = obtenerEscalaUsuarioOBS();

        // Si la ventana de resultado de reto está visible, calcularEscalaRetoOBS combina auto-fit * escalaUsuario
        const ventanaReto = document.getElementById("ventanaRetoResultado");
        const retoVisible = ventanaReto && ventanaReto.style.display !== "none" && getComputedStyle(ventanaReto).display !== "none";

        if (retoVisible && typeof window.calcularEscalaRetoOBS === "function") {
            window.calcularEscalaRetoOBS();
        } else {
            document.body.style.setProperty("--escala-obs", escalaUsuario);
            const composicion = document.getElementById("composicionRetoTemporizador");
            if (composicion) composicion.style.setProperty("--escala-obs", escalaUsuario);
        }
    }
    window.aplicarEscalaOBSGlobal = aplicarEscalaOBSGlobal;

    // ─── CAPA DE BRANDING (SOLO PARA OBS VIEWER) ─────────────
    function aplicarBrandingOBS() {
        if (!isObsMode) return;
        
        document.body.classList.add('modo-obs');
        // Clases visuales
        document.body.classList.remove('obs-pos-left', 'obs-pos-center', 'obs-pos-right');
        document.body.classList.add('obs-pos-' + (obsConfig.pos || 'right'));
        document.body.classList.remove('obs-bg-transparent', 'obs-bg-dark', 'obs-bg-light');
        document.body.classList.add('obs-bg-' + (obsConfig.bg || 'transparent'));
        
        document.body.classList.remove('modo-dia', 'modo-noche', 'modo-obs-dia', 'modo-obs-noche');
        if (obsConfig.theme === 'dia') document.body.classList.add('modo-dia', 'modo-obs-dia');
        else if (obsConfig.theme === 'noche') document.body.classList.add('modo-noche', 'modo-obs-noche');
        else document.body.classList.add(localStorage.getItem('modo-color') || 'modo-noche');

        // Aplicar la escala configurada
        aplicarEscalaOBSGlobal();

        // Limpiar el antiguo branding fixed al viewport si existiese en el body
        const oldBodyLayer = document.getElementById("obsBrandingLayer");
        if (oldBodyLayer && oldBodyLayer.parentElement === document.body) {
            oldBodyLayer.remove();
        }

        // Asociar la marca de agua a cada ventana para que se posicione respecto a sus límites
        document.querySelectorAll('.ventana').forEach(ventana => {
            if (!ventana.querySelector('.obsBrandingLayer')) {
                const brandingLayer = document.createElement("div");
                brandingLayer.className = "obsBrandingLayer";
                brandingLayer.style.pointerEvents = "none";
                
                const textoIzquierda = document.createElement("div");
                textoIzquierda.className = "obsBrandingTextoIzq";
                textoIzquierda.textContent = "LOT-LAB Sims 4";

                const textoDerecha = document.createElement("div");
                textoDerecha.className = "obsBrandingTextoDer";
                textoDerecha.textContent = "Creado por Ozono 96";

                brandingLayer.appendChild(textoIzquierda);
                brandingLayer.appendChild(textoDerecha);
                ventana.appendChild(brandingLayer);
            }
        });
    }

    if (isObsMode && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicarBrandingOBS);
    } else if (isObsMode) {
        aplicarBrandingOBS();
    }

    // ─── ESTADO CANÓNICO GLOBAL ──────────────────────────────
    const EstadoGlobal = {
        version: 0,
        ventanaActual: 'ventanaAcercaDe',
        
        estadosSemanticos: {
            ruletaDesastres: null,
            ruletaColor: null,
            temporizador: null,
            dados: null,
            packs: null,
            fichaSolar: null,
            retoGenerado: null,
            habilidades: null
        },

        uiState: {},     // Para almacenar clases y estilos { "id": { className: "...", style: "..." } }
        htmlState: {},   // Para HTML dinámico { "id": "..." }
        scrollState: {}  // Para scroll { "id": { top: 0, left: 0 } }
    };

    function incrementarVersion() {
        EstadoGlobal.version++;
        return EstadoGlobal.version;
    }

    // ─── WEBRTC (PEERJS) ─────────────────────────────────────
    let peer = null;
    let conexionesActivas = [];
    let miConexionServer = null;
    let isMaster = !isObsMode;
    let peerSessionId = roomParam;

    window.esSincronizacionOBS = false; 
    
    window.emitirEventoOBS = function (tipo, payload = {}) {
        if (!isMaster) return;

        const timestamp = Date.now();
        const mensaje = { tipo, timestamp, ...payload };
        
        actualizarEstadoMaestroLocal(mensaje);
        
        mensaje.version = incrementarVersion();
        
        conexionesActivas.forEach(conn => {
            if (conn.open) {
                conn.send(mensaje);
            }
        });
    };

    function actualizarEstadoMaestroLocal(msg) {
        if (msg.tipo === "SYNC_ABRIR_VENTANA") EstadoGlobal.ventanaActual = msg.idVentana;
        if (msg.tipo === "SYNC_MODAL_PACKS") EstadoGlobal.estadosSemanticos.packs = msg;
        if (msg.tipo === "SYNC_FICHA_SOLAR") EstadoGlobal.estadosSemanticos.fichaSolar = msg;
        if (msg.tipo === "RETO_GENERADO") EstadoGlobal.estadosSemanticos.retoGenerado = msg;
        if (msg.tipo === "RETO_REROLL" && msg.reto) {
            if (!EstadoGlobal.estadosSemanticos.retoGenerado) {
                EstadoGlobal.estadosSemanticos.retoGenerado = { tipo: "RETO_GENERADO", reto: msg.reto };
            } else {
                EstadoGlobal.estadosSemanticos.retoGenerado.reto = msg.reto;
            }
        }
        if (msg.tipo === "TIRAR_HABILIDADES") EstadoGlobal.estadosSemanticos.habilidades = msg;
        if (msg.tipo === "TIRAR_PACKS") EstadoGlobal.estadosSemanticos.packs = msg;
        if (msg.tipo === "TIRAR_MUNDOS") EstadoGlobal.estadosSemanticos.mundos = msg;

        if (msg.tipo === "SYNC_UI_BATCH") {
            // Actualizar uiState y htmlState
            if (msg.uiState) {
                Object.keys(msg.uiState).forEach(id => {
                    EstadoGlobal.uiState[id] = msg.uiState[id];
                });
            }
            if (msg.htmlState) {
                Object.keys(msg.htmlState).forEach(id => {
                    EstadoGlobal.htmlState[id] = msg.htmlState[id];
                });
            }
        }
        
        if (msg.tipo === "SCROLL_SYNC_BATCH") {
            if (msg.scrollState) {
                Object.keys(msg.scrollState).forEach(id => {
                    EstadoGlobal.scrollState[id] = msg.scrollState[id];
                });
            }
        }

        if (msg.tipo === "SYNC_ACCION") {
            if (msg.accion === "RULETA_DESASTRES_SUBPANTALLA") EstadoGlobal.estadosSemanticos.ruletaDesastresSubpantalla = msg.payload;
            if (msg.accion === "GIRAR_RULETA_DESASTRES") EstadoGlobal.estadosSemanticos.ruletaDesastres = msg;
            if (msg.accion === "GIRAR_RULETA_COLOR") EstadoGlobal.estadosSemanticos.ruletaColor = msg;
            if (msg.accion === "RULETA_COLOR_TIRADAS_STATE") EstadoGlobal.estadosSemanticos.ruletaColorTiradas = msg.payload;
            if (msg.accion === "TEMPORIZADOR") EstadoGlobal.estadosSemanticos.temporizador = msg;
            if (msg.accion === "TEMPORIZADOR_MINUTOS_STATE") EstadoGlobal.estadosSemanticos.temporizadorMinutos = msg.payload;
            if (msg.accion === "TIRAR_DADOS") EstadoGlobal.estadosSemanticos.dados = msg;
            if (msg.accion === "DADOS_TIRADAS_STATE") EstadoGlobal.estadosSemanticos.dadosTiradas = msg.payload;
            if (msg.accion === "HAB_CANTIDAD_STATE") EstadoGlobal.estadosSemanticos.habCantidad = msg.payload;
            if (msg.accion === "ESTADISTICAS_STATE") EstadoGlobal.estadosSemanticos.estadisticas = msg.payload;
            if (msg.accion === "RETOS_PACKS_UPDATE") EstadoGlobal.estadosSemanticos.retosPacks = msg.payload;
            if (msg.accion === "RETOS_OPCIONES_STATE") EstadoGlobal.estadosSemanticos.retosOpciones = msg.payload;
            if (msg.accion === "TEMPORIZADOR_ACOPLADO_STATE") EstadoGlobal.estadosSemanticos.temporizadorAcoplado = msg.payload;
            if (msg.accion === "RULETA_DESASTRES_CONFIG_STATE") EstadoGlobal.estadosSemanticos.ruletaDesastresConfig = msg.payload;
            if (msg.accion === "FILTROS_SOLARES_STATE") EstadoGlobal.estadosSemanticos.filtrosSolares = msg.payload;
            if (msg.accion === "FILTRO_SOLARES_PANEL") EstadoGlobal.estadosSemanticos.filtroSolarPanel = msg.payload;
            if (msg.accion === "BUSCAR_SOLARES_RESULTADO") EstadoGlobal.estadosSemanticos.buscarSolaresResultado = msg.payload;
        }
    }

    window.ejecutarEstadisticasObs = function(payload) {
        if (!payload) return;
        if (payload.filtros) {
            if (payload.filtros.texto !== undefined && document.getElementById("estatBuscarTexto")) document.getElementById("estatBuscarTexto").value = payload.filtros.texto;
            if (payload.filtros.fechaDesde !== undefined && document.getElementById("estatFechaDesde")) document.getElementById("estatFechaDesde").value = payload.filtros.fechaDesde;
            if (payload.filtros.fechaHasta !== undefined && document.getElementById("estatFechaHasta")) document.getElementById("estatFechaHasta").value = payload.filtros.fechaHasta;
            if (payload.filtros.precioMin !== undefined && document.getElementById("estatPrecioMin")) document.getElementById("estatPrecioMin").value = payload.filtros.precioMin;
            if (payload.filtros.precioMax !== undefined && document.getElementById("estatPrecioMax")) document.getElementById("estatPrecioMax").value = payload.filtros.precioMax;
            if (payload.filtros.tipoPack !== undefined && document.getElementById("estatTipoPack")) document.getElementById("estatTipoPack").value = payload.filtros.tipoPack;
            if (typeof window.aplicarFiltrosEstadisticas === "function") window.aplicarFiltrosEstadisticas();
        }
        if (payload.vista && typeof window.toggleVistaEstadisticas === "function") {
            window.toggleVistaEstadisticas(payload.vista);
        }
    };

    window.ejecutarTemporizadorAcopladoObs = function(payload) {
        if (!payload) return;
        const ventanaTemp = document.getElementById("ventanaTemporizador");
        const app = document.getElementById("app");
        const btnToggleReto = document.getElementById("toggleTemporizadorRetoBtn");
        const btnToggleRuleta = document.getElementById("toggleTemporizadorRuletaBtn");

        if (payload.acopladoAbierto) {
            if (ventanaTemp) ventanaTemp.style.display = "flex";
            if (app) app.classList.add("modo-paralelo");
            if (btnToggleReto) btnToggleReto.innerHTML = "⏱️ Cerrar temporizador";
            if (btnToggleRuleta) btnToggleRuleta.innerHTML = "⏱️ Cerrar temporizador";
        } else {
            if (typeof window.cerrarTemporizadorAcoplado === "function") {
                window.cerrarTemporizadorAcoplado();
            }
        }
    };

    function aplicarScrollWindowOBS(windowFraction, left) {
        const idVentana = window.ventanaActual || EstadoGlobal.ventanaActual;
        if (idVentana === 'ventanaRetoResultado') {
            window.scrollTo(0, 0);
            return;
        }

        const ventana = idVentana ? document.getElementById(idVentana) : document.querySelector('.ventana:not([style*="display: none"])');
        if (!ventana) {
            window.scrollTo(0, 0);
            return;
        }

        // Misma lógica que el master: calcular el rango de scroll propio de OBS para esta ventana.
        // scrollBase = cuánto hay que bajar para que la ventana quede pegada al borde del menu.
        // maxScrollWindow = cuánto hay que bajar más para ver el fondo de la ventana.
        const menuEl = document.getElementById('menuPrincipal');
        const menuBottom = menuEl ? menuEl.getBoundingClientRect().bottom : 0;
        const GAP = 20;
        const targetTopEnViewport = menuBottom + GAP;
        const ventanaTopEnDoc = ventana.getBoundingClientRect().top + window.scrollY;
        const scrollBase = Math.max(0, ventanaTopEnDoc - targetTopEnViewport);

        const ventanaHeight = Math.max(
            ventana.offsetHeight || 0,
            ventana.scrollHeight || 0,
            ventana.getBoundingClientRect().height || 0
        );
        // Recorrido hasta ver el último píxel de la ventana
        const maxScrollWindow = Math.max(1,
            ventanaHeight + targetTopEnViewport - window.innerHeight
        );

        const docMaxScroll = Math.max(0,
            document.documentElement.scrollHeight - window.innerHeight
        );

        // Escalar la fracción del master sobre el rango OBS
        const fraction = Math.min(1, Math.max(0, windowFraction));
        const targetScrollY = Math.round(
            Math.min(docMaxScroll, scrollBase + fraction * maxScrollWindow)
        );

        window.scrollTo(left || 0, targetScrollY);
    }

    function inicializarPeerJS() {
        if (typeof Peer === 'undefined') {
            console.warn("PeerJS no está cargado.");
            setTimeout(inicializarPeerJS, 500);
            return;
        }

        if (isMaster) {
            peerSessionId = localStorage.getItem('lotlab_obs_peer_session');
            if (!peerSessionId) {
                peerSessionId = 'lotlab_' + Math.random().toString(36).substring(2, 10);
                localStorage.setItem('lotlab_obs_peer_session', peerSessionId);
            }
            
            peer = new Peer(peerSessionId);
            
            peer.on('open', id => {
                console.log("[Master] Servidor P2P listo. ID de sala:", id);
                actualizarModalOBSUI();
            });

            peer.on('connection', conn => {
                conexionesActivas.push(conn);
                console.log("[Master] Nuevo Viewer conectado:", conn.peer);
                
                conn.on('open', () => {
                    conn.send({
                        tipo: "FULL_STATE",
                        estado: EstadoGlobal,
                        config: obsConfig,
                        timestamp: Date.now()
                    });
                });
                
                conn.on('data', data => {
                    if (data.tipo === "REQUEST_STATE") {
                        conn.send({ tipo: "FULL_STATE", estado: EstadoGlobal, config: obsConfig, timestamp: Date.now() });
                    }
                });
                
                conn.on('close', () => {
                    conexionesActivas = conexionesActivas.filter(c => c !== conn);
                });
            });

            peer.on('disconnected', () => {
                console.log("[Master] Desconectado del servidor de señalización, reconectando...");
                peer.reconnect();
            });
            
            iniciarScrollTracking();
            
        } else {
            // Viewer (OBS)
            if (!peerSessionId) {
                console.error("No se proporcionó room ID en la URL de OBS.");
                return;
            }
            
            peer = new Peer();
            
            peer.on('open', () => {
                conectarAlMaster();
            });

            peer.on('disconnected', () => {
                setTimeout(() => peer.reconnect(), 2000);
            });
        }
    }

    function conectarAlMaster() {
        if (!peer || peer.disconnected) return;
        
        console.log("[Viewer] Conectando a sala:", peerSessionId);
        miConexionServer = peer.connect(peerSessionId, { reliable: true });
        
        miConexionServer.on('open', () => {
            console.log("[Viewer] ¡Conectado al Master!");
            miConexionServer.send({ tipo: "REQUEST_STATE" });
        });
        
        miConexionServer.on('data', data => {
            procesarMensajeObs(data);
        });
        
        miConexionServer.on('close', () => {
            console.log("[Viewer] Conexión perdida con Master. Reconectando en 3s...");
            setTimeout(conectarAlMaster, 3000);
        });
        
        miConexionServer.on('error', err => {
            console.error("[Viewer] Error de conexión:", err);
            setTimeout(conectarAlMaster, 3000);
        });
    }

    let versionEstadoLocal = -1;

    function procesarMensajeObs(data) {
        if (!data || !data.tipo) return;

        window.esSincronizacionOBS = true; 

        try {
            if (data.tipo === "FULL_STATE") {
                versionEstadoLocal = data.estado.version;
                if (data.config) {
                    obsConfig = Object.assign(obsConfig, data.config);
                    aplicarBrandingOBS();
                }
                
                // 1. Restaurar UI State (modales, clases, estilos internos - omitiendo .ventana)
                if (data.estado.uiState) {
                    Object.keys(data.estado.uiState).forEach(id => {
                        const el = document.querySelector(`[data-sync-id='${id}']`) || document.getElementById(id);
                        if (el && !el.classList.contains('ventana')) {
                            if (data.estado.uiState[id].className !== undefined) el.className = data.estado.uiState[id].className;
                            if (data.estado.uiState[id].style !== undefined) el.setAttribute('style', data.estado.uiState[id].style);
                        }
                    });
                }

                // 2. Restaurar HTML dinámico
                if (data.estado.htmlState) {
                    Object.keys(data.estado.htmlState).forEach(id => {
                        const el = document.querySelector(`[data-sync-id='${id}']`) || document.getElementById(id);
                        if (el) el.innerHTML = data.htmlState[id];
                    });
                }
                
                // 3. Restaurar Scroll
                if (data.estado.scrollState) {
                    Object.keys(data.estado.scrollState).forEach(id => {
                        const state = data.estado.scrollState[id];
                        if (id === 'window') {
                            aplicarScrollWindowOBS(state.top, state.left, state.progress);
                        } else {
                            const el = document.querySelector(`[data-sync-id='${id}']`) || document.getElementById(id);
                            if (el) { el.scrollLeft = state.left; el.scrollTop = state.top; }
                        }
                    });
                }
                
                // 4. Restaurar Estados Semánticos
                const sem = data.estado.estadosSemanticos;
                if (sem) {
                    if (sem.packs) procesarMensajeObs(sem.packs);
                    // Pasar payload completo (incluye modoVista)
                    if (sem.retosPacks && typeof window.actualizarPacksRetosObs === 'function') window.actualizarPacksRetosObs(sem.retosPacks);
                    // sem.habilidadesPacks eliminado: Habilidades usa PACKS_SELECCIONADOS_SET común
                    if (sem.retosOpciones && typeof window.actualizarOpcionesRetoObs === 'function') window.actualizarOpcionesRetoObs(sem.retosOpciones);
                    if (sem.fichaSolar && sem.fichaSolar.abierta && typeof window.abrirFichaSolar === 'function') window.abrirFichaSolar(sem.fichaSolar.idSolar);
                    if (sem.retoGenerado && typeof window.renderizarResultadoReto === 'function') {
                        window.retoActual = sem.retoGenerado.reto;
                        window.renderizarResultadoReto(sem.retoGenerado.reto);
                    }
                    if (sem.temporizadorAcoplado && typeof window.ejecutarTemporizadorAcopladoObs === 'function') window.ejecutarTemporizadorAcopladoObs(sem.temporizadorAcoplado);
                    if (sem.estadisticas && typeof window.ejecutarEstadisticasObs === 'function') window.ejecutarEstadisticasObs(sem.estadisticas);
                    if (sem.habilidades && typeof window.restaurarResultadoHabilidadesObs === 'function') window.restaurarResultadoHabilidadesObs(sem.habilidades);
                    if (sem.packs && typeof window.restaurarResultadoPacksObs === 'function') window.restaurarResultadoPacksObs(sem.packs);
                    if (sem.mundos && typeof window.restaurarResultadoMundosObs === 'function') window.restaurarResultadoMundosObs(sem.mundos);
                    if (sem.ruletaDesastresSubpantalla && typeof window.ejecutarSubpantallaRuletaDesastresObs === 'function') window.ejecutarSubpantallaRuletaDesastresObs(sem.ruletaDesastresSubpantalla);
                    if (sem.ruletaDesastresConfig && typeof window.aplicarConfigRuletaDesastresObs === 'function') window.aplicarConfigRuletaDesastresObs(sem.ruletaDesastresConfig);
                    if (sem.ruletaDesastres) procesarMensajeObs(sem.ruletaDesastres);
                    if (sem.ruletaColor) procesarMensajeObs(sem.ruletaColor);
                    if (sem.ruletaColorTiradas && typeof window.actualizarTiradasRuletaColorObs === 'function') window.actualizarTiradasRuletaColorObs(sem.ruletaColorTiradas);
                    if (sem.temporizador) procesarMensajeObs(sem.temporizador);
                    if (sem.temporizadorMinutos && typeof window.actualizarMinutosTemporizadorObs === 'function') window.actualizarMinutosTemporizadorObs(sem.temporizadorMinutos);
                    if (sem.dados) procesarMensajeObs(sem.dados);
                    if (sem.dadosTiradas && typeof window.actualizarTiradasDadosObs === 'function') window.actualizarTiradasDadosObs(sem.dadosTiradas);
                    if (sem.habCantidad && typeof window.actualizarCantidadHabilidadesObs === 'function') window.actualizarCantidadHabilidadesObs(sem.habCantidad);
                    if (sem.packsCantidad && typeof window.actualizarCantidadPacksObs === 'function') window.actualizarCantidadPacksObs(sem.packsCantidad);
                    if (sem.mundosCantidad && typeof window.actualizarCantidadMundosObs === 'function') window.actualizarCantidadMundosObs(sem.mundosCantidad);

                    // Restaurar estado de filtros de solares
                    if (sem.filtrosSolares && typeof window.establecerEstadoFiltros === 'function') {
                        window.establecerEstadoFiltros(sem.filtrosSolares.estadoFiltros || {});
                        if (typeof window.actualizarBotonesFiltros === 'function') window.actualizarBotonesFiltros();
                        if (typeof window.actualizarZonaBorrar === 'function') window.actualizarZonaBorrar();
                    }
                }

                // 5. Restaurar ventana principal (AUTORIDAD FINAL - SIEMPRE AL FINAL)
                requestAnimationFrame(() => {
                    if (data.estado.ventanaActual && typeof window.abrirVentana === 'function') {
                        window.abrirVentana(data.estado.ventanaActual, false);
                    }

                    // Inicializaciones específicas según ventana activa en FULL_STATE
                    if (data.estado.ventanaActual === 'ventanaHabilidadesGenerador') {
                        if (typeof window._habFiltrarHabilidades === 'function') window._habFiltrarHabilidades();
                        if (typeof window._habInicializarGenerador === 'function') window._habInicializarGenerador();
                    } else if (data.estado.ventanaActual === 'ventanaPacksGenerador') {
                        if (typeof window._packsFiltrarPacks === 'function') window._packsFiltrarPacks();
                        if (typeof window._packsInicializarGenerador === 'function') window._packsInicializarGenerador();
                    } else if (data.estado.ventanaActual === 'ventanaMundosGenerador') {
                        if (typeof window._mundosFiltrarMundos === 'function') window._mundosFiltrarMundos();
                        if (typeof window._mundosInicializarGenerador === 'function') window._mundosInicializarGenerador();
                    } else if (data.estado.ventanaActual === 'ventanaEstadisticas') {
                        if (typeof window.abrirEstadisticas === 'function') window.abrirEstadisticas();
                        if (sem && sem.estadisticas && typeof window.ejecutarEstadisticasObs === 'function') window.ejecutarEstadisticasObs(sem.estadisticas);
                    } else if (data.estado.ventanaActual === 'ventanaRetoResultado') {
                        if (typeof window.ajustarEscalaRetoOBS === 'function') window.ajustarEscalaRetoOBS();
                    } else if (data.estado.ventanaActual === 'ventanaResultados') {
                        // El HTML de listaResultados llega vía htmlState (SYNC_UI_BATCH).
                        // Solo renderizamos localmente si el htmlState no lo ha cubierto aún.
                        const listaResultados = document.getElementById('listaResultados');
                        if (!listaResultados || !listaResultados.children.length) {
                            if (typeof window.mostrarResultados === 'function') window.mostrarResultados();
                        }
                    } else if (data.estado.ventanaActual === 'ventanaListado') {
                        // El HTML de listaCompletaSolares llega vía htmlState (SYNC_UI_BATCH).
                        // Llamamos también a mostrarListadoCompleto() como fallback y revinculamos listeners.
                        if (typeof window.mostrarListadoCompleto === 'function') window.mostrarListadoCompleto();
                        if (typeof window.vincularListenersListado === 'function') window.vincularListenersListado();
                    }
                });

            } else {
                if (data.version && data.version <= versionEstadoLocal) return;
                if (data.version) versionEstadoLocal = data.version;

                switch (data.tipo) {
                    case 'SYNC_CONFIG':
                        if (data.config) {
                            obsConfig = Object.assign(obsConfig, data.config);
                            aplicarBrandingOBS();
                        }
                        break;
                    case 'SYNC_ABRIR_VENTANA':
                        if (data.idVentana && typeof window.abrirVentana === 'function') {
                            window.abrirVentana(data.idVentana, false);
                        }
                        window.scrollTo(0, 0);
                        EstadoGlobal.scrollState['window'] = { top: 0, left: 0 };
                        if (data.idVentana !== 'ventanaRetos') {
                            const modalPacks = document.getElementById('modalPacksCategoria');
                            if (modalPacks) modalPacks.classList.remove('activo');
                        }
                        if (data.idVentana === 'ventanaHabilidadesGenerador') {
                            if (typeof window._habFiltrarHabilidades === 'function') window._habFiltrarHabilidades();
                            if (typeof window._habInicializarGenerador === 'function') window._habInicializarGenerador();
                        } else if (data.idVentana === 'ventanaPacksGenerador') {
                            if (typeof window._packsFiltrarPacks === 'function') window._packsFiltrarPacks();
                            if (typeof window._packsInicializarGenerador === 'function') window._packsInicializarGenerador();
                        } else if (data.idVentana === 'ventanaMundosGenerador') {
                            if (typeof window._mundosFiltrarMundos === 'function') window._mundosFiltrarMundos();
                            if (typeof window._mundosInicializarGenerador === 'function') window._mundosInicializarGenerador();
                        } else if (data.idVentana === 'ventanaEstadisticas') {
                            if (typeof window.abrirEstadisticas === 'function') window.abrirEstadisticas();
                        } else if (data.idVentana === 'ventanaRetoResultado') {
                            if (typeof window.ajustarEscalaRetoOBS === 'function') window.ajustarEscalaRetoOBS();
                        } else if (data.idVentana === 'ventanaListado') {
                            if (typeof window.mostrarListadoCompleto === 'function') window.mostrarListadoCompleto();
                        }
                        aplicarBrandingOBS();
                        break;
                    case 'SYNC_CERRAR_VENTANA':
                        if (data.idVentana && typeof window.cerrarVentana === 'function') {
                            window.cerrarVentana(data.idVentana);
                        }
                        break;
                    case 'SYNC_UI_BATCH':
                        if (data.uiState) {
                            Object.keys(data.uiState).forEach(id => {
                                const el = document.querySelector(`[data-sync-id='${id}']`) || document.getElementById(id);
                                if (el && !el.classList.contains('ventana')) {
                                    if (data.uiState[id].className !== undefined) el.className = data.uiState[id].className;
                                    if (data.uiState[id].style !== undefined) el.setAttribute('style', data.uiState[id].style);
                                }
                            });
                        }
                        if (data.htmlState) {
                            Object.keys(data.htmlState).forEach(id => {
                                const el = document.querySelector(`[data-sync-id='${id}']`) || document.getElementById(id);
                                if (el) {
                                    el.innerHTML = data.htmlState[id];
                                    // Re-vincular listeners de acordeón del listado completo
                                    if ((el.id === 'listaCompletaSolares' || id === 'listaCompletaSolares') && typeof window.vincularListenersListado === 'function') {
                                        window.vincularListenersListado();
                                    }
                                }
                            });
                        }
                        break;
                    case 'SCROLL_SYNC_BATCH':
                        if (data.scrollState) {
                            Object.keys(data.scrollState).forEach(id => {
                                const state = data.scrollState[id];
                                if (id === 'window') {
                                    aplicarScrollWindowOBS(state.windowFraction, state.left);
                                } else {
                                    const el = document.querySelector(`[data-sync-id='${id}']`) || document.getElementById(id);
                                    if (el) {
                                        el.scrollLeft = state.left;
                                        el.scrollTop = state.top;
                                    }
                                }
                            });
                        }
                        break;
                    case 'SYNC_FICHA_SOLAR':
                        if (data.abierta && typeof window.abrirFichaSolar === 'function') {
                            // Guardar ventana de origen en OBS antes de abrir la ficha
                            if (data.ventanaOrigen) {
                                window.ventanaOrigenFicha = data.ventanaOrigen;
                            }
                            window.abrirFichaSolar(data.idSolar);
                        }
                        break;
                    case 'SYNC_CERRAR_FICHA_SOLAR':
                        if (data.ventanaDestino && typeof window.cerrarVentana === 'function' && typeof window.abrirVentana === 'function') {
                            window.cerrarVentana('ventanaFichaSolar');
                            window.abrirVentana(data.ventanaDestino, false);
                        }
                        break;
                    case 'RETO_GENERADO':
                        if (data.reto) {
                            window.retoActual = data.reto;
                            if (typeof window.abrirVentana === 'function') {
                                window.abrirVentana('ventanaRetoResultado', false);
                            }
                            if (data.animar && data.secuencias && typeof window.animarGeneracionReto === 'function') {
                                window.animarGeneracionReto(data.reto, data.secuencias);
                            } else if (typeof window.renderizarResultadoReto === 'function') {
                                window.renderizarResultadoReto(data.reto);
                            }
                        }
                        break;
                    case 'RETO_REROLL':
                        if (data.reto) {
                            window.retoActual = data.reto;
                            if (data.secuencia && typeof window.animarRerollTarjeta === 'function') {
                                window.animarRerollTarjeta(data.categoriaId, data.reto, data.secuencia);
                            } else if (typeof window.renderizarResultadoReto === 'function') {
                                window.renderizarResultadoReto(data.reto);
                            }
                        }
                        break;
                    case 'TIRAR_HABILIDADES':
                        if (typeof window.ejecutarTiradaHabilidadesObs === 'function') {
                            window.ejecutarTiradaHabilidadesObs(data);
                        }
                        break;
                    case 'TIRAR_PACKS':
                        if (typeof window.ejecutarTiradaPacksObs === 'function') {
                            window.ejecutarTiradaPacksObs(data);
                        }
                        break;
                    case 'TIRAR_MUNDOS':
                        if (typeof window.ejecutarTiradaMundosObs === 'function') {
                            window.ejecutarTiradaMundosObs(data);
                        }
                        break;
                    case 'SYNC_MODAL_PACKS':
                        if (data.visible && typeof window.abrirModalPacksFlotante === 'function') {
                            window.abrirModalPacksFlotante(data.titulo, data.packs);
                        } else if (typeof window.cerrarModalPacksFlotante === 'function') {
                            window.cerrarModalPacksFlotante();
                        }
                        break;
                    case 'SYNC_ACCION':
                        if (data.accion === 'RULETA_DESASTRES_SUBPANTALLA' && typeof window.ejecutarSubpantallaRuletaDesastresObs === 'function') {
                            window.ejecutarSubpantallaRuletaDesastresObs(data.payload);
                        } else if (data.accion === 'GIRAR_RULETA_DESASTRES' && typeof window.ejecutarGiroRuletaDesastresObs === 'function') {
                            window.ejecutarGiroRuletaDesastresObs(data.payload);
                        } else if (data.accion === 'GIRAR_RULETA_COLOR' && typeof window.ejecutarGiroRuletaColorObs === 'function') {
                            window.ejecutarGiroRuletaColorObs(data.payload);
                        } else if (data.accion === 'RULETA_COLOR_TIRADAS_STATE' && typeof window.actualizarTiradasRuletaColorObs === 'function') {
                            window.actualizarTiradasRuletaColorObs(data.payload);
                        } else if (data.accion === 'TIRAR_DADOS' && typeof window.ejecutarTiradaDadosObs === 'function') {
                            window.ejecutarTiradaDadosObs(data.payload);
                        } else if (data.accion === 'DADOS_TIRADAS_STATE' && typeof window.actualizarTiradasDadosObs === 'function') {
                            window.actualizarTiradasDadosObs(data.payload);
                        } else if (data.accion === 'HAB_CANTIDAD_STATE' && typeof window.actualizarCantidadHabilidadesObs === 'function') {
                            window.actualizarCantidadHabilidadesObs(data.payload);
                        } else if (data.accion === 'HAB_ACELERAR_STATE' && typeof window.setAceleradoHabilidadesObs === 'function') {
                            window.setAceleradoHabilidadesObs(data.payload);
                        } else if (data.accion === 'PACKS_CANTIDAD_STATE' && typeof window.actualizarCantidadPacksObs === 'function') {
                            window.actualizarCantidadPacksObs(data.payload);
                        } else if (data.accion === 'PACKS_ACELERAR_STATE' && typeof window.setAceleradoPacksObs === 'function') {
                            window.setAceleradoPacksObs(data.payload);
                        } else if (data.accion === 'MUNDOS_CANTIDAD_STATE' && typeof window.actualizarCantidadMundosObs === 'function') {
                            window.actualizarCantidadMundosObs(data.payload);
                        } else if (data.accion === 'MUNDOS_ACELERAR_STATE' && typeof window.setAceleradoMundosObs === 'function') {
                            window.setAceleradoMundosObs(data.payload);
                        } else if (data.accion === 'TEMPORIZADOR' && typeof window.ejecutarTemporizadorObs === 'function') {
                            window.ejecutarTemporizadorObs(data.payload);
                        } else if (data.accion === 'TEMPORIZADOR_MINUTOS_STATE' && typeof window.actualizarMinutosTemporizadorObs === 'function') {
                            window.actualizarMinutosTemporizadorObs(data.payload);
                        } else if (data.accion === 'ESTADISTICAS_STATE' && typeof window.ejecutarEstadisticasObs === 'function') {
                            window.ejecutarEstadisticasObs(data.payload);
                        } else if (data.accion === 'RETOS_PACKS_UPDATE' && typeof window.actualizarPacksRetosObs === 'function') {
                            window.actualizarPacksRetosObs(data.payload);
                        } else if (data.accion === 'RETOS_OPCIONES_STATE' && typeof window.actualizarOpcionesRetoObs === 'function') {
                            window.actualizarOpcionesRetoObs(data.payload);
                        } else if (data.accion === 'TEMPORIZADOR_ACOPLADO_STATE' && typeof window.ejecutarTemporizadorAcopladoObs === 'function') {
                            window.ejecutarTemporizadorAcopladoObs(data.payload);
                        } else if (data.accion === 'RULETA_DESASTRES_CONFIG_STATE' && typeof window.aplicarConfigRuletaDesastresObs === 'function') {
                            window.aplicarConfigRuletaDesastresObs(data.payload);
                        } else if (data.accion === 'FILTROS_SOLARES_STATE' && data.payload) {
                            // Restaurar el estado completo de filtros (tras Confirmar / Eliminar filtro)
                            window.esSincronizacionOBS = true;
                            if (typeof window.establecerEstadoFiltros === 'function') {
                                window.establecerEstadoFiltros(data.payload.estadoFiltros || {});
                            }
                            if (typeof window.actualizarBotonesFiltros === 'function') window.actualizarBotonesFiltros();
                            if (typeof window.actualizarZonaBorrar === 'function') window.actualizarZonaBorrar();
                            setTimeout(() => { window.esSincronizacionOBS = false; }, 50);
                        } else if (data.accion === 'FILTRO_SOLARES_PANEL' && data.payload) {
                            // Sincronizar apertura / cierre del panel de opciones
                            window.esSincronizacionOBS = true;
                            if (data.payload.panelAbierto && data.payload.filtroAbierto) {
                                if (typeof window.abrirFiltro === 'function') window.abrirFiltro(data.payload.filtroAbierto);
                                if (typeof window.mostrarPanelFiltro === 'function') window.mostrarPanelFiltro();
                            } else {
                                if (typeof window.cerrarPanelFiltro === 'function') window.cerrarPanelFiltro();
                            }
                            setTimeout(() => { window.esSincronizacionOBS = false; }, 50);
                        } else if (data.accion === 'FILTRO_OPCIONES_SELECCIONADAS' && data.payload) {
                            // Actualizar marcado visual de opciones sin confirmar aún
                            window.esSincronizacionOBS = true;
                            const seleccionadas = data.payload.seleccionadas || [];
                            document.querySelectorAll('#listaOpcionesFiltro .opcionFiltro').forEach(btn => {
                                const val = btn.dataset.valor;
                                if (val !== undefined) {
                                    btn.classList.toggle('seleccionada', seleccionadas.includes(val));
                                }
                            });
                            setTimeout(() => { window.esSincronizacionOBS = false; }, 50);
                        } else if (data.accion === 'BUSCAR_SOLARES_RESULTADO' && data.payload) {
                            // Sincronizar estado de filtros en OBS (para consistencia de estado)
                            // El HTML de listaResultados llega directamente vía SYNC_UI_BATCH (MutationObserver)
                            window.esSincronizacionOBS = true;
                            if (typeof window.establecerEstadoFiltros === 'function') {
                                window.establecerEstadoFiltros(data.payload.estadoFiltros || {});
                            }
                            if (typeof window.actualizarBotonesFiltros === 'function') window.actualizarBotonesFiltros();
                            if (typeof window.actualizarZonaBorrar === 'function') window.actualizarZonaBorrar();
                            setTimeout(() => { window.esSincronizacionOBS = false; }, 50);

                        } else if (data.accion === 'LISTADO_ACORDEON_TOGGLE' && data.payload) {
                            // Sincronizar apertura/cierre de acordeón de mundos/barrios
                            window.esSincronizacionOBS = true;
                            const selector = data.payload.tipo === 'mundo'
                                ? '#listaCompletaSolares .tituloMundo'
                                : '#listaCompletaSolares .tituloBarrio';
                            const botones = document.querySelectorAll(selector);
                            const boton = botones[data.payload.idx];
                            if (boton) {
                                boton.classList.toggle('abierto', data.payload.abierto);
                                if (boton.nextElementSibling) {
                                    boton.nextElementSibling.classList.toggle('abierto', data.payload.abierto);
                                }
                            }
                            setTimeout(() => { window.esSincronizacionOBS = false; }, 50);
                        }
                        break;
                }
            }
        } finally {
            setTimeout(() => { window.esSincronizacionOBS = false; }, 50);
        }
    }

    // ─── DOM SYNC & SCROLL TRACKING EN MASTER ───────────────────────────────
    
    // Selectores clave que nos interesa vigilar
    const SYNC_SELECTORS = ".ventana, .modal, [id^='pantalla'], .desplegable, .opcionFiltro, .submenu, .contenidoDesplegable, .btnCategoriaDesplegable, .tarjetaResultado, #panelFiltro, #modalPacksCategoria";
    // Contenedores explícitos donde sincronizaremos el innerHTML como último recurso
    const DYNAMIC_HTML_CONTAINERS = ["listaCompletaSolares", "listaResultados", "panelFiltro", "contenidoFichaSolar"];

    function obtenerIdSyncDeterminista(el) {
        if (el.id) return el.id;
        const syncIdExistente = el.getAttribute('data-sync-id');
        if (syncIdExistente) return syncIdExistente;
        
        const parent = el.closest('.ventana, .modal, section, main, body');
        const parentId = parent ? (parent.id || (parent.className ? parent.className.trim().split(/\s+/)[0] : 'parent')) : 'root';
        const cls = el.className ? el.className.trim().split(/\s+/)[0] : 'item';
        const index = Array.from(el.parentNode ? el.parentNode.children : []).indexOf(el);
        return `${parentId}_${cls}_${index}`;
    }

    function iniciarSyncObserver() {
        if (!isMaster) return;

        // 1. Asignar data-sync-id determinista a elementos relevantes
        document.querySelectorAll(SYNC_SELECTORS + ", " + DYNAMIC_HTML_CONTAINERS.map(id => "#"+id).join(", ")).forEach(el => {
            if (!el.getAttribute('data-sync-id')) {
                el.setAttribute('data-sync-id', obtenerIdSyncDeterminista(el));
            }
        });

        // 2. MutationObserver
        let pendingUI = {};
        let pendingHTML = {};
        let uiTimeout = null;

        const observer = new MutationObserver(mutations => {
            if (window.esSincronizacionOBS || !isMaster) return;

            let changed = false;

            mutations.forEach(m => {
                const target = m.target;
                
                // Ignorar cambios del propio observer (branding)
                if (target.id === 'obsBrandingLayer' || target.closest('#obsBrandingLayer') || target.classList?.contains('obsBrandingLayer') || target.closest('.obsBrandingLayer')) return;

                if (m.type === 'attributes') {
                    // Filtrar manualmente: solo nos interesan class y style
                    if (m.attributeName !== 'class' && m.attributeName !== 'style') return;
                    if (target.matches(SYNC_SELECTORS)) {
                        const syncId = target.getAttribute('data-sync-id') || obtenerIdSyncDeterminista(target);
                        if (syncId) {
                            if (!target.getAttribute('data-sync-id')) target.setAttribute('data-sync-id', syncId);
                            pendingUI[syncId] = {
                                className: target.className,
                                style: target.getAttribute('style') || ''
                            };
                            changed = true;
                        }
                    }
                } else if (m.type === 'childList' || m.type === 'characterData') {
                    const dynamicContainer = target.closest(DYNAMIC_HTML_CONTAINERS.map(id => "#"+id).join(", "));
                    if (dynamicContainer) {
                        const syncId = dynamicContainer.getAttribute('data-sync-id') || dynamicContainer.id || obtenerIdSyncDeterminista(dynamicContainer);
                        if (!dynamicContainer.getAttribute('data-sync-id')) dynamicContainer.setAttribute('data-sync-id', syncId);
                        pendingHTML[syncId] = dynamicContainer.innerHTML;
                        changed = true;
                    }
                }
            });

            if (changed) {
                if (uiTimeout) clearTimeout(uiTimeout);
                uiTimeout = setTimeout(() => {
                    window.emitirEventoOBS('SYNC_UI_BATCH', { 
                        uiState: Object.keys(pendingUI).length > 0 ? pendingUI : null, 
                        htmlState: Object.keys(pendingHTML).length > 0 ? pendingHTML : null
                    });
                    pendingUI = {};
                    pendingHTML = {};
                }, 50); // Debouncing 50ms
            }
        });

        observer.observe(document.body, { 
            attributes: true, 
            childList: true, 
            subtree: true, 
            characterData: true
        });
    }

    function iniciarScrollTracking() {
        if (!isMaster) return;
        
        let pendingScroll = {};
        let scrollTimeout = null;

        window.addEventListener('scroll', (e) => {
            if (window.esSincronizacionOBS || !isMaster) return;

            const target = e.target;
            let syncId = null;
            let top = 0;
            let left = 0;

            if (target === document || target === window) {
                syncId = 'window';
                const idVentana = EstadoGlobal.ventanaActual || window.ventanaActual;
                if (idVentana === 'ventanaRetoResultado') {
                    pendingScroll[syncId] = { windowFraction: 0, left: 0 };
                } else {
                    const ventana = idVentana ? document.getElementById(idVentana) : document.querySelector('.ventana:not([style*="display: none"])');
                    if (ventana) {
                        // Fracción 0..1 sobre el rango de scroll propio de la ventana activa.
                        // 0 = ventana recién aparece (su top toca el borde del menú).
                        // 1 = ventana termina (su bottom toca el borde inferior del viewport).
                        const menuEl = document.getElementById('menuPrincipal');
                        const menuBottom = menuEl ? menuEl.getBoundingClientRect().bottom : 0;
                        const GAP = 20;
                        const targetTopEnViewport = menuBottom + GAP;
                        const ventanaTopEnDoc = ventana.getBoundingClientRect().top + window.scrollY;
                        const scrollBase = Math.max(0, ventanaTopEnDoc - targetTopEnViewport);

                        const ventanaHeight = Math.max(
                            ventana.offsetHeight || 0,
                            ventana.scrollHeight || 0,
                            ventana.getBoundingClientRect().height || 0
                        );
                        const maxScrollWindow = Math.max(1,
                            ventanaHeight + targetTopEnViewport - window.innerHeight
                        );

                        const relScroll = Math.max(0, window.scrollY - scrollBase);
                        const windowFraction = Math.min(1, relScroll / maxScrollWindow);

                        left = window.scrollX;
                        pendingScroll[syncId] = { windowFraction, left };
                    } else {
                        pendingScroll[syncId] = { windowFraction: 0, left: window.scrollX };
                    }
                }
            } else if (target.nodeType === 1) { // Element
                // Verificar que sea realmente un contenedor desplazable relevante
                const esDesplazable = (target.scrollHeight > target.clientHeight + 2) || (target.scrollWidth > target.clientWidth + 2);
                const esRelevante = target.closest('.ventana, .modal, main, body');
                
                if (!esDesplazable || !esRelevante) return;

                syncId = obtenerIdSyncDeterminista(target);
                if (syncId && !target.getAttribute('data-sync-id')) {
                    target.setAttribute('data-sync-id', syncId);
                }
                top = target.scrollTop;
                left = target.scrollLeft;
                pendingScroll[syncId] = { top, left };
            }

            if (syncId) {
                // pendingScroll[syncId] already set above for window scrolls;
                // for element scrolls it still uses top/left directly.
                if (!pendingScroll[syncId]) pendingScroll[syncId] = { top, left };
                
                if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
                scrollTimeout = requestAnimationFrame(() => {
                    window.emitirEventoOBS('SCROLL_SYNC_BATCH', { scrollState: pendingScroll });
                    pendingScroll = {};
                });
            }
        }, { passive: true, capture: true });
    }

    // ─── UI DE CONFIGURACIÓN OBS ─────────────────────────────
    function generarUrlOBS() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set('obs', '1');
        params.set('room', peerSessionId);
        params.set('pos', obsConfig.pos || 'right');
        params.set('theme', obsConfig.theme || 'noche');
        params.set('bg', obsConfig.bg || 'transparent');
        if (obsConfig.scale && parseInt(obsConfig.scale, 10) !== 100) {
            params.set('scale', obsConfig.scale);
        }
        return baseUrl + '?' + params.toString();
    }

    window.actualizarModalOBSUI = function () {
        const inputUrlOBS = document.getElementById('inputUrlOBS');
        const sliderEscala = document.getElementById('sliderEscalaOBS');
        const valEscala = document.getElementById('valEscalaOBS');
        
        document.querySelectorAll('.obsBtnPos').forEach(b => b.classList.toggle('activo', b.dataset.val === obsConfig.pos));
        document.querySelectorAll('.obsBtnTheme').forEach(b => b.classList.toggle('activo', b.dataset.val === obsConfig.theme));
        document.querySelectorAll('.obsBtnBg').forEach(b => b.classList.toggle('activo', b.dataset.val === obsConfig.bg));

        const escalaActual = obsConfig.scale !== undefined ? parseInt(obsConfig.scale, 10) : 100;
        if (sliderEscala) sliderEscala.value = escalaActual;
        if (valEscala) valEscala.textContent = escalaActual + '%';

        if (inputUrlOBS && peerSessionId) inputUrlOBS.value = generarUrlOBS();
    };

    window.abrirModalOBS = function () {
        const modalOBS = document.getElementById('modalOBS');
        if (!modalOBS) return;
        window.actualizarModalOBSUI();
        modalOBS.classList.add('activo');
        modalOBS.style.display = 'flex';
    };

    window.cerrarModalOBS = function () {
        const modalOBS = document.getElementById('modalOBS');
        if (modalOBS) {
            modalOBS.classList.remove('activo');
            modalOBS.style.display = 'none';
        }
    };

    function guardarYNotificarConfigOBS() {
        try { localStorage.setItem(OBS_STORAGE_KEY, JSON.stringify(obsConfig)); } catch (e) {}
        window.actualizarModalOBSUI();
        aplicarEscalaOBSGlobal();
        window.emitirEventoOBS('SYNC_CONFIG', { config: obsConfig });
    }

    function inicializarModalOBS() {
        const btnAbrirOBS = document.getElementById('botonOBS');
        const btnCerrarOBS = document.getElementById('cerrarModalOBSBtn');
        const overlayOBS = document.getElementById('overlayOBS');
        const btnCopiarUrl = document.getElementById('btnCopiarUrlOBS');
        const inputUrlOBS = document.getElementById('inputUrlOBS');
        const sliderEscala = document.getElementById('sliderEscalaOBS');
        const valEscala = document.getElementById('valEscalaOBS');
        const btnResetEscala = document.getElementById('btnResetEscalaOBS');

        if (btnAbrirOBS) {
            btnAbrirOBS.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                window.abrirModalOBS();
            });
        }

        if (btnCerrarOBS) btnCerrarOBS.addEventListener('click', window.cerrarModalOBS);
        if (overlayOBS) overlayOBS.addEventListener('click', window.cerrarModalOBS);

        document.querySelectorAll('.obsBtnPos').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.obsBtnPos').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                obsConfig.pos = this.dataset.val;
                guardarYNotificarConfigOBS();
            });
        });

        if (sliderEscala) {
            sliderEscala.addEventListener('input', function () {
                const val = parseInt(this.value, 10) || 100;
                obsConfig.scale = val;
                if (valEscala) valEscala.textContent = val + '%';
                guardarYNotificarConfigOBS();
            });
        }

        if (btnResetEscala) {
            btnResetEscala.addEventListener('click', function () {
                obsConfig.scale = 100;
                if (sliderEscala) sliderEscala.value = 100;
                if (valEscala) valEscala.textContent = '100%';
                guardarYNotificarConfigOBS();
            });
        }

        document.querySelectorAll('.obsBtnTheme').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.obsBtnTheme').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                obsConfig.theme = this.dataset.val;
                guardarYNotificarConfigOBS();
            });
        });

        document.querySelectorAll('.obsBtnBg').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.obsBtnBg').forEach(b => b.classList.remove('activo'));
                this.classList.add('activo');
                obsConfig.bg = this.dataset.val;
                guardarYNotificarConfigOBS();
            });
        });

        if (btnCopiarUrl) {
            btnCopiarUrl.addEventListener('click', () => {
                if (!inputUrlOBS) return;
                inputUrlOBS.select();
                inputUrlOBS.setSelectionRange(0, 99999);
                
                const urlTexto = inputUrlOBS.value;
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(urlTexto).then(notificarCopiado).catch(copyFallback);
                } else {
                    copyFallback();
                }

                function notificarCopiado() {
                    const textoOriginal = btnCopiarUrl.innerHTML;
                    btnCopiarUrl.innerHTML = '✅ ¡Enlace Copiado!';
                    btnCopiarUrl.classList.add('copiado');
                    setTimeout(() => {
                        btnCopiarUrl.innerHTML = textoOriginal;
                        btnCopiarUrl.classList.remove('copiado');
                    }, 2000);
                }

                function copyFallback() {
                    try {
                        document.execCommand('copy');
                        notificarCopiado();
                    } catch (err) {}
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            inicializarModalOBS();
            iniciarSyncObserver();
            inicializarPeerJS();
        });
    } else {
        inicializarModalOBS();
        iniciarSyncObserver();
        inicializarPeerJS();
    }

})();
