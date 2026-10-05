// Garantizar que en cada carga/recarga se inicie en el tope (0,0) con título grande y menú normal
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
document.addEventListener('DOMContentLoaded', () => { window.scrollTo(0, 0); });
window.addEventListener('load', () => { window.scrollTo(0, 0); });

let cargaInicialCompleta = false;
window.addEventListener('load', () => {
    setTimeout(() => {
        cargaInicialCompleta = true;
    }, 150);
});

// ─── HELPERS GLOBALES DE BASE64URL SEGURO ──────────────────────────────
if (typeof window.codificarBase64URL !== "function") {
    window.codificarBase64URL = function(cadena) {
        const bytes = new TextEncoder().encode(cadena);
        let binario = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binario += String.fromCharCode(bytes[i]);
        }
        return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };
}

if (typeof window.decodificarBase64URL !== "function") {
    window.decodificarBase64URL = function(base64url) {
        let base64 = String(base64url || "").replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4 !== 0) {
            base64 += "=";
        }
        const binario = atob(base64);
        const bytes = new Uint8Array(binario.length);
        for (let i = 0; i < binario.length; i++) {
            bytes[i] = binario.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    };
}

// ─── DICCIONARIOS DE RUTAS Y SLUGS POR VENTANA ─────────────────────────
const MAPA_RUTAS = {
    "acercade": "ventanaAcercaDe",
    "acerca-de": "ventanaAcercaDe",
    "inicio": "ventanaAcercaDe",
    "home": "ventanaAcercaDe",
    "about": "ventanaAcercaDe",

    "buscador": "ventanaBuscador",
    "buscador-solares": "ventanaBuscador",
    "listado": "ventanaListado",
    "listado-solares": "ventanaListado",
    "filtrador": "ventanaBuscador",
    "solares": "ventanaBuscador",
    "buscar": "ventanaBuscador",

    "retos": "ventanaRetos",
    "modo-retos": "ventanaRetos",
    "modo-reto": "ventanaRetos",
    "desafios": "ventanaRetos",
    "retos-opciones": "ventanaRetosOpciones",
    "reto-generado": "ventanaRetoResultado",
    "retos-resultado": "ventanaRetoResultado",

    "ruleta-desastres": "ventanaRuletaDesastres",
    "ruleta-desastre": "ventanaRuletaDesastres",
    "desastres": "ventanaRuletaDesastres",

    "ruleta-color": "ventanaRuletaColor",
    "ruleta-colores": "ventanaRuletaColor",
    "colores": "ventanaRuletaColor",

    "dados": "ventanaDados",
    "tirador-dados": "ventanaDados",

    "temporizador": "ventanaTemporizador",
    "timer": "ventanaTemporizador",
    "tiempo": "ventanaTemporizador",

    "habilidades": "ventanaRetos",
    "habilidad": "ventanaRetos",
    "habilidades-packs": "ventanaRetos",
    "habilidades-azar": "ventanaHabilidadesGenerador",
    "habilidades-generador": "ventanaHabilidadesGenerador",

    "packs-azar": "ventanaRetos",
    "packs-generador": "ventanaPacksGenerador",

    "mundos-azar": "ventanaRetos",
    "mundos-generador": "ventanaMundosGenerador",

    "trucos": "ventanaTrucos",
    "truco": "ventanaTrucos",
    "cheats": "ventanaTrucos",
    "trucos-inicio": "ventanaTrucos",
    "trucos-construir": "ventanaTrucosConstruir",
    "trucos-cas": "ventanaTrucosCAS",
    "trucos-vivir": "ventanaTrucosVivir",
    "trucos-packs": "ventanaTrucosPacks",

    "estadisticas": "ventanaEstadisticas",
    "stats": "ventanaEstadisticas",

    "resultados": "ventanaResultados",
    "listado": "ventanaListado",
    "listado-solares": "ventanaListado",
    "buscador-solares": "ventanaBuscador",
    "aleatorio": "ventanaAleatorio",
    "ficha-solar": "ventanaFichaSolar",
    "tier-list": "ventanaTierList",
    "tierlist": "ventanaTierList",
    "tier-list/mundos": "ventanaTierList",
    "tier-list/packs": "ventanaTierList",
    "tier-list/personalizada": "ventanaTierList",
    "tierlist/mundos": "ventanaTierList",
    "tierlist/packs": "ventanaTierList",
    "tierlist/personalizada": "ventanaTierList"
};

const VENTANA_A_SLUG = {
    "ventanaAcercaDe": "acercade",
    "ventanaBuscador": "filtrador",
    "ventanaRetos": "retos",
    "ventanaRetosOpciones": "retos-opciones",
    "ventanaRetoResultado": "reto-generado",
    "ventanaRuletaDesastres": "ruleta-desastres",
    "ventanaRuletaColor": "ruleta-color",
    "ventanaDados": "dados",
    "ventanaTemporizador": "temporizador",
    "ventanaHabilidadesGenerador": "habilidades-generador",
    "ventanaPacksGenerador": "packs-generador",
    "ventanaMundosGenerador": "mundos-generador",
    "ventanaTrucos": "trucos",
    "ventanaTrucosConstruir": "trucos-construir",
    "ventanaTrucosCAS": "trucos-cas",
    "ventanaTrucosVivir": "trucos-vivir",
    "ventanaTrucosPacks": "trucos-packs",
    "ventanaEstadisticas": "estadisticas",
    "ventanaResultados": "resultados",
    "ventanaListado": "listado",
    "ventanaAleatorio": "aleatorio",
    "ventanaFichaSolar": "ficha-solar",
    "ventanaTierList": "tier-list"
};

window.ventanaAnterior = "ventanaAcercaDe";
window.ventanaActual = "ventanaAcercaDe";
let estaNavegandoInternamente = false;

// Protege contra sobrescritura de URL durante la carga inicial.
// Se activa a true justo antes de que procesarRutaURL() se ejecute por primera vez.
let _urlInicialProcesada = false;

// Flag: indica que la navegación actual proviene de popstate (botón Atrás/Adelante).
// Cuando es true, actualizarHashURL usará replaceState en lugar de pushState
// para no añadir una entrada duplicada al historial.
let _esNavegandoDesdePopstate = false;

// ─── HELPERS PARA EL PARÁMETRO DE MODO EN LA URL (?nav=exp) ────────────
// Usa history.replaceState para añadir/eliminar ?nav=exp sin tocar el hash.
function leerModoDesdeURL() {
    try {
        const params = new URLSearchParams(window.location.search);
        const nav = params.get("nav");
        if (nav === "exp" || nav === "experimental") return "experimental";
        if (nav === "clasica" || nav === "clasico" || nav === "classic") return "clasica";
    } catch (e) {}
    return null; // No hay parámetro → usar valor por defecto (Clásica)
}

function actualizarParamNavURL(modo) {
    try {
        if (window.location.protocol === "file:") return; // file:// no admite search params
        const url = new URL(window.location.href);
        // URLs nuevas son siempre explícitas: ?nav=classic o ?nav=exp
        url.searchParams.set("nav", modo === "experimental" ? "exp" : "classic");
        const nuevaURL = url.pathname + (url.search || "") + (url.hash || "");
        if (window.location.pathname + window.location.search !== url.pathname + url.search) {
            history.replaceState(null, "", nuevaURL);
        }
    } catch (e) {}
}

// Devuelve el search string correcto para el modo actual (?nav=exp o ?nav=classic).
// En entornos file:// devuelve cadena vacía para no romper.
function obtenerSearchConModo() {
    if (window.location.protocol === "file:") return "";
    const modo = window.modoNavegacionActual || "clasica";
    return modo === "experimental" ? "?nav=exp" : "?nav=classic";
}

function actualizarHashURL(slug, usarPushState = false) {
    if (!slug) return;
    const search = obtenerSearchConModo();
    const hashDeseado = "#" + slug;
    // Evitar operación redundante si la URL ya es la correcta
    if (window.location.hash === hashDeseado && window.location.search === search) return;

    estaNavegandoInternamente = true;
    try {
        if (window.location.protocol !== "file:" && history.pushState) {
            if (usarPushState) {
                // Navegación voluntaria → nueva entrada en el historial
                history.pushState(null, "", search + hashDeseado);
            } else {
                // Restauración (popstate, carga inicial, estado interno) → no añadir entrada
                history.replaceState(null, "", search + hashDeseado);
            }
        } else {
            window.location.hash = hashDeseado;
        }
    } catch (e) {
        try {
            window.location.hash = hashDeseado;
        } catch (err) {
            // Silencioso en entornos locales estrictos
        }
    } finally {
        setTimeout(() => {
            estaNavegandoInternamente = false;
        }, 60);
    }
}

