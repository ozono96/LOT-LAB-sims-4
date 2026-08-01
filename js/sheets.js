async function cargarHoja(nombreHoja) {

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(nombreHoja)}?key=${CONFIG.API_KEY}`;

    try {

        const respuesta = await fetch(url);

        const datos = await respuesta.json();

        return datos.values || [];

    }

    catch (error) {

        console.error("Error cargando hoja:", nombreHoja, error);

        return [];

    }

}



async function cargarSolares() {

    const filas = await cargarHoja(CONFIG.SHEETS.SOLARES);

    if (filas.length === 0) {

        console.error("No se pudieron cargar los solares.");

        return;

    }

    filas.shift();

    database.solares = filas.map(fila => ({

        id: fila[0] || "",

        tipoPack: fila[1] || "",

        nombrePack: fila[2] || "",

        mundo: fila[3] || "",

        barrio: fila[4] || "",

        nombre: fila[5] || "",

        tipoLote: fila[6] || "",

        tipoSolar: fila[7] || "",

        tamaño: fila[8] || "",

        orientacion: fila[9] || "",

        acera: fila[10] || "",

        imagen: fila[11] || ""

    }));

    console.log("Solares cargados:", database.solares.length);

}



async function cargarListados() {

    let datos;

    datos = await cargarHoja(CONFIG.SHEETS.MUNDOS);

    database.mundos = datos.slice(1);

    console.log("Mundos:", database.mundos.length);




    datos = await cargarHoja(CONFIG.SHEETS.PACKS);

    database.packs = datos.slice(1);

    console.log("Packs:", database.packs.length);




    datos = await cargarHoja(CONFIG.SHEETS.OBJETIVOS);

    database.objetivos = datos.slice(1);

    console.log("Objetivos:", database.objetivos.length);




    datos = await cargarHoja(CONFIG.SHEETS.ESTILOS_ARQ);

    database.estilosArquitectonicos = datos.slice(1);

    console.log("Estilos arquitectónicos:", database.estilosArquitectonicos.length);




    datos = await cargarHoja(CONFIG.SHEETS.ESTILOS_DECORACION);

    database.estilosDecoracion = datos.slice(1);

    console.log("Estilos decoración:", database.estilosDecoracion.length);




    datos = await cargarHoja(CONFIG.SHEETS.COLORES);

    database.colores = datos.slice(1);

    console.log("Colores:", database.colores.length);




    datos = await cargarHoja(CONFIG.SHEETS.ETAPAS_VIDA);

    database.etapasVida = datos.slice(1);

    console.log("Etapas de vida:", database.etapasVida.length);




    datos = await cargarHoja(CONFIG.SHEETS.LIMITANTES_CONSTRUIR);

    database.limitantesConstruir = datos.slice(1);

    console.log("Limitantes construir:", database.limitantesConstruir.length);




    datos = await cargarHoja(CONFIG.SHEETS.LIMITANTES_COMPRAR);

    database.limitantesComprar = datos.slice(1);

    console.log("Limitantes comprar:", database.limitantesComprar.length);

}



async function iniciarBaseDatos() {

    await cargarSolares();

    await cargarListados();

    construirMapaIconosPacks();
    construirMapaIconosMundos();

    mostrarSolares(database.solares);

    document.dispatchEvent(new Event("datosCargados"));

}



iniciarBaseDatos();

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
            const ruta = `img/icon-pack/${subcarpeta}/${id}.png`;
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
        return `<button class="opcionFiltro btnPackIcono seleccionada" ${extraData} title="${nombrePack}">
            <img src="${ruta}" alt="${nombrePack}" class="iconoPack" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="iconoPackFallback" style="display:none;">📦</span>
        </button>`;
    }
    // Fallback sin icono
    return `<button class="opcionFiltro seleccionada" ${extraData}><span>📦 ${nombrePack}</span></button>`;
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
        return `<button class="opcionFiltro btnPackIcono seleccionada" ${extraData} title="${nombreMundo}">
            <img src="${ruta}" alt="${nombreMundo}" class="iconoPack" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span class="iconoPackFallback" style="display:none;">🌎</span>
        </button>`;
    }
    // Fallback sin icono
    return `<button class="opcionFiltro seleccionada" ${extraData}><span>🌎 ${nombreMundo}</span></button>`;
}


// ── Iconos de barrios (fotos dentro de img/barrios/{mundo}/{barrio}/) ──
const EXTENSIONES_FOTO_BARRIO = ["jpg", "png", "jpeg", "webp"];

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
const EXTENSIONES_ICONO_ETAPA = ["png", "jpg", "webp", "jpeg"];

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
const EXTENSIONES_ICONO_LIMITANTE = ["png", "jpg", "webp", "jpeg"];

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