/* =========================================================
   RETO GENERADOR
   Orquestador principal del generador de retos.
   ========================================================= */

// Estado del reto actual para permitir rerolls
let retoActual = null;

function obtenerPacksSeleccionadosUsuario() {
    if (window.PACKS_SELECCIONADOS_SET && window.PACKS_SELECCIONADOS_SET instanceof Set && window.PACKS_SELECCIONADOS_SET.size > 0) {
        return Array.from(window.PACKS_SELECCIONADOS_SET);
    }
    const seleccionados = [];
    document.querySelectorAll("#listaPacksRetos .opcionFiltro.seleccionada").forEach(btn => {
        const pack = btn.getAttribute("data-pack");
        if (pack) seleccionados.push(pack);
    });
    return seleccionados;
}

// Suma total de limitantes de Construir + Comprar (1 limitante = 1 punto de Dificultad Extra)
function calcularDificultadExtra(categorias) {
    let extra = 0;

    if (categorias.limitanteConstruir && categorias.limitanteConstruir.resultado && categorias.limitanteConstruir.resultado.elementos) {
        extra += categorias.limitanteConstruir.resultado.elementos.length;
    }

    if (categorias.limitanteComprar && categorias.limitanteComprar.resultado && categorias.limitanteComprar.resultado.elementos) {
        extra += categorias.limitanteComprar.resultado.elementos.length;
    }

    return extra;
}

// Función para calcular la dificultad total del reto
function calcularDificultadTotal(tipoRetoVal, categorias) {
    let dificultad = 0;
    if (tipoRetoVal === "con-solar") dificultad++;

    Object.keys(categorias).forEach(catId => {
        const cat = categorias[catId];
        if (!cat || !cat.resultado) return;

        if (catId === "tamanoSolar") {
            if (cat.resultado.tamanoRequerido) {
                const match = cat.resultado.tamanoRequerido.match(/(\d+)\s*x\s*(\d+)/i);
                if (match) {
                    const area = parseInt(match[1]) * parseInt(match[2]);
                    if (area > 900) dificultad++;
                }
            }
        } else if (catId === "limitanteConstruir" || catId === "limitanteComprar") {
            // Las limitantes NO suman a la dificultad normal
        } else if (catId === "ayudaCC" || catId === "ayudaTrucos" || catId === "ayudaMods") {
            if (typeof cat.resultado.dificultadDelta === "number") {
                dificultad += cat.resultado.dificultadDelta;
            }
        } else {
            dificultad++;
        }
    });

    return dificultad;
}
window.calcularDificultadTotal = calcularDificultadTotal;

