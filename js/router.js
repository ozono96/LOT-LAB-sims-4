/* =========================================================
   ROUTER.JS — SPA URL Routing por Ventana
   Cada ventana tiene su propia URL path compartible.
   - https/http  → history.pushState (path-based)
   - file://     → location.hash (hash-based)
   Compatibilidad con GitHub Pages via 404.html redirect.
   ========================================================= */

(function () {
    // ── Mapa de ventanaId → URL path ─────────────────────────────────────────
    const RUTAS_VENTANA = {
        "ventanaAcercaDe":             "/",
        "ventanaBuscador":             "/Buscador",
        "ventanaResultados":           "/Buscador/Resultados",
        "ventanaFichaSolar":           "/Buscador/Ficha",
        "ventanaListado":              "/Listado-de-Packs",
        "ventanaRetos":                "/Modo-Retos",
        "ventanaRetosOpciones":        "/Modo-Retos/Selector-de-packs",
        "ventanaRetoResultado":        "/Modo-Retos/Reto-Generado",
        "ventanaTemporizador":         "/Temporizador",
        "ventanaRuletaDesastres":      "/Ruleta-de-Desastres",
        "ventanaRuletaColor":          "/Ruleta-de-Colores",
        "ventanaDados":                "/Tirador-de-Dados",
        "ventanaTrucos":               "/Trucos",
        "ventanaTrucosConstruir":      "/Trucos/Construir",
        "ventanaTrucosCAS":            "/Trucos/CAS",
        "ventanaTrucosVivir":          "/Trucos/Vivir",
        "ventanaTrucosPacks":          "/Trucos/Packs",
        "ventanaEstadisticas":         "/Estadisticas",
        "ventanaHabilidadesPacks":     "/Habilidades",
        "ventanaHabilidadesGenerador": "/Habilidades/Generador"
    };

    // ── Mapa inverso path → ventanaId ────────────────────────────────────────
    const VENTANA_POR_RUTA = {};
    Object.entries(RUTAS_VENTANA).forEach(([id, path]) => {
        VENTANA_POR_RUTA[path.toLowerCase()] = id;
    });

    // ── Detectar si estamos en OBS/modo browser source ──────────────────────
    function esModoBrowserSource() {
        const params = new URLSearchParams(window.location.search);
        return params.has("obs") || !!window.opener;
    }

    // ── Detectar protocolo ─────────────────────────────────────────────────
    function usarHashRouting() {
        return window.location.protocol === "file:";
    }

    // ── Obtener la base path del repositorio (p.ej. /LOT-LAB-sims-4 en GitHub Pages) ──
    function obtenerBasePath() {
        const match = window.location.pathname.match(/^(\/[^/]+\/)/);
        if (!match) return "";
        const primerSegmento = match[1].toLowerCase();
        // Comprobar si el primer segmento coincide con alguna ruta de ventana
        const esRutaVentana = Object.values(RUTAS_VENTANA).some(r => {
            const seg = "/" + (r.split("/")[1] || "").toLowerCase() + "/";
            return seg.length > 1 && primerSegmento === seg;
        });
        if (esRutaVentana) return "";
        return match[1].replace(/\/$/, ""); // p.ej. "/LOT-LAB-sims-4"
    }

    // Se calcula una sola vez al cargar
    const BASE_PATH = obtenerBasePath();

    // ── Construir path absoluto para una ventana ─────────────────────────────
    function construirPath(ventanaId) {
        const ruta = RUTAS_VENTANA[ventanaId];
        if (!ruta) return BASE_PATH + "/";
        if (ruta === "/") return BASE_PATH + "/";
        return BASE_PATH + ruta;
    }

    // ── Actualizar la URL cuando se abre una ventana ──────────────────────────
    window.actualizarURLParaVentana = function (ventanaId) {
        if (esModoBrowserSource()) return; // No cambiar URL en OBS
        if (!RUTAS_VENTANA[ventanaId]) return; // Sin ruta = no tocar la URL

        if (usarHashRouting()) {
            // file:// → usar hash
            const hashDestino = "#" + RUTAS_VENTANA[ventanaId];
            if (window.location.hash !== hashDestino) {
                history.pushState({ ventana: ventanaId }, "", hashDestino);
            }
        } else {
            // http/https → path real
            const pathDestino = construirPath(ventanaId);
            if (window.location.pathname !== pathDestino) {
                history.pushState({ ventana: ventanaId }, "", pathDestino);
            }
        }
    };

    // ── Obtener ventanaId desde la URL actual ─────────────────────────────────
    function obtenerVentanaDesdeURL() {
        if (esModoBrowserSource()) return null;

        if (usarHashRouting()) {
            const hash = (window.location.hash.replace(/^#/, "") || "/").toLowerCase();
            const normalizado = hash.replace(/\/$/, "") || "/";
            return VENTANA_POR_RUTA[normalizado] || null;
        }

        // http/https: leer el pathname relativo a BASE_PATH
        let pathname = window.location.pathname;
        if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
            pathname = pathname.slice(BASE_PATH.length) || "/";
        }
        const normalizado = (pathname || "/").toLowerCase().replace(/\/$/, "") || "/";
        return VENTANA_POR_RUTA[normalizado] || null;
    }

    // ── Soporte redirect desde 404.html de GitHub Pages ──────────────────────
    function procesarRedirect404GitHubPages() {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("r");
        if (!redirect) return;

        try {
            const pathDecodificado = decodeURIComponent(redirect);
            const urlLimpia = new URL(window.location.href);
            urlLimpia.searchParams.delete("r");
            const nuevaURL = pathDecodificado + (urlLimpia.search !== "?" ? urlLimpia.search : "");
            history.replaceState(null, "", nuevaURL);
        } catch (e) {}
    }

    // ── Restaurar ventana desde la URL al cargar la página ────────────────────
    function restaurarVentanaDesdeURL() {
        procesarRedirect404GitHubPages();

        const ventanaId = obtenerVentanaDesdeURL();
        if (ventanaId && typeof abrirVentana === "function") {
            abrirVentana(ventanaId, false);
        }
    }

    // ── Listener para el botón Atrás/Adelante del navegador ──────────────────
    window.addEventListener("popstate", (event) => {
        if (esModoBrowserSource()) return;

        let ventanaId = null;
        if (event.state && event.state.ventana) {
            ventanaId = event.state.ventana;
        } else {
            ventanaId = obtenerVentanaDesdeURL();
        }

        if (ventanaId && typeof abrirVentana === "function") {
            abrirVentana(ventanaId, false);
        }
    });

    // ── Init: restaurar desde URL cuando el DOM esté listo ──────────────────
    // Esperar a que navigation.js finalice su carga inicial (setTimeout 150ms + margen)
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(restaurarVentanaDesdeURL, 200);
    });

})();