function procesarRutaURL() {
    if (estaNavegandoInternamente) return;

    let rawHash = window.location.hash || "";
    let rawSlug = rawHash.replace(/^[#/]+/, "").trim();
    let slug = rawSlug.toLowerCase();

    // ── MODO EXPERIMENTAL: reconstruir el estado correcto desde la URL ────
    // Esto ocurre antes de cualquier routing normal para evitar que el
    // launcher y una ventana de herramienta aparezcan simultáneamente.
    if (window.modoNavegacionActual === "experimental") {
        if (!slug) {
            // ?nav=exp (sin hash) → solo el launcher (nivel 1)
            EstadoExperimental.nivel = 1;
            EstadoExperimental.categoriaId = null;
            EstadoExperimental.herramientaId = null;
            renderizarNavegacionExperimental();
            return;
        }
        if (slug.startsWith("exp-cat/")) {
            // ?nav=exp#exp-cat/solares → mostrar categoría (nivel 2)
            const catId = rawSlug.substring("exp-cat/".length).trim().toLowerCase();
            EstadoExperimental.nivel = 2;
            EstadoExperimental.categoriaId = catId;
            EstadoExperimental.herramientaId = null;
            renderizarNavegacionExperimental();
            return;
        }
        // ?nav=exp#<tool-hash> → herramienta (nivel 3)
        // Configurar nivel 3 y ocultar el launcher ANTES de que el routing
        // normal abra la ventana para evitar que ambos aparezcan a la vez.
        EstadoExperimental.nivel = 3;
        EstadoExperimental.herramientaId = null; // Se conocerá al abrir la ventana
        const _menuExp = document.getElementById("menuPrincipal");
        const _n1 = document.getElementById("expNivel1");
        const _n2 = document.getElementById("expNivel2");
        if (_menuExp) _menuExp.style.display = "none";
        if (_n1) _n1.style.display = "none";
        if (_n2) _n2.style.display = "none";
        // Continúa al routing normal (sin return) para abrir la ventana correcta
    }

    if (!slug) {
        let isObs = window.location.search.includes('obs=1') || window.location.hash.includes('obs=1');
        let initialWindow = "ventanaAcercaDe";
        
        if (isObs) {
            let urlParams = new URLSearchParams(window.location.search);
            let urlWindow = urlParams.get('window');
            if (urlWindow) {
                initialWindow = urlWindow;
            } else {
                try {
                    let saved = localStorage.getItem("lotlab_current_window");
                    if (saved) initialWindow = saved;
                } catch(e) {}
            }
        }
        
        abrirVentana(initialWindow, false);
        return;
    }

    // ── Ruta dinámica para fichas de solares (#ficha-solar/<slug>) ──
    if (slug.startsWith("ficha-solar/") || slug === "ficha-solar") {
        const slugSolar = slug.startsWith("ficha-solar/")
            ? slug.substring("ficha-solar/".length).trim()
            : "";

        if (slugSolar) {
            const cargarFichaPorSlug = () => {
                const solar = typeof buscarSolarPorSlug === "function" ? buscarSolarPorSlug(slugSolar) : null;
                if (solar) {
                    abrirFichaSolar(solar.id);
                } else {
                    mostrarError404(slug);
                }
            };

            if (typeof database === "undefined" || !database.solares || database.solares.length === 0) {
                document.addEventListener("datosCargados", cargarFichaPorSlug, { once: true });
            } else {
                cargarFichaPorSlug();
            }
            return;
        } else {
            // Si es solo #ficha-solar sin slug específico
            if (window.solarFichaActual) {
                abrirFichaSolar(window.solarFichaActual.id);
            } else {
                abrirVentana("ventanaBuscador", false);
            }
            return;
        }
    }

    // ── Ruta dinámica para reto generado (#reto-generado/v1/<token>) ──
    if (slug.startsWith("reto-generado/v1/")) {
        const token = rawSlug.substring("reto-generado/v1/".length).trim();
        const procesarTokenReto = () => {
            if (typeof deserializarRetoV1 === "function") {
                const exito = deserializarRetoV1(token);
                if (!exito) {
                    alert("El enlace del reto no es compatible o está dañado.");
                    abrirVentana("ventanaRetosOpciones", false);
                }
            } else {
                abrirVentana("ventanaRetosOpciones", false);
            }
        };

        if (typeof database === "undefined" || !database.solares || database.solares.length === 0) {
            document.addEventListener("datosCargados", procesarTokenReto, { once: true });
        } else {
            procesarTokenReto();
        }
        return;
    }

    if (slug.startsWith("reto-generado/") && !slug.startsWith("reto-generado/v1/")) {
        alert("La versión de este reto no es compatible con esta versión de LOT-LAB.");
        abrirVentana("ventanaRetosOpciones", false);
        return;
    }

    if (slug === "reto-generado" || slug === "retos-resultado") {
        if (window.retoActual) {
            abrirVentana("ventanaRetoResultado", false);
            if (typeof renderizarResultadoReto === "function") {
                renderizarResultadoReto(window.retoActual);
            }
        } else {
            abrirVentana("ventanaRetosOpciones", false);
        }
        return;
    }

    // ── Ruta dinámica para tirador de dados (#dados/v1/<token>) ──
    if (slug.startsWith("dados/v1/")) {
        const token = rawSlug.substring("dados/v1/".length).trim();
        if (typeof restaurarDadosV1 === "function") {
            const exito = restaurarDadosV1(token);
            if (!exito) abrirVentana("ventanaDados", false);
        } else {
            abrirVentana("ventanaDados", false);
        }
        return;
    }
    if (slug.startsWith("dados/") && !slug.startsWith("dados/v1/")) {
        abrirVentana("ventanaDados", false);
        return;
    }

    // ── Ruta dinámica para ruleta de desastres (#ruleta-desastres/v1/<token>) ──
    if (slug.startsWith("ruleta-desastres/v1/") || slug.startsWith("ruleta-desastre/v1/") || slug.startsWith("desastres/v1/")) {
        let prefijo = "ruleta-desastres/v1/";
        if (slug.startsWith("ruleta-desastre/v1/")) prefijo = "ruleta-desastre/v1/";
        else if (slug.startsWith("desastres/v1/")) prefijo = "desastres/v1/";

        const token = rawSlug.substring(prefijo.length).trim();
        const procesarDesastres = () => {
            if (typeof restaurarRuletaDesastresV1 === "function") {
                const exito = restaurarRuletaDesastresV1(token);
                if (!exito) abrirVentana("ventanaRuletaDesastres", false);
            } else {
                abrirVentana("ventanaRuletaDesastres", false);
            }
        };

        if (typeof database === "undefined" || !Array.isArray(database.solares) || database.solares.length === 0) {
            document.addEventListener("datosCargados", procesarDesastres, { once: true });
        } else {
            procesarDesastres();
        }
        return;
    }
    if ((slug.startsWith("ruleta-desastres/") || slug.startsWith("ruleta-desastre/") || slug.startsWith("desastres/")) &&
        !slug.startsWith("ruleta-desastres/v1/") && !slug.startsWith("ruleta-desastre/v1/") && !slug.startsWith("desastres/v1/")) {
        abrirVentana("ventanaRuletaDesastres", false);
        return;
    }

    // ── Ruta dinámica para ruleta de colores (#ruleta-colores/v1/<token>) ──
    if (slug.startsWith("ruleta-colores/v1/") || slug.startsWith("ruleta-color/v1/")) {
        const prefijo = slug.startsWith("ruleta-colores/v1/") ? "ruleta-colores/v1/" : "ruleta-color/v1/";
        const token = rawSlug.substring(prefijo.length).trim();
        const procesarColor = () => {
            if (typeof restaurarRuletaColoresV1 === "function") {
                const exito = restaurarRuletaColoresV1(token);
                if (!exito) abrirVentana("ventanaRuletaColor", false);
            } else {
                abrirVentana("ventanaRuletaColor", false);
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.colores) || database.colores.length === 0) {
            document.addEventListener("datosCargados", procesarColor, { once: true });
        } else {
            procesarColor();
        }
        return;
    }
    if ((slug.startsWith("ruleta-colores/") || slug.startsWith("ruleta-color/")) && !slug.startsWith("ruleta-colores/v1/") && !slug.startsWith("ruleta-color/v1/")) {
        abrirVentana("ventanaRuletaColor", false);
        return;
    }

    // ── Ruta dinámica para habilidades al azar (#habilidades-azar/v1/<token>) ──
    if (slug.startsWith("habilidades-azar/v1/") || slug.startsWith("habilidades/v1/")) {
        const prefijo = slug.startsWith("habilidades-azar/v1/") ? "habilidades-azar/v1/" : "habilidades/v1/";
        const token = rawSlug.substring(prefijo.length).trim();
        const procesarHab = () => {
            if (typeof restaurarHabilidadesAzarV1 === "function") {
                const exito = restaurarHabilidadesAzarV1(token);
                if (!exito) abrirVentana("ventanaHabilidadesGenerador", false);
            } else {
                abrirVentana("ventanaHabilidadesGenerador", false);
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.habilidades) || database.habilidades.length === 0) {
            document.addEventListener("datosCargados", procesarHab, { once: true });
        } else {
            procesarHab();
        }
        return;
    }
    if ((slug.startsWith("habilidades-azar/") || slug.startsWith("habilidades/")) && !slug.startsWith("habilidades-azar/v1/") && !slug.startsWith("habilidades/v1/")) {
        abrirVentana("ventanaHabilidadesGenerador", false);
        return;
    }

    // ── Ruta dinámica para packs al azar (#packs-azar/v1/<token>) ──
    if (slug.startsWith("packs-azar/v1/") || slug.startsWith("packs/v1/")) {
        const prefijo = slug.startsWith("packs-azar/v1/") ? "packs-azar/v1/" : "packs/v1/";
        const token = rawSlug.substring(prefijo.length).trim();
        const procesarPacks = () => {
            if (typeof restaurarPacksAzarV1 === "function") {
                const exito = restaurarPacksAzarV1(token);
                if (!exito) abrirVentana("ventanaPacksGenerador", false);
            } else {
                abrirVentana("ventanaPacksGenerador", false);
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.packs) || database.packs.length === 0) {
            document.addEventListener("datosCargados", procesarPacks, { once: true });
        } else {
            procesarPacks();
        }
        return;
    }
    if ((slug.startsWith("packs-azar/") || slug.startsWith("packs/")) && !slug.startsWith("packs-azar/v1/") && !slug.startsWith("packs/v1/")) {
        abrirVentana("ventanaPacksGenerador", false);
        return;
    }

    // ── Ruta dinámica para mundos al azar (#mundos-azar/v1/<token>) ──
    if (slug.startsWith("mundos-azar/v1/") || slug.startsWith("mundos/v1/")) {
        const prefijo = slug.startsWith("mundos-azar/v1/") ? "mundos-azar/v1/" : "mundos/v1/";
        const token = rawSlug.substring(prefijo.length).trim();
        const procesarMundos = () => {
            if (typeof restaurarMundosAzarV1 === "function") {
                const exito = restaurarMundosAzarV1(token);
                if (!exito) abrirVentana("ventanaMundosGenerador", false);
            } else {
                abrirVentana("ventanaMundosGenerador", false);
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.mundos) || database.mundos.length === 0) {
            document.addEventListener("datosCargados", procesarMundos, { once: true });
        } else {
            procesarMundos();
        }
        return;
    }
    if ((slug.startsWith("mundos-azar/") || slug.startsWith("mundos/")) && !slug.startsWith("mundos-azar/v1/") && !slug.startsWith("mundos/v1/")) {
        abrirVentana("ventanaMundosGenerador", false);
        return;
    }

    // ── Ruta dinámica para temporizador (#temporizador/v1/<token>) ──
    if (slug.startsWith("temporizador/v1/")) {
        const token = rawSlug.substring("temporizador/v1/".length).trim();
        if (typeof restaurarTemporizadorV1 === "function") {
            const exito = restaurarTemporizadorV1(token);
            if (!exito) abrirVentana("ventanaTemporizador", false);
        } else {
            abrirVentana("ventanaTemporizador", false);
        }
        return;
    }
    if (slug.startsWith("temporizador/") && !slug.startsWith("temporizador/v1/")) {
        abrirVentana("ventanaTemporizador", false);
        return;
    }

    // ── Ruta dinámica para estadísticas (#estadisticas/v1/<token>) ──
    if (slug.startsWith("estadisticas/v1/")) {
        const token = rawSlug.substring("estadisticas/v1/".length).trim();
        if (typeof restaurarEstadisticasV1 === "function") {
            restaurarEstadisticasV1(token);
        } else {
            abrirVentana("ventanaEstadisticas", false);
        }
        return;
    }
    if (slug.startsWith("estadisticas/") && !slug.startsWith("estadisticas/v1/")) {
        abrirVentana("ventanaEstadisticas", false);
        return;
    }

    // ── Ruta dinámica para filtrador de solares (#filtrador/v1/<token>) ──
    if (slug.startsWith("filtrador/v1/") || slug.startsWith("buscador/v1/")) {
        const prefijo = slug.startsWith("filtrador/v1/") ? "filtrador/v1/" : "buscador/v1/";
        const token = rawSlug.substring(prefijo.length).trim();
        const procesarFiltrador = () => {
            if (typeof restaurarFiltradorV1 === "function") {
                const exito = restaurarFiltradorV1(token);
                if (!exito) abrirVentana("ventanaBuscador", false);
            } else {
                abrirVentana("ventanaBuscador", false);
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.solares) || database.solares.length === 0) {
            document.addEventListener("datosCargados", procesarFiltrador, { once: true });
        } else {
            procesarFiltrador();
        }
        return;
    }
    if ((slug.startsWith("filtrador/") || slug.startsWith("buscador/")) &&
        !slug.startsWith("filtrador/v1/") && !slug.startsWith("buscador/v1/")) {
        abrirVentana("ventanaBuscador", false);
        return;
    }

    // ── Ruta dinámica para trucos (#trucos/v1/<token>) ──
    if (slug.startsWith("trucos/v1/")) {
        const param = rawSlug.substring("trucos/v1/".length).trim();
        if (typeof restaurarTrucosV1 === "function") {
            const exito = restaurarTrucosV1(param);
            if (!exito) abrirVentana("ventanaTrucos", false);
        } else {
            abrirVentana("ventanaTrucos", false);
        }
        return;
    }

    // ── Ruta dinámica para Tier List (#tier-list/v1/<token>) ──
    if (slug.startsWith("tier-list/v1/") || slug.startsWith("tierlist/v1/")) {
        const prefijo = slug.startsWith("tier-list/v1/") ? "tier-list/v1/" : "tierlist/v1/";
        const token = rawSlug.substring(prefijo.length).trim();
        const procesarTierList = () => {
            if (window.TierListCore && typeof window.TierListCore.deserializarEstadoURL === "function") {
                window.TierListCore.deserializarEstadoURL(token);
            }
            abrirVentana("ventanaTierList", false);
            if (typeof window.inicializarTierList === "function") {
                window.inicializarTierList();
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.mundos) || database.mundos.length === 0) {
            document.addEventListener("datosCargados", procesarTierList, { once: true });
        } else {
            procesarTierList();
        }
        return;
    }
    // ── Rutas normales de navegación para Tier List ──
    const matchTierListModo = slug.match(/^tier-?list\/(mundos|packs|personalizada)$/);
    if (matchTierListModo) {
        const modo = matchTierListModo[1];
        const procesarModo = () => {
            if (window.EstadoTierList) {
                window.EstadoTierList.modo = modo;
                window.EstadoTierList.pantalla = "tablero";
                if (modo !== "personalizada" && window.TierListCore) {
                    window.TierListCore.sincronizarElementosDisponibles(modo);
                }
            }
            abrirVentana("ventanaTierList", false);
            if (typeof window.inicializarTierList === "function") {
                window.inicializarTierList();
            }
            if (window.TierListUI && typeof window.TierListUI.renderizarTierList === "function") {
                window.TierListUI.renderizarTierList();
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.mundos) || database.mundos.length === 0) {
            document.addEventListener("datosCargados", procesarModo, { once: true });
        } else {
            procesarModo();
        }
        return;
    }

    if (slug === "tier-list" || slug === "tierlist") {
        const procesarSelector = () => {
            if (window.EstadoTierList) {
                window.EstadoTierList.pantalla = "selector";
            }
            abrirVentana("ventanaTierList", false);
            if (typeof window.inicializarTierList === "function") {
                window.inicializarTierList();
            }
            if (window.TierListUI && typeof window.TierListUI.renderizarTierList === "function") {
                window.TierListUI.renderizarTierList();
            }
        };
        if (typeof database === "undefined" || !Array.isArray(database.mundos) || database.mundos.length === 0) {
            document.addEventListener("datosCargados", procesarSelector, { once: true });
        } else {
            procesarSelector();
        }
        return;
    }

    // Primero: Comprobar si el slug coincide con alguna página editable en ITEMS_ESTRUCTURA_SITIO
    // PERO solo si NO existe ya una ventana hardcoded para este slug en MAPA_RUTAS.
    // Las ventanas hardcoded (trucos, estadísticas, etc.) tienen prioridad sobre el árbol editable.
    const ventanaHardcoded = MAPA_RUTAS[slug];
    const esVentanaHardcoded = ventanaHardcoded && VENTANAS_HARDCODED.has(ventanaHardcoded);

    if (!esVentanaHardcoded) {
        let itemEditable = window.ITEMS_ESTRUCTURA_SITIO?.find(it => it.ruta === slug || it.id === slug);
        if (!itemEditable && slug.includes("/")) {
            const partes = slug.split("/");
            const lastPart = partes[partes.length - 1];
            itemEditable = window.ITEMS_ESTRUCTURA_SITIO?.find(it => it.id === lastPart || it.ruta === slug);
        }
        if (itemEditable) {
            // Bloquear acceso público a páginas que no están publicadas.
            // Borrador y Oculta se tratan igual que ruta inexistente para el visitante.
            const estadoEditable = itemEditable.estado || "";
            const esPublicada = (estadoEditable === "publicado" || estadoEditable === "publicada");
            if (!esPublicada) {
                mostrarError404(slug);
                return;
            }
            if (typeof abrirPaginaEditable === "function") {
                abrirPaginaEditable(itemEditable, false);
                return;
            }
        }
    }

    const idVentana = MAPA_RUTAS[slug];

    if (idVentana) {
        if (idVentana.startsWith("ventana_pag_")) {
            const pageId = idVentana.replace("ventana_pag_", "");
            const it = window.ITEMS_ESTRUCTURA_SITIO?.find(i => i.id === pageId);
            if (it && typeof cargarContenidoPaginaEditable === "function") {
                cargarContenidoPaginaEditable(it, idVentana);
            }
        }

        if (slug === "packs-azar") {
            window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
        } else if (slug === "habilidades" || slug === "habilidades-packs" || slug === "habilidad") {
            window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
        } else if (slug === "mundos-azar") {
            window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
        } else if (slug === "modo-retos" || slug === "retos" || slug === "desafios") {
            window.proximaVentanaTrasPacks = "ventanaRetosOpciones";
        }

        if (window.ventanaActual !== idVentana || document.getElementById(idVentana)?.style.display !== "block") {
            abrirVentana(idVentana, false);
            if (idVentana === "ventanaEstadisticas" && typeof abrirEstadisticas === "function") {
                abrirEstadisticas();
            }
        }
    } else {
        mostrarError404(slug);
    }
}

function mostrarError404(slugInvalido) {
    const spanRuta = document.getElementById("rutaInvalida404");

    if (spanRuta) {
        spanRuta.textContent = (slugInvalido && slugInvalido !== "404") ? "#" + slugInvalido : "dirección web";
    }

    abrirVentana("ventana404", false);
}

function gestionarPausaNavegacionTemporizadores() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const esTempVisible = ventanaTemp && (ventanaTemp.style.display === "block" || ventanaTemp.style.display === "flex");

    if (esTempVisible) {
        if (typeof window.reanudarTemporizadorPorNavegacion === "function") {
            window.reanudarTemporizadorPorNavegacion();
        }
    } else {
        if (typeof window.pausarTemporizadorPorNavegacion === "function") {
            window.pausarTemporizadorPorNavegacion();
        }
    }

    const ventanaRuleta = document.getElementById("pantallaJuegoRuletaDesastres");
    const ventanaRuletaPadre = document.getElementById("ventanaRuletaDesastres");
    const esRuletaVisible = ventanaRuletaPadre && (ventanaRuletaPadre.style.display === "block" || ventanaRuletaPadre.style.display === "flex") &&
        ventanaRuleta && ventanaRuleta.style.display === "block";

    if (esRuletaVisible) {
        if (typeof window.reanudarRuletaDesastresPorNavegacion === "function") {
            window.reanudarRuletaDesastresPorNavegacion();
        }
    } else {
        if (typeof window.pausarRuletaDesastresPorNavegacion === "function") {
            window.pausarRuletaDesastresPorNavegacion();
        }
    }
}
window.gestionarPausaNavegacionTemporizadores = gestionarPausaNavegacionTemporizadores;

function abrirVentana(id, esClickUsuario = false, esNavegacionHistorial = false) {
    if (typeof ocultarResumenSolar === "function") {
        ocultarResumenSolar();
    }
    const ventanaEl = document.getElementById(id);

    if (window.ventanaActual !== id) {
        window.ventanaAnterior = window.ventanaActual;
        window.ventanaActual = id;
        try {
            localStorage.setItem("lotlab_current_window", id);
        } catch (e) {}
    }

    if (id !== "ventanaRetoResultado" && id !== "ventanaRuletaDesastres" && id !== "ventanaTemporizador") {
        if (typeof cerrarTemporizadorAcoplado === "function") {
            cerrarTemporizadorAcoplado();
        }
    }

    // 1. Mostrar ventana objetivo en el DOM (PRIMERO Y SIEMPRE)
    document.querySelectorAll(".ventana").forEach(ventana => {
        const esTemporizadorAcoplado = ventana.id === "ventanaTemporizador" && document.getElementById("app")?.classList.contains("modo-paralelo") && (id === "ventanaRetoResultado" || id === "ventanaRuletaDesastres" || id === "ventanaTemporizador");
        const esVentanaAcopladaAlTemp = (ventana.id === "ventanaRetoResultado" || ventana.id === "ventanaRuletaDesastres") && document.getElementById("app")?.classList.contains("modo-paralelo") && id === "ventanaTemporizador";

        if (!esTemporizadorAcoplado && !esVentanaAcopladaAlTemp) {
            ventana.style.display = "none";
        }
    });

    if (ventanaEl) {
        const VENTANAS_FLEX = ["ventanaTemporizador", "ventanaTiempoAgotado"];
        ventanaEl.style.display = VENTANAS_FLEX.includes(id) ? "flex" : "block";

        if (window.modoNavegacionActual !== "experimental") {
            if (typeof actualizarCategoriaClasicaActiva === "function") {
                actualizarCategoriaClasicaActiva(obtenerCategoriaPorVentana(id));
            }
        }
    }

    // Pausar o reanudar automáticamente los temporizadores según visibilidad de su sección
    gestionarPausaNavegacionTemporizadores();

    if (typeof window.emitirEventoOBS === "function") {
        const payloadVentana = { idVentana: id };
        if (id === "ventanaRetos") {
            payloadVentana.modoPacksAzar = (window.proximaVentanaTrasPacks === "ventanaPacksGenerador") || (window._modoPacksAzarActivo === true);
        }
        window.emitirEventoOBS("SYNC_ABRIR_VENTANA", payloadVentana);
    }

    if (id === "ventanaAcercaDe" && typeof window.inicializarCarruselAcercaDe === "function") {
        window.inicializarCarruselAcercaDe();
    }

    if (id === "ventanaListado" && typeof window.mostrarListadoCompleto === "function") {
        window.mostrarListadoCompleto();
    }

    if (id === "ventanaAleatorio" && typeof window.mostrarAleatorio === "function") {
        window.mostrarAleatorio();
    }

    if (id === "ventanaRetos" && typeof window.renderizarPacksRetos === "function") {
        window.renderizarPacksRetos();
    }

    if (id === "ventanaTierList" && typeof window.inicializarTierList === "function") {
        window.inicializarTierList();
    }

    // 2. Sincronizar URL hash de forma segura
    // usarPushState = true cuando el usuario navega voluntariamente (no desde popstate ni carga inicial)
    const _usarPush = !esNavegacionHistorial && esClickUsuario;
    if (id !== "ventana404") {
        if (id === "ventanaFichaSolar") {
            const slugSolar = (window.solarFichaActual && typeof obtenerSlugSolar === "function")
                ? obtenerSlugSolar(window.solarFichaActual)
                : "";
            actualizarHashURL(slugSolar ? ("ficha-solar/" + slugSolar) : "ficha-solar", _usarPush);
        } else if (id === "ventanaRetoResultado") {
            const token = (window.retoActual && typeof serializarRetoAToken === "function")
                ? serializarRetoAToken(window.retoActual)
                : null;
            actualizarHashURL(token ? ("reto-generado/v1/" + token) : (VENTANA_A_SLUG[id] || "reto-generado"), _usarPush);
        } else if (id === "ventanaDados") {
            // Preservar token si ya hay uno activo; si no, usar slug estático
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("dados/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "dados", _usarPush);
            }
        } else if (id === "ventanaRuletaColor") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("ruleta-colores/v1/") && !slugActual.startsWith("ruleta-color/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "ruleta-colores", _usarPush);
            }
        } else if (id === "ventanaHabilidadesGenerador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("habilidades-azar/v1/") && !slugActual.startsWith("habilidades/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "habilidades-azar", _usarPush);
            }
        } else if (id === "ventanaPacksGenerador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("packs-azar/v1/") && !slugActual.startsWith("packs/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "packs-azar", _usarPush);
            }
        } else if (id === "ventanaMundosGenerador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("mundos-azar/v1/") && !slugActual.startsWith("mundos/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "mundos-azar", _usarPush);
            }
        } else if (id === "ventanaTemporizador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("temporizador/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "temporizador", _usarPush);
            }
        } else if (id === "ventanaEstadisticas") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("estadisticas/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "estadisticas", _usarPush);
            }
        } else if (id === "ventanaTierList") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("tier-list/v1/") && !slugActual.startsWith("tierlist/v1/")) {
                let slugDestino = "tier-list";
                const estado = window.EstadoTierList;
                if (estado && estado.pantalla === "tablero") {
                    if (estado.modo === "personalizada") {
                        slugDestino = "tier-list/personalizada";
                    } else if (window.TierListCore && typeof window.TierListCore.serializarEstadoURL === "function") {
                        const token = window.TierListCore.serializarEstadoURL();
                        slugDestino = token ? ("tier-list/v1/" + token) : ("tier-list/" + estado.modo);
                    } else if (estado.modo === "mundos") {
                        slugDestino = "tier-list/mundos";
                    } else if (estado.modo === "packs") {
                        slugDestino = "tier-list/packs";
                    }
                }
                actualizarHashURL(slugDestino, _usarPush);
            }
        } else if (id === "ventanaTrucos") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("trucos/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "trucos", _usarPush);
            }
        } else if (id === "ventanaRuletaDesastres") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("ruleta-desastres/v1/") && !slugActual.startsWith("ruleta-desastre/v1/") && !slugActual.startsWith("desastres/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "ruleta-desastres", _usarPush);
            }
        } else if (id === "ventanaBuscador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("filtrador/v1/") && !slugActual.startsWith("buscador/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "filtrador", _usarPush);
            }
        } else if (VENTANA_A_SLUG[id]) {
            actualizarHashURL(VENTANA_A_SLUG[id], _usarPush);
        }
    }

    // 3. Reset limpio de scroll y formato de barra al abrir cualquier ventana (REGLA 1)
    window.scrollTo(0, 0);

    if (ventanaEl) {
        ventanaEl.scrollTop = 0;
        // Reset de scroll interno de cualquier contenedor hijo si lo tuviera
        ventanaEl.querySelectorAll("*").forEach(el => {
            if (el.scrollTop > 0) el.scrollTop = 0;
        });
    }

    // Restablecer obligatoriamente la barra a FORMATO COMPLETO
    if (typeof window.resetearBarraMenuPrincipal === "function") {
        window.resetearBarraMenuPrincipal();
    } else {
        const headerEl = document.querySelector("header");
        const menuEl   = document.getElementById("menuPrincipal");
        const placeholder = document.getElementById("placeholderMenuPrincipal");
        if (headerEl) headerEl.classList.remove("headerCompacto");
        if (menuEl) {
            menuEl.classList.remove("menuFlotante");
            menuEl.style.top = "";
        }
        if (placeholder) placeholder.style.height = "0px";
    }

    // Reevaluar estado según la jerarquía de prioridades tras abrir
    if (typeof window.actualizarEstadoBarraMenu === "function") {
        window.actualizarEstadoBarraMenu();
    }
}