function generarReto(esAleatorio = false) {
    const packsUsuario = obtenerPacksSeleccionadosUsuario();

    if (packsUsuario.length === 0) {
        alert("Debes tener al menos un pack seleccionado.");
        return;
    }

    let tipoReto = "con-solar";
    const opcionesActivas = [];

    if (esAleatorio) {
        // En reto aleatorio: tipo de reto aleatorio (con-solar o sin-solar)
        tipoReto = Math.random() < 0.5 ? "con-solar" : "sin-solar";

        // Seleccionar aleatoriamente entre 2 y 6 opciones extra
        const todasOpciones = [
            "presupuesto", "colores", "habilidades", "estilo-exterior", "estilo-interior",
            "temporizador", "limite-packs", "tipo-solar-aleatorio", "limite-altura", "tamano-solar",
            "limitante-construir", "limitante-comprar"
        ];

        // Mezclar array
        const mezcladas = [...todasOpciones].sort(() => 0.5 - Math.random());
        const numOpciones = Math.floor(Math.random() * 5) + 2; // 2 a 6 opciones

        for (let i = 0; i < numOpciones; i++) {
            opcionesActivas.push(mezcladas[i]);
        }
    } else {
        // Leer botón de tipo de reto
        const btnTipo = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
        if (btnTipo) {
            tipoReto = btnTipo.getAttribute("data-tipo") || "con-solar";
        }

        // Leer opciones extra seleccionadas por el usuario
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltro.seleccionada").forEach(btn => {
            const op = btn.getAttribute("data-opcion");
            if (op) opcionesActivas.push(op);
        });

        // Leer opciones de ayuda seleccionadas por el usuario
        document.querySelectorAll("#opcionesAyudaRetos .opcionFiltro.seleccionada").forEach(btn => {
            const ayudaKey = btn.getAttribute("data-ayuda");
            if (ayudaKey) opcionesActivas.push(ayudaKey);
        });

        // Leer opción de tipo de solar (solo puede haber una)
        const btnTipoSolar = document.querySelector("#tipoSolarOpciones .opcionFiltro.seleccionada");
        if (btnTipoSolar) {
            const op = btnTipoSolar.getAttribute("data-opcion");
            if (op && op !== "sin-tipo-solar") {
                opcionesActivas.push(op);
            }
        }

        // Leer botones de limitantes extra (Construir / Comprar)
        document.querySelectorAll("#limitantesExtraOpciones .opcionFiltro.seleccionada").forEach(btn => {
            const lim = btn.getAttribute("data-limitante");
            if (lim === "construir") opcionesActivas.push("limitante-construir");
            if (lim === "comprar") opcionesActivas.push("limitante-comprar");
        });
    }

    const submenusConfig = typeof obtenerConfigSubmenus === "function" ? obtenerConfigSubmenus() : {
        colores: { cantidad: 3 },
        limitePacks: { maxPacks: 3, tiposPermitidos: ["Expansión", "Contenido", "Accesorios", "Kits"] },
        tamanoSolar: { tamano: null }
    };

    // Mapeo entre data-opcion y módulo
    const mapaModulos = {
        "estilo-exterior": RetoModulos.estiloExterior,
        "estilo-interior": RetoModulos.estiloInterior,
        "limite-packs": RetoModulos.limitePacks,
        "presupuesto": RetoModulos.presupuesto,
        "limite-altura": RetoModulos.limiteAltura,
        "tamano-solar": RetoModulos.tamanoSolar,
        "tipo-solar-aleatorio": RetoModulos.objetivo,
        "solo-comunitarios": RetoModulos.objetivo,
        "solo-residenciales": RetoModulos.objetivo,
        "colores": RetoModulos.colores,
        "habilidades": RetoModulos.habilidades,
        "temporizador": RetoModulos.temporizador,
        "limitante-construir": RetoModulos.limitanteConstruir,
        "limitante-comprar": RetoModulos.limitanteComprar,
        "ayudaCC": RetoModulos.ayudaCC,
        "ayudaTrucos": RetoModulos.ayudaTrucos,
        "ayudaMods": RetoModulos.ayudaMods
    };

    const contexto = {
        packsUsuario: packsUsuario,
        configColores: submenusConfig.colores,
        configHabilidades: submenusConfig.habilidades,
        configPacks: submenusConfig.limitePacks,
        configTamano: submenusConfig.tamanoSolar,
        configLimitantesConstruir: submenusConfig.limitantesConstruir,
        configLimitantesComprar: submenusConfig.limitantesComprar,
        resultadosGenerados: {},
        opcionesActivas: opcionesActivas // Para pasarlo al módulo de objetivo
    };

    const categoriasGeneradas = {};

    // Orden de ejecución importante: Presupuesto antes de Temporizador
    const ordenEjecucion = [
        "presupuesto", "colores", "habilidades", "estilo-exterior", "estilo-interior",
        "limite-packs", "tamano-solar", "tipo-solar-aleatorio", "solo-comunitarios", "solo-residenciales", "limite-altura",
        "limitante-construir", "limitante-comprar", "temporizador",
        "ayudaCC", "ayudaTrucos", "ayudaMods"
    ];

    ordenEjecucion.forEach(opKey => {
        if (opcionesActivas.includes(opKey)) {
            const modulo = mapaModulos[opKey];
            if (modulo) {
                const res = modulo.generar(contexto);
                contexto.resultadosGenerados[modulo.id] = res;
                categoriasGeneradas[modulo.id] = {
                    modulo: modulo,
                    resultado: res,
                    rerollsRestantes: 3
                };
            }
        }
    });

    // Selección de solar si corresponde.
    // IMPORTANTE: el "límite de packs" restringe qué packs de contenido/objetos
    // se pueden usar, NO en qué mundo/solar se construye. Por eso el pool de
    // solares siempre usa los packs completos del usuario.
    let solarSeleccionado = null;
    if (tipoReto === "con-solar") {
        solarSeleccionado = seleccionarSolarParaReto(packsUsuario, categoriasGeneradas);
    }

    // Composición por etapas de vida (solo para retos residenciales). Se calcula
    // aquí, después de conocer el solar, porque la exclusión de "Caballo" depende
    // de si el solar asignado es de tamaño ND.
    if (categoriasGeneradas.objetivo && categoriasGeneradas.objetivo.resultado.tipo === "residencial") {
        const excluirCaballo = (tipoReto === "con-solar" && solarSeleccionado && (solarSeleccionado.tamaño || "").trim().toUpperCase() === "ND");
        const sims = categoriasGeneradas.objetivo.resultado.sims;

        categoriasGeneradas.objetivo.resultado.composicion = typeof generarComposicionVivienda === "function"
            ? generarComposicionVivienda(sims, packsUsuario, excluirCaballo)
            : [];
    }

    // Calcular dificultad total
    const dificultad = calcularDificultadTotal(tipoReto, categoriasGeneradas);

    // Dificultad Extra: independiente de la dificultad normal, solo cuenta
    // las limitantes de Construir/Comprar (1 punto = 1 🔥 por limitante).
    const dificultadExtra = calcularDificultadExtra(categoriasGeneradas);

    // Crear objeto reto actual
    retoActual = {
        tipo: tipoReto,
        solar: solarSeleccionado,
        rerollsSolar: 3,
        categorias: categoriasGeneradas,
        dificultad: dificultad,
        dificultadExtra: dificultadExtra,
        contexto: contexto
    };
    window.retoActual = retoActual;

    sincronizarTemporizadorConReto();

    // Renderizar resultado en UI y abrir ventana
    if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }

    if (typeof abrirVentana === "function") {
        abrirVentana("ventanaRetoResultado");
    }
}

