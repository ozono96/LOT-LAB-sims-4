/* =========================================================
   TRUCOS
   Navegación entre la ventana de introducción y las 3
   categorías (Construir, CAS, Modo Vivir), y copiado al
   portapapeles de los textos marcados como "truco-copiable".
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("botonTrucos")?.addEventListener("click", () => {
        construirIndiceTrucos();
        abrirVentana("ventanaTrucos");
    });

    document.getElementById("botonTrucosConstruir")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosConstruir");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("botonTrucosCAS")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosCAS");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("botonTrucosVivir")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosVivir");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("botonTrucosPacks")?.addEventListener("click", () => {
        abrirVentana("ventanaTrucosPacks");
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.querySelectorAll(".botonVolverTrucos").forEach(boton => {
        boton.addEventListener("click", () => {
            abrirVentana("ventanaTrucos");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Hacer que el botón ✕ de las sub-ventanas de trucos actúe como "Volver a Trucos"
    const subVentanasTrucos = [
        "ventanaTrucosConstruir",
        "ventanaTrucosCAS",
        "ventanaTrucosVivir",
        "ventanaTrucosPacks"
    ];
    subVentanasTrucos.forEach(idVentana => {
        const ventana = document.getElementById(idVentana);
        if (!ventana) return;
        const btnCerrar = ventana.querySelector(".cabeceraVentana .cerrar");
        if (!btnCerrar) return;
        // Clonar para eliminar listeners existentes
        const btnCerrarClone = btnCerrar.cloneNode(true);
        btnCerrar.parentNode.replaceChild(btnCerrarClone, btnCerrar);
        btnCerrarClone.addEventListener("click", (e) => {
            e.stopPropagation();
            abrirVentana("ventanaTrucos");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Copiar al portapapeles cualquier texto marcado como "truco-copiable"
    document.addEventListener("click", (e) => {
        const el = e.target.closest(".truco-copiable");
        if (!el) return;

        copiarTextoTruco(el.textContent.trim(), e);
    });

    // Inicializar Buscador de Trucos
    inicializarBuscadorTrucos();

    // Reconstruir el índice cuando termine de cargarse la base de datos (solares, estadísticas, etc.)
    document.addEventListener("datosCargados", () => {
        construirIndiceTrucos();
    });

});

/* =========================================================
   SISTEMA DE BÚSQUEDA Y REDIRECCIÓN DE TRUCOS
   ========================================================= */

let INDICE_TRUCOS = [];

function normalizarTextoBusqueda(texto) {
    if (!texto) return "";
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[¡!¿?.,:;\-_'"«»“”‘’(){}\[\]\\\/|@#$%^&*+=<>~`]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizarCompacto(texto) {
    return normalizarTextoBusqueda(texto).replace(/\s+/g, "");
}

function extraerPacksEstadisticas(filas) {
    if (!filas || !Array.isArray(filas) || filas.length === 0) return [];
    if (typeof window.parsearFilasEstadisticas === "function") {
        try {
            const res = window.parsearFilasEstadisticas(filas);
            if (Array.isArray(res) && res.length > 0) return res;
        } catch (e) {}
    }
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

        filasDatos.forEach(fila => {
            const fecha = (fila[base + 0] || "").trim();
            const nombreInterno = (fila[base + 1] || "").trim();
            const colC = (fila[base + 2] || "").trim();
            const precioRaw = (fila[base + 3] || "").trim();
            const objetosRaw = (fila[base + 4] || "").trim();
            const idFoto = (fila[base + 5] || "").trim();

            if (!idFoto && !nombreInterno && !colC) return;
            const colCLow = colC.toLowerCase();
            if (["expansión", "contenido", "accesorios", "kits", "packs gratuitos", "juego base"].includes(colCLow)) return;

            const id = idFoto || nombreInterno;
            let nombre = colC || nombreInterno || id;
            let tipoPack = tipoHeader || "Pack";

            packs.push({
                id: id,
                nombre: nombre,
                tipoPack: tipoPack,
                fecha: fecha,
                precio: precioRaw,
                objetos: objetosRaw
            });
        });
    }
    return packs;
}