function toggleTemporizadorReto() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggleReto = document.getElementById("toggleTemporizadorRetoBtn");
    const btnToggleRuleta = document.getElementById("toggleTemporizadorRuletaBtn");

    if (!ventanaTemp) return;

    const estaAbierto = (ventanaTemp.style.display === "block" || ventanaTemp.style.display === "flex") && app && app.classList.contains("modo-paralelo");

    if (!estaAbierto) {
        if (typeof window.sincronizarTemporizadorConReto === "function") {
            window.sincronizarTemporizadorConReto();
        }
        ventanaTemp.style.display = "flex";
        if (app) app.classList.add("modo-paralelo");
        if (btnToggleReto) btnToggleReto.innerHTML = "⏱️ Cerrar temporizador";
        if (btnToggleRuleta) btnToggleRuleta.innerHTML = "⏱️ Cerrar temporizador";

        if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_ACCION", {
                accion: "TEMPORIZADOR_ACOPLADO_STATE",
                payload: { acopladoAbierto: true }
            });
        }
    } else {
        cerrarTemporizadorAcoplado();
    }
}

function cerrarTemporizadorAcoplado() {
    const ventanaTemp = document.getElementById("ventanaTemporizador");
    const app = document.getElementById("app");
    const btnToggleReto = document.getElementById("toggleTemporizadorRetoBtn");
    const btnToggleRuleta = document.getElementById("toggleTemporizadorRuletaBtn");

    if (ventanaTemp) ventanaTemp.style.display = "none";
    if (app) app.classList.remove("modo-paralelo");
    if (btnToggleReto) btnToggleReto.innerHTML = "⏱️ Abrir temporizador";
    if (btnToggleRuleta) btnToggleRuleta.innerHTML = "⏱️ Abrir temporizador";

    if (typeof window.pausarTemporizadorPorNavegacion === "function") {
        window.pausarTemporizadorPorNavegacion();
    }

    if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "TEMPORIZADOR_ACOPLADO_STATE",
            payload: { acopladoAbierto: false }
        });
    }
}

