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

    "temporizador": "ventanaTemporizador",
    "timer": "ventanaTemporizador",
    "tiempo": "ventanaTemporizador",

    "habilidades": "ventanaRetos",
    "habilidad": "ventanaRetos",
    "habilidades-packs": "ventanaRetos",
    "habilidades-generador": "ventanaHabilidadesGenerador",

    "packs-azar": "ventanaRetos",
    "packs-generador": "ventanaPacksGenerador",

    "mundos-azar": "ventanaRetos",
    "mundos-generador": "ventanaMundosGenerador",

    "trucos": "ventanaTrucos",
    "truco": "ventanaTrucos",
    "cheats": "ventanaTrucos",
    "trucos-construir": "ventanaTrucosConstruir",
    "trucos-cas": "ventanaTrucosCAS",
    "trucos-vivir": "ventanaTrucosVivir",
    "trucos-packs": "ventanaTrucosPacks",

    "estadisticas": "ventanaEstadisticas",
    "stats": "ventanaEstadisticas",

    "resultados": "ventanaResultados",
    "listado": "ventanaListado",
    "aleatorio": "ventanaAleatorio",
    "ficha-solar": "ventanaFichaSolar"
};

const VENTANA_A_SLUG = {
    "ventanaAcercaDe": "acercade",
    "ventanaBuscador": "filtrador",
    "ventanaRetos": "retos",
    "ventanaRetosOpciones": "retos-opciones",
    "ventanaRetoResultado": "reto-generado",
    "ventanaRuletaDesastres": "ruleta-desastres",
    "ventanaRuletaColor": "ruleta-color",
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
    "ventanaFichaSolar": "ficha-solar"
};

window.ventanaAnterior = "ventanaAcercaDe";
window.ventanaActual = "ventanaAcercaDe";
let estaNavegandoInternamente = false;

// Protege contra sobrescritura de URL durante la carga inicial.
// Se activa a true justo antes de que procesarRutaURL() se ejecute por primera vez.
let _urlInicialProcesada = false;

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

function actualizarHashURL(slug) {
    if (!slug) return;
    const search = obtenerSearchConModo();
    const hashDeseado = "#" + slug;
    // Evitar replaceState redundante
    if (window.location.hash === hashDeseado && window.location.search === search) return;

    estaNavegandoInternamente = true;
    try {
        if (window.location.protocol !== "file:" && history.replaceState) {
            // Siempre escribe el modo explícito junto al hash
            history.replaceState(null, "", search + hashDeseado);
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

    const idVentana = MAPA_RUTAS[slug];

    if (idVentana) {
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

function abrirVentana(id, esClickUsuario = false) {
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
        window.emitirEventoOBS("SYNC_ABRIR_VENTANA", { idVentana: id });
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

    // 2. Sincronizar URL hash de forma segura
    if (id !== "ventana404") {
        if (id === "ventanaFichaSolar") {
            const slugSolar = (window.solarFichaActual && typeof obtenerSlugSolar === "function")
                ? obtenerSlugSolar(window.solarFichaActual)
                : "";
            actualizarHashURL(slugSolar ? ("ficha-solar/" + slugSolar) : "ficha-solar");
        } else if (id === "ventanaRetoResultado") {
            const token = (window.retoActual && typeof serializarRetoAToken === "function")
                ? serializarRetoAToken(window.retoActual)
                : null;
            actualizarHashURL(token ? ("reto-generado/v1/" + token) : (VENTANA_A_SLUG[id] || "reto-generado"));
        } else if (id === "ventanaDados") {
            // Preservar token si ya hay uno activo; si no, usar slug estático
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("dados/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "dados");
            }
        } else if (id === "ventanaRuletaColor") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("ruleta-colores/v1/") && !slugActual.startsWith("ruleta-color/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "ruleta-colores");
            }
        } else if (id === "ventanaHabilidadesGenerador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("habilidades-azar/v1/") && !slugActual.startsWith("habilidades/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "habilidades-azar");
            }
        } else if (id === "ventanaPacksGenerador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("packs-azar/v1/") && !slugActual.startsWith("packs/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "packs-azar");
            }
        } else if (id === "ventanaMundosGenerador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("mundos-azar/v1/") && !slugActual.startsWith("mundos/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "mundos-azar");
            }
        } else if (id === "ventanaTemporizador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("temporizador/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "temporizador");
            }
        } else if (id === "ventanaEstadisticas") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("estadisticas/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "estadisticas");
            }
        } else if (id === "ventanaTrucos") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("trucos/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "trucos");
            }
        } else if (id === "ventanaRuletaDesastres") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("ruleta-desastres/v1/") && !slugActual.startsWith("ruleta-desastre/v1/") && !slugActual.startsWith("desastres/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "ruleta-desastres");
            }
        } else if (id === "ventanaBuscador") {
            const slugActual = (window.location.hash || "").replace(/^[#/]+/, "").trim().toLowerCase();
            if (!slugActual.startsWith("filtrador/v1/") && !slugActual.startsWith("buscador/v1/")) {
                actualizarHashURL(VENTANA_A_SLUG[id] || "filtrador");
            }
        } else if (VENTANA_A_SLUG[id]) {
            actualizarHashURL(VENTANA_A_SLUG[id]);
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
            abrirVentana("ventanaBuscador", true);
            break;
        case "listado":
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
        default:
            console.warn("Herramienta no implementada o desconocida:", idHerramienta);
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

function obtenerCategoriaPorVentana(idVentana) {
    if (!idVentana) return "inicio";
    switch (idVentana) {
        case "ventanaAcercaDe":
            return "inicio";
        case "ventanaBuscador":
        case "ventanaResultados":
        case "ventanaListado":
        case "ventanaFichaSolar":
            return "solares";
        case "ventanaDados":
        case "ventanaRuletaColor":
        case "ventanaHabilidadesGenerador":
        case "ventanaPacksGenerador":
        case "ventanaMundosGenerador":
            return "generadores";
        case "ventanaRetos":
        case "ventanaRetosOpciones":
        case "ventanaRetoResultado":
        case "ventanaRuletaDesastres":
            if (window.proximaVentanaTrasPacks && (
                window.proximaVentanaTrasPacks === "ventanaHabilidadesGenerador" ||
                window.proximaVentanaTrasPacks === "ventanaPacksGenerador" ||
                window.proximaVentanaTrasPacks === "ventanaMundosGenerador"
            )) {
                return "generadores";
            }
            return "retos";
        case "ventanaTemporizador":
        case "ventanaTiempoAgotado":
        case "ventanaTrucos":
        case "ventanaTrucosConstruir":
        case "ventanaTrucosCAS":
        case "ventanaTrucosVivir":
        case "ventanaTrucosPacks":
            return "herramientas";
        case "ventanaEstadisticas":
            return "datos";
        default:
            return "inicio";
    }
}
window.obtenerCategoriaPorVentana = obtenerCategoriaPorVentana;

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

        // Pantalla limpia: ninguna ventana visible detrás de Nivel 1
        document.querySelectorAll(".ventana").forEach(v => { v.style.display = "none"; });
        document.querySelectorAll(".btnVolverExperimental").forEach(b => b.remove());

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