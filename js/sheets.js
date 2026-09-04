let _resolverAutorizacion = null;
const _promesaAutorizacion = new Promise((resolve) => {
    _resolverAutorizacion = resolve;
});

window.marcarAppAutorizada = function () {
    if (typeof _resolverAutorizacion === "function") {
        _resolverAutorizacion(true);
        _resolverAutorizacion = null;
    }
};





async function iniciarBaseDatos() {
    const autorizada = await _promesaAutorizacion;

    if (!autorizada) {
        console.warn("[LOT-LAB] Acceso bloqueado: La aplicación no está autorizada.");
        return;
    }

    try {
        const respuesta = await fetch("data/database.json");
        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const data = await respuesta.json();

        database.solares = (data.solares || []).map(solar => {
            if (solar.tamaño === undefined) {
                const altKey = Object.keys(solar).find(k => k.startsWith("tam") && k.endsWith("o"));
                if (altKey && solar[altKey] !== undefined) {
                    solar.tamaño = solar[altKey];
                }
            }
            return solar;
        });
        database.mundos = data.mundos || [];
        database.packs = data.packs || [];
        database.objetivos = data.objetivos || [];
        database.estilosArquitectonicos = data.estilosArquitectonicos || [];
        database.estilosDecoracion = data.estilosDecoracion || [];
        database.colores = data.colores || [];
        database.etapasVida = data.etapasVida || [];
        database.limitantesConstruir = data.limitantesConstruir || [];
        database.limitantesComprar = data.limitantesComprar || [];
        database.habilidades = data.habilidades || [];
        database.todosTiposSolares = data.todosTiposSolares || [];
        database.estadisticasSims4 = data.estadisticasSims4 || [];
        database.agradecimientos = data.agradecimientos || [];

        console.log("[LOT-LAB] Base de datos cargada desde database.json:", {
            solares: database.solares.length,
            mundos: database.mundos.length,
            packs: database.packs.length,
            estadisticas: database.estadisticasSims4.length,
            agradecimientos: database.agradecimientos.length
        });

    } catch (error) {
        console.error("[LOT-LAB] Error al cargar data/database.json:", error);
    }

    construirMapaIconosPacks();
    construirMapaIconosMundos();
    construirMapaIconosTiposSolares();

    mostrarSolares(database.solares);

    document.dispatchEvent(new Event("datosCargados"));
}
window.iniciarBaseDatosSegura = iniciarBaseDatos;

// ── Mapa de iconos de packs ──────────────────────────────────
// Construye database.iconosPacks: { "nombre pack": { ruta, id } }
function construirMapaIconosPacks() {
    database.iconosPacks = {};

    const subcarpetaPorPrefijo = {
        "EP": "expansiones",
        "GP": "contenido",
        "SP": "accesorios",
        "TK": "kits",
        "FR": "packs gratuitos",
        "BG": "juego base"
    };

    // Pares [columna nombre, columna ID]
    const pares = [
        [0, 1],   // Expansión
        [2, 3],   // Contenido
        [4, 5],   // Accesorios
        [6, 7],   // Kits
        [8, 9],   // Gratis
        [10, 11]  // Juego Base
    ];

    if (!database.packs) return;

    database.packs.forEach(fila => {
        pares.forEach(([colNombre, colId]) => {
            const nombre = (fila[colNombre] || "").trim();
            const id = (fila[colId] || "").trim();
            if (!nombre || !id) return;

            const prefijo = id.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "";
            const subcarpeta = subcarpetaPorPrefijo[prefijo] || "expansiones";
            const ruta = `img/icon-pack/${subcarpeta}/${id}.webp`;
            const entrada = { ruta, id, nombre };

            database.iconosPacks[nombre.toLowerCase()] = entrada;
        });
    });

    // Cruzar con los solares: si solar.nombrePack no tiene icono todavía,
    // buscar en el mapa por similitud (incluye, contiene) y añadir el alias
    if (database.solares) {
        const nombresEnMapa = Object.keys(database.iconosPacks);
        database.solares.forEach(solar => {
            const np = (solar.nombrePack || "").trim();
            if (!np) return;
            const npLower = np.toLowerCase();
            if (database.iconosPacks[npLower]) return; // ya está

            // Buscar por si el nombre del solar contiene o está contenido en el del mapa
            const coincidencia = nombresEnMapa.find(k =>
                k.includes(npLower) || npLower.includes(k)
            );
            if (coincidencia) {
                database.iconosPacks[npLower] = database.iconosPacks[coincidencia];
            }
        });
    }

    console.log("Mapa de iconos de packs:", Object.keys(database.iconosPacks).length, "entradas");
}