function cerrarVentana(id) {
    const ventana = document.getElementById(id);

    if (ventana) {
        if (id === "ventanaFichaSolar") {
            window.solarFichaActual = null;
        }
        if (id === "ventanaTemporizador" && document.getElementById("app")?.classList.contains("modo-paralelo")) {
            cerrarTemporizadorAcoplado();
        } else {
            ventana.style.display = "none";
        }
        gestionarPausaNavegacionTemporizadores();
        comprobarVentanaVisible();
        if (typeof window.emitirEventoOBS === "function") {
            window.emitirEventoOBS("SYNC_CERRAR_VENTANA", { idVentana: id });
        }
    }
}

function comprobarVentanaVisible() {
    if (window.modoNavegacionActual === "experimental") return;

    const hayAlgunaVisible = Array.from(document.querySelectorAll(".ventana"))
        .some(v => (v.style.display === "block" || v.style.display === "flex") && v.id !== "ventanaAcercaDe");

    if (!hayAlgunaVisible) {
        abrirVentana("ventanaAcercaDe", true);
    }
}

// Exponer funciones globales explícitamente en window por seguridad
window.abrirVentana = abrirVentana;
window.cerrarVentana = cerrarVentana;
window.procesarRutaURL = procesarRutaURL;
window.mostrarError404 = mostrarError404;
window.toggleTemporizadorReto = toggleTemporizadorReto;
window.cerrarTemporizadorAcoplado = cerrarTemporizadorAcoplado;
window.comprobarVentanaVisible = comprobarVentanaVisible;

// ─── DESPACHADOR DE ACCIONES REALES DE HERRAMIENTAS ──────────────────
function ejecutarAccionHerramienta(idHerramienta) {
    switch (idHerramienta) {
        case "acerca-de":
            abrirVentana("ventanaAcercaDe", true);
            break;
        case "buscador":
        case "buscador-solares":
            abrirVentana("ventanaBuscador", true);
            break;
        case "listado":
        case "listado-solares":
            abrirVentana("ventanaListado", true);
            break;
        case "dados":
            abrirVentana("ventanaDados", true);
            break;
        case "ruleta-colores":
            abrirVentana("ventanaRuletaColor", true);
            break;
        case "habilidades-azar":
            window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
            abrirVentana("ventanaRetos", true);
            break;
        case "packs-azar":
            window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
            abrirVentana("ventanaRetos", true);
            break;
        case "mundos-azar":
            window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
            abrirVentana("ventanaRetos", true);
            break;
        case "modo-retos":
            window.proximaVentanaTrasPacks = "ventanaRetosOpciones";
            abrirVentana("ventanaRetos", true);
            break;
        case "ruleta-desastres":
            window.proximaVentanaTrasPacks = "ventanaRuletaDesastres";
            abrirVentana("ventanaRetos", true);
            break;
        case "temporizador":
            abrirVentana("ventanaTemporizador", true);
            break;
        case "trucos":
            abrirVentana("ventanaTrucos", true);
            break;
        case "estadisticas":
            abrirVentana("ventanaEstadisticas", true);
            if (typeof abrirEstadisticas === "function") {
                abrirEstadisticas();
            }
            break;
        case "tier-list":
            abrirVentana("ventanaTierList", true);
            if (typeof window.inicializarTierList === "function") {
                window.inicializarTierList();
            }
            break;
        default: {
            let item = window.ITEMS_ESTRUCTURA_SITIO?.find(it => it.id === idHerramienta || it.ruta === idHerramienta);
            if (!item && idHerramienta && idHerramienta.includes("/")) {
                const partes = idHerramienta.split("/");
                const last = partes[partes.length - 1];
                item = window.ITEMS_ESTRUCTURA_SITIO?.find(it => it.id === last || it.ruta === idHerramienta);
            }
            if (item && typeof abrirPaginaEditable === "function") {
                // Bloquear acceso público a páginas que no están publicadas.
                const estadoItem = item.estado || "";
                const esPublicadaItem = (estadoItem === "publicado" || estadoItem === "publicada");
                if (!esPublicadaItem) {
                    mostrarError404(idHerramienta);
                    return;
                }
                abrirPaginaEditable(item, true);
                return;
            }
            if (MAPA_RUTAS[idHerramienta]) {
                const targetVentana = MAPA_RUTAS[idHerramienta];
                abrirVentana(targetVentana, true);
                return;
            }
            console.warn("Herramienta no implementada o desconocida:", idHerramienta);
        }
    }
}
window.ejecutarAccionHerramienta = ejecutarAccionHerramienta;

// ─── ESTADO Y CONTROLADOR DE NAVEGACIÓN (CLÁSICA Y EXPERIMENTAL) ──────
// El parámetro ?nav= de la URL tiene prioridad sobre localStorage
// (permite que una URL compartida restaure el modo correcto).
{
    const _modoURL = leerModoDesdeURL();
    const _modoGuardado = localStorage.getItem("lotlab_nav_mode") || "clasica";
    window.modoNavegacionActual = _modoURL !== null ? _modoURL : _modoGuardado;
}

const EstadoExperimental = {
    nivel: 1, // 1: Círculos | 2: Categoría | 3: Herramienta abierta
    categoriaId: null,
    herramientaId: null
};
window.EstadoExperimental = EstadoExperimental;

function obtenerRegistro() {
    return Array.isArray(window.REGISTRO_NAVEGACION) ? window.REGISTRO_NAVEGACION : [];
}

// ─── GESTIÓN DE CATEGORÍA ACTIVA EN NAVEGACIÓN CLÁSICA ─────────────────
let categoriaClasicaActiva = "inicio";

