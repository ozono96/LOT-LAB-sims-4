/* =========================================================
   OBS INTEGRATION MODULE
   Permite enviar cualquier ventana a OBS Studio como
   Fuente de Navegador (Browser Source) o Popout standalone
   con sincronización en tiempo real vía WebRTC (PeerJS) y URL State.
   ========================================================= */

(function () {
    // Ventanas disponibles con nombre legible y opciones de pantalla
    const VENTANAS_OBS = [
        { id: "ventanaRuletaDesastres",   nombre: "🎡 Ruleta de Desastres (Juego / Girar)", screen: "juego" },
        { id: "ventanaRuletaDesastres",   nombre: "⚙️ Ruleta de Desastres (Configuración)", screen: "config" },
        { id: "ventanaRetoResultado",     nombre: "🎯 Reto Generado" },
        { id: "ventanaRetosOpciones",     nombre: "⚙️ Opciones del Reto" },
        { id: "ventanaRuletaColor",       nombre: "🎨 Ruleta de Colores" },
        { id: "ventanaDados",             nombre: "🎲 Tirador de Dados" },
        { id: "ventanaTemporizador",      nombre: "⏱️ Temporizador de Retos" },
        { id: "ventanaHabilidadesGenerador", nombre: "🧠 Habilidades al Azar" },
        { id: "ventanaBuscador",          nombre: "🔍 Filtrador de Solares" },
        { id: "ventanaResultados",        nombre: "🏠 Resultados de Búsqueda" },
        { id: "ventanaFichaSolar",        nombre: "📋 Ficha de Solar" },
        { id: "ventanaListado",           nombre: "📦 Listado de Packs" },
        { id: "ventanaTrucos",            nombre: "🕹️ Trucos" },
        { id: "ventanaEstadisticas",      nombre: "📊 Estadísticas Sims 4" },
    ];

    const OBS_SYNC_KEY_PREFIX = "lotlab_sync_";
    const OBS_SYNC_CHANNEL_NAME = "lotlab_obs_sync_v2";

    // ── PeerJS / WebRTC State ──────────
    let peerInstance = null;
    let peerConnections = [];
    let hostPeerId = null;
    let broadcastChannel = null;
    let syncObsWindowId = null;
    let ultimoTsAplicado = 0;

    // Generar o recuperar ID de Peer persistente para esta sesión de la pestaña principal
    function obtenerHostPeerId() {
        if (!hostPeerId) {
            let id = sessionStorage.getItem("lotlab_host_peer_id");
            if (!id) {
                id = "lotlab-" + Math.random().toString(36).substring(2, 9);
                sessionStorage.setItem("lotlab_host_peer_id", id);
            }
            hostPeerId = id;
        }
        return hostPeerId;
    }

    // ─── 1. INYECTAR BOTONES OBS EN CADA cabeceraVentana ──────────────────
    function inyectarBotonesOBSEnHeaders() {
        document.querySelectorAll(".ventana").forEach(ventana => {
            const id = ventana.id;
            if (!id) return;

            const cabecera = ventana.querySelector(".cabeceraVentana");
            if (!cabecera) return;

            // Evitar duplicados
            if (cabecera.querySelector(".btnOBS")) return;

            const btnCerrar = cabecera.querySelector(".cerrar");

            const btn = document.createElement("button");
            btn.className = "btnOBS";
            btn.type = "button";
            btn.title = "Copiar enlace para OBS";
            btn.setAttribute("data-window", id);
            btn.setAttribute("data-tooltip", "📺 Pulsa para copiar el enlace de OBS de esta ventana");
            btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="23" x2="12" y2="21" stroke="currentColor" stroke-width="2"/><line x1="3" y1="12" x2="1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="23" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/></svg>`;

            if (btnCerrar) {
                cabecera.insertBefore(btn, btnCerrar);
            } else {
                cabecera.appendChild(btn);
            }
        });
    }

    // ─── 2. ACTIVAR MODO OBS (Página limpia para browser source / popout) ──
    function activarModoOBS(windowId, screenParam) {
        syncObsWindowId = windowId;
        document.body.classList.add("modo-obs");
        document.documentElement.classList.add("modo-obs");

        forzarVisibilidadOBS();

        const prepararYMostrarVentana = () => {
            document.querySelectorAll(".ventana").forEach(v => {
                if (v.id !== windowId) v.style.display = "none";
            });

            const elVentana = document.getElementById(windowId);
            if (!elVentana) return;

            elVentana.style.display = "block";

            // Lógica de pantalla activa según tipo de ventana
            if (windowId === "ventanaRuletaDesastres") {
                const pantallaConfig = document.getElementById("pantallaConfigRuletaDesastres");
                const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");

                if (screenParam === "config") {
                    if (pantallaConfig) pantallaConfig.style.display = "block";
                    if (pantallaJuego) pantallaJuego.style.display = "none";
                } else {
                    if (pantallaConfig) pantallaConfig.style.display = "none";
                    if (pantallaJuego) pantallaJuego.style.display = "block";

                    if (typeof renderizarBotonesCategorias === "function") {
                        renderizarBotonesCategorias();
                    }
                }
            } else if (windowId === "ventanaHabilidadesGenerador") {
                if (typeof _habFiltrarHabilidades === "function") {
                    _habFiltrarHabilidades();
                    if (typeof _habInicializarGenerador === "function") _habInicializarGenerador();
                }
            } else if (windowId === "ventanaRetoResultado") {
                if (!window.retoActual && typeof generarReto === "function") {
                    generarReto(true);
                }
            } else if (windowId === "ventanaRuletaColor") {
                if (typeof inicializarRuletaColor === "function") {
                    inicializarRuletaColor();
                    setTimeout(inicializarRuletaColor, 300);
                }
            } else if (windowId === "ventanaDados") {
                if (typeof inicializarDados === "function") {
                    inicializarDados();
                }
            }
        };

        prepararYMostrarVentana();

        // ── Overlay de carga (se oculta al recibir el primer payload) ─────────
        let overlayOculto = false;
        const overlay = document.createElement("div");
        overlay.className = "obsOverlayCargando";
        overlay.id = "obsOverlayCargando";
        overlay.innerHTML = [
            '<div class="obsOverlayCargando__spinner"></div>',
            '<div class="obsOverlayCargando__texto">⏳ Conectando con la web principal…</div>',
            '<div class="obsOverlayCargando__sub">Asegúrate de que la pestaña web está abierta en el mismo navegador.</div>'
        ].join("");
        document.body.appendChild(overlay);

        window._ocultarOverlayCargandoOBS = function () {
            if (overlayOculto) return;
            overlayOculto = true;
            overlay.classList.add("oculto");
            setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 600);
        };

        // Fallback: ocultar tras 8 segundos si no llega ningún payload
        setTimeout(() => { if (window._ocultarOverlayCargandoOBS) window._ocultarOverlayCargandoOBS(); }, 8000);

        // 1. Aplicar estado guardado en localStorage síncronamente al instante
        try {
            const rawInicial = localStorage.getItem(OBS_SYNC_KEY_PREFIX + windowId);
            if (rawInicial) {
                aplicarEstadoObjetivoEnDOM(windowId, JSON.parse(rawInicial));
                if (window._ocultarOverlayCargandoOBS) window._ocultarOverlayCargandoOBS();
            }
        } catch (e) {}

        // 2. Leer parámetros de estado iniciales codificados en la URL
        procesarEstadoURLInicial(windowId);

        // 3. Iniciar receptor de estado en vivo (WebRTC + Storage + Broadcast)
        const urlParams = new URLSearchParams(window.location.search);
        const peerIdConectar = urlParams.get("peer");
        iniciarReceptorEstadoEnVivo(windowId, peerIdConectar);

        // 4. Auto-resize adaptativo si es un Popout (`window.opener`)
        if (window.opener) {
            activarAutoResizePopoutAdaptativo(windowId);
        }
    }

    // ─── 2a. AUTO-REDIMENSIONAR ADAPTATIVO EN TIEMPO REAL (POPOUT) ──────────
    function activarAutoResizePopoutAdaptativo(windowId) {
        if (!window.opener) return;

        const el = document.getElementById(windowId);
        if (!el) return;

        let prevAncho = 0;
        let prevAlto = 0;
        let debounceTimer = null;

        function reajustar() {
            if (el.style.display !== "block") return;

            const scrollW = el.scrollWidth || el.offsetWidth;
            const scrollH = el.scrollHeight || el.offsetHeight;
            if (scrollW < 10 || scrollH < 10) return;

            const margenW = Math.max(0, window.outerWidth - window.innerWidth);
            const margenH = Math.max(0, window.outerHeight - window.innerHeight);

            const anchoDeseado = Math.ceil(scrollW) + margenW;
            const altoDeseado  = Math.ceil(scrollH) + margenH;

            // Evitar ajustes ínfimos que puedan generar bucles
            if (Math.abs(anchoDeseado - prevAncho) < 14 && Math.abs(altoDeseado - prevAlto) < 14) {
                return;
            }

            prevAncho = anchoDeseado;
            prevAlto = altoDeseado;

            const anchoMax = window.screen ? window.screen.availWidth  : anchoDeseado;
            const altoMax  = window.screen ? window.screen.availHeight : altoDeseado;

            try {
                window.resizeTo(
                    Math.min(Math.max(anchoDeseado, 380), anchoMax),
                    Math.min(Math.max(altoDeseado,  260), altoMax)
                );
            } catch (e) {}
        }

        setTimeout(reajustar, 300);
        setTimeout(reajustar, 900);

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(reajustar, 120);
            });
            ro.observe(el);
        }
    }

    // ─── 2b. FORZAR VISIBILIDAD EN SEGUNDO PLANO ────────────────────────────
    function forzarVisibilidadOBS() {
        try {
            Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
            Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
        } catch (e) {}

        const bloquearEvento = (e) => {
            if (e && typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
            }
        };
        document.addEventListener("visibilitychange", bloquearEvento, true);
        window.addEventListener("blur", bloquearEvento, true);
    }

    // ─── 3. PROCESAR ESTADO CODIFICADO EN URL AL CARGAR EN OBS ──────────────
    function procesarEstadoURLInicial(windowId) {
        const params = new URLSearchParams(window.location.search);

        if (windowId === "ventanaRuletaColor") {
            const colorNombre = params.get("color");
            const colorHex = params.get("hex");
            if (colorNombre && colorHex) {
                const mensaje = document.getElementById("mensajeRuletaColor");
                const resultados = document.getElementById("resultadoRuletaColor");
                if (mensaje) mensaje.textContent = `Ha salido: ${colorNombre}`;
                if (resultados) {
                    resultados.innerHTML = `
                        <div class="chipColorRuleta">
                            <span class="chipColorRuleta__muestra" style="background:${colorHex}" data-tooltip="${colorNombre}"></span>
                        </div>
                    `;
                }
            }
        } else if (windowId === "ventanaRuletaDesastres") {
            const titulo = params.get("disTitle");
            const desc = params.get("disDesc");
            const icono = params.get("disIcon");
            if (titulo && desc) {
                const elTitulo = document.getElementById("tituloResultadoDesastre");
                const elDesc = document.getElementById("descResultadoDesastre");
                const elIcono = document.getElementById("iconoResultadoDesastre");
                if (elTitulo) elTitulo.textContent = titulo;
                if (elDesc) elDesc.innerHTML = desc;
                if (elIcono && icono) elIcono.textContent = icono;
            }
        } else if (windowId === "ventanaDados") {
            const dadosVal = params.get("dadosVal");
            if (dadosVal) {
                const res = document.getElementById("resultadoDados");
                const msg = document.getElementById("mensajeDados");
                if (msg) msg.textContent = `Tirada guardada: ${dadosVal}`;
            }
        }
    }

    // ─── 4. EMISOR Y RECEPTOR DE ESTADO EN TIEMPO REAL (WebRTC + Storage) ───
    function iniciarHostPeerJS() {
        if (typeof Peer === "undefined" || peerInstance) return;
        const myId = obtenerHostPeerId();
        try {
            peerInstance = new Peer(myId, { debug: 0 });
            peerInstance.on("connection", (conn) => {
                peerConnections.push(conn);
                conn.on("close", () => {
                    peerConnections = peerConnections.filter(c => c !== conn);
                });
            });
        } catch (e) {
            console.warn("[OBS PeerJS Host Error]", e);
        }
    }

    function emitirEstadoEnVivoOBS(windowId, payload) {
        if (!payload) return;
        payload.ts = Date.now();
        payload.windowId = windowId;

        // 1. Enviar vía WebRTC DataChannel a OBS Studio CEF
        peerConnections.forEach(conn => {
            try {
                if (conn.open) conn.send(payload);
            } catch (e) {}
        });

        // 2. BroadcastChannel (pestañas del mismo navegador)
        try {
            if (!broadcastChannel) broadcastChannel = new BroadcastChannel(OBS_SYNC_CHANNEL_NAME);
            broadcastChannel.postMessage(payload);
        } catch (e) {}

        // 3. localStorage (dispara evento 'storage' nativo)
        try {
            localStorage.setItem(OBS_SYNC_KEY_PREFIX + windowId, JSON.stringify(payload));
        } catch (e) {}
    }
    window.emitirEstadoEnVivoOBS = emitirEstadoEnVivoOBS;

    function iniciarReceptorEstadoEnVivo(targetWindowId, hostPeerIdToConnect) {
        const procesarPayload = (payload) => {
            if (!payload || payload.windowId !== targetWindowId) return;
            if (payload.ts <= ultimoTsAplicado) return;
            ultimoTsAplicado = payload.ts;

            aplicarEstadoObjetivoEnDOM(targetWindowId, payload);

            // Ocultar overlay de carga al recibir el primer payload válido
            if (window._ocultarOverlayCargandoOBS) window._ocultarOverlayCargandoOBS();
        };

        // 1. Conectar vía WebRTC PeerJS si venimos de una URL emitida por la pestaña principal
        if (hostPeerIdToConnect && typeof Peer !== "undefined") {
            try {
                const clientPeer = new Peer({ debug: 0 });
                clientPeer.on("open", () => {
                    const conn = clientPeer.connect(hostPeerIdToConnect);
                    conn.on("data", (data) => procesarPayload(data));
                });
            } catch (e) {}
        }

        // 2. Escuchar BroadcastChannel
        try {
            if (!broadcastChannel) broadcastChannel = new BroadcastChannel(OBS_SYNC_CHANNEL_NAME);
            broadcastChannel.onmessage = (event) => procesarPayload(event.data);
        } catch (e) {}

        // 3. Escuchar evento native 'storage'
        window.addEventListener("storage", (e) => {
            if (e.key === OBS_SYNC_KEY_PREFIX + targetWindowId && e.newValue) {
                try {
                    procesarPayload(JSON.parse(e.newValue));
                } catch (err) {}
            }
        });

        // 4. Carga inicial desde localStorage + Polling liviano (cada 400ms)
        try {
            const rawInicial = localStorage.getItem(OBS_SYNC_KEY_PREFIX + targetWindowId);
            if (rawInicial) procesarPayload(JSON.parse(rawInicial));
        } catch (err) {}

        setInterval(() => {
            try {
                const raw = localStorage.getItem(OBS_SYNC_KEY_PREFIX + targetWindowId);
                if (raw) procesarPayload(JSON.parse(raw));
            } catch (err) {}
        }, 400);
    }

    function aplicarEstadoObjetivoEnDOM(windowId, payload) {
        if (windowId === "ventanaRuletaDesastres") {
            const pantallaConfig = document.getElementById("pantallaConfigRuletaDesastres");
            const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");

            if (payload.pantalla === "juego") {
                if (pantallaConfig) pantallaConfig.style.display = "none";
                if (pantallaJuego) pantallaJuego.style.display = "block";
            }

            if (payload.iconoHTML !== undefined) {
                const containerIcono = document.getElementById("iconoResultadoDesastre");
                if (containerIcono) containerIcono.innerHTML = payload.iconoHTML;
            }
            if (payload.titulo !== undefined) {
                const el = document.getElementById("tituloResultadoDesastre");
                if (el) el.textContent = payload.titulo;
            }
            if (payload.descripcion !== undefined) {
                const el = document.getElementById("descResultadoDesastre");
                if (el) el.innerHTML = payload.descripcion;
            }
            if (payload.detalle !== undefined) {
                const el = document.getElementById("detalleResultadoDesastre");
                if (el) el.textContent = payload.detalle;
            }
            if (payload.historialHTML !== undefined) {
                const el = document.getElementById("listaHistorialDesastres");
                if (el) el.innerHTML = payload.historialHTML;
            }
            if (payload.timerText !== undefined) {
                const elDisplay = document.getElementById("displayCuentaAtrasDesastres");
                if (elDisplay) elDisplay.textContent = payload.timerText;
            }
            if (payload.timerLabelText !== undefined) {
                const elLabel = document.getElementById("labelEstadoCuentaAtrasDesastres");
                if (elLabel) elLabel.textContent = payload.timerLabelText;
            }
            if (payload.timerVisible !== undefined) {
                const elDiv = document.getElementById("divCuentaAtrasRuletaDesastres");
                if (elDiv) elDiv.style.display = payload.timerVisible ? "block" : "none";
            }
        } else if (windowId === "ventanaRetoResultado") {
            if (payload.retoActual && typeof renderizarResultadoReto === "function") {
                window.retoActual = payload.retoActual;
                renderizarResultadoReto(payload.retoActual);
            } else if (payload.contenidoHTML) {
                const el = document.getElementById("contenidoRetoResultado");
                if (el) el.innerHTML = payload.contenidoHTML;
            }
        } else if (windowId === "ventanaDados") {
            const elRes = document.getElementById("resultadoDados");
            if (elRes) {
                if (payload.resultadoHTML !== undefined) elRes.innerHTML = payload.resultadoHTML;
                if (payload.resultadoClassName !== undefined) elRes.className = payload.resultadoClassName;
            }
            if (payload.mensajeHTML !== undefined) {
                const el = document.getElementById("mensajeDados");
                if (el) el.innerHTML = payload.mensajeHTML;
            }
            if (payload.inputTiradasVal !== undefined) {
                const input = document.getElementById("inputTiradasDados");
                if (input) input.value = payload.inputTiradasVal;
            }
        } else if (windowId === "ventanaRuletaColor") {
            if (payload.giroAnimacion && payload.rotacionObjetivo !== undefined) {
                const wheel = document.getElementById("ruletaColorWheel");
                if (wheel) {
                    if (payload.wheelColors && typeof construirSVGRuleta === "function") {
                        wheel.innerHTML = construirSVGRuleta(payload.wheelColors);
                    }
                    wheel.style.transition = "transform 4.2s cubic-bezier(0.22, 1, 0.36, 1)";
                    wheel.style.transform = `rotate(${payload.rotacionObjetivo}deg)`;
                    wheel.dataset.rotacion = String(payload.rotacionObjetivo);
                }
            }
            if (payload.resultadoHTML !== undefined) {
                const el = document.getElementById("resultadoRuletaColor");
                if (el) el.innerHTML = payload.resultadoHTML;
            }
            if (payload.mensajeHTML !== undefined) {
                const el = document.getElementById("mensajeRuletaColor");
                if (el) el.innerHTML = payload.mensajeHTML;
            }
            if (payload.inputTiradasVal !== undefined) {
                const input = document.getElementById("inputTiradasRuleta");
                if (input) input.value = payload.inputTiradasVal;
            }
        } else if (windowId === "ventanaHabilidadesGenerador") {
            if (payload.resultadoHTML !== undefined) {
                const el = document.getElementById("habListaResultados");
                if (el) el.innerHTML = payload.resultadoHTML;
            }
        } else if (windowId === "ventanaTemporizador") {
            const displayTemp = document.getElementById("displayTemporizador");
            const configTemp = document.getElementById("configuracionTiempoContenedor");
            const accionesTemp = document.getElementById("accionesTemporizadorEnCurso");
            const inputMin = document.getElementById("inputMinutosTemporizador");

            if (payload.displayVisible !== undefined && displayTemp) displayTemp.style.display = payload.displayVisible;
            if (payload.configVisible !== undefined && configTemp) configTemp.style.display = payload.configVisible;
            if (payload.accionesVisible !== undefined && accionesTemp) accionesTemp.style.display = payload.accionesVisible;
            if (payload.inputMinutosVal !== undefined && inputMin) inputMin.value = payload.inputMinutosVal;
            if (payload.pausado !== undefined && displayTemp) {
                displayTemp.classList.toggle("pausado", payload.pausado);
            }
            if (payload.displayClassName !== undefined && displayTemp) {
                displayTemp.className = payload.displayClassName;
            }
            if (payload.tempDigitsHTML !== undefined) {
                const digits = document.getElementById("tempDigits");
                if (digits) digits.innerHTML = payload.tempDigitsHTML;
                else if (displayTemp) displayTemp.innerHTML = payload.tempDigitsHTML;
            }
        } else if (payload.contenidoGenericoHTML !== undefined) {
            // ── Ventanas genéricas (solo lectura): trucos, estadísticas, listado, etc.
            const elVentana = document.getElementById(windowId);
            if (elVentana) elVentana.innerHTML = payload.contenidoGenericoHTML;
        }
    }

    // ─── 5. MUTATION OBSERVERS Y EVENTOS DE EMISIÓN DESDE LA PESTAÑA PRINCIPAL ─
    function instanciarMutationObserversEmision() {
        if (document.body.classList.contains("modo-obs")) return; // Solo en la pestaña principal emitimos

        iniciarHostPeerJS();

        const capturarYEmitirEstado = (windowId) => {
            if (windowId === "ventanaRuletaDesastres") {
                const pantallaJuego = document.getElementById("pantallaJuegoRuletaDesastres");
                const divCuentaAtras = document.getElementById("divCuentaAtrasRuletaDesastres");
                emitirEstadoEnVivoOBS("ventanaRuletaDesastres", {
                    pantalla: (pantallaJuego && pantallaJuego.style.display !== "none") ? "juego" : "config",
                    iconoHTML: document.getElementById("iconoResultadoDesastre")?.innerHTML,
                    titulo: document.getElementById("tituloResultadoDesastre")?.textContent,
                    descripcion: document.getElementById("descResultadoDesastre")?.innerHTML,
                    detalle: document.getElementById("detalleResultadoDesastre")?.textContent,
                    historialHTML: document.getElementById("listaHistorialDesastres")?.innerHTML,
                    timerText: document.getElementById("displayCuentaAtrasDesastres")?.textContent,
                    timerLabelText: document.getElementById("labelEstadoCuentaAtrasDesastres")?.textContent,
                    timerVisible: divCuentaAtras ? divCuentaAtras.style.display !== "none" : false
                });
            } else if (windowId === "ventanaRetoResultado") {
                emitirEstadoEnVivoOBS("ventanaRetoResultado", {
                    retoActual: window.retoActual,
                    contenidoHTML: document.getElementById("contenidoRetoResultado")?.innerHTML
                });
            } else if (windowId === "ventanaDados") {
                const elRes = document.getElementById("resultadoDados");
                emitirEstadoEnVivoOBS("ventanaDados", {
                    resultadoHTML: elRes?.innerHTML,
                    resultadoClassName: elRes?.className,
                    mensajeHTML: document.getElementById("mensajeDados")?.innerHTML,
                    inputTiradasVal: document.getElementById("inputTiradasDados")?.value
                });
            } else if (windowId === "ventanaRuletaColor") {
                emitirEstadoEnVivoOBS("ventanaRuletaColor", {
                    resultadoHTML: document.getElementById("resultadoRuletaColor")?.innerHTML,
                    mensajeHTML: document.getElementById("mensajeRuletaColor")?.innerHTML,
                    inputTiradasVal: document.getElementById("inputTiradasRuleta")?.value
                });
            } else if (windowId === "ventanaHabilidadesGenerador") {
                emitirEstadoEnVivoOBS("ventanaHabilidadesGenerador", {
                    resultadoHTML: document.getElementById("habListaResultados")?.innerHTML
                });
            } else if (windowId === "ventanaTemporizador") {
                const displayTemp = document.getElementById("displayTemporizador");
                const configTemp = document.getElementById("configuracionTiempoContenedor");
                const accionesTemp = document.getElementById("accionesTemporizadorEnCurso");
                emitirEstadoEnVivoOBS("ventanaTemporizador", {
                    displayVisible: displayTemp?.style.display,
                    configVisible: configTemp?.style.display,
                    accionesVisible: accionesTemp?.style.display,
                    inputMinutosVal: document.getElementById("inputMinutosTemporizador")?.value,
                    pausado: displayTemp ? displayTemp.classList.contains("pausado") : false,
                    displayClassName: displayTemp ? displayTemp.className : "",
                    tempDigitsHTML: document.getElementById("tempDigits")?.innerHTML || displayTemp?.innerHTML
                });
            }
        };

        const contenedoresAEscuchar = [
            { id: "tarjetaResultadoDesastre", windowId: "ventanaRuletaDesastres" },
            { id: "listaHistorialDesastres",   windowId: "ventanaRuletaDesastres" },
            { id: "displayCuentaAtrasDesastres", windowId: "ventanaRuletaDesastres" },
            { id: "contenidoRetoResultado",    windowId: "ventanaRetoResultado" },
            { id: "resultadoDados",            windowId: "ventanaDados" },
            { id: "mensajeDados",              windowId: "ventanaDados" },
            { id: "resultadoRuletaColor",      windowId: "ventanaRuletaColor" },
            { id: "mensajeRuletaColor",        windowId: "ventanaRuletaColor" },
            { id: "habListaResultados",        windowId: "ventanaHabilidadesGenerador" },
            { id: "displayTemporizador",       windowId: "ventanaTemporizador" },
            { id: "tempDigits",                windowId: "ventanaTemporizador" }
        ];

        contenedoresAEscuchar.forEach(item => {
            const el = document.getElementById(item.id);
            if (el && typeof MutationObserver !== "undefined") {
                let debounceTimer = null;
                const mo = new MutationObserver(() => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => capturarYEmitirEstado(item.windowId), 50);
                });
                // attributes:true detecta cambios de clase (p.ej. clase "pausado" en displayTemporizador)
                mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true });
            }
        });

        // ── Catchall universal para ventanas no cubiertas por handlers específicos ──
        // Cubre: ventanaTrucos, ventanaTrucosConstruir, ventanaTrucosCAS, ventanaTrucosVivir,
        //        ventanaTrucosPacks, ventanaEstadisticas, ventanaHabilidadesPacks, ventanaRetos,
        //        ventanaRetosOpciones, ventanaListado, ventanaBuscador, etc.
        const VENTANAS_CON_HANDLER_ESPECIFICO = new Set([
            "ventanaRuletaDesastres", "ventanaRetoResultado", "ventanaDados",
            "ventanaRuletaColor", "ventanaHabilidadesGenerador", "ventanaTemporizador"
        ]);

        if (typeof MutationObserver !== "undefined") {
            let catchallTimer = null;
            const moCatchall = new MutationObserver(() => {
                clearTimeout(catchallTimer);
                catchallTimer = setTimeout(() => {
                    // Encontrar la ventana visible que NO tiene handler específico
                    const ventanaVisible = document.querySelector(".ventana[style*='display: block'], .ventana[style*='display:block']");
                    if (!ventanaVisible || !ventanaVisible.id) return;
                    if (VENTANAS_CON_HANDLER_ESPECIFICO.has(ventanaVisible.id)) return;

                    emitirEstadoEnVivoOBS(ventanaVisible.id, {
                        contenidoGenericoHTML: ventanaVisible.innerHTML
                    });
                }, 200);
            });
            moCatchall.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
        }

        // Escuchar cambios de valor en todos los inputs (números, scroll de ratón, typing)
        document.addEventListener("input", (e) => {
            const windowEl = e.target.closest(".ventana");
            if (windowEl && windowEl.id) {
                capturarYEmitirEstado(windowEl.id);
            }
        }, true);

        document.addEventListener("change", (e) => {
            const windowEl = e.target.closest(".ventana");
            if (windowEl && windowEl.id) {
                capturarYEmitirEstado(windowEl.id);
            }
        }, true);

        document.addEventListener("wheel", (e) => {
            if (e.target.tagName === "INPUT" || e.target.closest(".habNumeroWrap")) {
                const windowEl = e.target.closest(".ventana");
                if (windowEl && windowEl.id) {
                    setTimeout(() => capturarYEmitirEstado(windowEl.id), 50);
                }
            }
        }, true);
    }

    // ─── 6. COPIAR URL PARA OBS BROWSER SOURCE ─────────────────────────────
    function construirURLOBS(windowId, screenId = null) {
        const loc = window.location;

        if (loc.protocol === "file:") {
            setTimeout(() => mostrarToastOBS("⚠️ Estás en local (file://). Para Browser Source usa la URL de GitHub Pages, o usa el Popout."), 100);
        }

        const url = new URL(loc.href.split("?")[0].split("#")[0]);
        url.searchParams.set("obs", "1");
        url.searchParams.set("window", windowId);

        if (screenId) {
            url.searchParams.set("screen", screenId);
        } else if (windowId === "ventanaRuletaDesastres") {
            url.searchParams.set("screen", "juego");
        }

        // Adjuntar ID de Peer WebRTC para comunicación directa con OBS CEF
        const peerId = obtenerHostPeerId();
        if (peerId) {
            url.searchParams.set("peer", peerId);
        }

        // Adjuntar estado actual de la tarjeta en la URL
        if (windowId === "ventanaRuletaColor") {
            const msg = document.getElementById("mensajeRuletaColor");
            const res = document.getElementById("resultadoRuletaColor");
            const sampleChip = res?.querySelector(".chipColorRuleta__muestra");
            if (sampleChip) {
                url.searchParams.set("color", sampleChip.getAttribute("data-tooltip") || "Color");
                url.searchParams.set("hex", sampleChip.style.backgroundColor || "#2ecc71");
            }
        } else if (windowId === "ventanaRuletaDesastres") {
            const elTitulo = document.getElementById("tituloResultadoDesastre");
            const elDesc = document.getElementById("descResultadoDesastre");
            const elIcono = document.getElementById("iconoResultadoDesastre");
            if (elTitulo && elTitulo.textContent) url.searchParams.set("disTitle", elTitulo.textContent);
            if (elDesc && elDesc.innerHTML) url.searchParams.set("disDesc", elDesc.innerHTML);
            if (elIcono && elIcono.textContent) url.searchParams.set("disIcon", elIcono.textContent);
        }

        return url.href;
    }

    window.copiarURLEnlaceOBS = function (windowId, screenId = null) {
        if (!windowId) return;
        const obsURL = construirURLOBS(windowId, screenId);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(obsURL).then(() => {
                mostrarToastOBS("🎥 URL copiada. Añádela como Fuente de Navegador en OBS Studio.");
            }).catch(() => {
                prompt("Copia este enlace para OBS Browser Source:", obsURL);
            });
        } else {
            prompt("Copia este enlace para OBS Browser Source:", obsURL);
        }
    };

    function copiarURLEnlaceOBSDirecto(windowId, event) {
        if (!windowId) return;

        let screenParam = null;
        if (windowId === "ventanaRuletaDesastres") {
            const juego = document.getElementById("pantallaJuegoRuletaDesastres");
            screenParam = (juego && juego.style.display !== "none") ? "juego" : "config";
        }

        const obsURL = construirURLOBS(windowId, screenParam);

        const avisarExito = () => {
            if (typeof mostrarTooltipCopiado === "function") {
                mostrarTooltipCopiado(event, "✅ Enlace de OBS copiado");
            } else {
                mostrarToastOBS("🎥 Enlace de OBS copiado.");
            }
        };

        const avisarFallo = () => {
            if (typeof mostrarTooltipCopiado === "function") {
                mostrarTooltipCopiado(event, "⚠️ No se pudo copiar");
            } else {
                prompt("Copia este enlace para OBS Browser Source:", obsURL);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(obsURL).then(avisarExito).catch(() => {
                copiarURLEnlaceOBSFallback(obsURL, avisarExito, avisarFallo);
            });
        } else {
            copiarURLEnlaceOBSFallback(obsURL, avisarExito, avisarFallo);
        }
    }

    function copiarURLEnlaceOBSFallback(texto, avisarExito, avisarFallo) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand("copy");
            avisarExito();
        } catch (error) {
            avisarFallo();
        }

        document.body.removeChild(textarea);
    }

    // ─── 7. ABRIR POPOUT STANDALONE ────────────────────────────────────────
    window.abrirPopoutOBS = function (windowId, screenId = null) {
        if (!windowId) return;

        if (!screenId && windowId === "ventanaRuletaDesastres") {
            const juego = document.getElementById("pantallaJuegoRuletaDesastres");
            screenId = (juego && juego.style.display !== "none") ? "juego" : "config";
        }

        const url = construirURLOBS(windowId, screenId);
        window.open(url, "OBS_" + windowId, "width=920,height=720,scrollbars=yes,resizable=yes");
    };

    // ─── 8. MODAL SELECTOR DE VENTANA PARA OBS ─────────────────────────────
    function crearModalOBS() {
        if (document.getElementById("modalOBSSelector")) return;

        const modal = document.createElement("div");
        modal.id = "modalOBSSelector";
        modal.className = "modalOBSSelector";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        modal.innerHTML = `
            <div class="modalOBSCard">
                <div class="modalOBSHeader">
                    <span class="modalOBSTitulo">📺 Enviar a OBS Studio</span>
                    <button class="cerrar modalOBSCerrar" id="cerrarModalOBS" title="Cerrar">✕</button>
                </div>
                <p class="modalOBSDesc">Selecciona una ventana. Podrás copiar el enlace directo para <strong>OBS Browser Source</strong> o abrirla en una ventana emergente independiente.</p>
                <div class="modalOBSLista" id="listaVentanasOBS"></div>
            </div>
        `;

        document.body.appendChild(modal);

        const lista = modal.querySelector("#listaVentanasOBS");
        VENTANAS_OBS.forEach(v => {
            if (!document.getElementById(v.id)) return;

            const item = document.createElement("div");
            item.className = "modalOBSItem";
            item.innerHTML = `
                <span class="modalOBSItemNombre">${v.nombre}</span>
                <div class="modalOBSItemAcciones">
                    <button class="btnObsCopiar" data-window="${v.id}" data-screen="${v.screen || ''}" data-tooltip="Copiar URL para OBS Browser Source">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        Copiar URL
                    </button>
                    <button class="btnObsPopout" data-window="${v.id}" data-screen="${v.screen || ''}" data-tooltip="Abrir en ventana emergente">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                        Popout
                    </button>
                </div>
            `;
            lista.appendChild(item);
        });

        lista.addEventListener("click", (e) => {
            const btnCopiar = e.target.closest(".btnObsCopiar");
            const btnPopout = e.target.closest(".btnObsPopout");
            if (btnCopiar) window.copiarURLEnlaceOBS(btnCopiar.dataset.window, btnCopiar.dataset.screen || null);
            if (btnPopout) window.abrirPopoutOBS(btnPopout.dataset.window, btnPopout.dataset.screen || null);
        });

        document.getElementById("cerrarModalOBS").addEventListener("click", () => {
            modal.classList.remove("visible");
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("visible");
        });
    }

    window.abrirSelectorOBS = function () {
        crearModalOBS();
        const modal = document.getElementById("modalOBSSelector");
        if (modal) modal.classList.add("visible");
    };

    // ─── 9. TOAST NOTIFICACIÓN ─────────────────────────────────────────────
    function mostrarToastOBS(mensaje) {
        let toast = document.getElementById("toastOBS");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toastOBS";
            toast.className = "toastOBS";
            document.body.appendChild(toast);
        }
        toast.textContent = mensaje;
        toast.classList.add("visible");
        setTimeout(() => toast.classList.remove("visible"), 4500);
    }

    // ─── 10. CLICK EN BOTONES OBS PEQUEÑOS DE CADA CABECERA ─────────────────
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btnOBS");
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const windowId = btn.dataset.window;
            if (windowId) {
                copiarURLEnlaceOBSDirecto(windowId, e);
            }
        }
    });

    // ─── 11. INIT ──────────────────────────────────────────────────────────
    document.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetWindowId = urlParams.get("window");
        const screenParam = urlParams.get("screen");
        const esOBS = urlParams.has("obs") && targetWindowId;

        if (esOBS) {
            activarModoOBS(targetWindowId, screenParam);
        }

        setTimeout(inyectarBotonesOBSEnHeaders, 600);
    });

    window.addEventListener("load", () => {
        setTimeout(inyectarBotonesOBSEnHeaders, 1000);
        setTimeout(instanciarMutationObserversEmision, 500);
    });
})();