// Devuelve la ruta del icono dado el nombre del pack, o null si no existe
function rutaIconoPack(nombrePack) {
    if (!database.iconosPacks) return null;
    const entrada = database.iconosPacks[(nombrePack || "").trim().toLowerCase()];
    return entrada ? entrada.ruta : null;
}

// Genera HTML de un botón de pack con icono estético y nombre como tooltip
function htmlBotonPackIcono(nombrePack, extraClases = "", extraData = "") {
    const ruta = rutaIconoPack(nombrePack);
    if (ruta) {
        return `<button class="opcionFiltro btnPackIcono ${extraClases}" ${extraData} title="${nombrePack}">
            <img src="${ruta}" alt="${nombrePack}" class="iconoPack" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="iconoPackFallback" style="display:none;">📦</span>
        </button>`;
    }
    // Fallback sin icono
    return `<button class="opcionFiltro ${extraClases}" ${extraData}><span>📦 ${nombrePack}</span></button>`;
}

// Genera HTML de una tira de iconos de packs (para resultados del reto)
function htmlIconosPacks(listaNombres) {
    return listaNombres.map(nombre => {
        const ruta = rutaIconoPack(nombre);
        if (ruta) {
            return `<span class="chipIconoPack" title="${nombre}">
                <img src="${ruta}" alt="${nombre}" class="iconoPack" onerror="this.parentElement.innerHTML='<span>📦 ${nombre}</span>'">
            </span>`;
        }
        return `<span class="chipPackTexto">📦 ${nombre}</span>`;
    }).join("");
}

// ── Mapa de iconos de mundos ─────────────────────────────────
// Construye database.iconosMundos: { "nombre mundo": { ruta, id } }
function construirMapaIconosMundos() {
    database.iconosMundos = {};

    if (!database.mundos) return;

    database.mundos.forEach(fila => {
        const nombre = (fila[0] || "").trim(); // Columna A: nombre del mundo
        const id = (fila[1] || "").trim(); // Columna B: ID de la carpeta

        if (!nombre || !id) return;

        const ruta = `img/mundos-con-solares/${id}/icono.webp`;
        database.iconosMundos[nombre.toLowerCase()] = { ruta, id, nombre };
    });

    console.log("Mapa de iconos de mundos:", Object.keys(database.iconosMundos).length, "entradas");
}

// Devuelve la ruta del icono dado el nombre del mundo, o null si no existe
function rutaIconoMundo(nombreMundo) {
    if (!database.iconosMundos) return null;
    const entrada = database.iconosMundos[(nombreMundo || "").trim().toLowerCase()];
    return entrada ? entrada.ruta : null;
}

// Genera HTML de un botón de mundo con icono, mismo estilo que los packs
function htmlBotonMundoIcono(nombreMundo, extraClases = "", extraData = "") {
    const ruta = rutaIconoMundo(nombreMundo);
    if (ruta) {
        return `<button class="opcionFiltro btnPackIcono ${extraClases}" ${extraData} title="${nombreMundo}">
            <img src="${ruta}" alt="${nombreMundo}" class="iconoPack" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="iconoPackFallback" style="display:none;">🌎</span>
        </button>`;
    }
    // Fallback sin icono
    return `<button class="opcionFiltro ${extraClases}" ${extraData}><span>🌎 ${nombreMundo}</span></button>`;
}


// ── Iconos de barrios (fotos dentro de img/barrios/{mundo}/{barrio}/) ──
const EXTENSIONES_FOTO_BARRIO = ["webp"];

function manejarErrorImagenBarrio(img) {
    const intento = parseInt(img.dataset.intento || "0", 10) + 1;

    if (intento < EXTENSIONES_FOTO_BARRIO.length) {
        img.dataset.intento = String(intento);
        img.src = `${img.dataset.rutaBase}.${EXTENSIONES_FOTO_BARRIO[intento]}`;
    } else {
        img.style.display = "none";
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "inline-flex";
    }
}

// Genera HTML de un botón de barrio con foto, mismo estilo que packs/mundos
// (carpeta plana: img/barrios/ contiene una carpeta por cada barrio, con la foto dentro)
function htmlBotonBarrioIcono(nombreBarrio, nombreMundo, extraData = "") {
    const rutaBase = nombreBarrio
        ? `img/barrios/${nombreBarrio.trim()}/foto`
        : null;

    if (rutaBase) {
        return `<button class="opcionFiltro btnPackIcono seleccionada" ${extraData} title="${nombreBarrio}">
            <img src="${rutaBase}.${EXTENSIONES_FOTO_BARRIO[0]}" data-ruta-base="${rutaBase}" data-intento="0"
                alt="${nombreBarrio}" class="iconoPack" onerror="manejarErrorImagenBarrio(this)">
            <span class="iconoPackFallback" style="display:none;">🏘️ ${nombreBarrio}</span>
        </button>`;
    }

    // Fallback sin mundo conocido / sin foto
    return `<button class="opcionFiltro seleccionada" ${extraData}><span>🏘️ ${nombreBarrio}</span></button>`;
}