const MAPA_VENTANA_A_TOOL = {
    "ventanaAcercaDe": "acerca-de",
    "ventanaBuscador": "buscador",
    "ventanaResultados": "buscador",
    "ventanaListado": "listado",
    "ventanaFichaSolar": "buscador",
    "ventanaDados": "dados",
    "ventanaRuletaColor": "ruleta-colores",
    "ventanaHabilidadesGenerador": "habilidades-azar",
    "ventanaPacksGenerador": "packs-azar",
    "ventanaMundosGenerador": "mundos-azar",
    "ventanaRetos": "modo-retos",
    "ventanaRetosOpciones": "modo-retos",
    "ventanaRetoResultado": "modo-retos",
    "ventanaRuletaDesastres": "ruleta-desastres",
    "ventanaTemporizador": "temporizador",
    "ventanaTiempoAgotado": "temporizador",
    "ventanaTrucos": "trucos",
    "ventanaTrucosConstruir": "trucos",
    "ventanaTrucosCAS": "trucos",
    "ventanaTrucosVivir": "trucos",
    "ventanaTrucosPacks": "trucos",
    "ventanaTierList": "tier-list",
    "ventanaEstadisticas": "estadisticas"
};

function obtenerCategoriaPorVentana(idVentana) {
    if (!idVentana) return "inicio";

    const toolId = MAPA_VENTANA_A_TOOL[idVentana] || idVentana;
    const registro = obtenerRegistro();

    // 1. Buscar dinámicamente en el registro activo (fuente de verdad estructural del CMS)
    for (const cat of registro) {
        if (!cat || !Array.isArray(cat.herramientas)) continue;
        if (cat.herramientas.some(h => h.id === toolId || h.id === idVentana || (toolId === "buscador" && (h.id === "buscador-solares" || h.id === "listado-solares")))) {
            return cat.id;
        }
    }

    // 2. Comportamiento especial de generadores dentro de retos
    if (window.proximaVentanaTrasPacks && (
        window.proximaVentanaTrasPacks === "ventanaHabilidadesGenerador" ||
        window.proximaVentanaTrasPacks === "ventanaPacksGenerador" ||
        window.proximaVentanaTrasPacks === "ventanaMundosGenerador"
    )) {
        return "generadores";
    }

    // 3. Páginas dinámicas del CMS
    if (idVentana && idVentana.startsWith("ventana_pag_")) {
        const pageId = idVentana.replace("ventana_pag_", "");
        const it = window.ITEMS_ESTRUCTURA_SITIO?.find(i => i.id === pageId);
        if (it) {
            let pId = it.padreId;
            let hops = 0;
            while (pId && hops < 10) {
                const parentNode = window.ITEMS_ESTRUCTURA_SITIO?.find(i => i.id === pId);
                if (!parentNode || !parentNode.padreId) return pId;
                pId = parentNode.padreId;
                hops++;
            }
            if (pId) return pId;
        }
    }

    // 4. Fallback estático
    switch (idVentana) {
        case "ventanaAcercaDe": return "inicio";
        case "ventanaBuscador":
        case "ventanaResultados":
        case "ventanaListado":
        case "ventanaFichaSolar": return "solares";
        case "ventanaDados":
        case "ventanaRuletaColor":
        case "ventanaHabilidadesGenerador":
        case "ventanaPacksGenerador":
        case "ventanaMundosGenerador": return "generadores";
        case "ventanaRetos":
        case "ventanaRetosOpciones":
        case "ventanaRetoResultado":
        case "ventanaRuletaDesastres": return "retos";
        case "ventanaTemporizador":
        case "ventanaTiempoAgotado":
        case "ventanaTrucos":
        case "ventanaTrucosConstruir":
        case "ventanaTrucosCAS":
        case "ventanaTrucosVivir":
        case "ventanaTrucosPacks":
        case "ventanaTierList": return "herramientas";
        case "ventanaEstadisticas": return "datos";
        default: return "inicio";
    }
}
window.obtenerCategoriaPorVentana = obtenerCategoriaPorVentana;

// ─── GESTIÓN DINÁMICA DE PÁGINAS EDITABLES CMS ───────────────────────
const VENTANAS_HARDCODED = new Set([
    "ventanaAcercaDe", "ventanaBuscador", "ventanaResultados", "ventanaFichaSolar",
    "ventanaListado", "ventanaRetos", "ventanaRetosOpciones", "ventanaRetoResultado",
    "ventanaRuletaDesastres", "ventanaTemporizador", "ventanaRuletaColor",
    "ventanaDados", "ventanaTrucos", "ventanaTrucosConstruir", "ventanaTrucosCAS",
    "ventanaTrucosVivir", "ventanaTrucosPacks", "ventanaEstadisticas",
    "ventanaHabilidadesGenerador", "ventanaPacksGenerador", "ventanaMundosGenerador",
    "ventanaTierList", "ventana404"
]);

function escHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function asegurarVentanaPaginaEditable(item) {
    if (!item || !item.id) return null;
    const idVentana = "ventana_pag_" + item.id;
    let ventanaEl = document.getElementById(idVentana);
    if (!ventanaEl) {
        ventanaEl = document.createElement("div");
        ventanaEl.id = idVentana;
        ventanaEl.className = "ventana ventana-pagina-editable";
        ventanaEl.style.display = "none";

        const iconoHtml = item.icono ? `<span style="margin-right:8px;">${escHtml(item.icono)}</span>` : "";
        const tituloHtml = escHtml(item.nombre || "Página");

        ventanaEl.innerHTML = `
            <div class="cabeceraVentana">
                <button class="cerrar" type="button" aria-label="Cerrar">✕</button>
                <h2 id="h2_${idVentana}">${iconoHtml}${tituloHtml}</h2>
            </div>
            <div class="cuerpoVentana contenidoPaginaEditable" id="contenido_${idVentana}" style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                <div class="cargando-pagina-cms" style="padding:40px;text-align:center;color:var(--texto-secundario, #aaa);">
                    Cargando contenido...
                </div>
            </div>
        `;

        ventanaEl.querySelector(".cerrar").addEventListener("click", function () {
            cerrarVentana(idVentana);
            sincronizarCierreVentanaExperimental(idVentana);
        });

        const appSec = document.getElementById("app");
        if (appSec) {
            appSec.appendChild(ventanaEl);
        } else {
            document.body.appendChild(ventanaEl);
        }
    }
    return idVentana;
}
window.asegurarVentanaPaginaEditable = asegurarVentanaPaginaEditable;

function cargarContenidoPaginaEditable(item, idVentana) {
    if (!item || !idVentana) return;
    const contEl = document.getElementById("contenido_" + idVentana);
    const h2El = document.getElementById("h2_" + idVentana);
    if (!contEl) return;

    const archivo = item.archivo || (item.id + ".json");
    const rutaArchivo = archivo.startsWith("data/content/") ? archivo : ("data/content/" + archivo);

    contEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--texto-secundario, #aaa);">Cargando contenido...</div>';

    fetch(rutaArchivo + "?t=" + Date.now())
        .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(data => {
            const bloques = Array.isArray(data.bloques) ? data.bloques : [];

            // 1. Cabecera / Título H2
            let primerTitulo = null;
            for (let i = 0; i < bloques.length; i++) {
                if (bloques[i].tipo === "titulo" && (bloques[i].nivel || 2) <= 2) {
                    primerTitulo = bloques[i];
                    break;
                }
            }

            if (h2El) {
                const icono = item.icono ? (item.icono + " ") : "";
                if (primerTitulo && primerTitulo.contenido) {
                    const rawTit = primerTitulo.contenido;
                    const tmpD = document.createElement("div");
                    tmpD.innerHTML = rawTit;
                    h2El.textContent = icono + (tmpD.innerText || tmpD.textContent || rawTit);
                } else {
                    h2El.textContent = icono + (data.titulo || item.nombre || "Página");
                }
            }

            // 2. Bloques del cuerpo (excluyendo el primer título si fue a la cabecera)
            const bloquesCuerpo = bloques.filter(b => !(b.tipo === "titulo" && (b.nivel || 2) <= 2));

            if (bloquesCuerpo.length === 0) {
                contEl.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--texto-secundario,#888);font-style:italic;">Esta página aún no contiene bloques de contenido publicados.</div>';
            } else if (window.AcercaDeCMS && typeof window.AcercaDeCMS.renderizarBloques === "function") {
                if (typeof window.AcercaDeCMS.inyectarEstilosCMS === "function") {
                    window.AcercaDeCMS.inyectarEstilosCMS();
                }
                contEl.innerHTML = window.AcercaDeCMS.renderizarBloques(bloquesCuerpo);
                if (typeof window.AcercaDeCMS.inicializarGaleriasCMS === "function") {
                    window.AcercaDeCMS.inicializarGaleriasCMS(contEl);
                }
            } else if (typeof window.renderizarBloquesCMS === "function") {
                contEl.innerHTML = window.renderizarBloquesCMS(bloquesCuerpo);
                if (typeof window.inicializarGaleriasCMS === "function") {
                    window.inicializarGaleriasCMS(contEl);
                }
            } else {
                contEl.innerHTML = bloquesCuerpo.map(b => `<p style="margin-bottom:12px;">${escHtml(b.contenido || "")}</p>`).join("");
            }

            contEl.dataset.archivoCargado = rutaArchivo;
            contEl.dataset.cargadoOk = "true";
        })
        .catch(err => {
            console.error("Error al cargar contenido de la página:", rutaArchivo, err);
            contEl.innerHTML = `
                <div style="padding:40px 20px;text-align:center;color:var(--texto-secundario,#888);">
                    <div style="font-size:2.4rem;margin-bottom:12px;">📄</div>
                    <p style="font-weight:700;font-size:1.15rem;margin-bottom:8px;color:var(--texto-principal,#fff);">Página en construcción</p>
                    <p style="font-size:0.95rem;opacity:0.85;">No se encontró el archivo de contenido de esta página o aún no ha sido publicado.</p>
                </div>
            `;
            contEl.dataset.cargadoOk = "error";
        });
}
window.cargarContenidoPaginaEditable = cargarContenidoPaginaEditable;

function abrirPaginaEditable(item, esClickUsuario = true) {
    if (!item) return;
    const idVentana = asegurarVentanaPaginaEditable(item);
    if (!idVentana) return;

    cargarContenidoPaginaEditable(item, idVentana);
    abrirVentana(idVentana, esClickUsuario);
}
window.abrirPaginaEditable = abrirPaginaEditable;

function registrarPaginasEditables(items) {
    if (!Array.isArray(items)) return;
    items.forEach(it => {
        if (it.tipo === "pagina") {
            const targetActual = MAPA_RUTAS[it.id];
            // Si ya apunta a una ventana hardcoded del núcleo, respetarla
            if (targetActual && VENTANAS_HARDCODED.has(targetActual)) {
                return;
            }

            const idVentana = asegurarVentanaPaginaEditable(it);
            MAPA_RUTAS[it.id] = idVentana;
            if (it.ruta) {
                MAPA_RUTAS[it.ruta] = idVentana;
                const partes = it.ruta.split("/");
                const ultimo = partes[partes.length - 1];
                if (ultimo) MAPA_RUTAS[ultimo] = idVentana;
            }
            VENTANA_A_SLUG[idVentana] = it.ruta || it.id;
        }
    });
}
window.registrarPaginasEditables = registrarPaginasEditables;