function calcularRelevancia(item, queryNorm, queryCompact) {
    const titNorm = normalizarTextoBusqueda(item.titulo);
    const codNorm = normalizarTextoBusqueda(item.codigo);
    const catNorm = normalizarTextoBusqueda(item.categoria);
    const descNorm = normalizarTextoBusqueda(item.descripcion);

    const titComp = titNorm.replace(/\s+/g, "");
    const codComp = codNorm.replace(/\s+/g, "");

    let score = 0;

    // Coincidencia exacta
    if (titNorm === queryNorm) return 200;
    if (codNorm === queryNorm) return 190;
    if (queryCompact && codComp === queryCompact) return 185;

    // Título empieza por la búsqueda o palabra completa exacta
    if (titNorm.startsWith(queryNorm)) score = Math.max(score, 160);
    const palabrasTitulo = titNorm.split(" ");
    if (palabrasTitulo.includes(queryNorm)) score = Math.max(score, 150);

    // Tolerancia singular/plural para consultas de 3 o más caracteres (ej: "días" <-> "día")
    const qStem = (queryNorm.length > 3 && queryNorm.endsWith("s")) ? queryNorm.slice(0, -1) : (queryNorm + "s");
    if (palabrasTitulo.includes(qStem)) score = Math.max(score, 145);
    if (titNorm.startsWith(qStem)) score = Math.max(score, 140);

    // Código empieza por la búsqueda
    if (codNorm.startsWith(queryNorm)) score = Math.max(score, 130);

    // Título contiene la consulta o el stem
    if (titNorm.includes(queryNorm)) score = Math.max(score, 100);
    if (titNorm.includes(qStem)) score = Math.max(score, 95);
    if (queryCompact && titComp.includes(queryCompact)) score = Math.max(score, 90);

    // Código contiene la consulta
    if (codNorm.includes(queryNorm)) score = Math.max(score, 80);
    if (queryCompact && codComp.includes(queryCompact)) score = Math.max(score, 75);

    // Categoría contiene la consulta
    if (catNorm.includes(queryNorm)) score = Math.max(score, 50);

    // Descripción contiene la consulta
    if (descNorm.includes(queryNorm)) score = Math.max(score, 25);
    if (queryCompact && descNorm.replace(/\s+/g, "").includes(queryCompact)) score = Math.max(score, 20);

    return score;
}


