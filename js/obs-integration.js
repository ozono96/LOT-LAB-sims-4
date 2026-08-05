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
            btn.title = "Enviar a OBS";
            btn.setAttribute("data-window", id);
            btn.setAttribute("data-tooltip", "📺 Copiar enlace para OBS Studio");
            btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="23" x2="12" y2="21" stroke="currentColor" stroke-width="2"/><line x1="3" y1="12" x2="1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="23" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/></svg>`;

            if (btnCerrar) {
                cabecera.insertBefore(btn, btnCerrar);
            } else {
                cabecera.appendChild(btn);
            }
        });
    }

    // ─── 2. ACTIVAR MODO OBS (página limpia para browser source) ───────────
    function activarModoOBS(windowId) {
        document.body.classList.add("modo-obs");
        document.documentElement.classList.add("modo-obs");

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
    }

    // ─── 3. COPIAR URL PARA OBS BROWSER SOURCE ─────────────────────────────
    window.copiarURLEnlaceOBS = function (windowId) {
        if (!windowId) return;
        const url = new URL(window.location.href.split("?")[0].split("#")[0]);
        url.searchParams.set("obs", "1");
        url.searchParams.set("window", windowId);
        const obsURL = url.href;

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

    // ─── 4. ABRIR POPOUT STANDALONE ────────────────────────────────────────
    window.abrirPopoutOBS = function (windowId) {
        if (!windowId) return;
        const url = new URL(window.location.href.split("?")[0].split("#")[0]);
        url.searchParams.set("obs", "1");
        url.searchParams.set("window", windowId);
        window.open(url.href, "OBS_" + windowId, "width=900,height=700,scrollbars=yes,resizable=yes");
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

    // ─── 7. CLICK EN BOTONES OBS DEL HEADER ────────────────────────────────
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btnOBS");
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const windowId = btn.dataset.window;
            if (windowId) {
                window.abrirSelectorOBS();
                // Preseleccionar visualmente la ventana actual
                setTimeout(() => {
                    const modal = document.getElementById("modalOBSSelector");
                    if (modal) {
                        modal.querySelectorAll(".modalOBSItem").forEach(item => {
                            const copiar = item.querySelector(".btnObsCopiar");
                            const activo = copiar && copiar.dataset.window === windowId;
                            item.style.background = activo ? "rgba(46,204,113,0.15)" : "";
                            item.style.borderColor = activo ? "rgba(46,204,113,0.5)" : "";
                        });
                    }
                }, 50);
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
    });
})();