function sincronizarEstructuraDesdeJSON() {
    fetch("data/content/site-structure.json")
        .then(r => r.ok ? r.json() : null)
        .then(items => {
            if (!Array.isArray(items) || items.length === 0) return;
            window.ITEMS_ESTRUCTURA_SITIO = items;
            registrarPaginasEditables(items);

            const raices = items
                .filter(it => !it.padreId && it.tipo === "seccion" && it.estado !== "oculta" && it.estado !== "oculto")
                .sort((a, b) => (a.orden || 0) - (b.orden || 0));

            const registro = raices.map(raiz => {
                const hijos = items
                    .filter(it => it.padreId === raiz.id && it.estado !== "oculta" && it.estado !== "oculto")
                    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

                const herramientas = hijos.map(h => {
                    let toolId = h.id;
                    if (toolId === "buscador-solares") toolId = "buscador";
                    if (toolId === "listado-solares") toolId = "listado";

                    const esBorrador = (h.estado === "borrador");
                    const esDisponible = !esBorrador;

                    const obj = {
                        id: toolId,
                        nombre: h.nombre,
                        icono: h.icono || (h.tipo === "seccion" ? "📁" : "📄"),
                        disponible: esDisponible,
                        descripcion: h.descripcion || (h.tipo === "seccion" ? ("Sección " + h.nombre) : ("Herramienta " + h.nombre))
                    };
                    if (h.ruta) obj.ruta = h.ruta;
                    if (h.archivo) obj.archivo = h.archivo;
                    if (!esDisponible) {
                        obj.tooltip = "🏗️ Próximamente";
                    }
                    return obj;
                });

                return {
                    id: raiz.id,
                    nombre: raiz.nombre,
                    icono: raiz.icono || "📁",
                    herramientas: herramientas
                };
            });

            window.REGISTRO_NAVEGACION = registro;
            renderizarNavegacionClasica();
            renderizarNavegacionExperimental();
            const catActual = obtenerCategoriaPorVentana(window.ventanaActual);
            actualizarCategoriaClasicaActiva(catActual);

            // Si hay un hash activo en la URL, re-procesar la ruta ahora que
            // ITEMS_ESTRUCTURA_SITIO ya está poblado. Cubre dos casos:
            // A) Página editable cuyo MAPA_RUTAS se acaba de registrar.
            // B) Cualquier slug que no pudo resolverse al inicio porque la
            //    estructura aún no había cargado (la ventana actual sería la
            //    de inicio o la 404, no la página real del hash).
            const currentHash = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (currentHash) {
                const ventanaInicioOError = (window.ventanaActual === "ventanaAcercaDe" || window.ventanaActual === "ventana404");
                const esPaginaEditable = MAPA_RUTAS[currentHash] && MAPA_RUTAS[currentHash].startsWith("ventana_pag_");
                const esItemEditable = !!window.ITEMS_ESTRUCTURA_SITIO?.find(it => (it.ruta === currentHash || it.id === currentHash));
                if (ventanaInicioOError || esPaginaEditable || esItemEditable) {
                    procesarRutaURL();
                }
            }
        })
        .catch(() => {});
}
window.sincronizarEstructuraDesdeJSON = sincronizarEstructuraDesdeJSON;

function actualizarCategoriaClasicaActiva(catId) {
    if (catId) {
        categoriaClasicaActiva = catId;
    } else if (window.ventanaActual) {
        categoriaClasicaActiva = obtenerCategoriaPorVentana(window.ventanaActual);
    }
    document.querySelectorAll(".btn-categoria-nav").forEach(b => {
        b.classList.toggle("activa", b.dataset.catId === categoriaClasicaActiva);
    });
}
window.actualizarCategoriaClasicaActiva = actualizarCategoriaClasicaActiva;

function cambiarModoNavegacion(nuevoModo, actualizarURL = true) {
    window.modoNavegacionActual = nuevoModo;
    try {
        localStorage.setItem("lotlab_nav_mode", nuevoModo);
    } catch (e) {}

    // Sincronizar el parámetro ?nav= en la URL (solo cambia ?nav=, NO el hash)
    if (actualizarURL) {
        actualizarParamNavURL(nuevoModo);
    }

    document.body.classList.toggle("modo-nav-experimental", nuevoModo === "experimental");
    actualizarSelectorModoNavUI();

    const barraClasica = document.getElementById("barraNavegacionClasica");
    const launcherExp  = document.getElementById("launcherExperimental");
    const menuPrincipal = document.getElementById("menuPrincipal");

    // Detectar si hay una ventana/herramienta actualmente visible.
    // Determina si el usuario está en una herramienta (nivel 3) o en el launcher/inicio.
    const hayVentanaVisible = Array.from(document.querySelectorAll(".ventana"))
        .some(v => v.style.display === "block" || v.style.display === "flex");

    if (nuevoModo === "clasica") {
        // ── Cambio a Clásico ────────────────────────────────────────────
        document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());
        if (menuPrincipal) menuPrincipal.style.display = "block";
        if (barraClasica) barraClasica.style.display = "block";
        if (launcherExp)  launcherExp.style.display  = "none";
        cerrarDropdownClasica();
        actualizarCategoriaClasicaActiva();

        if (hayVentanaVisible) {
            // Hay herramienta abierta: conservarla tal cual, solo cambiar el chrome de navegación.
            // No llamar a comprobarVentanaVisible() ni a ningún abrirVentana.
        } else if (_urlInicialProcesada) {
            // No hay herramienta (venía del launcher Experimental): mostrar inicio.
            comprobarVentanaVisible();
        }

        if (typeof inicializarCarruselMovilClasica === "function") {
            inicializarCarruselMovilClasica();
        }
    } else {
        // ── Cambio a Experimental ────────────────────────────────────────
        if (typeof detenerCarruselMovilClasica === "function") {
            detenerCarruselMovilClasica();
        }
        if (barraClasica) barraClasica.style.display = "none";
        if (launcherExp)  launcherExp.style.display  = "block";
        document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());

        if (hayVentanaVisible) {
            // Hay herramienta abierta: entrar directamente en Experimental nivel 3.
            // La ventana sigue visible; solo ocultamos el chrome de Classic y los paneles del launcher.
            if (menuPrincipal) menuPrincipal.style.display = "none";
            EstadoExperimental.nivel = 3;
            EstadoExperimental.categoriaId = obtenerCategoriaPorVentana(window.ventanaActual);
            EstadoExperimental.herramientaId = null;
            // renderizarNavegacionExperimental en nivel 3 solo oculta los paneles (n1, n2, n3)
            renderizarNavegacionExperimental();
        } else {
            // No hay herramienta: mostrar launcher Experimental desde cero.
            if (menuPrincipal) menuPrincipal.style.display = "block";
            document.querySelectorAll(".ventana").forEach(v => { v.style.display = "none"; });
            EstadoExperimental.nivel = 1;
            EstadoExperimental.categoriaId = null;
            EstadoExperimental.herramientaId = null;
            renderizarNavegacionExperimental();
        }
    }

    if (typeof window.resetearBarraMenuPrincipal === "function") {
        window.resetearBarraMenuPrincipal();
    }
}
window.cambiarModoNavegacion = cambiarModoNavegacion;

function actualizarSelectorModoNavUI() {
    const modo = window.modoNavegacionActual;
    const opcionClasica = document.getElementById("opcionModoClasica");
    const opcionExp = document.getElementById("opcionModoExperimental");

    if (opcionClasica) {
        opcionClasica.classList.toggle("activa", modo === "clasica");
    }
    if (opcionExp) {
        opcionExp.classList.toggle("activa", modo === "experimental");
    }
}

// ─── NAVEGACIÓN CLÁSICA: RENDERIZADO Y DROPDOWNS ──────────────────────
let categoriaClasicaAbierta = null;

function renderizarNavegacionClasica() {
    const contenedor = document.getElementById("categoriasNavClasica");
    if (!contenedor) return;

    const registro = obtenerRegistro();
    contenedor.innerHTML = "";

    // 1. Botones originales (8 categorías principales)
    registro.forEach(cat => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-categoria-nav";
        btn.dataset.catId = cat.id;
        btn.innerHTML = `<span class="icono-cat-nav">${cat.icono}</span><span class="nombre-cat-nav">${cat.nombre}</span>`;

        btn.addEventListener("mouseenter", () => {
            if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("hover");
        });

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            alternarDropdownClasica(cat.id, btn);
        });

        contenedor.appendChild(btn);
    });

    // 2. Clones para conseguir bucle continuo e infinito exclusivo en móvil
    registro.forEach(cat => {
        const clone = document.createElement("button");
        clone.type = "button";
        clone.className = "btn-categoria-nav cat-nav-clon";
        clone.dataset.catId = cat.id;
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        clone.innerHTML = `<span class="icono-cat-nav">${cat.icono}</span><span class="nombre-cat-nav">${cat.nombre}</span>`;

        clone.addEventListener("mouseenter", () => {
            if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("hover");
        });

        clone.addEventListener("click", (e) => {
            e.stopPropagation();
            alternarDropdownClasica(cat.id, clone);
        });

        contenedor.appendChild(clone);
    });

    actualizarCategoriaClasicaActiva();
    inicializarCarruselMovilClasica();
}

function alternarDropdownClasica(catId, btnEl) {
    const dropdown = document.getElementById("dropdownNavClasica");
    const contenido = document.getElementById("dropdownNavContenido");
    if (!dropdown || !contenido) return;

    // Pausar carrusel mientras se interactúa con el menú
    pausarCarruselMovilClasica();

    // Si es Inicio, abre directamente Acerca de y marca Inicio como activa
    if (catId === "inicio") {
        cerrarDropdownClasica();
        actualizarCategoriaClasicaActiva("inicio");
        if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("click");
        ejecutarAccionHerramienta("acerca-de");
        return;
    }

    if (categoriaClasicaAbierta === catId && dropdown.style.display !== "none") {
        cerrarDropdownClasica();
        return;
    }

    categoriaClasicaAbierta = catId;
    const registro = obtenerRegistro();
    const cat = registro.find(c => c.id === catId);
    if (!cat) return;

    // Destacar únicamente la categoría seleccionada en verde (siempre única categoría activa)
    actualizarCategoriaClasicaActiva(catId);

    // Renderizar herramientas dentro del dropdown
    let html = `<div class="dropdown-header-categoria"><span>${cat.icono} ${cat.nombre}</span></div><div class="dropdown-herramientas-lista">`;

    cat.herramientas.forEach(tool => {
        const deshab = !tool.disponible;
        const tooltipAttr = tool.tooltip ? `data-tooltip="${tool.tooltip}"` : "";
        html += `
            <button type="button" class="btn-dropdown-tool ${deshab ? "deshabilitado" : ""}" data-tool-id="${tool.id}" ${tooltipAttr}>
                <span class="dropdown-tool-icono">${tool.icono}</span>
                <div class="dropdown-tool-texto">
                    <span class="dropdown-tool-nombre">${tool.nombre}</span>
                    ${tool.descripcion ? `<span class="dropdown-tool-desc">${tool.descripcion}</span>` : ""}
                </div>
            </button>
        `;
    });

    html += `</div>`;
    contenido.innerHTML = html;

    // Escuchadores para cada herramienta
    contenido.querySelectorAll(".btn-dropdown-tool").forEach(toolBtn => {
        toolBtn.addEventListener("mouseenter", () => {
            const toolId = toolBtn.dataset.toolId;
            const tool = cat.herramientas.find(t => t.id === toolId);
            if (tool && tool.disponible && typeof reproducirSonidoUI === "function") {
                reproducirSonidoUI("hover");
            }
        });

        toolBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const toolId = toolBtn.dataset.toolId;
            const tool = cat.herramientas.find(t => t.id === toolId);
            if (!tool || !tool.disponible) return;

            if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("click");
            actualizarCategoriaClasicaActiva(catId);
            cerrarDropdownClasica();
            ejecutarAccionHerramienta(tool.id);
        });
    });

    dropdown.style.display = "block";
    if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("apertura");
}