function construirIndiceTrucos() {
    INDICE_TRUCOS = [];

    const secciones = [
        { idVentana: "ventanaTrucos", categoria: "🕹️ General", nodoId: "trucos-inicio", ramaId: "trucos" },
        { idVentana: "ventanaTrucosConstruir", categoria: "🏗️ Construir", nodoId: "trucos-construir", ramaId: "trucos" },
        { idVentana: "ventanaTrucosCAS", categoria: "💇 CAS", nodoId: "trucos-cas", ramaId: "trucos" },
        { idVentana: "ventanaTrucosVivir", categoria: "🏠 Modo Vivir", nodoId: "trucos-vivir", ramaId: "trucos" },
        { idVentana: "ventanaTrucosPacks", categoria: "📦 Packs", nodoId: "trucos-packs", ramaId: "trucos" }
    ];

    let contador = 0;

    secciones.forEach(sec => {
        const ventana = document.getElementById(sec.idVentana);
        if (!ventana) return;

        // Buscar bloques con .truco-copiable o encabezados (h3, h4)
        const elementos = ventana.querySelectorAll("h3, h4, .truco-copiable");
        
        elementos.forEach(el => {
            let codigo = "";
            let titulo = "";
            let descripcion = "";

            if (el.classList.contains("truco-copiable")) {
                codigo = el.textContent.trim();
                // Buscar encabezado o párrafo cercano para descripción
                const padre = el.closest("h4, h3, p, div");
                titulo = codigo;
                if (padre) {
                    let sig = padre.nextElementSibling;
                    while (sig && sig.tagName === "P" && !descripcion) {
                        descripcion = sig.textContent.trim();
                        sig = sig.nextElementSibling;
                    }
                }
            } else if (el.tagName === "H4" || el.tagName === "H3") {
                const copiable = el.querySelector(".truco-copiable");
                if (copiable) {
                    codigo = copiable.textContent.trim();
                    titulo = el.textContent.trim();
                } else {
                    titulo = el.textContent.trim();
                }

                let sig = el.nextElementSibling;
                while (sig && sig.tagName === "P" && !descripcion) {
                    descripcion = sig.textContent.trim();
                    sig = sig.nextElementSibling;
                }
            }

            if (!titulo && !codigo) return;

            // Evitar duplicados consecutivos exactos
            const queryKey = normalizarTextoBusqueda(`${sec.idVentana}_${codigo || titulo}`);
            const existe = INDICE_TRUCOS.some(item => normalizarTextoBusqueda(`${item.idVentana}_${item.codigo || item.titulo}`) === queryKey);
            if (existe) return;

            contador++;
            INDICE_TRUCOS.push({
                id: `truco_idx_${contador}`,
                codigo: codigo,
                titulo: titulo,
                descripcion: descripcion,
                categoria: sec.categoria,
                idVentana: sec.idVentana,
                nodoId: sec.nodoId,
                ramaId: sec.ramaId,
                elemento: el
            });
        });
    });

    // Indexar dinámicamente el resto de secciones y ventanas de la web (para ámbito 'todo' y páginas fuera de trucos)
    const todasLasVentanas = document.querySelectorAll(".ventana");
    todasLasVentanas.forEach(vent => {
        if (!vent.id || secciones.some(s => s.idVentana === vent.id)) return;

        const h2 = vent.querySelector(".cabeceraVentana h2");
        const titVentana = h2 ? h2.textContent.trim() : vent.id.replace("ventana", "");
        let ramaId = vent.getAttribute("data-rama");
        if (!ramaId) {
            if (vent.id.startsWith("ventanaTrucos")) ramaId = "trucos";
            else if (vent.id === "ventanaAcercaDe") ramaId = "inicio";
            else if (vent.id.startsWith("ventanaReto")) ramaId = "retos";
            else if (vent.id.includes("Generador")) ramaId = "generadores";
            else if (vent.id === "ventanaBuscador" || vent.id === "ventanaResultados" || vent.id === "ventanaFichaSolar") ramaId = "solares";
            else ramaId = vent.id.replace("ventana", "").toLowerCase();
        }
        const nodoId = vent.getAttribute("data-nodo-id") || vent.id;

        // Añadir la sección misma como destino navegable
        if (titVentana) {
            contador++;
            INDICE_TRUCOS.push({
                id: `web_idx_${contador}`,
                codigo: "",
                titulo: titVentana,
                descripcion: `Ir a la sección de ${titVentana}`,
                categoria: "🌐 " + titVentana,
                idVentana: vent.id,
                nodoId: nodoId,
                ramaId: ramaId,
                elemento: vent
            });
        }

        // Buscar elementos internos: .truco-copiable, h3, h4, .boton-lotlab
        const subEls = vent.querySelectorAll("h3, h4, .truco-copiable, .boton-lotlab");
        subEls.forEach(el => {
            let codigo = "";
            let titulo = "";
            let descripcion = "";

            if (el.classList.contains("truco-copiable")) {
                codigo = el.textContent.trim();
                titulo = codigo;
            } else if (el.tagName === "H3" || el.tagName === "H4") {
                const cop = el.querySelector(".truco-copiable");
                if (cop) {
                    codigo = cop.textContent.trim();
                    titulo = el.textContent.trim();
                } else {
                    titulo = el.textContent.trim();
                }
            } else if (el.classList.contains("boton-lotlab")) {
                titulo = el.textContent.trim();
            }

            if (!titulo && !codigo) return;

            let sig = el.nextElementSibling;
            while (sig && sig.tagName === "P" && !descripcion) {
                descripcion = sig.textContent.trim();
                sig = sig.nextElementSibling;
            }

            const queryKey = normalizarTextoBusqueda(`${vent.id}_${codigo || titulo}`);
            const existe = INDICE_TRUCOS.some(item => normalizarTextoBusqueda(`${item.idVentana}_${item.codigo || item.titulo}`) === queryKey);
            if (existe) return;

            contador++;
            INDICE_TRUCOS.push({
                id: `web_sub_idx_${contador}`,
                codigo: codigo,
                titulo: titulo,
                descripcion: descripcion,
                categoria: titVentana,
                idVentana: vent.id,
                nodoId: nodoId,
                ramaId: ramaId,
                elemento: el
            });
        });
    });

    // ── Indexar solares y fichas de solar (database.solares) ──
    if (typeof database !== "undefined" && Array.isArray(database.solares) && database.solares.length > 0) {
        // Entrada general a fichas de solar
        contador++;
        INDICE_TRUCOS.push({
            id: "solar_general",
            tipoResultado: "ventana",
            codigo: "",
            titulo: "Fichas de Solar - Buscador de Solares",
            descripcion: "Explora y consulta las fichas de solares de todos los mundos de Los Sims 4",
            categoria: "🏡 Fichas de Solar",
            idVentana: "ventanaBuscador",
            nodoId: "solares",
            ramaId: "solares",
            elemento: document.getElementById("ventanaBuscador") || null
        });

        database.solares.forEach(solar => {
            if (!solar || !solar.nombre) return;
            contador++;
            const desc = [
                solar.mundo || "",
                solar.barrio || "",
                solar.tipoSolar || "",
                solar.tamaño ? `${solar.tamaño}` : "",
                solar.nombrePack ? `(${solar.nombrePack})` : ""
            ].filter(Boolean).join(" • ");

            INDICE_TRUCOS.push({
                id: `solar_${solar.id}`,
                idSolar: solar.id,
                tipoResultado: "solar",
                codigo: solar.tamaño || "",
                titulo: solar.nombre,
                descripcion: desc,
                categoria: `🏡 Ficha de Solar: ${solar.mundo || 'Solar'}`,
                idVentana: "ventanaFichaSolar",
                nodoId: "solares",
                ramaId: "solares",
                elemento: null
            });
        });
    }

    // ── Indexar sección de Estadísticas Sims 4 y sus packs/datos ──
    const ventEstad = document.getElementById("ventanaEstadisticas");
    contador++;
    INDICE_TRUCOS.push({
        id: "estadisticas_general",
        tipoResultado: "estadisticas",
        codigo: "",
        titulo: "Estadísticas Sims 4",
        descripcion: "Gráficos de lanzamientos, precios, tipos de packs y datos históricos de Los Sims 4",
        categoria: "📊 Estadísticas Sims 4",
        idVentana: "ventanaEstadisticas",
        nodoId: "estadisticas",
        ramaId: "datos",
        elemento: ventEstad || null
    });

    const opcionesEstad = [
        { titulo: "Lista de Packs - Estadísticas Sims 4", desc: "Ver tabla completa de lanzamientos, precios y objetos de todos los packs" },
        { titulo: "Gráficos de Lanzamientos - Estadísticas Sims 4", desc: "Evolución temporal de expansiones, packs de contenido y kits a lo largo de los años" },
        { titulo: "Precios y Objetos por Pack - Estadísticas", desc: "Análisis comparativo de contenido y precio de packs de Los Sims 4" }
    ];
    opcionesEstad.forEach((op, opIdx) => {
        contador++;
        INDICE_TRUCOS.push({
            id: `estad_op_${opIdx}`,
            tipoResultado: "estadisticas",
            codigo: "",
            titulo: op.titulo,
            descripcion: op.desc,
            categoria: "📊 Estadísticas Sims 4",
            idVentana: "ventanaEstadisticas",
            nodoId: "estadisticas",
            ramaId: "datos",
            elemento: ventEstad || null
        });
    });

    // Indexar todos los packs de estadísticas desde database.estadisticasSims4
    let filasEstad = (typeof database !== "undefined" && Array.isArray(database.estadisticasSims4)) ? database.estadisticasSims4 : [];
    if (filasEstad.length > 0) {
        try {
            const packsEstad = (window.ESTAD && window.ESTAD.packsOriginales && window.ESTAD.packsOriginales.length > 0)
                ? window.ESTAD.packsOriginales
                : extraerPacksEstadisticas(filasEstad);
            
            packsEstad.forEach(p => {
                if (!p || !p.nombre) return;
                contador++;
                INDICE_TRUCOS.push({
                    id: `pack_estad_${p.id}`,
                    tipoResultado: "estadisticas",
                    codigo: p.id || p.codigoInterno || "",
                    titulo: `${p.nombre} (${p.tipoPack || 'Pack'})`,
                    nombreSolo: p.nombre,
                    descripcion: `Lanzamiento: ${p.fecha || p.anioLanzamiento || 'N/D'} • ${p.precio ? p.precio + (String(p.precio).includes('€') ? '' : '€') : 'Gratis'} • ${p.objetos ? p.objetos + ' objetos' : ''}`,
                    categoria: `📊 Estadísticas: ${p.tipoPack || 'Pack'}`,
                    idVentana: "ventanaEstadisticas",
                    nodoId: "estadisticas",
                    ramaId: "datos",
                    elemento: ventEstad || null
                });
            });
        } catch(e) {}
    }

    console.log(`✔ Índice web y trucos construido con ${INDICE_TRUCOS.length} entradas.`);
}