// ── Iconos de etapas de vida (fotos en img/iconosetapas/{idFoto}.*) ──
const EXTENSIONES_ICONO_ETAPA = ["webp"];

function manejarErrorImagenEtapa(img) {
    const intento = parseInt(img.dataset.intento || "0", 10) + 1;

    if (intento < EXTENSIONES_ICONO_ETAPA.length) {
        img.dataset.intento = String(intento);
        img.src = `${img.dataset.rutaBase}.${EXTENSIONES_ICONO_ETAPA[intento]}`;
    } else {
        img.style.display = "none";
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "inline-flex";
    }
}

// Devuelve la ruta base (sin extensión) del icono de una etapa de vida, o null si no hay ID
function rutaBaseIconoEtapa(idFoto) {
    if (!idFoto) return null;
    const id = idFoto.toString().trim();
    if (!id) return null;
    return `img/iconosetapas/${id}`;
}

// ── Iconos de limitantes extra (fotos en img/iconosbb/{idFoto}.*) ──
const EXTENSIONES_ICONO_LIMITANTE = ["webp"];

function manejarErrorImagenLimitante(img) {
    const intento = parseInt(img.dataset.intento || "0", 10) + 1;

    if (intento < EXTENSIONES_ICONO_LIMITANTE.length) {
        img.dataset.intento = String(intento);
        img.src = `${img.dataset.rutaBase}.${EXTENSIONES_ICONO_LIMITANTE[intento]}`;
    } else {
        img.style.display = "none";
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = "flex";
    }
}

// Devuelve la ruta base (sin extensión) del icono de una limitante, o null si no hay ID
function rutaBaseIconoLimitante(idFoto) {
    if (!idFoto) return null;
    const id = idFoto.toString().trim();
    if (!id) return null;
    return `img/iconosbb/${id}`;
}

// ── Mapa de iconos de tipos de solares ────────────────────────
// Construye database.iconosTiposSolares: { "nombre tipo solar": ruta }
// Fuente: "Listado de todos los tipos de solares" (Columna B: nombre, Columna C: archivo imagen)
function construirMapaIconosTiposSolares() {
    database.iconosTiposSolares = {};
    if (!database.todosTiposSolares || !Array.isArray(database.todosTiposSolares)) return;

    database.todosTiposSolares.forEach(fila => {
        if (!fila || fila.length === 0) return;
        const nombre = (fila[1] || "").trim(); // Columna B: nombre del tipo de solar
        const imagenRaw = (fila[2] || "").trim(); // Columna C: nombre del archivo de imagen

        if (!nombre || !imagenRaw) return;

        let archivo = imagenRaw;
        // Limpiar cualquier extensión previa (.png, .jpg, .jpeg, .webp) para evitar duplicados como .webp.webp
        archivo = archivo.replace(/\.(png|jpg|jpeg|webp)$/i, "");
        archivo += ".webp";
        const ruta = `img/iconos-tipo-solar/${archivo}`;
        database.iconosTiposSolares[nombre.toLowerCase()] = ruta;
    });

    console.log("Mapa de iconos de tipos de solares:", Object.keys(database.iconosTiposSolares).length, "entradas");
}

// Devuelve la ruta del icono de un tipo de solar o null si no existe
function rutaIconoTipoSolar(nombreTipoSolar) {
    if (!database.iconosTiposSolares || !nombreTipoSolar) return null;
    return database.iconosTiposSolares[nombreTipoSolar.trim().toLowerCase()] || null;
}
window.rutaIconoTipoSolar = rutaIconoTipoSolar;

// Genera HTML de un botón de tipo de solar con icono para el filtrador de solares
function htmlBotonTipoSolarFiltro(nombreTipoSolar, activo = false, extraData = "") {
    const ruta = rutaIconoTipoSolar(nombreTipoSolar);
    const claseSel = activo ? " seleccionada" : "";

    if (ruta) {
        return `<button class="opcionFiltro opcionFiltroConIcono${claseSel}" ${extraData} data-valor="${nombreTipoSolar}">
            <div class="iconoTipoSolarFiltroWrap">
                <img src="${ruta}" alt="${nombreTipoSolar}" class="iconoTipoSolarFiltro" onerror="this.parentElement.style.display='none';">
            </div>
            <span>${nombreTipoSolar}</span>
        </button>`;
    }

    // Fallback sin icono
    return `<button class="opcionFiltro${claseSel}" ${extraData} data-valor="${nombreTipoSolar}"><span>${nombreTipoSolar}</span></button>`;
}
window.htmlBotonTipoSolarFiltro = htmlBotonTipoSolarFiltro;