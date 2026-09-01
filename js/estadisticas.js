/* ==========================================================
   ESTADÍSTICAS SIMS 4
   estadisticas.js
   Carga, parsea y visualiza los datos de todos los packs
========================================================== */

// ── Estado global del módulo ─────────────────────────────
const ESTAD = {
    packsOriginales: [],   // Todos los packs cargados
    packsFiltrados: [],    // Packs tras aplicar filtros
    cargado: false,        // Si ya se cargaron los datos
    vistaActual: "lista",  // "lista" | "graficos"
    _eventosInit: false,
    zoomFactor: {
        porTipo: 1,
        porMeses: 1,
        mesesAno: 1,
        diasSemana: 1,
        temporal: 1,
        solares: 1,
        objetos: 1,
    },
    lineasVisiblesTemporal: {
        "Total": true,
        "Expansión": true,
        "Contenido": true,
        "Accesorios": true,
        "Kits": true,
        "Packs gratuitos": true,
        "Juego Base": true,
    },
    detalleActivo: null, // { chartId, tipo, valor, titulo }
};

// ── Mapa de tipos por prefijo de ID ─────────────────────
const TIPO_POR_PREFIJO = {
    "EP": "Expansión",
    "GP": "Contenido",
    "SP": "Accesorios",
    "TK": "Kits",
    "FR": "Packs gratuitos",
    "BG": "Juego Base",
};

const SUBCARPETA_POR_PREFIJO = {
    "EP": "expansiones",
    "GP": "contenido",
    "SP": "accesorios",
    "TK": "kits",
    "FR": "packs gratuitos",
    "BG": "juego base",
};

// Colores para gráficos (colores elegidos por el usuario)
const COLORES_TIPO = {
    "Expansión": "#3aeded",
    "Contenido": "#2563EB",
    "Accesorios": "#18d906",
    "Kits": "#9c0cc0",
    "Packs gratuitos": "#e63cd7",
    "Juego Base": "#c3cfb9",
};

// Aplica opacidad a cualquier color hex (#RRGGBB o #RRGGBBAA)
function colorConAlpha(hexColor, alphaHex = "FF") {
    if (!hexColor) return "#2563EB" + alphaHex;
    let clean = hexColor.toString().replace("#", "").trim();
    if (clean.length === 8) {
        clean = clean.substring(0, 6);
    }
    return `#${clean}${alphaHex}`;
}

// Mapeo de meses en español
const MESES_ES = {
    enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
    julio: "07", agosto: "08", septiembre: "09", setiembre: "09", sep: "09",
    octubre: "10", noviembre: "11", diciembre: "12"
};

const NOMBRES_MESES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// Normalizar tipo de pack para que coincida exactamente con los filtros
function normalizarTipoPack(tipoStr, idStr) {
    const prefijo = (idStr || "").match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "";
    if (TIPO_POR_PREFIJO[prefijo]) return TIPO_POR_PREFIJO[prefijo];

    const t = (tipoStr || "").toLowerCase();
    if (t.includes("expansi")) return "Expansión";
    if (t.includes("contenido")) return "Contenido";
    if (t.includes("accesorio")) return "Accesorios";
    if (t.includes("kit")) return "Kits";
    if (t.includes("gratis") || t.includes("gratuit")) return "Packs gratuitos";
    if (t.includes("base")) return "Juego Base";

    return "Expansión";
}

// Convierte distintos formatos de fecha a "YYYY-MM-DD"
function parsearFechaAISO(str) {
    if (!str) return "";
    let s = String(str).replace(/\u00a0/g, " ").trim();
    if (!s) return "";

    // 1. Formato numérico DD/MM/YYYY, DD-MM-YYYY, D/M/YYYY, DD.MM.YYYY, D/M/YY (ej: "31/03/2015", "2/9/2014", "19/05/2015", "02/09/2014")
    const mDMY = s.match(/\b(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{2,4})\b/);
    if (mDMY) {
        let p1 = parseInt(mDMY[1], 10);
        let p2 = parseInt(mDMY[2], 10);
        let y = mDMY[3];
        if (y.length === 2) y = (parseInt(y, 10) > 50 ? "19" : "20") + y;

        let d = p1;
        let m = p2;
        if (p2 > 12 && p1 <= 12) {
            d = p2;
            m = p1;
        }

        const dayStr = d.toString().padStart(2, "0");
        const monthStr = m.toString().padStart(2, "0");
        return `${y}-${monthStr}-${dayStr}`;
    }

    // 2. Formato ISO YYYY-MM-DD o YYYY/MM/DD (ej: "2014-09-02", "2014-09-02 0:00:00")
    const mISO = s.match(/\b(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})\b/);
    if (mISO) {
        const y = parseInt(mISO[1], 10);
        if (y >= 1990 && y <= 2100) {
            return `${mISO[1]}-${mISO[2].padStart(2, "0")}-${mISO[3].padStart(2, "0")}`;
        }
    }

    // 3. Texto con mes en español y año en la fecha (ej: "2 de octubre de 2025", "2 oct 2025")
    const mDMYText = s.match(/(\d{1,2})[\-\/\.\s]+(?:de\s*)?([a-záéíóúñ]+)[\-\/\.\s]*(?:de\s*|del\s*|,?\s*)?(\d{2,4})/i);
    if (mDMYText) {
        const d = mDMYText[1].padStart(2, "0");
        const mesNombre = mDMYText[2].toLowerCase();
        const m = MESES_ES[mesNombre];
        let y = mDMYText[3];
        if (y.length === 2) y = (parseInt(y, 10) > 50 ? "19" : "20") + y;
        if (m) return `${y}-${m}-${d}`;
    }

    // 4. Solo año (ej: "2025")
    const mSoloAnio = s.match(/\b(199\d|20\d{2})\b/);
    if (mSoloAnio) {
        return `${mSoloAnio[1]}-01-01`;
    }

    return "";
}