function inicializarBuscadorTrucos() {
    construirIndiceTrucos();

    const contenedores = document.querySelectorAll(".contenedorBuscadorTrucos");
    if (contenedores.length === 0) return;

    contenedores.forEach(contenedor => {
        const input = contenedor.querySelector("input, .inputBuscadorTrucos");
        const contenedorResultados = contenedor.querySelector(".desplegableResultadosTrucos");
        const btnLimpiar = contenedor.querySelector(".btnLimpiarBuscador, .btnLimpiarBuscadorTrucos");

        if (!input || !contenedorResultados) return;

        const ambito = input.getAttribute("data-ambito") || contenedor.getAttribute("data-ambito") || "arbol";
        const ventanaActual = contenedor.closest(".ventana");
        const idVentanaActual = ventanaActual ? ventanaActual.id : null;

        let ramaContenedor = contenedor.getAttribute("data-rama") || (ventanaActual ? ventanaActual.getAttribute("data-rama") : null);
        if (!ramaContenedor && ventanaActual && ventanaActual.id) {
            if (ventanaActual.id.startsWith("ventanaTrucos")) {
                ramaContenedor = "trucos";
            } else if (ventanaActual.id === "ventanaAcercaDe") {
                ramaContenedor = "inicio";
            } else if (ventanaActual.id.startsWith("ventanaReto")) {
                ramaContenedor = "retos";
            } else if (ventanaActual.id.includes("Generador")) {
                ramaContenedor = "generadores";
            } else if (ventanaActual.id === "ventanaBuscador" || ventanaActual.id === "ventanaResultados" || ventanaActual.id === "ventanaFichaSolar") {
                ramaContenedor = "solares";
            } else {
                ramaContenedor = ventanaActual.id.replace("ventana", "").toLowerCase();
            }
        }

        let indiceTecladoActivo = -1;

        function renderizarResultados(coincidencias) {
            if (coincidencias.length === 0) {
                contenedorResultados.innerHTML = `
                    <div style="padding: 16px; text-align: center; opacity: 0.7; font-size: 0.95rem;">
                        🔍 No se encontraron resultados que coincidan con la búsqueda.
                    </div>`;
                contenedorResultados.style.display = "block";
                return;
            }

            let html = "";
            coincidencias.slice(0, 18).forEach((item, idx) => {
                html += `
                    <div class="itemResultadoTruco" data-idx="${idx}" id="item_res_${idx}">
                        <div class="infoResultadoTruco">
                            <div class="tituloResultadoTruco">
                                ${item.codigo ? `<span class="codigoResultadoTruco">${escaparHTML(item.codigo)}</span>` : `${escaparHTML(item.titulo)}`}
                                <span class="badgeCategoriaTruco">${item.categoria}</span>
                            </div>
                            ${item.codigo && item.titulo !== item.codigo ? `<div style="font-size: 0.85rem; opacity: 0.9;">${escaparHTML(item.titulo)}</div>` : ''}
                            ${item.descripcion ? `<div class="descResultadoTruco">${escaparHTML(item.descripcion.slice(0, 110))}${item.descripcion.length > 110 ? '...' : ''}</div>` : ''}
                        </div>
                        <span class="flechaResultadoTruco">➡️</span>
                    </div>
                `;
            });

            contenedorResultados.innerHTML = html;
            contenedorResultados.style.display = "block";

            // Listeners de click en cada item
            contenedorResultados.querySelectorAll(".itemResultadoTruco").forEach(div => {
                div.addEventListener("click", () => {
                    const idx = parseInt(div.getAttribute("data-idx"));
                    const itemSeleccionado = coincidencias[idx];
                    if (itemSeleccionado) {
                        irATruco(itemSeleccionado);
                    }
                });
            });
        }

        function cerrarDesplegable() {
            contenedorResultados.style.display = "none";
            indiceTecladoActivo = -1;
        }

        input.addEventListener("input", () => {
            const query = normalizarTextoBusqueda(input.value);
            const queryCompact = normalizarCompacto(input.value);

            if (btnLimpiar) {
                btnLimpiar.style.display = query ? "block" : "none";
            }

            if (!query) {
                cerrarDesplegable();
                return;
            }

            const resultadosConScore = [];

            INDICE_TRUCOS.forEach(item => {
                // Filtro de ámbito (Scope):
                // 1. ÁMBITO: Página actual ("actual")
                if (ambito === "actual") {
                    if (idVentanaActual && item.idVentana && item.idVentana !== idVentanaActual) {
                        return;
                    }
                    if (ventanaActual && item.elemento && !ventanaActual.contains(item.elemento)) {
                        return;
                    }
                }
                // 2. ÁMBITO: Árbol / Rama ("arbol")
                else if (ambito === "arbol") {
                    if (ramaContenedor && item.ramaId && item.ramaId !== ramaContenedor) {
                        return;
                    }
                }
                // 3. ÁMBITO: Toda la web / Global ("todo" o "global")
                else if (ambito === "todo" || ambito === "global") {
                    // No se filtra por rama ni por ventana: búsqueda global
                }
                // 4. Ámbito por identificador específico
                else if (ambito) {
                    if (item.nodoId !== ambito && item.ramaId !== ambito && item.idVentana !== ambito) {
                        return;
                    }
                }

                const score = calcularRelevancia(item, query, queryCompact);
                if (score > 0) {
                    resultadosConScore.push({ item, score });
                }
            });

            // Ordenar por relevancia descendente: títulos/packs y códigos exactos primero
            resultadosConScore.sort((a, b) => b.score - a.score);
            const resultados = resultadosConScore.map(r => r.item);

            indiceTecladoActivo = -1;
            renderizarResultados(resultados);
        });

        if (btnLimpiar) {
            btnLimpiar.addEventListener("click", () => {
                input.value = "";
                btnLimpiar.style.display = "none";
                cerrarDesplegable();
                input.focus();
            });
        }

        // Navegación por teclado (Flecha abajo, Flecha arriba, Enter, Escape)
        input.addEventListener("keydown", (e) => {
            const items = contenedorResultados.querySelectorAll(".itemResultadoTruco");
            if (contenedorResultados.style.display === "none" || items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                indiceTecladoActivo = (indiceTecladoActivo + 1) % items.length;
                actualizarSeleccionTeclado(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                indiceTecladoActivo = (indiceTecladoActivo - 1 + items.length) % items.length;
                actualizarSeleccionTeclado(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (indiceTecladoActivo >= 0 && items[indiceTecladoActivo]) {
                    items[indiceTecladoActivo].click();
                } else if (items[0]) {
                    items[0].click();
                }
            } else if (e.key === "Escape") {
                cerrarDesplegable();
            }
        });

        function actualizarSeleccionTeclado(items) {
            items.forEach((it, idx) => {
                if (idx === indiceTecladoActivo) {
                    it.classList.add("activoTeclado");
                    it.scrollIntoView({ block: "nearest" });
                } else {
                    it.classList.remove("activoTeclado");
                }
            });
        }
    });

    // Cerrar desplegables si se hace click fuera
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".contenedorBuscadorTrucos")) {
            document.querySelectorAll(".desplegableResultadosTrucos").forEach(d => d.style.display = "none");
        }
    });
}