function cerrarDropdownClasica() {
    categoriaClasicaAbierta = null;
    const dropdown = document.getElementById("dropdownNavClasica");
    if (dropdown) dropdown.style.display = "none";
    // Mantiene la categoría de la sección activa actual según la ventana visible
    const catActual = obtenerCategoriaPorVentana(window.ventanaActual);
    actualizarCategoriaClasicaActiva(catActual);
    reanudarCarruselMovilClasica(2000);
}

// ─── CARRUSEL AUTOMÁTICO E INFINITO — MÓVIL Y CLÁSICA ─────────────────
let carruselMovilAnimId = null;
let carruselMovilPausado = false;
let carruselMovilTimeoutReanudar = null;
let carruselMovilEventosIniciados = false;

function esDispositivoMovilParaCarrusel() {
    return window.innerWidth <= 768;
}

function inicializarCarruselMovilClasica() {
    const contenedor = document.getElementById("categoriasNavClasica");
    if (!contenedor) return;

    detenerCarruselMovilClasica();

    // Solo móvil, solo clásica, y respetando prefers-reduced-motion
    if (!esDispositivoMovilParaCarrusel()) {
        contenedor.scrollLeft = 0;
        return;
    }
    if (window.modoNavegacionActual !== "clasica") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    iniciarLoopCarruselMovil();

    if (!carruselMovilEventosIniciados) {
        carruselMovilEventosIniciados = true;

        const pausar = () => {
            carruselMovilPausado = true;
            if (carruselMovilTimeoutReanudar) {
                clearTimeout(carruselMovilTimeoutReanudar);
                carruselMovilTimeoutReanudar = null;
            }
        };

        const programarReanudacion = () => {
            if (carruselMovilTimeoutReanudar) clearTimeout(carruselMovilTimeoutReanudar);
            carruselMovilTimeoutReanudar = setTimeout(() => {
                const dropdown = document.getElementById("dropdownNavClasica");
                if (dropdown && dropdown.style.display !== "none") return;
                carruselMovilPausado = false;
            }, 2500);
        };

        contenedor.addEventListener("touchstart", pausar, { passive: true });
        contenedor.addEventListener("touchmove", pausar, { passive: true });
        contenedor.addEventListener("touchend", programarReanudacion, { passive: true });
        contenedor.addEventListener("touchcancel", programarReanudacion, { passive: true });
        contenedor.addEventListener("pointerdown", pausar, { passive: true });

        // Scroll manual con swipe continuo infinito
        contenedor.addEventListener("scroll", () => {
            const primerClon = contenedor.querySelector(".cat-nav-clon");
            if (primerClon) {
                const loopWidth = primerClon.offsetLeft;
                if (loopWidth > 0) {
                    if (contenedor.scrollLeft >= loopWidth * 1.8) {
                        contenedor.scrollLeft -= loopWidth;
                    } else if (contenedor.scrollLeft <= 0) {
                        contenedor.scrollLeft += loopWidth;
                    }
                }
            }
            if (carruselMovilPausado) {
                programarReanudacion();
            }
        }, { passive: true });

        // Listener de redimensión
        window.addEventListener("resize", () => {
            if (!esDispositivoMovilParaCarrusel() || window.modoNavegacionActual !== "clasica") {
                detenerCarruselMovilClasica();
                contenedor.scrollLeft = 0;
            } else if (!carruselMovilAnimId && (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
                iniciarLoopCarruselMovil();
            }
        }, { passive: true });

        // Listener de accesibilidad reducida
        try {
            if (window.matchMedia) {
                window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
                    if (e.matches) {
                        detenerCarruselMovilClasica();
                    } else if (esDispositivoMovilParaCarrusel() && window.modoNavegacionActual === "clasica") {
                        iniciarLoopCarruselMovil();
                    }
                });
            }
        } catch (_) {}
    }
}

function iniciarLoopCarruselMovil() {
    const contenedor = document.getElementById("categoriasNavClasica");
    if (!contenedor) return;

    if (carruselMovilAnimId) cancelAnimationFrame(carruselMovilAnimId);
    carruselMovilPausado = false;

    // Velocidad de avance continuo: lenta y suave (~0.35px por frame ≈ 21px/s)
    const VELOCIDAD = 0.35;
    let acumulador = 0;

    function paso() {
        if (!esDispositivoMovilParaCarrusel() || window.modoNavegacionActual !== "clasica") {
            detenerCarruselMovilClasica();
            return;
        }

        if (!carruselMovilPausado) {
            const primerClon = contenedor.querySelector(".cat-nav-clon");
            if (primerClon) {
                const loopWidth = primerClon.offsetLeft;
                if (loopWidth > 0) {
                    acumulador += VELOCIDAD;
                    if (acumulador >= 1) {
                        const px = Math.floor(acumulador);
                        acumulador -= px;
                        contenedor.scrollLeft += px;

                        // Salto imperceptible al inicio al alcanzar el set de clones
                        if (contenedor.scrollLeft >= loopWidth) {
                            contenedor.scrollLeft -= loopWidth;
                        }
                    }
                }
            }
        }

        carruselMovilAnimId = requestAnimationFrame(paso);
    }

    carruselMovilAnimId = requestAnimationFrame(paso);
}

function pausarCarruselMovilClasica() {
    carruselMovilPausado = true;
    if (carruselMovilTimeoutReanudar) {
        clearTimeout(carruselMovilTimeoutReanudar);
        carruselMovilTimeoutReanudar = null;
    }
}

function reanudarCarruselMovilClasica(demoraMs = 2500) {
    if (carruselMovilTimeoutReanudar) clearTimeout(carruselMovilTimeoutReanudar);
    carruselMovilTimeoutReanudar = setTimeout(() => {
        const dropdown = document.getElementById("dropdownNavClasica");
        if (dropdown && dropdown.style.display !== "none") return;
        carruselMovilPausado = false;
    }, demoraMs);
}

function detenerCarruselMovilClasica() {
    if (carruselMovilAnimId) {
        cancelAnimationFrame(carruselMovilAnimId);
        carruselMovilAnimId = null;
    }
    if (carruselMovilTimeoutReanudar) {
        clearTimeout(carruselMovilTimeoutReanudar);
        carruselMovilTimeoutReanudar = null;
    }
    carruselMovilPausado = false;
}
window.detenerCarruselMovilClasica = detenerCarruselMovilClasica;
window.inicializarCarruselMovilClasica = inicializarCarruselMovilClasica;

// ─── NAVEGACIÓN EXPERIMENTAL: 2 FILAS × 4 BOTONES Y BOTÓN VOLVER ──────
function renderizarNavegacionExperimental() {
    const launcher = document.getElementById("launcherExperimental");
    if (!launcher) return;

    const n1 = document.getElementById("expNivel1");
    const n2 = document.getElementById("expNivel2");
    const n3 = document.getElementById("expNivel3");
    const registro = obtenerRegistro();

    if (EstadoExperimental.nivel === 1) {
        if (n1) n1.style.display = "block";
        if (n2) n2.style.display = "none";
        if (n3) n3.style.display = "none";

        // Solo ocultar ventanas y actualizar URL del launcher si el modo experimental está activo.
        // En modo clásico, el launcher experimental no interfiere con las ventanas ya abiertas
        // ni con la URL (p.ej. las abiertas por procesarRutaURL durante la carga inicial).
        if (window.modoNavegacionActual === "experimental") {
            document.querySelectorAll(".ventana").forEach(v => { v.style.display = "none"; });

            // URL del launcher: ?nav=exp (sin hash)
            // Solo actualizar la URL durante la navegación del usuario, NO durante la
            // carga inicial (evita que se borre el hash original antes de que procesarRutaURL lo lea).
            if (_urlInicialProcesada) {
                try {
                    if (window.location.protocol !== "file:") {
                        const search = obtenerSearchConModo();
                        if (window.location.search !== search || window.location.hash) {
                            history.replaceState(null, "", search);
                        }
                    }
                } catch (_) {}
            }
        }
        document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());

        const grid = document.getElementById("expCirculosGrid");
        if (grid) {
            grid.innerHTML = "";
            registro.forEach(cat => {
                const card = document.createElement("button");
                card.type = "button";
                card.className = "exp-categoria-card";
                card.dataset.catId = cat.id;

                card.innerHTML = `
                    <span class="exp-cat-card-icono">${cat.icono}</span>
                    <span class="exp-cat-card-nombre">${cat.nombre}</span>
                `;

                card.addEventListener("mouseenter", () => {
                    if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("hover");
                });

                card.addEventListener("click", () => {
                    if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("click");
                    if (cat.id === "inicio") {
                        EstadoExperimental.categoriaId = "inicio";
                        EstadoExperimental.herramientaId = "acerca-de";
                        const menu = document.getElementById("menuPrincipal");
                        if (menu) menu.style.display = "none";
                        ejecutarAccionHerramienta("acerca-de");
                        return;
                    }
                    EstadoExperimental.nivel = 2;
                    EstadoExperimental.categoriaId = cat.id;
                    renderizarNavegacionExperimental();
                });

                grid.appendChild(card);
            });
        }
    } else if (EstadoExperimental.nivel === 2) {
        if (n1) n1.style.display = "none";
        if (n2) n2.style.display = "block";
        if (n3) n3.style.display = "none";

        // Pantalla limpia: ninguna ventana visible detrás de Nivel 2
        document.querySelectorAll(".ventana").forEach(v => { v.style.display = "none"; });
        document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());

        // URL de categoría: ?nav=exp#exp-cat/{catId}
        try {
            if (window.location.protocol !== "file:" && EstadoExperimental.categoriaId) {
                const search = obtenerSearchConModo();
                const hashCat = "#exp-cat/" + EstadoExperimental.categoriaId;
                if (window.location.search !== search || window.location.hash !== hashCat) {
                    history.replaceState(null, "", search + hashCat);
                }
            }
        } catch (_) {}

        const cat = registro.find(c => c.id === EstadoExperimental.categoriaId);
        const titulo = document.getElementById("expCategoriaTitulo");
        if (titulo && cat) {
            titulo.innerHTML = `<span>${cat.icono}</span> ${cat.nombre.toUpperCase()}`;
        }

        const grid = document.getElementById("expHerramientasGrid");
        if (grid && cat) {
            grid.innerHTML = "";
            cat.herramientas.forEach(tool => {
                const card = document.createElement("button");
                card.type = "button";
                card.className = `exp-herramienta-card ${!tool.disponible ? "deshabilitada" : ""}`;
                card.dataset.toolId = tool.id;
                if (!tool.disponible && tool.tooltip) {
                    card.setAttribute("data-tooltip", tool.tooltip);
                }

                card.innerHTML = `
                    <span class="exp-herramienta-icono">${tool.icono}</span>
                    <div class="exp-herramienta-info">
                        <span class="exp-herramienta-nombre">${tool.nombre}</span>
                        ${tool.descripcion ? `<span class="exp-herramienta-desc">${tool.descripcion}</span>` : ""}
                    </div>
                `;

                card.addEventListener("mouseenter", () => {
                    if (tool.disponible && typeof reproducirSonidoUI === "function") reproducirSonidoUI("hover");
                });

                card.addEventListener("click", () => {
                    if (!tool.disponible) return;
                    if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("click");
                    EstadoExperimental.nivel = 3;
                    EstadoExperimental.herramientaId = tool.id;

                    // Ocultar menú principal para que la ventana real sea la protagonista
                    const menu = document.getElementById("menuPrincipal");
                    if (menu) menu.style.display = "none";

                    ejecutarAccionHerramienta(tool.id);
                });

                grid.appendChild(card);
            });
        }
    } else if (EstadoExperimental.nivel === 3) {
        if (n1) n1.style.display = "none";
        if (n2) n2.style.display = "none";
        if (n3) n3.style.display = "none";
    }
}