// Quitar acentos para búsquedas flexibles
function quitarAcentos(str) {
    return (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// ── Parsear filas de la hoja ─────────────────────────────
function parsearFilasEstadisticas(filas) {
    if (!filas || filas.length === 0) return [];

    const packs = [];
    const COLS_POR_GRUPO = 6;

    const cabecera = filas[0] || [];
    let filasDatos = filas;
    const textoFila0 = cabecera.join(" ").toLowerCase();
    if (textoFila0.includes("fecha") || textoFila0.includes("nombre")) {
        filasDatos = filas.slice(1);
    }

    const maxCols = Math.max(...filas.map(f => f.length));
    const numGrupos = Math.ceil(maxCols / COLS_POR_GRUPO);

    for (let g = 0; g < numGrupos; g++) {
        const base = g * COLS_POR_GRUPO;
        const tipoHeader = (cabecera[base + 2] || "").trim();

        filasDatos.forEach((fila) => {
            const fecha = (fila[base + 0] || "").trim();
            const nombreInterno = (fila[base + 1] || "").trim(); // Col B: Nombre interno (EP01)
            const colC = (fila[base + 2] || "").trim(); // Col C: Nombre real del pack (¡A Trabajar!)
            const precioRaw = (fila[base + 3] || "").trim(); // Col D: Precio
            const objetosRaw = (fila[base + 4] || "").trim(); // Col E: Objetos
            const idFoto = (fila[base + 5] || "").trim(); // Col F: ID imagen (EP1)

            if (!idFoto && !nombreInterno && !colC) return;

            const colCLow = colC.toLowerCase();
            if (colCLow === "expansión" || colCLow === "contenido" || colCLow === "accesorios" || colCLow === "kits" || colCLow === "packs gratuitos" || colCLow === "juego base") {
                return;
            }

            const id = idFoto || nombreInterno;
            const prefijo = id.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || "";

            let nombre = colC;
            if (!nombre || normalizarTipoPack(nombre, id) === nombre) {
                nombre = nombreInterno || id;
            }

            const codigoInterno = nombreInterno || id;
            const tipoPack = normalizarTipoPack(tipoHeader || colC, id);

            let precio = 0;
            let esGratis = false;
            const precioLow = precioRaw.toLowerCase();
            if (precioLow === "gratis" || precioLow === "0" || precioLow === "0€" || precioLow === "0,00€" || precioRaw === "") {
                esGratis = true;
                precio = 0;
            } else {
                const numStr = precioRaw.replace("€", "").replace(/\s/g, "").replace(",", ".").trim();
                precio = parseFloat(numStr) || 0;
            }

            let objetos = null;
            if (objetosRaw.toUpperCase() !== "NA" && objetosRaw !== "") {
                const n = parseInt(objetosRaw.replace(/\./g, "").replace(",", ""), 10);
                if (!isNaN(n)) objetos = n;
            }

            const subcarpeta = SUBCARPETA_POR_PREFIJO[prefijo] || "expansiones";
            const rutaImg = `img/icon-pack/${subcarpeta}/${id}.png`;

            const fechaISO = fecha ? parsearFechaAISO(fecha) : "";
            const anioLanzamiento = fechaISO ? fechaISO.substring(0, 4) : (fecha.match(/\d{4}/)?.[0] || "");

            const esJuegoBase = prefijo === "BG";

            packs.push({
                nombre,
                codigoInterno,
                id,
                tipoPack,
                prefijo,
                precio,
                esGratis,
                objetos,
                rutaImg,
                fecha,
                fechaISO,
                anioLanzamiento,
                esJuegoBase,
            });
        });
    }

    const vistos = new Set();
    const unicos = packs.filter(p => {
        const key = `${p.codigoInterno}_${p.nombre}`;
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
    });

    unicos.sort((a, b) => {
        if (!a.fechaISO) return 1;
        if (!b.fechaISO) return -1;
        return a.fechaISO.localeCompare(b.fechaISO);
    });

    return unicos;
}

// ── Carga de datos ───────────────────────────────────────
async function cargarEstadisticasSims4() {
    if (ESTAD.cargado) return;

    mostrarEstadCargando(true);

    try {
        let filas = (typeof database !== "undefined" && database.estadisticasSims4) ? database.estadisticasSims4 : [];

        // Si los datos aún no están en memoria, esperar al evento datosCargados
        if (!filas || filas.length === 0) {
            await new Promise((resolve) => {
                if (typeof database !== "undefined" && database.estadisticasSims4 && database.estadisticasSims4.length > 0) {
                    resolve();
                } else {
                    document.addEventListener("datosCargados", resolve, { once: true });
                }
            });
            filas = (typeof database !== "undefined" && database.estadisticasSims4) ? database.estadisticasSims4 : [];
        }

        if (!filas || filas.length === 0) {
            mostrarEstadError("No se pudieron cargar los datos de estadísticas.");
            return;
        }

        ESTAD.packsOriginales = parsearFilasEstadisticas(filas);
        ESTAD.packsFiltrados = [...ESTAD.packsOriginales];
        ESTAD.cargado = true;

        console.log("Estadísticas cargadas:", ESTAD.packsOriginales.length, "packs");

    } catch (err) {
        console.error("Error cargando estadísticas:", err);
        mostrarEstadError("Error al cargar los datos. Inténtalo de nuevo.");
        return;
    } finally {
        mostrarEstadCargando(false);
    }

    actualizarResumen(ESTAD.packsFiltrados);
    renderizarLista(ESTAD.packsFiltrados);
    actualizarContador(ESTAD.packsFiltrados.length, ESTAD.packsOriginales.length);
}

// ── Actualización de estadísticas ────
async function refrescarEstadisticasEnSegundoPlano() {
    if (!ESTAD.cargado) {
        await cargarEstadisticasSims4();
    }
}

function obtenerFiltrosEstadisticasActuales() {
    return {
        texto: document.getElementById("estatBuscarTexto")?.value || "",
        fechaDesde: document.getElementById("estatFechaDesde")?.value || "",
        fechaHasta: document.getElementById("estatFechaHasta")?.value || "",
        precioMin: document.getElementById("estatPrecioMin")?.value || "",
        precioMax: document.getElementById("estatPrecioMax")?.value || "",
        tipoPack: document.getElementById("estatTipoPack")?.value || ""
    };
}

function sincronizarEstadisticasOBS() {
    if (!window.esSincronizacionOBS && typeof window.emitirEventoOBS === "function") {
        window.emitirEventoOBS("SYNC_ACCION", {
            accion: "ESTADISTICAS_STATE",
            payload: {
                vista: ESTAD.vistaActual,
                filtros: obtenerFiltrosEstadisticasActuales()
            }
        });
    }
}

// ── Filtrado en tiempo real ──────────────────────────────
function aplicarFiltrosEstadisticas() {
    const textoInput = document.getElementById("estatBuscarTexto")?.value || "";
    const texto = quitarAcentos(textoInput.trim());
    const fechaDesde = document.getElementById("estatFechaDesde")?.value || "";
    const fechaHasta = document.getElementById("estatFechaHasta")?.value || "";
    const precioMinV = document.getElementById("estatPrecioMin")?.value;
    const precioMaxV = document.getElementById("estatPrecioMax")?.value;
    const tipoPack = document.getElementById("estatTipoPack")?.value || "";

    const precioMin = precioMinV !== "" && precioMinV !== undefined ? parseFloat(precioMinV) : null;
    const precioMax = precioMaxV !== "" && precioMaxV !== undefined ? parseFloat(precioMaxV) : null;

    ESTAD.packsFiltrados = ESTAD.packsOriginales.filter(pack => {
        if (texto) {
            const haystack = quitarAcentos(`${pack.nombre} ${pack.codigoInterno} ${pack.id} ${pack.tipoPack} ${pack.fecha} ${pack.anioLanzamiento}`);
            if (!haystack.includes(texto)) return false;
        }

        if (fechaDesde) {
            if (!pack.fechaISO || pack.fechaISO < fechaDesde) return false;
        }

        if (fechaHasta) {
            if (!pack.fechaISO || pack.fechaISO > fechaHasta) return false;
        }

        if (precioMin !== null && !isNaN(precioMin) && pack.precio < precioMin) return false;
        if (precioMax !== null && !isNaN(precioMax) && pack.precio > precioMax) return false;
        if (tipoPack && pack.tipoPack !== tipoPack) return false;

        return true;
    });

    actualizarResumen(ESTAD.packsFiltrados);
    actualizarContador(ESTAD.packsFiltrados.length, ESTAD.packsOriginales.length);

    if (ESTAD.vistaActual === "lista") {
        renderizarLista(ESTAD.packsFiltrados);
    } else {
        requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
    }

    sincronizarEstadisticasOBS();
}

// ── Resumen dinámico (cards superiores) ──────────────────
function actualizarResumen(packs) {
    const precioTotal = packs.reduce((sum, p) => sum + p.precio, 0);

    let packMasObjetos = null;
    for (const p of packs) {
        if (p.objetos !== null) {
            if (!packMasObjetos || p.objetos > packMasObjetos.objetos) {
                packMasObjetos = p;
            }
        }
    }

    const totalObjetos = packs.reduce((sum, p) => sum + (p.objetos || 0), 0);

    const elPrecio = document.getElementById("estatTotalPrecio");
    const elPacks = document.getElementById("estatTotalPacks");
    const elObjetos = document.getElementById("estatTotalObjetos");
    const elMasObjetos = document.getElementById("estatMasObjetos");

    if (elPrecio) elPrecio.textContent = formatearEuros(precioTotal);
    if (elPacks) elPacks.textContent = packs.length;
    if (elObjetos) elObjetos.textContent = totalObjetos > 0 ? totalObjetos.toLocaleString("es-ES") : "—";
    if (elMasObjetos) {
        const cardMasObjetos = document.getElementById("estatCardMasObjetos");
        if (packMasObjetos) {
            elMasObjetos.textContent = `${packMasObjetos.nombre}`;
            elMasObjetos.title = `${packMasObjetos.nombre} (${packMasObjetos.objetos} objetos nuevos)`;
            if (cardMasObjetos) {
                cardMasObjetos.setAttribute("data-tooltip", `Pack con más objetos de la selección: ${packMasObjetos.nombre} (${packMasObjetos.objetos.toLocaleString("es-ES")} objetos nuevos)`);
            }
        } else {
            elMasObjetos.textContent = "—";
            if (cardMasObjetos) {
                cardMasObjetos.setAttribute("data-tooltip", "Pack de la selección actual que incluye la mayor cantidad individual de objetos nuevos");
            }
        }
    }

    const elBannerVal = document.getElementById("estatPrecioTotalBannerVal");
    if (elBannerVal) {
        elBannerVal.textContent = formatearEuros(precioTotal);
    }

    // ── Cards nuevas: Mundos, Barrios, Solares ────────────
    // Cruzamos solares de la base de datos con los packs filtrados actuales

    let totalSolares = 0;
    const barriosUnicos = new Set();
    const mundosUnicos = new Set();

    if (database && database.solares) {
        database.solares.forEach(s => {
            const sNombre = quitarAcentos(s.nombrePack || "").toLowerCase();
            // Si no hay filtro activo (todos los packs) o el solar pertenece a un pack filtrado
            const pertenece = packs.length === ESTAD.packsOriginales.length ||
                packs.some(p => {
                    const pNom = quitarAcentos(p.nombre || "").toLowerCase();
                    return pNom && (sNombre === pNom || sNombre.includes(pNom) || pNom.includes(sNombre));
                });
            if (!pertenece) return;
            totalSolares++;
            if (s.barrio && s.barrio.trim()) barriosUnicos.add(s.barrio.trim());
            if (s.mundo && s.mundo.trim()) mundosUnicos.add(s.mundo.trim());
        });
    }

    const elMundos = document.getElementById("estatTotalMundos");
    const elBarrios = document.getElementById("estatTotalBarrios");
    const elSolares = document.getElementById("estatTotalSolares");

    if (elMundos) elMundos.textContent = mundosUnicos.size > 0 ? mundosUnicos.size : "—";
    if (elBarrios) elBarrios.textContent = barriosUnicos.size > 0 ? barriosUnicos.size : "—";
    if (elSolares) elSolares.textContent = totalSolares > 0 ? totalSolares.toLocaleString("es-ES") : "—";

    // ── Card Tiempo desde Sims 4 ──────────────────────────
    const elTiempo = document.getElementById("estatTiempoValor");
    if (elTiempo) {
        const { anios, meses, dias } = calcularTiempoTranscurrido("2014-09-02");
        elTiempo.textContent = `${anios}a ${meses}m ${dias}d`;
    }
}


function formatearEuros(n) {
    if (n === 0) return "0,00 €";
    return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// ── Contador de resultados ───────────────────────────────
function actualizarContador(filtrados, total) {
    const el = document.getElementById("estatContador");
    if (!el) return;
    if (filtrados === total) {
        el.textContent = `Mostrando todos los ${total} packs`;
    } else {
        el.textContent = `Mostrando ${filtrados} de ${total} packs`;
    }
}

// ── Vista Lista ──────────────────────────────────────────
function renderizarLista(packs) {
    const contenedor = document.getElementById("estatListaPacks");
    if (!contenedor) return;

    if (packs.length === 0) {
        contenedor.innerHTML = `<div class="estatSinResultados">
            <span style="font-size:2.5rem;">🔍</span>
            <p>No se encontraron packs con los filtros actuales.</p>
        </div>`;
        return;
    }

    const mapaSolares = obtenerMapaConteoSolares();

    contenedor.innerHTML = packs.map(pack => {
        const colorTipo = COLORES_TIPO[pack.tipoPack] || "#2563EB";

        const badgeCodigo = pack.codigoInterno || pack.id;
        const badgeId = `<span class="packBadgeId" data-tooltip="Nombre interno del pack dentro del juego" title="Nombre interno del pack dentro del juego" style="background:${colorTipo}; color:#ffffff; border-color:${colorTipo};">${badgeCodigo}</span>`;
        const badgeTipo = `<span class="packBadgeTipo" style="background:${colorConAlpha(colorTipo, "22")}; color:${colorTipo}; border:1px solid ${colorConAlpha(colorTipo, "55")};">${pack.tipoPack}</span>`;

        let notaExtra = "";
        if (pack.esJuegoBase) {
            notaExtra = `<div class="packNotaGratis">🆓 Gratuito desde el 18 de octubre de 2022 (antes costaba 19,99&nbsp;€)</div>`;
        }

        let precioDisplay = "";
        if (pack.esJuegoBase || pack.precio === 0) {
            precioDisplay = `<div class="packPrecioWrap"><span class="packPrecio packPrecioGratis">Gratis</span></div>`;
        } else {
            precioDisplay = `<div class="packPrecioWrap"><span class="packPrecio">${formatearEuros(pack.precio)}</span></div>`;
        }

        let objetosHTML = "";
        if (pack.objetos !== null) {
            objetosHTML = `<div class="packObjetos">
                <span class="packObjetosIcono">🏠</span>
                <strong class="packObjetosNum">${pack.objetos.toLocaleString("es-ES")}</strong>
                <span class="packObjetosLabel"> objetos nuevos</span>
            </div>`;
        } else if (pack.esJuegoBase) {
            objetosHTML = `<div class="packObjetos packObjetosNA"><span>Base del juego</span></div>`;
        }

        const cantSolares = mapaSolares.get(pack.id) || 0;
        let solaresHTML = "";
        if (cantSolares > 0) {
            solaresHTML = `<div class="packSolares">
                <span class="packSolaresIcono">🏡</span>
                <strong class="packSolaresNum">${cantSolares.toLocaleString("es-ES")}</strong>
                <span class="packSolaresLabel"> ${cantSolares === 1 ? 'solar nuevo' : 'solares nuevos'}</span>
            </div>`;
        }

        let fechaDisplay = "";
        if (pack.fechaISO) {
            const partes = pack.fechaISO.split("-");
            const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
            const fechaBonita = d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            fechaDisplay = `📅 ${fechaBonita}`;
        } else if (pack.fecha) {
            fechaDisplay = `📅 ${pack.fecha}`;
        }

        return `<div class="packCardEstat" data-id="${pack.id}" data-tipo="${pack.tipoPack}">
            <div class="packCardImgWrap">
                <img
                    src="${pack.rutaImg}"
                    alt="${pack.nombre}"
                    class="packIconoEstat"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                >
                <div class="packIconoFallback" style="display:none;">📦</div>
            </div>
            <div class="packCardInfo">
                <div class="packCardCabecera">
                    ${badgeId}
                    <span class="packNombreEstat">${pack.nombre}</span>
                    <div class="packBadges">${badgeTipo}</div>
                </div>
                ${notaExtra}
                <div class="packCardDatos">
                    ${fechaDisplay ? `<div class="packFechaEstat">${fechaDisplay}</div>` : ""}
                    ${precioDisplay}
                    ${solaresHTML}
                    ${objetosHTML}
                </div>
            </div>
        </div>`;
    }).join("");
}

// ── Vista Gráficos ───────────────────────────────────────
function renderizarGraficos(packs) {
    dibujarGraficoLanzamientosYPrecios(packs);
    dibujarGraficoPorMeses(packs);
    dibujarGraficoMesesAno(packs);
    dibujarGraficoDiasSemana(packs);
    dibujarGraficoTemporal(packs);
    dibujarGraficoPastel(packs);
    dibujarGraficoPrecio(packs);
    dibujarGraficoSolaresMundos(packs);
    dibujarGraficoObjetos(packs);

    // Si hay un panel de detalle abierto, actualizarlo con los packs filtrados actuales
    actualizarDetalleLanzamientos();
}

// Helper: obtener contexto con soporte de zoom
function getCtx(id, numElementos = 0, minWidthPerElem = 75, chartKey = "") {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const isDark = document.body.classList.contains("modo-noche");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    let containerW = canvas.parentElement?.clientWidth || 560;
    const zoom = (chartKey && ESTAD.zoomFactor[chartKey]) ? ESTAD.zoomFactor[chartKey] : 1;

    if (numElementos > 0 && minWidthPerElem > 0) {
        const requiredW = (numElementos * minWidthPerElem + 100) * zoom;
        if (requiredW > containerW) {
            containerW = requiredW;
        }
    } else if (zoom !== 1) {
        containerW = containerW * zoom;
    }

    const cH = 320;
    canvas.style.width = containerW + "px";
    canvas.style.height = cH + "px";
    canvas.width = containerW * dpr;
    canvas.height = cH * dpr;
    ctx.scale(dpr, dpr);
    ctx._isDark = isDark;
    ctx._cW = containerW;
    ctx._cH = cH;
    return ctx;
}

function colorTexto(ctx) { return document.body.classList.contains("modo-noche") ? "#ebebeb" : "#111111"; }
function colorSubTexto(ctx) { return document.body.classList.contains("modo-noche") ? "rgba(220,220,240,0.75)" : "rgba(30,30,50,0.78)"; }
function colorFondoG(ctx) { return document.body.classList.contains("modo-noche") ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"; }
function colorLinea(ctx) { return document.body.classList.contains("modo-noche") ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)"; }

// ── Gráfico 1: Lanzamientos ordenados por fecha y precio ──────────────────
function dibujarGraficoLanzamientosYPrecios(packs) {
    const ctx = getCtx("graficoPorTipo", packs.length, 75, "porTipo");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    if (packs.length === 0) {
        dibujarVacio(ctx, W, H, "Sin packs que mostrar");
        return;
    }

    const maxPrecio = Math.max(...packs.map(p => p.precio), 1);
    const pad = { top: 28, right: 20, bottom: 65, left: 45 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    // Cuadrícula
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctx.beginPath();
        ctx.strokeStyle = colorLinea(ctx);
        ctx.lineWidth = 1;
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + aW, y);
        ctx.stroke();
        const val = (maxPrecio - (maxPrecio / 4) * i).toFixed(2);
        ctx.fillStyle = colorSubTexto(ctx);
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(val + "€", pad.left - 5, y + 4);
    }

    const n = packs.length;
    const barW = aW / n;
    const barPad = Math.max(2, barW * 0.18);

    if (!ESTAD.hitboxes) ESTAD.hitboxes = [];
    ESTAD.hitboxes = ESTAD.hitboxes.filter(h => h.chartId !== "graficoPorTipo");

    packs.forEach((pack, i) => {
        const x = pad.left + barW * i + barPad;
        const bW = Math.max(barW - barPad * 2, 2);
        const bH = (pack.precio / maxPrecio) * aH;
        const y = pad.top + aH - bH;
        const color = COLORES_TIPO[pack.tipoPack] || "#2563EB";

        const grd = ctx.createLinearGradient(0, y, 0, y + bH);
        grd.addColorStop(0, colorConAlpha(color, "FF"));
        grd.addColorStop(1, colorConAlpha(color, "66"));
        ctx.fillStyle = grd;
        roundRect(ctx, x, y, bW, bH, 4);
        ctx.fill();

        const fs = Math.max(8, Math.min(10, bW * 0.55));
        ctx.fillStyle = colorTexto(ctx);
        ctx.font = `bold ${fs}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        const precioTxt = pack.precio === 0 ? "0€" : pack.precio + "€";
        ctx.fillText(precioTxt, x + bW / 2, y - 5);

        // Icono del pack en el eje X
        const iconSize = Math.max(22, Math.min(36, bW));
        const iconX = x + (bW - iconSize) / 2;
        const iconY = pad.top + aH + 10;

        const img = obtenerImagenPack(pack.rutaImg, () => {
            requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
        });

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = colorConAlpha(color, "44");
            roundRect(ctx, iconX, iconY, iconSize, iconSize, 6);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = colorTexto(ctx);
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(pack.id, iconX + iconSize / 2, iconY + iconSize / 2 + 3);
        }

        // Registrar hitbox para tooltip hover
        ESTAD.hitboxes.push({
            chartId: "graficoPorTipo",
            x1: x,
            x2: x + bW,
            y1: pad.top,
            y2: pad.top + aH + iconSize + 15,
            pack: pack
        });
    });
}

// ── Gráfico 2: Packs y Precio total por Mes (NUEVO) ──────────────────
function dibujarGraficoPorMeses(packs) {
    const conFecha = packs.filter(p => p.fechaISO);
    const ctx = getCtx("graficoPorMeses", 0, 0, "porMeses");
    if (!ctx) return;

    if (conFecha.length === 0) {
        dibujarVacio(ctx, ctx._cW, ctx._cH, "Sin datos de fecha en el intervalo seleccionado");
        return;
    }

    // Agrupar por mes (YYYY-MM)
    const porMes = {};
    conFecha.forEach(p => {
        const keyMes = p.fechaISO.substring(0, 7); // YYYY-MM
        if (!porMes[keyMes]) {
            porMes[keyMes] = {
                key: keyMes,
                precioTotal: 0,
                porTipo: {}
            };
        }
        porMes[keyMes].precioTotal += p.precio;
        const tipo = p.tipoPack;
        porMes[keyMes].porTipo[tipo] = (porMes[keyMes].porTipo[tipo] || 0) + 1;
    });

    const mesesClaves = Object.keys(porMes).sort();

    // Re-obtener ctx con ancho adecuado por cantidad de meses
    const ctxMeses = getCtx("graficoPorMeses", mesesClaves.length, 90, "porMeses");
    if (!ctxMeses) return;
    const W = ctxMeses._cW, H = ctxMeses._cH;
    ctxMeses.clearRect(0, 0, W, H);

    const pad = { top: 40, right: 25, bottom: 60, left: 50 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctxMeses.fillStyle = colorFondoG(ctxMeses);
    ctxMeses.fillRect(0, 0, W, H);

    const maxPacksPorMes = Math.max(...mesesClaves.map(m => {
        return Object.values(porMes[m].porTipo).reduce((sum, v) => sum + v, 0);
    }), 1);

    // Cuadrícula
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctxMeses.beginPath();
        ctxMeses.strokeStyle = colorLinea(ctxMeses);
        ctxMeses.lineWidth = 1;
        ctxMeses.moveTo(pad.left, y);
        ctxMeses.lineTo(pad.left + aW, y);
        ctxMeses.stroke();
        const val = Math.round(maxPacksPorMes - (maxPacksPorMes / 4) * i);
        ctxMeses.fillStyle = colorSubTexto(ctxMeses);
        ctxMeses.font = "10px 'Segoe UI', sans-serif";
        ctxMeses.textAlign = "right";
        ctxMeses.fillText(val + " packs", pad.left - 5, y + 4);
    }

    const n = mesesClaves.length;
    const mesW = aW / n;

    mesesClaves.forEach((keyMes, i) => {
        const mesData = porMes[keyMes];
        const xGrupo = pad.left + mesW * i;
        const tiposEnMes = Object.keys(mesData.porTipo);
        const subBarW = Math.max((mesW * 0.7) / tiposEnMes.length, 6);

        let totalPacksMes = 0;

        tiposEnMes.forEach((tipo, tIdx) => {
            const cant = mesData.porTipo[tipo];
            totalPacksMes += cant;
            const color = COLORES_TIPO[tipo] || "#2563EB";
            const bH = (cant / maxPacksPorMes) * aH;
            const bX = xGrupo + (mesW * 0.15) + (subBarW * tIdx);
            const bY = pad.top + aH - bH;

            const grd = ctxMeses.createLinearGradient(0, bY, 0, bY + bH);
            grd.addColorStop(0, colorConAlpha(color, "FF"));
            grd.addColorStop(1, colorConAlpha(color, "66"));
            ctxMeses.fillStyle = grd;
            roundRect(ctxMeses, bX, bY, subBarW - 2, bH, 3);
            ctxMeses.fill();

            // Cantidad dentro o arriba de la sub-barra
            ctxMeses.fillStyle = colorTexto(ctxMeses);
            ctxMeses.font = "bold 9px 'Segoe UI', sans-serif";
            ctxMeses.textAlign = "center";
            ctxMeses.fillText(cant, bX + (subBarW - 2) / 2, bY - 3);
        });

        // PRECIO TOTAL ENCIMA DEL MES
        ctxMeses.fillStyle = "var(--color-advertencia, #e67e22)";
        ctxMeses.font = "bold 11px 'Segoe UI', sans-serif";
        ctxMeses.textAlign = "center";
        const precioTxt = mesData.precioTotal === 0 ? "Gratis" : formatearEuros(mesData.precioTotal);
        ctxMeses.fillText(precioTxt, xGrupo + mesW / 2, pad.top - 12);

        // Etiqueta del mes (MM/YYYY)
        const [yyyy, mm] = keyMes.split("-");
        const nombreMesShort = NOMBRES_MESES[parseInt(mm, 10) - 1] || mm;
        ctxMeses.fillStyle = colorTexto(ctxMeses);
        ctxMeses.font = "bold 10px 'Segoe UI', sans-serif";
        ctxMeses.textAlign = "center";
        ctxMeses.fillText(`${nombreMesShort} ${yyyy}`, xGrupo + mesW / 2, pad.top + aH + 20);
    });
}

const NOMBRES_MESES_COMPLETOS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const NOMBRES_DIAS_SEMANA = [
    "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

const ORDEN_STACK_CATEGORIAS = [
    "Expansión", "Contenido", "Accesorios", "Kits", "Packs gratuitos", "Juego Base"
];

// ── Gráfico NUEVO: Lanzamientos por mes del año (12 meses - Barras apiladas) ──
function dibujarGraficoMesesAno(packs) {
    const conFecha = packs.filter(p => p.fechaISO);
    const ctx = getCtx("graficoMesesAno", 12, 58, "mesesAno");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    if (conFecha.length === 0) {
        dibujarVacio(ctx, W, H, "Sin datos de fecha en el intervalo seleccionado");
        return;
    }

    // Inicializar 12 meses
    const meses = Array.from({ length: 12 }, (_, i) => ({
        index: i,
        nombre: NOMBRES_MESES[i] || "",
        nombreCompleto: NOMBRES_MESES_COMPLETOS[i] || "",
        total: 0,
        porTipo: {}
    }));

    conFecha.forEach(p => {
        const partes = p.fechaISO.split("-");
        const mm = parseInt(partes[1], 10);
        if (mm >= 1 && mm <= 12) {
            const mIdx = mm - 1;
            meses[mIdx].total++;
            const t = p.tipoPack || "Otro";
            meses[mIdx].porTipo[t] = (meses[mIdx].porTipo[t] || 0) + 1;
        }
    });

    const maxTotalMes = Math.max(...meses.map(m => m.total), 1);
    const pad = { top: 38, right: 20, bottom: 65, left: 45 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    // Cuadrícula Y
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctx.beginPath();
        ctx.strokeStyle = colorLinea(ctx);
        ctx.lineWidth = 1;
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + aW, y);
        ctx.stroke();
        const val = Math.round(maxTotalMes - (maxTotalMes / 4) * i);
        ctx.fillStyle = colorSubTexto(ctx);
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(val + (val === 1 ? " pack" : " packs"), pad.left - 5, y + 4);
    }

    if (!ESTAD.hitboxes) ESTAD.hitboxes = [];
    ESTAD.hitboxes = ESTAD.hitboxes.filter(h => h.chartId !== "graficoMesesAno");

    const barW = aW / 12;
    const barPad = Math.max(3, barW * 0.16);
    const bW = Math.max(barW - barPad * 2, 4);

    meses.forEach((mesData, i) => {
        const x = pad.left + barW * i + barPad;
        let currY = pad.top + aH;

        const tiposActivos = ORDEN_STACK_CATEGORIAS.filter(t => (mesData.porTipo[t] || 0) > 0);
        const desglose = [];

        tiposActivos.forEach((tipo, tIdx) => {
            const cant = mesData.porTipo[tipo];
            const color = COLORES_TIPO[tipo] || "#2563EB";
            desglose.push({ tipo, cant, color });

            const segH = (cant / maxTotalMes) * aH;
            const segY = currY - segH;

            const grd = ctx.createLinearGradient(0, segY, 0, segY + segH);
            grd.addColorStop(0, colorConAlpha(color, "FF"));
            grd.addColorStop(1, colorConAlpha(color, "77"));
            ctx.fillStyle = grd;

            const esCima = (tIdx === tiposActivos.length - 1);
            if (esCima && segH >= 4) {
                roundRect(ctx, x, segY, bW, segH, 4);
            } else {
                ctx.beginPath();
                ctx.rect(x, segY, bW, segH);
                ctx.closePath();
            }
            ctx.fill();

            // Línea separadora sutil si hay varios segmentos
            if (tiposActivos.length > 1 && !esCima) {
                ctx.strokeStyle = ctx._isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, segY);
                ctx.lineTo(x + bW, segY);
                ctx.stroke();
            }

            // Número dentro del segmento si cabe
            if (segH >= 15 && bW >= 14) {
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = 3;
                ctx.font = "bold 9px 'Segoe UI', sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(cant, x + bW / 2, segY + segH / 2 + 3);
                ctx.shadowBlur = 0;
            }

            currY = segY;
        });

        // Total encima de la barra apilada
        if (mesData.total > 0) {
            ctx.fillStyle = colorTexto(ctx);
            ctx.font = "bold 10px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(mesData.total, x + bW / 2, currY - 6);
        }

        // Resaltado si esta barra está activa en el panel desplegable
        const esSeleccionado = Boolean(ESTAD.detalleActivo && ESTAD.detalleActivo.chartId === "graficoMesesAno" && ESTAD.detalleActivo.valor === i);
        if (esSeleccionado) {
            ctx.save();
            ctx.strokeStyle = ctx._isDark ? "#3aeded" : "#2563EB";
            ctx.lineWidth = 2.5;
            const fullBarH = Math.max(pad.top + aH - currY, 6);
            roundRect(ctx, x - 2, currY - 2, bW + 4, fullBarH + 4, 6);
            ctx.stroke();
            ctx.restore();
        }

        // Etiqueta del mes en eje X
        ctx.fillStyle = esSeleccionado ? (ctx._isDark ? "#3aeded" : "#2563EB") : colorTexto(ctx);
        ctx.font = esSeleccionado ? "bold 11px 'Segoe UI', sans-serif" : "bold 10px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(mesData.nombre, x + bW / 2, pad.top + aH + 18);

        // Hitbox para tooltip hover y click
        ESTAD.hitboxes.push({
            chartId: "graficoMesesAno",
            x1: x - 2,
            x2: x + bW + 2,
            y1: pad.top,
            y2: pad.top + aH + 28,
            tipo: "mes",
            valor: i,
            tituloRaw: mesData.nombreCompleto,
            titulo: `📅 ${mesData.nombreCompleto}`,
            total: mesData.total,
            desglose: desglose
        });
    });

    // Leyenda inferior de categorías
    dibujarLeyendaStack(ctx, W, H, pad);
}

// ── Gráfico NUEVO: Lanzamientos por día de la semana (7 días - Barras apiladas) ──
function dibujarGraficoDiasSemana(packs) {
    const conFecha = packs.filter(p => p.fechaISO);
    const ctx = getCtx("graficoDiasSemana", 7, 75, "diasSemana");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    if (conFecha.length === 0) {
        dibujarVacio(ctx, W, H, "Sin datos de fecha en el intervalo seleccionado");
        return;
    }

    // Inicializar 7 días (Lunes=0 ... Domingo=6)
    const dias = Array.from({ length: 7 }, (_, i) => ({
        index: i,
        nombre: NOMBRES_DIAS_SEMANA[i] || "",
        total: 0,
        porTipo: {}
    }));

    conFecha.forEach(p => {
        const partes = p.fechaISO.split("-");
        const yyyy = parseInt(partes[0], 10);
        const mm = parseInt(partes[1], 10);
        const dd = parseInt(partes[2], 10);

        // Fecha de calendario a mediodía local para evitar cualquier salto horario
        const fechaCal = new Date(yyyy, mm - 1, dd, 12, 0, 0);
        const diaIdx = (fechaCal.getDay() + 6) % 7; // 0=Lunes ... 6=Domingo

        if (diaIdx >= 0 && diaIdx < 7) {
            dias[diaIdx].total++;
            const t = p.tipoPack || "Otro";
            dias[diaIdx].porTipo[t] = (dias[diaIdx].porTipo[t] || 0) + 1;
        }
    });

    const maxTotalDia = Math.max(...dias.map(d => d.total), 1);
    const pad = { top: 38, right: 20, bottom: 65, left: 45 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    // Cuadrícula Y
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctx.beginPath();
        ctx.strokeStyle = colorLinea(ctx);
        ctx.lineWidth = 1;
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + aW, y);
        ctx.stroke();
        const val = Math.round(maxTotalDia - (maxTotalDia / 4) * i);
        ctx.fillStyle = colorSubTexto(ctx);
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(val + (val === 1 ? " pack" : " packs"), pad.left - 5, y + 4);
    }

    if (!ESTAD.hitboxes) ESTAD.hitboxes = [];
    ESTAD.hitboxes = ESTAD.hitboxes.filter(h => h.chartId !== "graficoDiasSemana");

    const barW = aW / 7;
    const barPad = Math.max(8, barW * 0.22);
    const bW = Math.max(barW - barPad * 2, 8);

    dias.forEach((diaData, i) => {
        const x = pad.left + barW * i + barPad;
        let currY = pad.top + aH;

        const tiposActivos = ORDEN_STACK_CATEGORIAS.filter(t => (diaData.porTipo[t] || 0) > 0);
        const desglose = [];

        tiposActivos.forEach((tipo, tIdx) => {
            const cant = diaData.porTipo[tipo];
            const color = COLORES_TIPO[tipo] || "#2563EB";
            desglose.push({ tipo, cant, color });

            const segH = (cant / maxTotalDia) * aH;
            const segY = currY - segH;

            const grd = ctx.createLinearGradient(0, segY, 0, segY + segH);
            grd.addColorStop(0, colorConAlpha(color, "FF"));
            grd.addColorStop(1, colorConAlpha(color, "77"));
            ctx.fillStyle = grd;

            const esCima = (tIdx === tiposActivos.length - 1);
            if (esCima && segH >= 4) {
                roundRect(ctx, x, segY, bW, segH, 5);
            } else {
                ctx.beginPath();
                ctx.rect(x, segY, bW, segH);
                ctx.closePath();
            }
            ctx.fill();

            if (tiposActivos.length > 1 && !esCima) {
                ctx.strokeStyle = ctx._isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, segY);
                ctx.lineTo(x + bW, segY);
                ctx.stroke();
            }

            if (segH >= 15 && bW >= 14) {
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "rgba(0,0,0,0.6)";
                ctx.shadowBlur = 3;
                ctx.font = "bold 10px 'Segoe UI', sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(cant, x + bW / 2, segY + segH / 2 + 3);
                ctx.shadowBlur = 0;
            }

            currY = segY;
        });

        // Total encima de la barra apilada
        if (diaData.total > 0) {
            ctx.fillStyle = colorTexto(ctx);
            ctx.font = "bold 11px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(diaData.total, x + bW / 2, currY - 6);
        }

        // Resaltado si esta barra está activa en el panel desplegable
        const esSeleccionado = Boolean(ESTAD.detalleActivo && ESTAD.detalleActivo.chartId === "graficoDiasSemana" && ESTAD.detalleActivo.valor === i);
        if (esSeleccionado) {
            ctx.save();
            ctx.strokeStyle = ctx._isDark ? "#3aeded" : "#2563EB";
            ctx.lineWidth = 2.5;
            const fullBarH = Math.max(pad.top + aH - currY, 6);
            roundRect(ctx, x - 2, currY - 2, bW + 4, fullBarH + 4, 6);
            ctx.stroke();
            ctx.restore();
        }

        // Etiqueta del día en eje X
        ctx.fillStyle = esSeleccionado ? (ctx._isDark ? "#3aeded" : "#2563EB") : colorTexto(ctx);
        ctx.font = esSeleccionado ? "bold 12px 'Segoe UI', sans-serif" : "bold 11px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(diaData.nombre, x + bW / 2, pad.top + aH + 18);

        // Hitbox para tooltip hover y click
        ESTAD.hitboxes.push({
            chartId: "graficoDiasSemana",
            x1: x - 4,
            x2: x + bW + 4,
            y1: pad.top,
            y2: pad.top + aH + 28,
            tipo: "dia",
            valor: i,
            tituloRaw: diaData.nombre,
            titulo: `📆 ${diaData.nombre}`,
            total: diaData.total,
            desglose: desglose
        });
    });

    // Leyenda inferior de categorías
    dibujarLeyendaStack(ctx, W, H, pad);
}

// Helper: Leyenda horizontal para gráficos de barras apiladas
function dibujarLeyendaStack(ctx, W, H, pad) {
    const tipos = ORDEN_STACK_CATEGORIAS;
    const leyY = H - 12;

    ctx.font = "9.5px 'Segoe UI', sans-serif";
    const items = tipos.map(t => ({
        tipo: t,
        color: COLORES_TIPO[t] || "#2563EB",
        w: ctx.measureText(t).width + 16
    }));

    const totalW = items.reduce((s, i) => s + i.w + 8, 0) - 8;
    let startX = Math.max(pad.left, (W - totalW) / 2);

    items.forEach(item => {
        ctx.fillStyle = item.color;
        roundRect(ctx, startX, leyY - 8, 9, 9, 2);
        ctx.fill();

        ctx.fillStyle = colorSubTexto(ctx);
        ctx.font = "9.5px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(item.tipo, startX + 13, leyY);

        startX += item.w + 8;
    });
}

// ── Detalle desplegable de lanzamientos al pulsar barras ───────

function mostrarDetalleLanzamientos(chartId, tipo, valor, titulo) {
    ESTAD.detalleActivo = { chartId, tipo, valor, titulo };

    const panelId = chartId === "graficoMesesAno" ? "panelDetalleMesesAno" : "panelDetalleDiasSemana";
    const panel = document.getElementById(panelId);
    const otroPanelId = chartId === "graficoMesesAno" ? "panelDetalleDiasSemana" : "panelDetalleMesesAno";
    const otroPanel = document.getElementById(otroPanelId);

    if (otroPanel) otroPanel.style.display = "none";
    if (!panel) return;

    // Filtrar packs exclusivamente a partir de ESTAD.packsFiltrados
    let packsDetalle = [];
    if (tipo === "mes") {
        packsDetalle = ESTAD.packsFiltrados.filter(p => {
            if (!p.fechaISO) return false;
            const partes = p.fechaISO.split("-");
            return parseInt(partes[1], 10) - 1 === valor;
        });
    } else if (tipo === "dia") {
        packsDetalle = ESTAD.packsFiltrados.filter(p => {
            if (!p.fechaISO) return false;
            const [y, m, d] = p.fechaISO.split("-").map(Number);
            const fechaCal = new Date(y, m - 1, d, 12, 0, 0);
            return (fechaCal.getDay() + 6) % 7 === valor;
        });
    }

    // Ordenar cronológicamente
    packsDetalle.sort((a, b) => (a.fechaISO || "").localeCompare(b.fechaISO || ""));

    const mapaSolares = obtenerMapaConteoSolares();

    let contenidoHTML = "";
    if (packsDetalle.length === 0) {
        contenidoHTML = `<div class="estatDetalleVacio">
            <span style="font-size:1.8rem; opacity:0.8;">ℹ️</span>
            <div><strong>Sin lanzamientos</strong></div>
            <div style="opacity:0.75; font-size:0.85rem;">No hay packs que coincidan con los filtros seleccionados para este ${tipo === "mes" ? "mes" : "día"}.</div>
        </div>`;
    } else {
        const itemsHTML = packsDetalle.map(pack => {
            const colorTipo = COLORES_TIPO[pack.tipoPack] || "#2563EB";
            const badgeCodigo = pack.codigoInterno || pack.id;
            const badgeId = `<span class="packBadgeId" style="background:${colorTipo}; color:#ffffff; border-color:${colorTipo}; font-size:0.75rem; padding:2px 8px;">${badgeCodigo}</span>`;
            const badgeTipo = `<span class="packBadgeTipo" style="background:${colorConAlpha(colorTipo, "22")}; color:${colorTipo}; border:1px solid ${colorConAlpha(colorTipo, "55")}; font-size:0.7rem; padding:2px 8px;">${pack.tipoPack}</span>`;

            let precioDisplay = "";
            if (pack.esJuegoBase || pack.precio === 0) {
                precioDisplay = `<span class="packPrecio packPrecioGratis" style="font-size:0.82rem; padding:2px 8px;">Gratis</span>`;
            } else {
                precioDisplay = `<span class="packPrecio" style="font-size:0.82rem; padding:2px 8px;">${formatearEuros(pack.precio)}</span>`;
            }

            let fechaDisplay = "";
            if (pack.fechaISO) {
                const partes = pack.fechaISO.split("-");
                const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10), 12, 0, 0);
                const fechaBonita = d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
                fechaDisplay = `📅 ${fechaBonita}`;
            } else if (pack.fecha) {
                fechaDisplay = `📅 ${pack.fecha}`;
            }

            const cantSolares = mapaSolares.get(pack.id) || 0;
            let solaresHTML = "";
            if (cantSolares > 0) {
                solaresHTML = `<div class="packSolares" style="font-size:0.78rem; padding:2px 8px;">
                    <span class="packSolaresIcono">🏡</span>
                    <strong class="packSolaresNum">${cantSolares}</strong>
                    <span class="packSolaresLabel"> ${cantSolares === 1 ? 'solar' : 'solares'}</span>
                </div>`;
            }

            let objetosHTML = "";
            if (pack.objetos !== null) {
                objetosHTML = `<div class="packObjetos" style="font-size:0.78rem; padding:2px 8px;">
                    <span class="packObjetosIcono">🏠</span>
                    <strong class="packObjetosNum">${pack.objetos.toLocaleString("es-ES")}</strong>
                    <span class="packObjetosLabel"> objetos</span>
                </div>`;
            }

            return `<div class="estatDetallePackCard">
                <div class="estatDetallePackImgWrap">
                    <img
                        src="${pack.rutaImg}"
                        alt="${pack.nombre}"
                        class="estatDetallePackImg"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                    >
                    <div class="packIconoFallback" style="display:none; font-size:1.3rem;">📦</div>
                </div>
                <div class="estatDetallePackInfo">
                    <div class="estatDetallePackRowTop">
                        ${badgeId}
                        <span class="estatDetallePackNombre">${pack.nombre}</span>
                        <div style="margin-left:auto;">${badgeTipo}</div>
                    </div>
                    <div class="estatDetallePackRowBottom">
                        <span class="estatDetallePackFecha">${fechaDisplay}</span>
                        <div>${precioDisplay}</div>
                        ${solaresHTML}
                        ${objetosHTML}
                    </div>
                </div>
            </div>`;
        }).join("");

        contenidoHTML = `<div class="estatDetalleLista">${itemsHTML}</div>`;
    }

    const iconoTitulo = tipo === "mes" ? "📅 " : "📆 ";
    panel.innerHTML = `
        <div class="estatDetalleHeader">
            <div class="estatDetalleTituloWrap">
                <h4 class="estatDetalleTitulo">${iconoTitulo}${titulo}</h4>
                <span class="estatDetalleBadgeCount">${packsDetalle.length} ${packsDetalle.length === 1 ? 'lanzamiento encontrado' : 'lanzamientos encontrados'}</span>
            </div>
            <button type="button" class="estatDetalleBtnCerrar" onclick="cerrarDetalleLanzamientos('${chartId}')" title="Cerrar detalle">✕</button>
        </div>
        ${contenidoHTML}
    `;

    panel.style.display = "flex";
}

function cerrarDetalleLanzamientos(chartId) {
    if (ESTAD.detalleActivo && ESTAD.detalleActivo.chartId === chartId) {
        ESTAD.detalleActivo = null;
    }
    const panelId = chartId === "graficoMesesAno" ? "panelDetalleMesesAno" : "panelDetalleDiasSemana";
    const panel = document.getElementById(panelId);
    if (panel) panel.style.display = "none";

    renderizarGraficos(ESTAD.packsFiltrados);
}

function actualizarDetalleLanzamientos() {
    if (!ESTAD.detalleActivo) return;
    const { chartId, tipo, valor, titulo } = ESTAD.detalleActivo;
    const panelId = chartId === "graficoMesesAno" ? "panelDetalleMesesAno" : "panelDetalleDiasSemana";
    const panel = document.getElementById(panelId);
    if (panel && panel.style.display !== "none") {
        mostrarDetalleLanzamientos(chartId, tipo, valor, titulo);
    }
}

// ── Gráfico 3: Multilínea temporal por tipo y global ──────────────────
function dibujarGraficoTemporal(packs) {
    const conFecha = packs.filter(p => p.fechaISO || p.anioLanzamiento);
    const ctx = getCtx("graficoTemporal", 0, 0, "temporal");
    if (!ctx) return;

    if (conFecha.length === 0) {
        dibujarVacio(ctx, ctx._cW, ctx._cH, "Sin datos de fecha");
        return;
    }

    // Datos por año y por tipo
    const aniosSet = new Set();
    const datosPorAnioYTipo = {}; // { anio: { Total: X, Expansión: Y, ... } }

    conFecha.forEach(p => {
        const anio = p.anioLanzamiento || (p.fechaISO ? p.fechaISO.substring(0, 4) : "Desc.");
        aniosSet.add(anio);
        if (!datosPorAnioYTipo[anio]) {
            datosPorAnioYTipo[anio] = { Total: 0 };
        }
        datosPorAnioYTipo[anio].Total = (datosPorAnioYTipo[anio].Total || 0) + 1;
        datosPorAnioYTipo[anio][p.tipoPack] = (datosPorAnioYTipo[anio][p.tipoPack] || 0) + 1;
    });

    const anios = Array.from(aniosSet).sort();

    // Re-obtener ctx con ancho responsivo
    const ctxTemp = getCtx("graficoTemporal", anios.length, 65, "temporal");
    if (!ctxTemp) return;
    const W = ctxTemp._cW, H = ctxTemp._cH;
    ctxTemp.clearRect(0, 0, W, H);

    // Renderizar controles de líneas si es la primera vez o cambiaron los tipos
    renderizarControlesLineasTemporal();

    const pad = { top: 35, right: 30, bottom: 45, left: 45 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctxTemp.fillStyle = colorFondoG(ctxTemp);
    ctxTemp.fillRect(0, 0, W, H);

    // Calcular máximo valor entre las líneas activas
    let maxVal = 1;
    anios.forEach(a => {
        Object.keys(ESTAD.lineasVisiblesTemporal).forEach(lineKey => {
            if (ESTAD.lineasVisiblesTemporal[lineKey]) {
                const val = datosPorAnioYTipo[a][lineKey] || 0;
                if (val > maxVal) maxVal = val;
            }
        });
    });

    // Cuadrícula Y
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctxTemp.beginPath();
        ctxTemp.strokeStyle = colorLinea(ctxTemp);
        ctxTemp.lineWidth = 1;
        ctxTemp.moveTo(pad.left, y);
        ctxTemp.lineTo(pad.left + aW, y);
        ctxTemp.stroke();
        const val = Math.round(maxVal - (maxVal / 4) * i);
        ctxTemp.fillStyle = colorSubTexto(ctxTemp);
        ctxTemp.font = "10px 'Segoe UI', sans-serif";
        ctxTemp.textAlign = "right";
        ctxTemp.fillText(val, pad.left - 5, y + 4);
    }

    const n = anios.length;

    // Dibujar cada línea activa
    const lineasADibujar = Object.keys(ESTAD.lineasVisiblesTemporal).filter(k => ESTAD.lineasVisiblesTemporal[k]);

    lineasADibujar.forEach(lineKey => {
        let colorLine = "#2563EB";
        let isTotal = false;

        if (lineKey === "Total") {
            isTotal = true;
            colorLine = ctxTemp._isDark ? "#ffffff" : "#000000";
        } else {
            colorLine = COLORES_TIPO[lineKey] || "#2563EB";
        }

        const pts = anios.map((a, i) => {
            const val = datosPorAnioYTipo[a][lineKey] || 0;
            return {
                x: pad.left + (n > 1 ? (aW / (n - 1)) * i : aW / 2),
                y: pad.top + aH - (val / maxVal) * aH,
                v: val,
                a
            };
        });

        // Dibujar trazo
        ctxTemp.beginPath();
        ctxTemp.strokeStyle = colorLine;
        ctxTemp.lineWidth = isTotal ? 3 : 2;
        if (isTotal) {
            ctxTemp.setLineDash([5, 4]);
        } else {
            ctxTemp.setLineDash([]);
        }
        ctxTemp.lineJoin = "round";
        pts.forEach((p, i) => i === 0 ? ctxTemp.moveTo(p.x, p.y) : ctxTemp.lineTo(p.x, p.y));
        ctxTemp.stroke();
        ctxTemp.setLineDash([]);

        // Puntos
        pts.forEach(p => {
            if (p.v > 0 || isTotal) {
                ctxTemp.beginPath();
                ctxTemp.arc(p.x, p.y, isTotal ? 4.5 : 3.5, 0, Math.PI * 2);
                ctxTemp.fillStyle = colorLine;
                ctxTemp.fill();
                ctxTemp.strokeStyle = ctxTemp._isDark ? "#111" : "#fff";
                ctxTemp.lineWidth = 1.5;
                ctxTemp.stroke();

                if (p.v > 0) {
                    ctxTemp.fillStyle = colorTexto(ctxTemp);
                    ctxTemp.font = `${isTotal ? "bold 10px" : "9px"} 'Segoe UI', sans-serif`;
                    ctxTemp.textAlign = "center";
                    ctxTemp.fillText(p.v, p.x, p.y - 7);
                }
            }
        });
    });

    // Etiquetas X (años)
    anios.forEach((a, i) => {
        const x = pad.left + (n > 1 ? (aW / (n - 1)) * i : aW / 2);
        ctxTemp.fillStyle = colorSubTexto(ctxTemp);
        ctxTemp.font = "bold 10px 'Segoe UI', sans-serif";
        ctxTemp.textAlign = "center";
        ctxTemp.fillText(a, x, pad.top + aH + 18);
    });
}

// Renderiza los botones de toggle para activar/desactivar cada línea del gráfico temporal
function renderizarControlesLineasTemporal() {
    const cont = document.getElementById("estatControlesLineasTemporal");
    if (!cont) return;

    const lineas = ["Total", "Expansión", "Contenido", "Accesorios", "Kits", "Packs gratuitos", "Juego Base"];
    const isDark = document.body.classList.contains("modo-noche");

    cont.innerHTML = lineas.map(lineKey => {
        const activa = ESTAD.lineasVisiblesTemporal[lineKey] !== false;
        let colorDot = COLORES_TIPO[lineKey] || "#2563EB";
        if (lineKey === "Total") colorDot = isDark ? "#ffffff" : "#000000";

        return `<button type="button" class="estatBtnLinea ${activa ? "activa" : ""}" data-line="${lineKey}">
            <span class="estatColorDot" style="background:${colorDot};"></span>
            <span>${lineKey}</span>
        </button>`;
    }).join("");

    cont.querySelectorAll(".estatBtnLinea").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const lineKey = btn.getAttribute("data-line");
            ESTAD.lineasVisiblesTemporal[lineKey] = !ESTAD.lineasVisiblesTemporal[lineKey];
            renderizarControlesLineasTemporal();
            dibujarGraficoTemporal(ESTAD.packsFiltrados);
        });
    });
}

// ── Gráfico 4: Distribución por número de packs por categoría ──────
function dibujarGraficoPastel(packs) {
    const ctx = getCtx("graficoPastel");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    const porTipo = {};
    for (const p of packs) porTipo[p.tipoPack] = (porTipo[p.tipoPack] || 0) + 1;
    const tipos = Object.keys(porTipo).sort((a, b) => porTipo[b] - porTipo[a]);
    const valores = tipos.map(t => porTipo[t]);
    const total = valores.reduce((a, b) => a + b, 0);

    if (total === 0) { dibujarVacio(ctx, W, H, "Sin datos"); return; }

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    if (!ESTAD.donutSlices) ESTAD.donutSlices = [];
    ESTAD.donutSlices = ESTAD.donutSlices.filter(s => s.chartId !== "graficoPastel");

    // Posición del rosco y de la leyenda
    const cx = Math.min(W * 0.28, 125);
    const cy = H / 2;
    const radio = Math.min(cx - 15, H * 0.38);

    let ang = -Math.PI / 2;
    tipos.forEach((tipo, i) => {
        const frac = valores[i] / total;
        const angFin = ang + frac * Math.PI * 2;
        const color = COLORES_TIPO[tipo] || "#2563EB";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radio, ang, angFin);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ESTAD.donutSlices.push({
            chartId: "graficoPastel",
            cx, cy,
            innerR: radio * 0.5,
            outerR: radio,
            angInicio: ang,
            angFin: angFin,
            tipo,
            cantPacks: valores[i],
            totalPacks: total,
            pct: ((valores[i] / total) * 100).toFixed(1).replace(".0", ""),
            color
        });

        ang = angFin;
    });

    // Donut central
    ctx.beginPath();
    ctx.arc(cx, cy, radio * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = ctx._isDark ? "rgba(25,25,35,0.97)" : "rgba(245,245,245,0.97)";
    ctx.fill();
    ctx.fillStyle = colorTexto(ctx);
    ctx.font = `bold 18px 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(total, cx, cy + 5);
    ctx.font = `10px 'Segoe UI', sans-serif`;
    ctx.fillStyle = colorSubTexto(ctx);
    ctx.fillText("packs", cx, cy + 18);

    // Leyenda lateral
    const leyX = cx + radio + 18;
    let leyY = H / 2 - (tipos.length * 22) / 2;
    tipos.forEach((tipo, i) => {
        ctx.fillStyle = COLORES_TIPO[tipo] || "#2563EB";
        roundRect(ctx, leyX, leyY, 11, 11, 3);
        ctx.fill();
        ctx.fillStyle = colorTexto(ctx);
        ctx.font = "10.5px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        const pct = Math.round((valores[i] / total) * 100);
        ctx.fillText(`${tipo}: ${valores[i]} (${pct}%)`, leyX + 16, leyY + 9);
        leyY += 22;
    });
}

// ── Gráfico NUEVO: Distribución por precio acumulado por categoría ──────
function dibujarGraficoPrecio(packs) {
    const ctx = getCtx("graficoPrecio");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    const precioPorTipo = {};
    const cantidadPorTipo = {};
    let totalPrecio = 0;

    packs.forEach(p => {
        const t = p.tipoPack || "Otro";
        const precio = (typeof p.precio === "number" && !isNaN(p.precio)) ? p.precio : 0;
        precioPorTipo[t] = (precioPorTipo[t] || 0) + precio;
        cantidadPorTipo[t] = (cantidadPorTipo[t] || 0) + 1;
        totalPrecio += precio;
    });

    if (totalPrecio === 0) {
        dibujarVacio(ctx, W, H, "Sin costes en la selección actual");
        return;
    }

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    if (!ESTAD.donutSlices) ESTAD.donutSlices = [];
    ESTAD.donutSlices = ESTAD.donutSlices.filter(s => s.chartId !== "graficoPrecio");

    // Solo tipos con precio > 0 para los segmentos del rosco
    const tiposConPrecio = Object.keys(precioPorTipo).filter(t => precioPorTipo[t] > 0);
    tiposConPrecio.sort((a, b) => precioPorTipo[b] - precioPorTipo[a]);

    // Posición del rosco y de la leyenda (idéntico a graficoPastel)
    const cx = Math.min(W * 0.28, 125);
    const cy = H / 2;
    const radio = Math.min(cx - 15, H * 0.38);

    let ang = -Math.PI / 2;
    tiposConPrecio.forEach((tipo) => {
        const frac = precioPorTipo[tipo] / totalPrecio;
        const angFin = ang + frac * Math.PI * 2;
        const color = COLORES_TIPO[tipo] || "#2563EB";

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radio, ang, angFin);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ESTAD.donutSlices.push({
            chartId: "graficoPrecio",
            cx, cy,
            innerR: radio * 0.5,
            outerR: radio,
            angInicio: ang,
            angFin: angFin,
            tipo,
            precio: precioPorTipo[tipo],
            totalPrecio,
            pct: ((precioPorTipo[tipo] / totalPrecio) * 100).toFixed(1).replace(".0", ""),
            cantPacks: cantidadPorTipo[tipo] || 0,
            color
        });

        ang = angFin;
    });

    // Donut central con coste total
    ctx.beginPath();
    ctx.arc(cx, cy, radio * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = ctx._isDark ? "rgba(25,25,35,0.97)" : "rgba(245,245,245,0.97)";
    ctx.fill();
    ctx.fillStyle = colorTexto(ctx);
    const strTotal = formatearEuros(totalPrecio);
    const fontSize = strTotal.length > 9 ? 12 : (strTotal.length > 7 ? 13 : 15);
    ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(strTotal, cx, cy + 4);
    ctx.font = `9.5px 'Segoe UI', sans-serif`;
    ctx.fillStyle = colorSubTexto(ctx);
    ctx.fillText("coste total", cx, cy + 17);

    // Leyenda lateral idéntica a graficoPastel
    const leyX = cx + radio + 18;
    let leyY = H / 2 - (tiposConPrecio.length * 22) / 2;
    tiposConPrecio.forEach((tipo) => {
        ctx.fillStyle = COLORES_TIPO[tipo] || "#2563EB";
        roundRect(ctx, leyX, leyY, 11, 11, 3);
        ctx.fill();
        ctx.fillStyle = colorTexto(ctx);
        ctx.font = "10.5px 'Segoe UI', sans-serif";
        ctx.textAlign = "left";
        const pct = ((precioPorTipo[tipo] / totalPrecio) * 100).toFixed(1).replace(".0", "");
        ctx.fillText(`${tipo}: ${formatearEuros(precioPorTipo[tipo])} (${pct}%)`, leyX + 16, leyY + 9);
        leyY += 22;
    });
}

// Captura del gráfico (Genera 2 imágenes: 1. Vista actual exacta / 2. Gráfico completo panorámico)
async function descargarCapturaGrafico(canvasId) {
    if (typeof html2canvas === "undefined") {
        console.error("html2canvas no está cargado.");
        return;
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const bloque = canvas.closest(".graficoBloque");
    if (!bloque) return;

    // Ocultar botón compartir durante capturas
    const btnCompartir = bloque.querySelector(".graficoBtnCompartir");
    const btnDisplay = btnCompartir ? btnCompartir.style.visibility : null;
    if (btnCompartir) btnCompartir.style.visibility = "hidden";

    // Añadir marcas de agua
    const marcaDer = document.createElement("div");
    marcaDer.textContent = "Creado por Ozono 96";
    Object.assign(marcaDer.style, { position: "absolute", bottom: "8px", right: "12px", fontSize: "0.8rem", opacity: "0.65", color: "var(--color-texto)", fontWeight: "bold", zIndex: "9999", pointerEvents: "none" });
    bloque.style.position = "relative";
    bloque.appendChild(marcaDer);

    const marcaIzq = document.createElement("div");
    marcaIzq.textContent = "LOT-LAB Sims 4";
    Object.assign(marcaIzq.style, { position: "absolute", bottom: "8px", left: "12px", fontSize: "0.8rem", opacity: "0.65", color: "var(--color-texto)", fontWeight: "bold", zIndex: "9999", pointerEvents: "none" });
    bloque.appendChild(marcaIzq);

    const scrollHoriz = bloque.querySelector(".graficoScrollHoriz");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
        // ── FOTO 1: Vista Actual exacta (tal y como se muestra en pantalla) ──
        await new Promise(r => setTimeout(r, 80));
        const resVistaActual = await html2canvas(bloque, {
            scale: 2,
            backgroundColor: null,
            useCORS: true,
        });
        descargarBlobDirecto(resVistaActual.toDataURL("image/png"), `LotLab_${canvasId}_vista_actual_${timestamp}.png`);

        // ── FOTO 2: Gráfico Completo panorámico — composición directa desde el canvas ──
        // El canvas ya contiene TODA la gráfica en memoria (el scroll solo recorta la vista).
        // Leemos canvas.width/height directamente y componemos sobre un canvas en memoria.
        {
            const isDarkMode = document.body.classList.contains("modo-noche");
            const dpr = window.devicePixelRatio || 1;

            // Dimensiones reales del gráfico completo (en píxeles físicos del canvas)
            const fullW = canvas.width;
            const fullH = canvas.height;
            // Dimensiones en CSS px
            const cssW = fullW / dpr;
            const cssH = fullH / dpr;

            // Padding visual (simula el .graficoBloque padding)
            const padH = 20, padTop = 60, padBot = 44;
            const outW = cssW + padH * 2;
            const outH = cssH + padTop + padBot;

            // Canvas de salida en alta resolución
            const out = document.createElement("canvas");
            out.width = outW * dpr * 2;   // scale: 2
            out.height = outH * dpr * 2;
            const oc = out.getContext("2d");
            oc.scale(dpr * 2, dpr * 2);

            // Fondo con bordes redondeados
            oc.fillStyle = isDarkMode ? "#1c1e26" : "#f0f2f5";
            oc.beginPath();
            if (oc.roundRect) {
                oc.roundRect(0, 0, outW, outH, 14);
            } else {
                oc.rect(0, 0, outW, outH);
            }
            oc.fill();

            // Título del gráfico
            const titleEl = bloque.querySelector(".graficoTitulo");
            const titleText = titleEl ? titleEl.textContent.trim() : "";
            oc.fillStyle = isDarkMode ? "#ebebeb" : "#111111";
            oc.font = "bold 15px 'Segoe UI', Arial, sans-serif";
            oc.textAlign = "left";
            oc.fillText(titleText, padH, padTop - 18);

            // Gráfico completo
            oc.drawImage(canvas, 0, 0, fullW, fullH, padH, padTop, cssW, cssH);

            // Marca de agua izquierda
            oc.fillStyle = isDarkMode ? "rgba(235,235,255,0.55)" : "rgba(30,30,50,0.55)";
            oc.font = "bold 11px 'Segoe UI', Arial, sans-serif";
            oc.textAlign = "left";
            oc.fillText("LOT-LAB Sims 4", padH, outH - 14);

            // Marca de agua derecha
            oc.textAlign = "right";
            oc.fillText("Creado por Ozono 96", outW - padH, outH - 14);

            descargarBlobDirecto(out.toDataURL("image/png"), `LotLab_${canvasId}_completo_${timestamp}.png`);
        }
    } catch (err) {
        console.error("Error al capturar gráfico:", err);
    } finally {
        if (btnCompartir) btnCompartir.style.visibility = btnDisplay || "";
        if (marcaDer.parentNode) marcaDer.parentNode.removeChild(marcaDer);
        if (marcaIzq.parentNode) marcaIzq.parentNode.removeChild(marcaIzq);
    }
}

function descargarBlobDirecto(dataUrl, nombreArchivo) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ── Cache de imágenes para iconos en canvas ──────────────
const PACK_IMAGE_CACHE = {};

function obtenerImagenPack(rutaImg, onLoaded) {
    if (!rutaImg) return null;
    if (PACK_IMAGE_CACHE[rutaImg] !== undefined) {
        return PACK_IMAGE_CACHE[rutaImg];
    }
    const img = new Image();
    img.src = rutaImg;
    img.onload = () => {
        PACK_IMAGE_CACHE[rutaImg] = img;
        if (onLoaded) onLoaded();
    };
    img.onerror = () => {
        PACK_IMAGE_CACHE[rutaImg] = null;
    };
    PACK_IMAGE_CACHE[rutaImg] = img;
    return img;
}

// ── Gráfico: Solares por pack con mundo ───────────────────
function obtenerMapaConteoSolares() {
    const mapa = new Map();
    if (!database || !database.solares || !database.solares.length) return mapa;

    database.solares.forEach(solar => {
        const sPackNorm = quitarAcentos(solar.nombrePack || "");
        const sTipoNorm = quitarAcentos(solar.tipoPack || "");
        if (!sPackNorm && !sTipoNorm) return;

        const packEncontrado = ESTAD.packsOriginales.find(p => {
            const pNom = quitarAcentos(p.nombre || "");
            const pCod = quitarAcentos(p.codigoInterno || "");
            const pId = quitarAcentos(p.id || "");

            if (pNom && (sPackNorm === pNom || sPackNorm.includes(pNom) || pNom.includes(sPackNorm))) return true;
            if (pCod && sPackNorm === pCod) return true;
            if (pId && sPackNorm === pId) return true;
            if (p.esJuegoBase && (sTipoNorm.includes("base") || sPackNorm.includes("base"))) return true;
            return false;
        });

        if (packEncontrado) {
            mapa.set(packEncontrado.id, (mapa.get(packEncontrado.id) || 0) + 1);
        }
    });

    return mapa;
}

function obtenerConteoSolaresPorPack(packs) {
    const mapaConteo = obtenerMapaConteoSolares();
    const resultado = [];
    packs.forEach(p => {
        const cant = mapaConteo.get(p.id) || 0;
        if (cant > 0) {
            resultado.push({
                pack: p,
                cantSolares: cant
            });
        }
    });

    resultado.sort((a, b) => b.cantSolares - a.cantSolares);
    return resultado;
}

function dibujarGraficoSolaresMundos(packs) {
    const packsConSolares = obtenerConteoSolaresPorPack(packs);

    const ctx = getCtx("graficoSolaresMundos", packsConSolares.length, 75, "solares");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    if (packsConSolares.length === 0) {
        dibujarVacio(ctx, W, H, "Sin datos de solares");
        return;
    }

    const maxSolares = Math.max(...packsConSolares.map(item => item.cantSolares), 1);
    const pad = { top: 26, right: 15, bottom: 65, left: 40 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctx.beginPath();
        ctx.strokeStyle = colorLinea(ctx);
        ctx.lineWidth = 1;
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + aW, y);
        ctx.stroke();
        const val = Math.round(maxSolares - (maxSolares / 4) * i);
        ctx.fillStyle = colorSubTexto(ctx);
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(val, pad.left - 4, y + 4);
    }

    const n = packsConSolares.length;
    const barW = aW / n;
    const barPad = Math.max(2, barW * 0.18);

    if (!ESTAD.hitboxes) ESTAD.hitboxes = [];
    ESTAD.hitboxes = ESTAD.hitboxes.filter(h => h.chartId !== "graficoSolaresMundos");

    packsConSolares.forEach((item, i) => {
        const pack = item.pack;
        const cant = item.cantSolares;

        const x = pad.left + barW * i + barPad;
        const bW = Math.max(barW - barPad * 2, 2);
        const bH = (cant / maxSolares) * aH;
        const y = pad.top + aH - bH;
        const color = COLORES_TIPO[pack.tipoPack] || "#2563EB";

        const grd = ctx.createLinearGradient(0, y, 0, y + bH);
        grd.addColorStop(0, colorConAlpha(color, "FF"));
        grd.addColorStop(1, colorConAlpha(color, "55"));
        ctx.fillStyle = grd;
        roundRect(ctx, x, y, bW, bH, 4);
        ctx.fill();

        const fs = Math.max(8, Math.min(10, bW * 0.55));
        ctx.fillStyle = colorTexto(ctx);
        ctx.font = `bold ${fs}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(cant.toLocaleString("es-ES"), x + bW / 2, y - 5);

        const iconSize = Math.max(22, Math.min(36, bW));
        const iconX = x + (bW - iconSize) / 2;
        const iconY = pad.top + aH + 10;

        const img = obtenerImagenPack(pack.rutaImg, () => {
            requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
        });

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = colorConAlpha(color, "44");
            roundRect(ctx, iconX, iconY, iconSize, iconSize, 6);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = colorTexto(ctx);
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(pack.id, iconX + iconSize / 2, iconY + iconSize / 2 + 3);
        }

        ESTAD.hitboxes.push({
            chartId: "graficoSolaresMundos",
            x1: x,
            x2: x + bW,
            y1: pad.top,
            y2: pad.top + aH + iconSize + 15,
            pack: pack,
            cantSolares: cant
        });
    });
}

// ── Gráfico 5: Objetos nuevos por pack con scroll dinámico ──────
function dibujarGraficoObjetos(packs) {
    const conObjetos = packs
        .filter(p => p.objetos !== null && p.objetos > 0)
        .sort((a, b) => b.objetos - a.objetos);

    const ctx = getCtx("graficoObjetos", conObjetos.length, 75, "objetos");
    if (!ctx) return;
    const W = ctx._cW, H = ctx._cH;
    ctx.clearRect(0, 0, W, H);

    if (conObjetos.length === 0) { dibujarVacio(ctx, W, H, "Sin datos de objetos"); return; }

    const maxObj = Math.max(...conObjetos.map(p => p.objetos));
    const pad = { top: 26, right: 15, bottom: 65, left: 40 };
    const aW = W - pad.left - pad.right;
    const aH = H - pad.top - pad.bottom;

    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (aH / 4) * i;
        ctx.beginPath();
        ctx.strokeStyle = colorLinea(ctx);
        ctx.lineWidth = 1;
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + aW, y);
        ctx.stroke();
        const val = Math.round(maxObj - (maxObj / 4) * i);
        ctx.fillStyle = colorSubTexto(ctx);
        ctx.font = "10px 'Segoe UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(val, pad.left - 4, y + 4);
    }

    const n = conObjetos.length;
    const barW = aW / n;
    const barPad = Math.max(2, barW * 0.18);

    if (!ESTAD.hitboxes) ESTAD.hitboxes = [];
    ESTAD.hitboxes = ESTAD.hitboxes.filter(h => h.chartId !== "graficoObjetos");

    conObjetos.forEach((pack, i) => {
        const x = pad.left + barW * i + barPad;
        const bW = Math.max(barW - barPad * 2, 2);
        const bH = (pack.objetos / maxObj) * aH;
        const y = pad.top + aH - bH;
        const color = COLORES_TIPO[pack.tipoPack] || "#2563EB";

        const grd = ctx.createLinearGradient(0, y, 0, y + bH);
        grd.addColorStop(0, colorConAlpha(color, "FF"));
        grd.addColorStop(1, colorConAlpha(color, "55"));
        ctx.fillStyle = grd;
        roundRect(ctx, x, y, bW, bH, 4);
        ctx.fill();

        const fs = Math.max(8, Math.min(10, bW * 0.55));
        ctx.fillStyle = colorTexto(ctx);
        ctx.font = `bold ${fs}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(pack.objetos.toLocaleString("es-ES"), x + bW / 2, y - 5);

        // Icono de pack en el eje X
        const iconSize = Math.max(22, Math.min(36, bW));
        const iconX = x + (bW - iconSize) / 2;
        const iconY = pad.top + aH + 10;

        const img = obtenerImagenPack(pack.rutaImg, () => {
            requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
        });

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        } else {
            ctx.fillStyle = colorConAlpha(color, "44");
            roundRect(ctx, iconX, iconY, iconSize, iconSize, 6);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = colorTexto(ctx);
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(pack.id, iconX + iconSize / 2, iconY + iconSize / 2 + 3);
        }

        // Registrar hitbox para tooltip hover
        ESTAD.hitboxes.push({
            chartId: "graficoObjetos",
            x1: x,
            x2: x + bW,
            y1: pad.top,
            y2: pad.top + aH + iconSize + 15,
            pack: pack
        });
    });
}

// ── Helpers ──────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
    if (w <= 0 || h <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function dibujarVacio(ctx, W, H, msg) {
    ctx.fillStyle = colorFondoG(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = colorSubTexto(ctx);
    ctx.font = "14px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(msg, W / 2, H / 2);
}

// ── Estados UI ───────────────────────────────────────────
function mostrarEstadCargando(show) {
    const lista = document.getElementById("estatListaPacks");
    if (!lista) return;
    if (show) {
        lista.innerHTML = `<div class="estatCargando">
            <div class="estatSpinner"></div>
            <p>Cargando estadísticas...</p>
        </div>`;
    }
}

function mostrarEstadError(msg) {
    const lista = document.getElementById("estatListaPacks");
    if (lista) {
        lista.innerHTML = `<div class="estatError">
            <span style="font-size:2rem;">⚠️</span>
            <p>${msg}</p>
        </div>`;
    }
}

// ── Toggle vista lista/gráficos ──────────────────────────
function toggleVistaEstadisticas(vista) {
    ESTAD.vistaActual = vista;
    const btnLista = document.getElementById("estatBtnLista");
    const btnGraf = document.getElementById("estatBtnGraficos");
    const vistaLista = document.getElementById("estatVistaLista");
    const vistaGraf = document.getElementById("estatVistaGraficos");

    if (vista === "lista") {
        btnLista?.classList.add("activa");
        btnGraf?.classList.remove("activa");
        if (vistaLista) vistaLista.style.display = "block";
        if (vistaGraf) vistaGraf.style.display = "none";
        renderizarLista(ESTAD.packsFiltrados);
    } else {
        btnGraf?.classList.add("activa");
        btnLista?.classList.remove("activa");
        if (vistaGraf) vistaGraf.style.display = "block";
        if (vistaLista) vistaLista.style.display = "none";
        requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
    }

    sincronizarEstadisticasOBS();
}

// ── State para el Selector de Fecha Personalizado ─────────
const DATE_PICKER_STATE = {
    targetId: "", // "estatFechaDesde" | "estatFechaHasta"
    selectedYear: null,
    selectedMonth: null, // 1-12
    selectedDay: null,   // 1-31
    minYear: 2014,
    maxYear: 2026,
};

// Comprueba si un año es bisiesto
function esBisiesto(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Obtener días en un mes considerando si el año es bisiesto
function obtenerDiasEnMes(mes, anio) {
    const diasPorMes = [31, esBisiesto(anio) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return diasPorMes[mes - 1] || 31;
}

// Obtener el año máximo según los packs cargados de la tabla
function obtenerMaxAnioEnPacks() {
    let maxY = 2014;
    ESTAD.packsOriginales.forEach(p => {
        if (p.anioLanzamiento) {
            const y = parseInt(p.anioLanzamiento, 10);
            if (!isNaN(y) && y > maxY) maxY = y;
        }
    });
    return Math.max(maxY, new Date().getFullYear());
}

// Abre el modal de fecha — lo mueve a document.body para que position:fixed
// sea relativo al viewport y no a la ventana (que tiene transform en la animación)
function abrirDatePickerModal(targetId) {
    DATE_PICKER_STATE.targetId = targetId;
    DATE_PICKER_STATE.selectedYear = null;
    DATE_PICKER_STATE.selectedMonth = null;
    DATE_PICKER_STATE.selectedDay = null;
    DATE_PICKER_STATE.maxYear = obtenerMaxAnioEnPacks();

    const modal = document.getElementById("estatDatePickerModal");
    if (!modal) return;

    // Mover al body para que position:fixed esté referenciado al viewport
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    modal.style.display = "flex";

    renderizarPasoDatePicker("year");
}

function cerrarDatePickerModal() {
    const modal = document.getElementById("estatDatePickerModal");
    if (modal) modal.style.display = "none";
}

// Renderiza los tres pasos: Paso 1 (Año), Paso 2 (Mes), Paso 3 (Día)
function renderizarPasoDatePicker(paso) {
    const title = document.getElementById("estatDatePickerTitle");
    const body = document.getElementById("estatDatePickerBody");
    const stepY = document.getElementById("estatStepYear");
    const stepM = document.getElementById("estatStepMonth");
    const stepD = document.getElementById("estatStepDay");

    if (!body) return;

    stepY?.classList.toggle("activa", paso === "year");
    stepM?.classList.toggle("activa", paso === "month");
    stepD?.classList.toggle("activa", paso === "day");

    if (paso === "year") {
        if (title) title.textContent = "📅 1. Selecciona el Año";
        body.className = "estatDatePickerBody estatGridYears";

        let html = "";
        for (let y = DATE_PICKER_STATE.minYear; y <= DATE_PICKER_STATE.maxYear; y++) {
            html += `<button type="button" class="estatPickerBtn" data-year="${y}">${y}</button>`;
        }
        body.innerHTML = html;

        body.querySelectorAll("[data-year]").forEach(btn => {
            btn.addEventListener("click", () => {
                DATE_PICKER_STATE.selectedYear = parseInt(btn.getAttribute("data-year"), 10);
                renderizarPasoDatePicker("month");
            });
        });

    } else if (paso === "month") {
        if (title) title.textContent = `📅 2. Selecciona el Mes (${DATE_PICKER_STATE.selectedYear})`;
        body.className = "estatDatePickerBody estatGridMonths";

        const mesesNombres = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        let html = "";
        mesesNombres.forEach((mName, idx) => {
            html += `<button type="button" class="estatPickerBtn" data-month="${idx + 1}">${mName}</button>`;
        });
        body.innerHTML = html;

        body.querySelectorAll("[data-month]").forEach(btn => {
            btn.addEventListener("click", () => {
                DATE_PICKER_STATE.selectedMonth = parseInt(btn.getAttribute("data-month"), 10);
                renderizarPasoDatePicker("day");
            });
        });

    } else if (paso === "day") {
        const mName = NOMBRES_MESES[DATE_PICKER_STATE.selectedMonth - 1];
        if (title) title.textContent = `📅 3. Selecciona el Día (${mName} ${DATE_PICKER_STATE.selectedYear})`;
        body.className = "estatDatePickerBody estatGridDays";

        const numDias = obtenerDiasEnMes(DATE_PICKER_STATE.selectedMonth, DATE_PICKER_STATE.selectedYear);

        let html = "";
        for (let d = 1; d <= numDias; d++) {
            html += `<button type="button" class="estatPickerBtn" data-day="${d}">${d}</button>`;
        }
        body.innerHTML = html;

        body.querySelectorAll("[data-day]").forEach(btn => {
            btn.addEventListener("click", () => {
                DATE_PICKER_STATE.selectedDay = parseInt(btn.getAttribute("data-day"), 10);
                confirmarFechaSeleccionada();
            });
        });
    }
}

function confirmarFechaSeleccionada() {
    const y = DATE_PICKER_STATE.selectedYear;
    const m = String(DATE_PICKER_STATE.selectedMonth).padStart(2, "0");
    const d = String(DATE_PICKER_STATE.selectedDay).padStart(2, "0");

    const isoStr = `${y}-${m}-${d}`;
    const displayStr = `${d}/${m}/${y}`;

    const inputHidden = document.getElementById(DATE_PICKER_STATE.targetId);
    if (inputHidden) inputHidden.value = isoStr;

    const valSpan = document.getElementById(DATE_PICKER_STATE.targetId + "Val");
    if (valSpan) valSpan.textContent = displayStr;

    cerrarDatePickerModal();
    aplicarFiltrosEstadisticas();
}

function limpiarFechaSeleccionada(targetId) {
    const inputHidden = document.getElementById(targetId);
    if (inputHidden) inputHidden.value = "";

    const valSpan = document.getElementById(targetId + "Val");
    if (valSpan) valSpan.textContent = "Seleccionar";
}

// ── Inicialización de eventos y controles personalizados ──
function inicializarEventosEstadisticas() {
    let debTimer = null;
    const debounce = (fn, ms = 200) => { clearTimeout(debTimer); debTimer = setTimeout(fn, ms); };

    document.getElementById("estatBuscarTexto")
        ?.addEventListener("input", () => debounce(aplicarFiltrosEstadisticas, 200));

    document.getElementById("estatPrecioMin")
        ?.addEventListener("input", () => debounce(aplicarFiltrosEstadisticas, 300));
    document.getElementById("estatPrecioMax")
        ?.addEventListener("input", () => debounce(aplicarFiltrosEstadisticas, 300));

    // Triggers Fecha Desde / Hasta (Custom Modal Date Picker)
    document.getElementById("estatFechaDesdeBtn")?.addEventListener("click", () => abrirDatePickerModal("estatFechaDesde"));
    document.getElementById("estatFechaHastaBtn")?.addEventListener("click", () => abrirDatePickerModal("estatFechaHasta"));

    // Modal de Fecha (cerrar, overlay, limpiar)
    document.getElementById("estatDatePickerClose")?.addEventListener("click", cerrarDatePickerModal);
    document.getElementById("estatDatePickerOverlay")?.addEventListener("click", cerrarDatePickerModal);

    document.getElementById("estatDatePickerClear")?.addEventListener("click", () => {
        if (DATE_PICKER_STATE.targetId) {
            limpiarFechaSeleccionada(DATE_PICKER_STATE.targetId);
            cerrarDatePickerModal();
            aplicarFiltrosEstadisticas();
        }
    });

    // Migas de pan del selector de fecha
    document.getElementById("estatStepYear")?.addEventListener("click", () => renderizarPasoDatePicker("year"));
    document.getElementById("estatStepMonth")?.addEventListener("click", () => {
        if (DATE_PICKER_STATE.selectedYear) renderizarPasoDatePicker("month");
    });
    document.getElementById("estatStepDay")?.addEventListener("click", () => {
        if (DATE_PICKER_STATE.selectedYear && DATE_PICKER_STATE.selectedMonth) renderizarPasoDatePicker("day");
    });

    // Custom Dropdown: Tipo de Pack
    const btnTipo = document.getElementById("estatTipoPackBtn");
    const dropTipo = document.getElementById("estatTipoPackDropdown");
    const valTipo = document.getElementById("estatTipoPackVal");
    const inputTipo = document.getElementById("estatTipoPack");

    btnTipo?.addEventListener("click", (e) => {
        e.stopPropagation();
        const estaAbierto = dropTipo.style.display === "flex";
        dropTipo.style.display = estaAbierto ? "none" : "flex";
        btnTipo.classList.toggle("abierto", !estaAbierto);
    });

    dropTipo?.querySelectorAll(".estatDropdownItem").forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            const val = item.getAttribute("data-value");
            const txt = item.textContent;

            dropTipo.querySelectorAll(".estatDropdownItem").forEach(i => i.classList.remove("activa"));
            item.classList.add("activa");

            if (inputTipo) inputTipo.value = val;
            if (valTipo) valTipo.textContent = txt;

            dropTipo.style.display = "none";
            btnTipo.classList.remove("abierto");

            aplicarFiltrosEstadisticas();
        });
    });

    document.addEventListener("click", () => {
        if (dropTipo) dropTipo.style.display = "none";
        if (btnTipo) btnTipo.classList.remove("abierto");
    });

    // Botón Limpiar Filtros
    document.getElementById("estatBorrarFiltros")
        ?.addEventListener("click", () => {
            const txtInput = document.getElementById("estatBuscarTexto");
            if (txtInput) txtInput.value = "";

            const pMin = document.getElementById("estatPrecioMin");
            if (pMin) pMin.value = "";
            const pMax = document.getElementById("estatPrecioMax");
            if (pMax) pMax.value = "";

            limpiarFechaSeleccionada("estatFechaDesde");
            limpiarFechaSeleccionada("estatFechaHasta");

            if (inputTipo) inputTipo.value = "";
            if (valTipo) valTipo.textContent = "🏷️ Todos los tipos";

            if (dropTipo) {
                dropTipo.querySelectorAll(".estatDropdownItem").forEach(i => {
                    i.classList.toggle("activa", i.getAttribute("data-value") === "");
                });
            }

            aplicarFiltrosEstadisticas();
        });

    document.getElementById("estatBtnLista")
        ?.addEventListener("click", () => toggleVistaEstadisticas("lista"));
    document.getElementById("estatBtnGraficos")
        ?.addEventListener("click", () => toggleVistaEstadisticas("graficos"));


    // Botones de Compartir/Descargar imagen de gráfico
    document.querySelectorAll(".graficoBtnCompartir").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const canvasId = btn.getAttribute("data-canvas");
            if (canvasId) descargarCapturaGrafico(canvasId);
        });
    });

    // Eventos de Scroll Horizontal y Zoom (Ctrl + Wheel)
    document.querySelectorAll(".graficoScrollHoriz").forEach(container => {
        const chartKey = container.getAttribute("data-chart");

        container.addEventListener("wheel", (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
                const currentZoom = (chartKey && ESTAD.zoomFactor[chartKey]) ? ESTAD.zoomFactor[chartKey] : 1;
                const newZoom = Math.min(Math.max(0.5, currentZoom + zoomDelta), 3.5);
                if (chartKey) {
                    ESTAD.zoomFactor[chartKey] = newZoom;
                    requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
                }
            } else {
                const tieneScrollHoriz = container.scrollWidth > container.clientWidth;
                if (tieneScrollHoriz) {
                    e.preventDefault();
                    container.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
                }
            }
        }, { passive: false });

        let isDown = false;
        let startX, scrollLeft;
        container.addEventListener("mousedown", (e) => {
            isDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });
        container.addEventListener("mouseleave", () => { isDown = false; });
        container.addEventListener("mouseup", () => { isDown = false; });
        container.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5;
            container.scrollLeft = scrollLeft - walk;
        });
    });

    inicializarTooltipGraficos();
    inicializarPanelTiempo();

    // Re-renderizar gráficos al cambiar tema día/noche
    document.getElementById("botonModo")?.addEventListener("click", () => {
        setTimeout(() => {
            if (ESTAD.cargado && document.getElementById("ventanaEstadisticas")?.style.display === "block") {
                renderizarControlesLineasTemporal();
                if (ESTAD.vistaActual === "graficos") {
                    renderizarGraficos(ESTAD.packsFiltrados);
                }
            }
        }, 60);
    });

    window.addEventListener("resize", () => {
        if (ESTAD.vistaActual === "graficos" &&
            document.getElementById("ventanaEstadisticas")?.style.display === "block") {
            renderizarGraficos(ESTAD.packsFiltrados);
        }
    });
}

