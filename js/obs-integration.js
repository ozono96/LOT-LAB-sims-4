/* =========================================================
   OBS INTEGRATION MODULE
   Permite enviar cualquier ventana a OBS Studio como
   Fuente de Navegador (Browser Source) o Popout standalone.
   ========================================================= */

(function () {
    // Ventanas disponibles con nombre legible
    const VENTANAS_OBS = [
        { id: "ventanaBuscador",          nombre: "🔍 Filtrador de Solares" },
        { id: "ventanaResultados",        nombre: "🏠 Resultados de Búsqueda" },
        { id: "ventanaFichaSolar",        nombre: "📋 Ficha de Solar" },
        { id: "ventanaListado",           nombre: "📦 Listado de Packs" },
        { id: "ventanaRetosOpciones",     nombre: "⚙️ Opciones del Reto" },
        { id: "ventanaRetoResultado",     nombre: "🎯 Reto Generado" },
        { id: "ventanaTemporizador",      nombre: "⏱️ Temporizador de Retos" },
        { id: "ventanaRuletaColor",       nombre: "🎨 Ruleta de Colores" },
        { id: "ventanaDados",             nombre: "🎲 Tirador de Dados" },
        { id: "ventanaTrucos",            nombre: "🕹️ Trucos" },
        { id: "ventanaEstadisticas",      nombre: "📊 Estadísticas Sims 4" },
        { id: "ventanaRuletaDesastres",   nombre: "🎡 Ruleta de Desastres" },
        { id: "ventanaHabilidadesGenerador", nombre: "🧠 Habilidades al Azar" },
    ];

    // ─── SINCRONIZACIÓN: Canal de comunicación entre pestaña principal y OBS ──
    // BroadcastChannel (Chrome / OBS CEF Chromium) + localStorage (fallback)
    const OBS_CHANNEL_NAME = "lotlab-obs-sync";
    let broadcastChannel = null;
    let localStoragePollInterval = null;
    let ultimoTs = 0;
    let obsWindowId = null; // ID de la ventana activa en el modo OBS

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

    // ─── 2. ACTIVAR MODO OBS (página limpia para browser source / popout) ──
    // IMPORTANTE: esta función NUNCA debe tocar el innerHTML de las
    // ventanas ni sustituir nodos del DOM. Tanto si esta página se usa
    // como Fuente de Navegador de OBS como si se usa como Popout (donde
    // el propio streamer interactúa con los botones), el HTML y los
    // listeners de clic tienen que seguir siendo exactamente los mismos
    // que en una pestaña normal. Lo único que cambia es qué ventana se
    // muestra y el aspecto visual (vía CSS, sección "MODO OBS" de
    // style.css), nunca la lógica ni los elementos interactivos.
    let vigilanteVentanaOBSInterval = null;

    function activarModoOBS(windowId) {
        obsWindowId = windowId;
        document.body.classList.add("modo-obs");
        document.documentElement.classList.add("modo-obs");

        forzarVisibilidadOBS();

        // Muestra la ventana pedida sin llamar a abrirVentana() para no
        // resetear el estado ni destruir los listeners de los controles
        // internos (botones "Comenzar", reroll, etc.).
        const mostrarVentanaOBS = () => {
            const elVentana = document.getElementById(windowId);
            if (!elVentana) return;
            // Ocultar el resto de ventanas sin tocar su estado interno
            document.querySelectorAll(".ventana").forEach(v => {
                if (v.id !== windowId) v.style.display = "none";
            });
            elVentana.style.display = "block";
        };

        mostrarVentanaOBS();
        setTimeout(mostrarVentanaOBS, 200);
        setTimeout(mostrarVentanaOBS, 700);

        // Vigilante permanente y NO destructivo: únicamente restituye
        // display:block si algo externo oculta la ventana. NUNCA llama a
        // abrirVentana() (que resetea el DOM y los controles).
        if (vigilanteVentanaOBSInterval) clearInterval(vigilanteVentanaOBSInterval);
        vigilanteVentanaOBSInterval = setInterval(() => {
            const elVentana = document.getElementById(windowId);
            if (elVentana && elVentana.style.display !== "block") {
                elVentana.style.display = "block";
            }
        }, 1000);

        // Auto-ajuste de tamaño SOLO si esto es un Popout (ventana abierta
        // con window.open desde la propia web: tiene "window.opener"). Una
        // Fuente de Navegador de OBS no tiene opener y su tamaño lo decide
        // OBS, así que ahí resizeTo() no pinta nada y no se ejecuta.
        if (window.opener) {
            activarAutoResizePopout(windowId);
            iniciarReceptorSincronizacion(windowId);
        } else {
            // Es un Browser Source de OBS — también escucha actualizaciones
            iniciarReceptorSincronizacion(windowId);
        }
    }

    // ─── 2a. AUTO-REDIMENSIONAR LA VENTANA EMERGENTE (POPOUT) ──────────────
    // Cada ventana (reto, ruleta, dados...) tiene una altura/anchura de
    // contenido distinta y puede cambiar de tamaño según lo que se genere.
    // Redimensionamos la ventana emergente real del sistema operativo para
    // que encaje exactamente con el contenido, así OBS "Captura de ventana"
    // no deja huecos ni recorta nada.
    function activarAutoResizePopout(windowId) {
        function margenVentanaNavegador() {
            return {
                w: Math.max(0, window.outerWidth - window.innerWidth),
                h: Math.max(0, window.outerHeight - window.innerHeight)
            };
        }

        function ajustarTamanoPopout() {
            const el = document.getElementById(windowId);
            if (!el || el.style.display !== "block") return;

            // Usamos scrollWidth/scrollHeight para medir el contenido real,
            // no getBoundingClientRect(), porque en modo OBS el CSS usa
            // fit-content (no 100vw), así que scroll mide el tamaño natural.
            const scrollW = el.scrollWidth  || el.offsetWidth;
            const scrollH = el.scrollHeight || el.offsetHeight;
            if (scrollW < 10 || scrollH < 10) return; // aún no ha pintado

            const margen = margenVentanaNavegador();
            const anchoDeseado = Math.ceil(scrollW) + margen.w;
            const altoDeseado  = Math.ceil(scrollH) + margen.h;

            const anchoMax = window.screen ? window.screen.availWidth  : anchoDeseado;
            const altoMax  = window.screen ? window.screen.availHeight : altoDeseado;

            try {
                window.resizeTo(
                    Math.min(Math.max(anchoDeseado, 360), anchoMax),
                    Math.min(Math.max(altoDeseado,  240), altoMax)
                );
            } catch (e) {
                // Algunos navegadores bloquean resizeTo en ciertos contextos; se ignora.
            }
        }

        // Varios intentos mientras carga todo el contenido (imágenes, fuentes...)
        setTimeout(ajustarTamanoPopout, 300);
        setTimeout(ajustarTamanoPopout, 900);
        setTimeout(ajustarTamanoPopout, 1800);
        window.addEventListener("load", () => setTimeout(ajustarTamanoPopout, 200));

        // Reajustar si el contenido de la ventana cambia de tamaño más
        // adelante (por ejemplo, al generar un reto o hacer un reroll).
        const elInicial = document.getElementById(windowId);
        if (elInicial && typeof ResizeObserver !== "undefined") {
            let debounceResize = null;
            const ro = new ResizeObserver(() => {
                clearTimeout(debounceResize);
                debounceResize = setTimeout(ajustarTamanoPopout, 250);
            });
            ro.observe(elInicial);
        }
    }

    // ─── 2b. EVITAR QUE OBS PAUSE TEMPORIZADORES Y ANIMACIONES ─────────────
    // Un Browser Source de OBS (o una ventana Popout minimizada/tapada) se
    // renderiza "fuera de pantalla", y los navegadores tratan eso como una
    // pestaña en segundo plano, ralentizando setInterval/requestAnimationFrame.
    // Forzamos que la página siempre se reporte a sí misma como visible para
    // que temporizadores, ruletas y cuentas atrás no se congelen.
    function forzarVisibilidadOBS() {
        try {
            Object.defineProperty(document, "hidden", {
                configurable: true,
                get: () => false
            });
            Object.defineProperty(document, "visibilityState", {
                configurable: true,
                get: () => "visible"
            });
        } catch (e) {
            console.warn("[OBS] No se pudo forzar la visibilidad de la página:", e);
        }

        const bloquearEvento = (e) => {
            if (e && typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
            }
        };
        document.addEventListener("visibilitychange", bloquearEvento, true);
        window.addEventListener("blur", bloquearEvento, true);
    }

    // ─── 3. SINCRONIZACIÓN PESTAÑA PRINCIPAL ↔ OBS (BroadcastChannel) ──────
    // La pestaña principal emite el contenido de la ventana cada vez que cambia
    // (reto generado, reroll, etc.). El Browser Source / Popout lo recibe y
    // actualiza su vista sin recargar la página.

    // EMISOR: llamado desde la pestaña principal cuando hay un cambio de contenido
    function emitirActualizacionOBS(windowId) {
        const el = document.getElementById(windowId);
        if (!el) return;
        const payload = { type: "ventana-actualizada", windowId, html: el.innerHTML, ts: Date.now() };
        try {
            if (!broadcastChannel) broadcastChannel = new BroadcastChannel(OBS_CHANNEL_NAME);
            broadcastChannel.postMessage(payload);
        } catch (e) { /* no disponible */ }
        try { localStorage.setItem("obs-sync-" + windowId, JSON.stringify({ html: payload.html, ts: payload.ts })); } catch (e) { /* quota */ }
    }
    window.emitirActualizacionOBS = emitirActualizacionOBS;

    // RECEPTOR: escucha actualizaciones en el Popout / Browser Source
    function iniciarReceptorSincronizacion(windowId) {
        try {
            if (!broadcastChannel) broadcastChannel = new BroadcastChannel(OBS_CHANNEL_NAME);
            broadcastChannel.onmessage = (event) => {
                const data = event.data;
                if (data && data.type === "ventana-actualizada" && data.windowId === windowId) {
                    aplicarActualizacionOBS(windowId, data.html, data.ts);
                }
            };
        } catch (e) { console.warn("[OBS] BroadcastChannel no disponible:", e); }

        // Polling de localStorage como fallback (cada 2 segundos)
        if (localStoragePollInterval) clearInterval(localStoragePollInterval);
        localStoragePollInterval = setInterval(() => {
            try {
                const raw = localStorage.getItem("obs-sync-" + windowId);
                if (!raw) return;
                const data = JSON.parse(raw);
                if (data && data.ts > ultimoTs) aplicarActualizacionOBS(windowId, data.html, data.ts);
            } catch (e) { /* ignore */ }
        }, 2000);
    }

    // Aplica el HTML recibido actualizando solo el contenido interior de la ventana
    function aplicarActualizacionOBS(windowId, html, ts) {
        if (ts <= ultimoTs) return;
        ultimoTs = ts;
        const el = document.getElementById(windowId);
        if (!el || !html) return;
        el.innerHTML = html;
        // Si hay popout activo, reajustar tamaño tras el cambio de contenido
        if (window.opener && obsWindowId) {
            setTimeout(() => {
                const scrollW = el.scrollWidth || el.offsetWidth;
                const scrollH = el.scrollHeight || el.offsetHeight;
                if (scrollW > 10 && scrollH > 10) {
                    const mw = Math.max(0, window.outerWidth  - window.innerWidth);
                    const mh = Math.max(0, window.outerHeight - window.innerHeight);
                    try { window.resizeTo(
                        Math.min(Math.max(scrollW + mw, 360), window.screen?.availWidth  || 9999),
                        Math.min(Math.max(scrollH + mh, 240), window.screen?.availHeight || 9999)
                    ); } catch (e) { /* ignorar */ }
                }
            }, 300);
        }
    }

    // HOOK: emitir actualización cuando se renderiza un reto o la ruleta gira.
    // Se aplica con monkey-patching no destructivo en el evento "load".
    function hookearFuncionesDeActualizacion() {
        const origRenderizar = window.renderizarResultadoReto;
        if (typeof origRenderizar === "function") {
            window.renderizarResultadoReto = function (...args) {
                const r = origRenderizar.apply(this, args);
                setTimeout(() => emitirActualizacionOBS("ventanaRetoResultado"), 150);
                return r;
            };
        }
        const origRuleta = window.iniciarRuleta;
        if (typeof origRuleta === "function") {
            window.iniciarRuleta = function (...args) {
                const r = origRuleta.apply(this, args);
                setTimeout(() => emitirActualizacionOBS("ventanaRuletaDesastres"), 150);
                return r;
            };
        }
    }

    // ─── 4. COPIAR URL PARA OBS BROWSER SOURCE ─────────────────────────────
    function construirURLOBS(windowId) {
        const loc = window.location;
        // Advertir en modo local (file://) donde el Browser Source no funciona bien
        if (loc.protocol === "file:") {
            setTimeout(() => mostrarToastOBS("⚠️ Estás en local. Para OBS Browser Source usa la URL de GitHub Pages, o usa el Popout."), 100);
        }
        const url = new URL(loc.href.split("?")[0].split("#")[0]);
        url.searchParams.set("obs", "1");
        url.searchParams.set("window", windowId);
        return url.href;
    }

    window.copiarURLEnlaceOBS = function (windowId) {
        if (!windowId) return;
        const obsURL = construirURLOBS(windowId);

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

    // Copia directa (sin abrir el selector) usada por los botones pequeños
    // de cada cabecera de ventana. Muestra la misma clase de tooltip verde
    // "✅ copiado" que ya usa el resto de la web (ver trucos.js).
    function copiarURLEnlaceOBSDirecto(windowId, event) {
        if (!windowId) return;
        const obsURL = construirURLOBS(windowId);

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

    // ─── 4. ABRIR POPOUT STANDALONE ────────────────────────────────────────
    // El Popout es simplemente esta misma web abierta en una pestaña /
    // ventana nueva de tu propio navegador, mostrando solo la ventana
    // elegida. Al ser tu mismo navegador, es 100% interactiva: los botones
    // funcionan exactamente igual que en la pestaña normal. Para capturarla
    // en OBS, usa "Captura de ventana" (Window Capture) apuntando a esa
    // ventana emergente, no "Fuente de navegador".
    window.abrirPopoutOBS = function (windowId) {
        if (!windowId) return;
        // Emitir el estado actual ANTES de abrir el popout, para que cuando
        // éste cargue ya tenga datos en localStorage listos para mostrar.
        emitirActualizacionOBS(windowId);
        window.open(construirURLOBS(windowId), "OBS_" + windowId, "width=900,height=700,scrollbars=yes,resizable=yes");
    };

    // ─── 5. MODAL SELECTOR DE VENTANA PARA OBS ─────────────────────────────
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

        // Rellenar lista de ventanas
        const lista = modal.querySelector("#listaVentanasOBS");
        VENTANAS_OBS.forEach(v => {
            // Solo mostrar ventanas que existan en el DOM
            if (!document.getElementById(v.id)) return;

            const item = document.createElement("div");
            item.className = "modalOBSItem";
            item.innerHTML = `
                <span class="modalOBSItemNombre">${v.nombre}</span>
                <div class="modalOBSItemAcciones">
                    <button class="btnObsCopiar" data-window="${v.id}" data-tooltip="Copiar URL para OBS Browser Source">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        Copiar URL
                    </button>
                    <button class="btnObsPopout" data-window="${v.id}" data-tooltip="Abrir en ventana emergente">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                        Popout
                    </button>
                </div>
            `;
            lista.appendChild(item);
        });

        // Eventos de botones
        lista.addEventListener("click", (e) => {
            const btnCopiar = e.target.closest(".btnObsCopiar");
            const btnPopout = e.target.closest(".btnObsPopout");
            if (btnCopiar) window.copiarURLEnlaceOBS(btnCopiar.dataset.window);
            if (btnPopout) window.abrirPopoutOBS(btnPopout.dataset.window);
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

    // ─── 6. TOAST NOTIFICACIÓN ─────────────────────────────────────────────
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

    // ─── 7. CLICK EN BOTONES OBS PEQUEÑOS DE CADA CABECERA ─────────────────
    // Copian el enlace directamente (sin abrir el selector) y avisan con el
    // mismo tipo de tooltip verde "copiado" que usa el resto de la web.
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

    // ─── 8. INIT ───────────────────────────────────────────────────────────
    document.addEventListener("DOMContentLoaded", () => {
        // Detectar modo OBS desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const targetWindowId = urlParams.get("window");
        const esOBS = urlParams.has("obs") && targetWindowId;

        if (esOBS) {
            activarModoOBS(targetWindowId);
        }

        // Inyectar botones tras carga completa de app
        setTimeout(inyectarBotonesOBSEnHeaders, 800);
    });

    // También re-inyectar si se abren ventanas dinámicamente
    window.addEventListener("load", () => {
        setTimeout(inyectarBotonesOBSEnHeaders, 1200);
        // Hookear funciones de actualización de contenido (se hace en "load"
        // para asegurar que renderizarResultadoReto y similares ya existen).
        setTimeout(hookearFuncionesDeActualizacion, 800);
    });
})();