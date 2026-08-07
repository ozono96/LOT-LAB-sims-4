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

    // ─── 2. ACTIVAR MODO OBS (página limpia para browser source) ───────────
    let vigilanteVentanaOBSInterval = null;

    function activarModoOBS(windowId) {
        document.body.classList.add("modo-obs");
        document.documentElement.classList.add("modo-obs");

        forzarVisibilidadOBS();
        iniciarReceptorSyncOBS(windowId);

        const intentarAbrir = () => {
            const elVentana = document.getElementById(windowId);
            if (elVentana) {
                if (typeof abrirVentana === "function") {
                    abrirVentana(windowId, false);
                } else {
                    document.querySelectorAll(".ventana").forEach(v => v.classList.remove("activo"));
                    elVentana.classList.add("activo");
                }
            }
        };

        intentarAbrir();
        setTimeout(intentarAbrir, 200);
        setTimeout(intentarAbrir, 700);

        // Vigilante permanente: si algún otro script de la web cambia la
        // ventana activa (por ejemplo al cargar datos o al navegar), esto
        // la vuelve a colocar en la ventana pedida para OBS, para que la
        // fuente de navegador nunca se quede "atascada" mostrando otra cosa
        // ni deje de reflejar cambios en tiempo real.
        if (vigilanteVentanaOBSInterval) clearInterval(vigilanteVentanaOBSInterval);
        vigilanteVentanaOBSInterval = setInterval(() => {
            const elVentana = document.getElementById(windowId);
            if (elVentana && elVentana.style.display !== "block") {
                intentarAbrir();
            }
        }, 1000);
    }

    // ─── 2b. EVITAR QUE OBS PAUSE TEMPORIZADORES Y ANIMACIONES ─────────────
    // Un Browser Source de OBS se renderiza "fuera de pantalla", y muchos
    // navegadores tratan eso como una pestaña en segundo plano, pausando
    // requestAnimationFrame y ralentizando setInterval. Esto es lo que hace
    // que la información (temporizadores, ruletas, resultados) parezca no
    // actualizarse aunque la ventana correcta esté siendo mostrada. Forzamos
    // aquí que la página siempre se reporte a sí misma como visible.
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
        window.addEventListener("pagehide", bloquearEvento, true);
    }

    // Los estilos de transparencia y de refuerzo de legibilidad en modo día
    // viven ahora en style.css (sección "MODO OBS"), usando las variables
    // de tema reales del proyecto (--color-tarjeta, --borde, --blur, etc.)
    // en vez de un parche aparte por JavaScript.

    // ─── 2d. SINCRONIZACIÓN EN TIEMPO REAL ENTRE PESTAÑAS DEL MISMO NAVEGADOR
    // Una Fuente de Navegador de OBS (URL pegada directamente en OBS) es un
    // Chromium completamente aparte del navegador de escritorio: no comparte
    // memoria ni almacenamiento, así que ningún truco de JavaScript puede
    // "empujar" cambios hacia ella desde fuera. Lo que SÍ es 100% real es
    // sincronizar entre pestañas/ventanas de TU MISMO navegador (dos pestañas
    // normales, o la ventana "Popout" que abre este sitio, capturada en OBS
    // con "Captura de ventana" en vez de "Fuente de navegador"). Eso es lo
    // que implementa este bloque: cada vez que el contenido de una ventana
    // cambia en una pestaña, se retransmite y se aplica al instante en
    // cualquier otra pestaña/ventana abierta de la misma web.
    const CANAL_SYNC_OBS = "lotlab_obs_sync_v1";
    const canalSyncOBS = (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel(CANAL_SYNC_OBS) : null;
    let ventanaObjetivoSyncOBS = null;

    function claveStorageSync(windowId) {
        return "lotlab_obs_sync_" + windowId;
    }

    function enviarSnapshotVentana(windowId) {
        const el = document.getElementById(windowId);
        if (!el) return;

        const payload = {
            tipo: "obs_sync_ventana",
            windowId: windowId,
            html: el.innerHTML,
            modoNoche: document.body.classList.contains("modo-noche"),
            ts: Date.now()
        };

        if (canalSyncOBS) {
            try { canalSyncOBS.postMessage(payload); } catch (e) { /* silencioso */ }
        }
        try {
            localStorage.setItem(claveStorageSync(windowId), JSON.stringify(payload));
        } catch (e) { /* cuota de localStorage superada: se ignora, no es crítico */ }
    }

    function aplicarSnapshotVentana(payload) {
        if (!payload || payload.windowId !== ventanaObjetivoSyncOBS) return;
        const el = document.getElementById(payload.windowId);
        if (!el) return;

        if (el.innerHTML !== payload.html) {
            el.innerHTML = payload.html;
        }
        document.body.classList.toggle("modo-noche", !!payload.modoNoche);
        document.body.classList.toggle("modo-dia", !payload.modoNoche);
    }

    // ── Lado emisor: se ejecuta en cualquier pestaña normal (no modo OBS) ──
    let observerEmisorSyncOBS = null;
    let ventanasPendientesSyncOBS = new Set();
    let temporizadorDebounceSyncOBS = null;

    function programarEnvioSyncOBS(windowId) {
        if (!windowId) return;
        ventanasPendientesSyncOBS.add(windowId);
        if (temporizadorDebounceSyncOBS) return;

        temporizadorDebounceSyncOBS = setTimeout(() => {
            ventanasPendientesSyncOBS.forEach(id => enviarSnapshotVentana(id));
            ventanasPendientesSyncOBS.clear();
            temporizadorDebounceSyncOBS = null;
        }, 250);
    }

    function iniciarEmisorSyncOBS() {
        const app = document.getElementById("app");
        if (!app || observerEmisorSyncOBS) return;

        observerEmisorSyncOBS = new MutationObserver((mutaciones) => {
            mutaciones.forEach(m => {
                const nodo = m.target.nodeType === 1 ? m.target : m.target.parentElement;
                if (!nodo) return;
                const ventana = nodo.closest(".ventana");
                if (ventana && ventana.id) {
                    programarEnvioSyncOBS(ventana.id);
                }
            });
        });

        observerEmisorSyncOBS.observe(app, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["style", "class", "src"]
        });

        // Si cambia el tema día/noche, reenviamos la ventana activa para que
        // las pestañas sincronizadas también actualicen el tema.
        document.getElementById("botonModo")?.addEventListener("click", () => {
            setTimeout(() => {
                if (window.ventanaActual) programarEnvioSyncOBS(window.ventanaActual);
            }, 50);
        });

        // Snapshot inicial de la ventana activa al cargar la página.
        setTimeout(() => {
            if (window.ventanaActual) enviarSnapshotVentana(window.ventanaActual);
        }, 1500);
    }

    // ── Lado receptor: se ejecuta dentro de la página cargada en OBS ───────
    function iniciarReceptorSyncOBS(windowId) {
        ventanaObjetivoSyncOBS = windowId;

        if (canalSyncOBS) {
            canalSyncOBS.onmessage = (e) => {
                if (e.data && e.data.tipo === "obs_sync_ventana") {
                    aplicarSnapshotVentana(e.data);
                }
            };
        }

        // Redundancia vía localStorage + evento "storage": funciona incluso
        // si BroadcastChannel no está disponible en el navegador.
        window.addEventListener("storage", (e) => {
            if (!e.key || e.key !== claveStorageSync(windowId) || !e.newValue) return;
            try {
                aplicarSnapshotVentana(JSON.parse(e.newValue));
            } catch (err) { /* silencioso */ }
        });

        // Si ya había actividad guardada antes de abrir esta vista, la
        // aplicamos de inmediato en vez de esperar al próximo cambio.
        try {
            const guardado = localStorage.getItem(claveStorageSync(windowId));
            if (guardado) aplicarSnapshotVentana(JSON.parse(guardado));
        } catch (e) { /* silencioso */ }
    }

    // ─── 3. COPIAR URL PARA OBS BROWSER SOURCE ─────────────────────────────
    function construirURLOBS(windowId) {
        const url = new URL(window.location.href.split("?")[0].split("#")[0]);
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
    window.abrirPopoutOBS = function (windowId) {
        if (!windowId) return;
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
    // Ahora copian el enlace directamente (sin abrir el selector) y avisan
    // con el mismo tipo de tooltip verde "copiado" que usa el resto de la web.
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
        } else {
            // Pestaña normal (o Popout): emite cambios para que cualquier
            // otra pestaña/ventana de este mismo navegador que esté
            // sincronizada (incluida una vista en modo OBS) se actualice.
            iniciarEmisorSyncOBS();
        }

        // Inyectar botones tras carga completa de app
        setTimeout(inyectarBotonesOBSEnHeaders, 800);
    });

    // También re-inyectar si se abren ventanas dinámicamente
    window.addEventListener("load", () => {
        setTimeout(inyectarBotonesOBSEnHeaders, 1200);
    });
})();