// ── Panel de Tiempo por Pack ──────────────────────────────

function calcularTiempoTranscurrido(fechaISOOrigen) {
    if (!fechaISOOrigen) return { anios: "—", meses: "—", dias: "—" };
    const hoy = new Date();
    const origen = new Date(fechaISOOrigen + "T00:00:00");
    if (isNaN(origen)) return { anios: "—", meses: "—", dias: "—" };

    let anios = hoy.getFullYear() - origen.getFullYear();
    let meses = hoy.getMonth() - origen.getMonth();
    let dias = hoy.getDate() - origen.getDate();

    if (dias < 0) {
        meses--;
        const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }
    if (meses < 0) {
        anios--;
        meses += 12;
    }

    return { anios, meses, dias };
}

function inicializarPanelTiempo() {
    const cardTiempo = document.getElementById("estatCardTiempo");
    const panel = document.getElementById("estatTiempoPanel");
    const btnCerrar = document.getElementById("btnCerrarTiempoPanel");
    const resultado = document.getElementById("estatTiempoResultado");

    if (!cardTiempo || !panel) return;

    cardTiempo.addEventListener("click", () => {
        const abierto = panel.style.display !== "none";
        panel.style.display = abierto ? "none" : "block";
        if (!abierto) rellenarPanelTiempo();
    });

    cardTiempo.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cardTiempo.click(); }
    });

    btnCerrar?.addEventListener("click", () => {
        panel.style.display = "none";
        if (resultado) resultado.style.display = "none";
    });
}