function sincronizarTemporizadorConReto() {
    if (!retoActual || !retoActual.categorias || !retoActual.categorias["temporizador"]) return;
    const tempCat = retoActual.categorias["temporizador"];
    if (tempCat && tempCat.resultado) {
        const mins = tempCat.resultado.minutos || parseInt(tempCat.resultado.texto, 10);
        const inputMinutos = document.getElementById("inputMinutosTemporizador");
        if (inputMinutos && mins && !isNaN(mins)) {
            inputMinutos.value = mins;
        }
    }
}
window.sincronizarTemporizadorConReto = sincronizarTemporizadorConReto;

function rerollCategoria(categoriaId) {
    if (!retoActual || !retoActual.categorias[categoriaId]) return;

    const catObj = retoActual.categorias[categoriaId];
    if (catObj.rerollsRestantes <= 0) return;

    // Descontar reroll
    catObj.rerollsRestantes--;

    // Re-generar categoría con el módulo correspondiente
    const resNuevo = catObj.modulo.generar(retoActual.contexto);
    catObj.resultado = resNuevo;
    retoActual.contexto.resultadosGenerados[categoriaId] = resNuevo;

    // Si la categoría es "objetivo" y ha vuelto a salir residencial, recalculamos
    // también la composición por etapas de vida (respetando el solar ya asignado).
    if (categoriaId === "objetivo" && typeof recalcularComposicionVivienda === "function") {
        recalcularComposicionVivienda(retoActual);
    }

    // Si la categoría es una limitante, recalculamos la Dificultad Extra
    if (categoriaId === "limitanteConstruir" || categoriaId === "limitanteComprar") {
        retoActual.dificultadExtra = calcularDificultadExtra(retoActual.categorias);
    }

    // Si la categoría es de ayuda o afecta a la dificultad, recalculamos dificultad total
    if (categoriaId === "ayudaCC" || categoriaId === "ayudaTrucos" || categoriaId === "ayudaMods" || categoriaId === "tamanoSolar") {
        retoActual.dificultad = calcularDificultadTotal(retoActual.tipo, retoActual.categorias);
    }

    // Si la categoría era presupuesto y también está activo el temporizador, actualizar temporizador
    if (categoriaId === "presupuesto" && retoActual.categorias["temporizador"]) {
        const tempCat = retoActual.categorias["temporizador"];
        tempCat.resultado = tempCat.modulo.generar(retoActual.contexto);
    }

    // El reroll de limitePacks NO cambia el solar (el solar es independiente).

    sincronizarTemporizadorConReto();

    // Volver a renderizar UI sin cambiar el resto del reto
    if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }
}

// Reroll exclusivo del solar seleccionado (independiente de los rerolls de categorías)
function rerollSolar() {
    if (!retoActual || retoActual.tipo !== "con-solar") return;
    if (typeof retoActual.rerollsSolar !== "number") retoActual.rerollsSolar = 3;
    if (retoActual.rerollsSolar <= 0) return;

    retoActual.rerollsSolar--;
    retoActual.solar = seleccionarSolarParaReto(retoActual.contexto.packsUsuario, retoActual.categorias);

    // El nuevo solar puede cambiar si "Caballo" debe excluirse (tamaño ND) o no
    if (typeof recalcularComposicionVivienda === "function") {
        recalcularComposicionVivienda(retoActual);
    }

    if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }
}
window.rerollSolar = rerollSolar;