function irATruco(item) {
    document.querySelectorAll(".desplegableResultadosTrucos").forEach(d => d.style.display = "none");

    // 1. Redirección específica para Fichas de Solar
    if (item.tipoResultado === "solar" && item.idSolar) {
        if (typeof abrirFichaSolar === "function") {
            abrirFichaSolar(item.idSolar);
        } else if (typeof abrirVentana === "function") {
            abrirVentana("ventanaFichaSolar", true);
        }
        return;
    }

    // 2. Redirección específica para Estadísticas Sims 4
    if (item.idVentana === "ventanaEstadisticas" || item.tipoResultado === "estadisticas") {
        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaEstadisticas", true);
        }
        if (typeof abrirEstadisticas === "function") {
            abrirEstadisticas();
        }
        if (item.nombreSolo) {
            setTimeout(() => {
                const inputFiltro = document.getElementById("estatBuscarTexto");
                if (inputFiltro) {
                    inputFiltro.value = item.nombreSolo;
                    inputFiltro.dispatchEvent(new Event("input"));
                }
            }, 300);
        }
        return;
    }

    // 3. Abrir la ventana destino si es diferente
    if (typeof abrirVentana === "function") {
        abrirVentana(item.idVentana);
    }

    // 2. Hacer scroll suave hasta el elemento y aplicar efecto flash
    setTimeout(() => {
        if (item.elemento) {
            item.elemento.scrollIntoView({ behavior: "smooth", block: "center" });

            // Aplicar destello visual
            const objetivoFlash = item.elemento.closest("h4, h3, p, .truco-copiable") || item.elemento;
            objetivoFlash.classList.remove("resaltado-truco-flash");
            void objetivoFlash.offsetWidth; // Trigger reflow
            objetivoFlash.classList.add("resaltado-truco-flash");

            setTimeout(() => {
                objetivoFlash.classList.remove("resaltado-truco-flash");
            }, 2600);
        }
    }, 180);
}

function escaparHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function copiarTextoTruco(texto, event) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => mostrarTooltipCopiado(event, "✅ Texto copiado"))
            .catch(() => copiarTextoTrucoFallback(texto, event));
    } else {
        copiarTextoTrucoFallback(texto, event);
    }
}

function copiarTextoTrucoFallback(texto, event) {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand("copy");
        mostrarTooltipCopiado(event, "✅ Texto copiado");
    } catch (error) {
        mostrarTooltipCopiado(event, "⚠️ No se pudo copiar");
    }

    document.body.removeChild(textarea);
}

function mostrarTooltipCopiado(event, mensaje) {
    const tooltip = document.getElementById("tooltipOpciones");
    if (!tooltip) return;

    const punto = event && event.touches ? event.touches[0] : event;
    const x = punto ? punto.clientX : window.innerWidth / 2;
    const y = punto ? punto.clientY : window.innerHeight / 2;

    tooltip.textContent = mensaje;
    tooltip.style.left = x + "px";
    tooltip.style.top = (y - 10) + "px";
    tooltip.style.display = "block";

    clearTimeout(window._tooltipCopiadoTimeout);
    window._tooltipCopiadoTimeout = setTimeout(() => {
        tooltip.style.display = "none";
    }, 1400);
}

console.log("✔ trucos cargado con buscador inteligente");