const ORDEN_TIPOS = ["Expansión", "Contenido", "Accesorios", "Kits", "Packs gratuitos", "Juego Base"];

const ICONOS_TIPO = {
    "Expansión": "🌍",
    "Contenido": "🎭",
    "Accesorios": "👗",
    "Kits": "📦",
    "Packs gratuitos": "🎁",
    "Juego Base": "🎮",
};

function rellenarPanelTiempo() {
    const contenedor = document.getElementById("estatTiempoPorTipo");
    const resultado = document.getElementById("estatTiempoResultado");
    if (!contenedor) return;

    // Reseteamos selección y resultado
    if (resultado) resultado.style.display = "none";

    // Agrupamos por tipo
    const grupos = {};
    ESTAD.packsOriginales.forEach(p => {
        const tipo = p.tipoPack || "Otro";
        if (!grupos[tipo]) grupos[tipo] = [];
        grupos[tipo].push(p);
    });

    const ordenFinal = [...ORDEN_TIPOS, ...Object.keys(grupos).filter(t => !ORDEN_TIPOS.includes(t))];

    contenedor.innerHTML = "";
    let primerGrupoAbierto = false;

    ordenFinal.forEach(tipo => {
        const listaPacks = grupos[tipo];
        if (!listaPacks || listaPacks.length === 0) return;

        const grupoEl = document.createElement("div");
        grupoEl.className = "estatTipoGrupo";
        const icono = ICONOS_TIPO[tipo] || "📦";
        const color = COLORES_TIPO[tipo] || "#2563EB";

        grupoEl.innerHTML = `
            <div class="estatTipoGrupoHeader" style="border-left: 3px solid ${color};">
                <span>${icono} ${tipo}</span>
                <span class="estatTipoGrupoBadge">${listaPacks.length}</span>
                <span class="estatTipoGrupoChevron">▼</span>
            </div>
            <div class="estatTipoIconoGrid"></div>
        `;

        const header = grupoEl.querySelector(".estatTipoGrupoHeader");
        const grid = grupoEl.querySelector(".estatTipoIconoGrid");

        // Abre el primero por defecto
        if (!primerGrupoAbierto) {
            grupoEl.classList.add("abierto");
            primerGrupoAbierto = true;
        }

        header.addEventListener("click", () => {
            const estaAbierto = grupoEl.classList.contains("abierto");
            grupoEl.classList.toggle("abierto", !estaAbierto);
        });

        // Packs como iconos
        listaPacks.forEach(pack => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "estatPackIconoBtn";
            const tooltipTexto = `${pack.nombre} (${pack.tipoPack || "Pack"}${pack.fecha ? " · " + pack.fecha : ""})`;
            btn.setAttribute("data-tooltip", tooltipTexto);

            const img = document.createElement("img");
            img.src = pack.rutaImg;
            img.alt = pack.nombre;
            img.className = "estatPackIconoImg";
            img.onerror = () => { img.style.display = "none"; };

            btn.appendChild(img);

            btn.addEventListener("click", () => {
                // Quitar selección anterior
                contenedor.querySelectorAll(".estatPackIconoBtn.seleccionado").forEach(b => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");
                mostrarResultadoTiempo(pack);
            });

            grid.appendChild(btn);
        });

        contenedor.appendChild(grupoEl);
    });
}