function adjuntarBotonVolverExperimental(idVentana) {
    // Las ventanas conservan exactamente su cabecera nativa; se asegura que no queden botones residuales
    document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());
}
window.adjuntarBotonVolverExperimental = adjuntarBotonVolverExperimental;

function volverANivelExperimental() {
    document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());
    const menu = document.getElementById("menuPrincipal");
    const launcher = document.getElementById("launcherExperimental");
    if (menu) menu.style.display = "block";
    if (launcher) launcher.style.display = "block";

    // Si la categoría era 'inicio' o no hay categoría, regresar directamente al launcher Nivel 1
    if (EstadoExperimental.categoriaId === "inicio" || !EstadoExperimental.categoriaId) {
        EstadoExperimental.nivel = 1;
        EstadoExperimental.categoriaId = null;
    } else {
        EstadoExperimental.nivel = 2;
    }
    EstadoExperimental.herramientaId = null;
    renderizarNavegacionExperimental();
}
window.volverANivelExperimental = volverANivelExperimental;

function sincronizarCierreVentanaExperimental(idVentana) {
    if (window.modoNavegacionActual !== "experimental") return;
    volverANivelExperimental();
}
window.sincronizarCierreVentanaExperimental = sincronizarCierreVentanaExperimental;

// ─── INICIALIZACIÓN GENERAL DEL SISTEMA DE NAVEGACIÓN ─────────────────
function inicializarNuevoSistemaNavegacion() {
    renderizarNavegacionClasica();
    actualizarSelectorModoNavUI();

    // Selector de modo en el footer
    const btnSelector = document.getElementById("botonSelectorModoNav");
    const popoverModo = document.getElementById("popoverModoNav");
    const wrapperModo = document.getElementById("selectorModoNavWrapper");

    btnSelector?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!popoverModo) return;
        const abierto = popoverModo.classList.toggle("abierto");
        wrapperModo?.classList.toggle("popover-abierto", abierto);
        if (abierto) {
            document.getElementById("listaIdiomas")?.classList.remove("abierta");
            document.getElementById("popoverSonido")?.classList.remove("abierto");
            document.getElementById("controlSonidoWrapper")?.classList.remove("popover-abierto");
        }
    });

    document.querySelectorAll(".opcionModoNav").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const modo = btn.dataset.modo;
            if (modo) {
                cambiarModoNavegacion(modo);
                popoverModo?.classList.remove("abierto");
                wrapperModo?.classList.remove("popover-abierto");
            }
        });
    });

    // Cerrar popover de modo al pulsar fuera
    document.addEventListener("click", (e) => {
        if (popoverModo && !popoverModo.contains(e.target) && e.target !== btnSelector && !btnSelector?.contains(e.target)) {
            popoverModo.classList.remove("abierto");
            wrapperModo?.classList.remove("popover-abierto");
        }
    });

    // Cerrar dropdown clásica al hacer clic fuera
    document.addEventListener("click", (e) => {
        const barraClasica = document.getElementById("barraNavegacionClasica");
        if (barraClasica && !barraClasica.contains(e.target)) {
            cerrarDropdownClasica();
        }
    });

    // Botones volver de la navegación experimental
    document.getElementById("expBtnVolverInicio")?.addEventListener("click", () => {
        if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("volver");
        EstadoExperimental.nivel = 1;
        EstadoExperimental.categoriaId = null;
        EstadoExperimental.herramientaId = null;
        renderizarNavegacionExperimental();
    });

    document.getElementById("expBtnVolverCategoria")?.addEventListener("click", () => {
        if (typeof reproducirSonidoUI === "function") reproducirSonidoUI("volver");
        if (window.ventanaActual && typeof cerrarVentana === "function") {
            cerrarVentana(window.ventanaActual);
        }
        EstadoExperimental.nivel = 2;
        EstadoExperimental.herramientaId = null;
        renderizarNavegacionExperimental();
    });

    // Aplicar el modo guardado (ya leído desde URL o localStorage).
    // actualizarURL=false porque la URL ya tiene el param correcto o es una carga inicial.
    cambiarModoNavegacion(window.modoNavegacionActual, false);

    // Sincronizar dinámicamente con la estructura del CMS si está disponible
    sincronizarEstructuraDesdeJSON();
}

document.addEventListener("DOMContentLoaded", function () {
    inicializarNuevoSistemaNavegacion();

    // Botones de cerrar en ventanas
    document.querySelectorAll(".cerrar")
        .forEach(boton => {
            boton.addEventListener("click", function () {
                const ventana = this.closest(".ventana");
                if (ventana) {
                    if (ventana.id === "ventanaTemporizador" && document.getElementById("app")?.classList.contains("modo-paralelo")) {
                        cerrarTemporizadorAcoplado();
                        sincronizarCierreVentanaExperimental(ventana.id);
                        return;
                    }
                    if (ventana.id === "ventanaRetosOpciones") {
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaHabilidadesGenerador") {
                        window.proximaVentanaTrasPacks = "ventanaHabilidadesGenerador";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaPacksGenerador") {
                        window.proximaVentanaTrasPacks = "ventanaPacksGenerador";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaMundosGenerador") {
                        window.proximaVentanaTrasPacks = "ventanaMundosGenerador";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaRetoResultado") {
                        cerrarTemporizadorAcoplado();
                        abrirVentana("ventanaRetosOpciones", true);
                        return;
                    }
                    if (ventana.id === "ventanaRuletaDesastres") {
                        window.proximaVentanaTrasPacks = "ventanaRuletaDesastres";
                        abrirVentana("ventanaRetos", true);
                        return;
                    }
                    if (ventana.id === "ventanaAvisoDificultadReto") {
                        cerrarVentana("ventanaAvisoDificultadReto");
                        abrirVentana("ventanaRetosOpciones", true);
                        return;
                    }
                    if (ventana.id === "ventanaAvisoDesastres") {
                        cerrarVentana("ventanaAvisoDesastres");
                        abrirVentana("ventanaRuletaDesastres", true);
                        return;
                    }
                    if (ventana.id === "ventanaResultados") {
                        // Ventana secundaria del Filtrador: app.js gestiona cerrarVentana + abrirVentana.
                        // En Experimental el nivel 3 permanece activo (Filtrador sigue siendo la herramienta).
                        return;
                    }
                    if (ventana.id === "ventanaFichaSolar") {
                        const destino = window.ventanaOrigenFicha || window.ventanaAnterior || "ventanaBuscador";
                        window.solarFichaActual = null;
                        cerrarVentana("ventanaFichaSolar");
                        abrirVentana(destino, true);
                        if (typeof window.emitirEventoOBS === "function" && !window.esSincronizacionOBS) {
                            window.emitirEventoOBS("SYNC_CERRAR_FICHA_SOLAR", { ventanaDestino: destino });
                        }
                        // ventanaFichaSolar es siempre una ventana secundaria (abierta desde Filtrador/Listado).
                        // Cerrarla vuelve a la herramienta (nivel 3) y no al selector de categoría (nivel 2).
                        return;
                    }

                    cerrarVentana(ventana.id);
                    sincronizarCierreVentanaExperimental(ventana.id);
                }
            });
        });

    // Tooltip global para cualquier elemento con data-tooltip
    const tooltipGlobal = document.getElementById("tooltipOpciones");
    if (tooltipGlobal) {
        document.body.addEventListener("mouseenter", (e) => {
            if (window._tooltipCopiadoTimeout) return;
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.textContent = el.getAttribute("data-tooltip");
                tooltipGlobal.style.display = "block";
            }
        }, true);
        document.body.addEventListener("mousemove", (e) => {
            if (window._tooltipCopiadoTimeout) return;
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                const text = el.getAttribute("data-tooltip");
                if (text) {
                    tooltipGlobal.textContent = text;
                    tooltipGlobal.style.display = "block";
                    // position:fixed usa coordenadas del viewport (clientX/clientY), NO pageX/pageY
                    tooltipGlobal.style.left = e.clientX + "px";
                    tooltipGlobal.style.top = (e.clientY - 10) + "px";
                } else {
                    tooltipGlobal.style.display = "none";
                }
            } else {
                tooltipGlobal.style.display = "none";
            }
        }, true);
        document.body.addEventListener("mouseleave", (e) => {
            if (window._tooltipCopiadoTimeout) return;
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, true);

        // Versión táctil
        document.body.addEventListener("touchstart", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                const touch = e.touches[0];
                tooltipGlobal.textContent = el.getAttribute("data-tooltip");
                tooltipGlobal.style.left = touch.clientX + "px";
                tooltipGlobal.style.top = (touch.clientY - 10) + "px";
                tooltipGlobal.style.display = "block";
            }
        }, { capture: true, passive: true });

        document.body.addEventListener("touchend", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, { capture: true, passive: true });

        document.body.addEventListener("touchcancel", (e) => {
            const el = e.target.closest("[data-tooltip]");
            if (el) {
                tooltipGlobal.style.display = "none";
            }
        }, { capture: true, passive: true });
    }

    // Escuchar cambios de URL en la barra de navegación del navegador (Atrás/Adelante)
    window.addEventListener("hashchange", function () {
        procesarRutaURL();
    });

    // Escuchar navegación Atrás/Adelante del navegador (popstate).
    // Se activa cuando el usuario pulsa el botón Atrás/Adelante o usa el ratón.
    // En ese caso, procesarRutaURL restaura la vista sin generar una nueva entrada pushState.
    window.addEventListener("popstate", function () {
        if (estaNavegandoInternamente) return;
        _esNavegandoDesdePopstate = true;
        try {
            procesarRutaURL();
        } finally {
            // Restablecer el flag tras el procesamiento (microtask)
            setTimeout(() => { _esNavegandoDesdePopstate = false; }, 0);
        }
    });

    // Botones de la ventana 404
    document.getElementById("btnVolverInicio404")?.addEventListener("click", function () {
        abrirVentana("ventanaAcercaDe", true);
    });

    document.getElementById("btnIrBuscador404")?.addEventListener("click", function () {
        abrirVentana("ventanaBuscador", true);
    });
});

// Procesar la ruta inicial al cargar la web - fuera del DOMContentLoaded para
// garantizar que todos los scripts IIFE (como acercade.js) ya han definido sus
// funciones globales antes de que intentemos abrir la primera ventana.
function initNavigation() {
    if (window._navigationInitialized) return;
    window._navigationInitialized = true;
    // Dar un pequeño respiro extra (10ms) para asegurar que acercade.js
    // asignó la función window.inicializarCarruselAcercaDe
    setTimeout(() => {
        // Marcar que la URL inicial ya va a ser procesada.
        // A partir de aquí, comprobarVentanaVisible() y las actualizaciones
        // de URL en renderizarNavegacionExperimental() funcionan con normalidad.
        _urlInicialProcesada = true;
        procesarRutaURL();
    }, 10);
}

if (document.readyState === "complete") {
    initNavigation();
} else {
    window.addEventListener("load", initNavigation);
    // Fallback por si acaso
    setTimeout(initNavigation, 1000);
}