// =========================================================
// SERIALIZACIÓN Y RESTAURACIÓN DE TOKEN v1 (#trucos/v1/<token>)
// =========================================================

function serializarTrucosV1(categoria, query) {
    try {
        const cat = categoria || "general";
        const q = query || "";
        const payload = { v: 1, cat: cat };
        if (q.trim()) payload.q = q.trim();
        const jsonStr = JSON.stringify(payload);
        return typeof window.codificarBase64URL === "function"
            ? window.codificarBase64URL(jsonStr)
            : cat;
    } catch (e) {
        return categoria || "general";
    }
}
window.serializarTrucosV1 = serializarTrucosV1;

function restaurarTrucosV1(param) {
    if (!param || typeof param !== "string") return false;
    try {
        let cat = "general";
        let query = "";

        const paramLimpio = param.trim();
        const slugDirecto = paramLimpio.toLowerCase();
        if (slugDirecto === "construir" || slugDirecto === "cas" || slugDirecto === "vivir" || slugDirecto === "packs" || slugDirecto === "general") {
            cat = slugDirecto;
        } else if (typeof window.decodificarBase64URL === "function") {
            try {
                const jsonStr = window.decodificarBase64URL(paramLimpio);
                const payload = JSON.parse(jsonStr);
                if (payload && payload.v === 1) {
                    if (payload.cat) cat = String(payload.cat).toLowerCase();
                    if (payload.q) query = String(payload.q);
                }
            } catch (errJson) {
                cat = "general";
            }
        }

        let idVentana = "ventanaTrucos";
        if (cat === "construir") idVentana = "ventanaTrucosConstruir";
        else if (cat === "cas") idVentana = "ventanaTrucosCAS";
        else if (cat === "vivir") idVentana = "ventanaTrucosVivir";
        else if (cat === "packs") idVentana = "ventanaTrucosPacks";

        if (typeof abrirVentana === "function") {
            abrirVentana(idVentana, false);
        }

        if (query) {
            const inputs = document.querySelectorAll(".inputBuscadorTrucos, .contenedorBuscadorTrucos input");
            inputs.forEach(input => {
                input.value = query;
                input.dispatchEvent(new Event("input", { bubbles: true }));
            });
        }

    } catch (e) {
        console.error("Error al restaurar trucos:", e);
        return false;
    }
}
window.restaurarTrucosV1 = restaurarTrucosV1;
window.construirIndiceTrucos = construirIndiceTrucos;
window.inicializarBuscadorTrucos = inicializarBuscadorTrucos;
window.normalizarTextoBusqueda = normalizarTextoBusqueda;
window.irATruco = irATruco;
window.LOTLAB_BUSCADOR = {
    normalizar: normalizarTextoBusqueda,
    construirIndice: construirIndiceTrucos,
    inicializar: inicializarBuscadorTrucos,
    irATruco: irATruco,
    getIndice: function() { return INDICE_TRUCOS; }
};