function mostrarResultadoTiempo(pack) {
    const resultado = document.getElementById("estatTiempoResultado");
    const elNombre = document.getElementById("estatTiempoPackNombre");
    const elFechaLanz = document.getElementById("estatTiempoFechaLanz");
    const elAnios = document.getElementById("estatTiempoAnos");
    const elMeses = document.getElementById("estatTiempoMeses");
    const elDias = document.getElementById("estatTiempoDias");
    const elImg = document.getElementById("estatTiempoPackImg");

    // Mostrar icono del pack
    if (elImg) {
        elImg.src = pack.rutaImg || "";
        elImg.alt = pack.nombre;
        elImg.style.display = pack.rutaImg ? "block" : "none";
        elImg.onerror = () => { elImg.style.display = "none"; };
    }

    if (elNombre) elNombre.textContent = pack.nombre;
    if (elFechaLanz) elFechaLanz.textContent = pack.fecha ? `Lanzado el ${pack.fecha}` : (pack.fechaISO || "Fecha desconocida");

    if (!pack.fechaISO) {
        if (elAnios) elAnios.textContent = "—";
        if (elMeses) elMeses.textContent = "—";
        if (elDias) elDias.textContent = "—";
    } else {
        const { anios, meses, dias } = calcularTiempoTranscurrido(pack.fechaISO);
        if (elAnios) elAnios.textContent = anios;
        if (elMeses) elMeses.textContent = meses;
        if (elDias) elDias.textContent = dias;
    }

    if (resultado) {
        resultado.style.display = "block";
        resultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}


// ── Hover Tooltip flotante para canvas de gráficos ───────
function inicializarTooltipGraficos() {
    let tooltip = document.getElementById("estatGraficoTooltip");
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "estatGraficoTooltip";
        tooltip.className = "estatGraficoTooltip";
        document.body.appendChild(tooltip);
    }

    document.querySelectorAll(".graficoCanvas").forEach(canvas => {
        canvas.addEventListener("mousemove", (e) => {
            const chartId = canvas.id;
            if (!ESTAD.hitboxes || ESTAD.hitboxes.length === 0) {
                tooltip.style.display = "none";
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = (canvas.width / dpr) / rect.width;
            const scaleY = (canvas.height / dpr) / rect.height;

            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            // 1. Comprobar sectores circulares de gráficos Donut (graficoPastel, graficoPrecio)
            if (chartId === "graficoPastel" || chartId === "graficoPrecio") {
                if (ESTAD.donutSlices && ESTAD.donutSlices.length > 0) {
                    const slices = ESTAD.donutSlices.filter(s => s.chartId === chartId);
                    if (slices.length > 0) {
                        const { cx, cy } = slices[0];
                        const dist = Math.hypot(mouseX - cx, mouseY - cy);
                        let ang = Math.atan2(mouseY - cy, mouseX - cx);
                        if (ang < -Math.PI / 2) ang += Math.PI * 2;

                        const slice = slices.find(s =>
                            dist >= s.innerR && dist <= s.outerR &&
                            ang >= s.angInicio && ang <= s.angFin
                        );

                        if (slice) {
                            const isDark = document.body.classList.contains("modo-noche");
                            const bordeSep = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
                            if (slice.chartId === "graficoPrecio") {
                                tooltip.innerHTML = `<div style="text-align:left; min-width:145px;">
                                    <div style="font-weight:800; font-size:0.9rem; border-bottom:1px solid ${bordeSep}; padding-bottom:4px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                                        <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${slice.color};"></span>
                                        <span>${slice.tipo}</span>
                                    </div>
                                    <div style="font-size:0.88rem; font-weight:800; color:${slice.color}; margin-top:2px;">${formatearEuros(slice.precio)}</div>
                                    <div style="font-size:0.8rem; opacity:0.88; margin-top:2px;">${slice.pct}% del coste total</div>
                                    <div style="font-size:0.78rem; opacity:0.75; margin-top:2px;">📦 ${slice.cantPacks} ${slice.cantPacks === 1 ? 'pack' : 'packs'}</div>
                                </div>`;
                            } else {
                                tooltip.innerHTML = `<div style="text-align:left; min-width:130px;">
                                    <div style="font-weight:800; font-size:0.9rem; border-bottom:1px solid ${bordeSep}; padding-bottom:4px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                                        <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${slice.color};"></span>
                                        <span>${slice.tipo}</span>
                                    </div>
                                    <div style="font-size:0.88rem; font-weight:800; color:${slice.color}; margin-top:2px;">${slice.cantPacks} ${slice.cantPacks === 1 ? 'pack' : 'packs'}</div>
                                    <div style="font-size:0.8rem; opacity:0.88; margin-top:2px;">${slice.pct}% de los packs</div>
                                </div>`;
                            }
                            tooltip.style.left = e.clientX + "px";
                            tooltip.style.top = e.clientY + "px";
                            tooltip.style.display = "block";
                            canvas.style.cursor = "pointer";
                            return;
                        }
                    }
                }
            }

            // 2. Comprobar hitboxes rectangulares de gráficos de barras/puntos
            if (!ESTAD.hitboxes || ESTAD.hitboxes.length === 0) {
                tooltip.style.display = "none";
                canvas.style.cursor = "default";
                return;
            }

            const hit = ESTAD.hitboxes.find(h =>
                h.chartId === chartId &&
                mouseX >= h.x1 && mouseX <= h.x2 &&
                mouseY >= h.y1 && mouseY <= h.y2
            );

            if (hit) {
                if (hit.desglose) {
                    const lineasDesglose = (hit.desglose.length > 0)
                        ? hit.desglose.map(d =>
                            `<div style="display:flex; align-items:center; justify-content:space-between; gap:14px; margin-top:3px;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:${d.color}; flex-shrink:0;"></span>
                                    <span style="font-size:0.8rem; opacity:0.9;">${d.tipo}</span>
                                </div>
                                <strong style="font-size:0.82rem;">${d.cant}</strong>
                            </div>`
                        ).join("")
                        : `<div style="font-size:0.8rem; opacity:0.75; font-style:italic; margin-top:2px;">Sin lanzamientos</div>`;

                    const isDark = document.body.classList.contains("modo-noche");
                    const bordeSep = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
                    const badgeBg = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)";

                    tooltip.innerHTML = `<div style="text-align:left; min-width:145px;">
                        <div style="font-weight:800; font-size:0.9rem; border-bottom:1px solid ${bordeSep}; padding-bottom:4px; margin-bottom:4px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
                            <span>${hit.titulo}</span>
                            <span style="background:${badgeBg}; padding:1px 7px; border-radius:100px; font-size:0.75rem;">${hit.total} ${hit.total === 1 ? 'pack' : 'packs'}</span>
                        </div>
                        ${lineasDesglose}
                    </div>`;
                } else if (hit.pack) {
                    const p = hit.pack;
                    const anio = p.anioLanzamiento || (p.fecha ? p.fecha : "N/A");
                    let infoExtra = "";
                    if (hit.chartId === "graficoObjetos" && p.objetos) {
                        infoExtra = `<br><span style="opacity:0.85;font-size:0.78rem;">🏠 Objetos: ${p.objetos.toLocaleString("es-ES")}</span>`;
                    } else if (hit.chartId === "graficoSolaresMundos" && hit.cantSolares) {
                        infoExtra = `<br><span style="opacity:0.85;font-size:0.78rem;">🏡 Solares: ${hit.cantSolares.toLocaleString("es-ES")}</span>`;
                    }
                    tooltip.innerHTML = `<strong>${p.nombre}</strong><br><span style="opacity:0.85;font-size:0.78rem;">📅 Lanzamiento: ${anio}</span>${infoExtra}`;
                }
                tooltip.style.left = e.clientX + "px";
                tooltip.style.top = e.clientY + "px";
                tooltip.style.display = "block";

                if (hit.tipo === "mes" || hit.tipo === "dia") {
                    canvas.style.cursor = "pointer";
                } else {
                    canvas.style.cursor = "default";
                }
            } else {
                tooltip.style.display = "none";
                canvas.style.cursor = "default";
            }
        });

        // Click en barras de mes o día para desplegar panel de detalle
        canvas.addEventListener("click", (e) => {
            const chartId = canvas.id;
            if (chartId !== "graficoMesesAno" && chartId !== "graficoDiasSemana") return;
            if (!ESTAD.hitboxes || ESTAD.hitboxes.length === 0) return;

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = (canvas.width / dpr) / rect.width;
            const scaleY = (canvas.height / dpr) / rect.height;

            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            const hit = ESTAD.hitboxes.find(h =>
                h.chartId === chartId &&
                mouseX >= h.x1 && mouseX <= h.x2 &&
                mouseY >= h.y1 && mouseY <= h.y2
            );

            if (hit && (hit.tipo === "mes" || hit.tipo === "dia")) {
                mostrarDetalleLanzamientos(hit.chartId, hit.tipo, hit.valor, hit.tituloRaw || hit.titulo);
            }
        });

        canvas.addEventListener("mouseleave", () => {
            if (tooltip) tooltip.style.display = "none";
            canvas.style.cursor = "default";
        });
    });
}

// ── Punto de entrada público ─────────────────────────────
function abrirEstadisticas() {
    if (!ESTAD._eventosInit) {
        inicializarEventosEstadisticas();
        ESTAD._eventosInit = true;
    }
    if (!ESTAD.cargado) {
        cargarEstadisticasSims4();
    } else {
        actualizarResumen(ESTAD.packsFiltrados);
        if (ESTAD.vistaActual === "lista") {
            renderizarLista(ESTAD.packsFiltrados);
        } else {
            requestAnimationFrame(() => renderizarGraficos(ESTAD.packsFiltrados));
        }
        // Actualización silenciosa en segundo plano: si la hoja cambió, refresca la vista
        refrescarEstadisticasEnSegundoPlano();
    }
}

window.abrirEstadisticas = abrirEstadisticas;
window.toggleVistaEstadisticas = toggleVistaEstadisticas;
window.aplicarFiltrosEstadisticas = aplicarFiltrosEstadisticas;
window.mostrarDetalleLanzamientos = mostrarDetalleLanzamientos;
window.cerrarDetalleLanzamientos = cerrarDetalleLanzamientos;
window.ESTAD = ESTAD;
