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

/**
 * Sistema Centralizado de Validación de Disponibilidad del Reto.
 * Comprueba todos los recursos que dependen de packs según las opciones
 * seleccionadas actualmente por el usuario.
 *
 * @returns {Array<{id: string, icono: string, nombre: string, detalle: string}>} - Lista de problemas detectados
 */
function validarDisponibilidadReto() {
    const packsUsuario = typeof obtenerPacksSeleccionadosUsuario === "function" ? obtenerPacksSeleccionadosUsuario() : [];
    const problemas = [];

    // 1. Tipo de Reto: ¿Requiere solar?
    const btnTipo = document.querySelector("#tipoRetoOpciones .opcionFiltro.seleccionada");
    const tipoReto = btnTipo ? (btnTipo.getAttribute("data-tipo") || "con-solar") : "con-solar";

    if (tipoReto === "con-solar") {
        const haySolares = typeof haySolaresDisponibles === "function" ? haySolaresDisponibles(packsUsuario) : true;
        if (!haySolares) {
            problemas.push({
                id: "solar",
                icono: "🏡",
                nombre: "Reto con solar",
                detalle: "solares o mundos"
            });
        }
    }

    // 2. Tipo de Solar: ¿Está la opción activada?
    const btnPadreTipoSolar = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="tipo-solar"]');
    const tipoSolarActivo = btnPadreTipoSolar ? btnPadreTipoSolar.classList.contains("seleccionada") : false;

    if (tipoSolarActivo) {
        const hayObjetivos = typeof hayObjetivosDisponibles === "function" ? hayObjetivosDisponibles(packsUsuario) : true;
        if (!hayObjetivos) {
            problemas.push({
                id: "tipoSolar",
                icono: "🎯",
                nombre: "Tipo de solar",
                detalle: "tipos de solar"
            });
        }
    }

    // 3. Habilidades: ¿Está la opción activada?
    const btnHabilidades = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="habilidades"]');
    const habilidadesActivo = btnHabilidades ? btnHabilidades.classList.contains("seleccionada") : false;

    if (habilidadesActivo) {
        const hayHabilidades = typeof hayHabilidadesDisponibles === "function" ? hayHabilidadesDisponibles(packsUsuario) : true;
        if (!hayHabilidades) {
            problemas.push({
                id: "habilidades",
                icono: "🧠",
                nombre: "Habilidades requeridas",
                detalle: "habilidades"
            });
        }
    }

    return problemas;
}
window.validarDisponibilidadReto = validarDisponibilidadReto;

/**
 * Actualiza el CUADRO ÚNICO de advertencia de disponibilidad dinámicamente.
 * Si todo está disponible, oculta el aviso y habilita los botones de generación.
 * Si hay 1 o más problemas, muestra un único aviso agrupado y bloquea la generación.
 */
function actualizarAvisoDisponibilidadReto() {
    const aviso = document.getElementById("avisoDisponibilidadReto") || document.getElementById("avisoSinObjetivosTipoSolar");
    const btnGenerarReto = document.getElementById("generarRetoBtn");
    const btnRetoAleatorio = document.getElementById("retoAleatorioBtn");
    if (!aviso) return;

    const problemas = validarDisponibilidadReto();

    if (problemas.length === 0) {
        aviso.style.display = "none";
        if (btnGenerarReto) {
            btnGenerarReto.disabled = false;
            btnGenerarReto.classList.remove("deshabilitado");
        }
        if (btnRetoAleatorio) {
            btnRetoAleatorio.disabled = false;
            btnRetoAleatorio.classList.remove("deshabilitado");
        }
    } else {
        aviso.style.display = "block";
        if (btnGenerarReto) {
            btnGenerarReto.disabled = true;
            btnGenerarReto.classList.add("deshabilitado");
        }
        if (btnRetoAleatorio) {
            btnRetoAleatorio.disabled = true;
            btnRetoAleatorio.classList.add("deshabilitado");
        }

        // Construir el mensaje dinámico adaptado
        if (problemas.length === 1) {
            const p = problemas[0];
            let explicacion = "";
            if (p.id === "solar") {
                explicacion = "No hay solares disponibles con los packs seleccionados. Activa el <strong>Juego Base</strong> o algún pack que incluya mundos/solares para poder generar un reto con solar (o cambia a <strong>Reto sin solar</strong>).";
            } else if (p.id === "tipoSolar") {
                explicacion = "No hay tipos de solar disponibles con los packs seleccionados. Activa el <strong>Juego Base</strong> o algún pack que proporcione tipos de solar para poder utilizar esta opción (o desmarca Tipo de solar).";
            } else if (p.id === "habilidades") {
                explicacion = "No hay habilidades disponibles con los packs seleccionados. Activa algún pack que incluya habilidades para poder utilizar esta opción (o desmarca Habilidades requeridas).";
            } else {
                explicacion = `No hay contenido disponible para <strong>${p.nombre}</strong> con los packs seleccionados.`;
            }

            aviso.innerHTML = `
                <div style="font-size: 1.3rem; margin-bottom: 6px;">⚠️</div>
                <strong style="font-size: 1.05rem;">No puedes generar este reto</strong>
                <div style="margin-top: 6px; opacity: 0.88;">${explicacion}</div>
            `;
        } else {
            // Múltiples problemas agrupados en una sola advertencia
            const listaHtml = problemas.map(p => `<div>• ${p.icono} <strong>${p.nombre}</strong></div>`).join("");
            aviso.innerHTML = `
                <div style="font-size: 1.3rem; margin-bottom: 6px;">⚠️</div>
                <strong style="font-size: 1.05rem;">No puedes generar este reto</strong>
                <div style="margin-top: 6px; opacity: 0.9;">No hay contenido disponible para las opciones seleccionadas porque has desactivado todos los packs necesarios para:</div>
                <div style="margin: 10px auto; text-align: left; display: inline-block; font-size: 0.95rem; line-height: 1.6;">
                    ${listaHtml}
                </div>
                <div style="margin-top: 4px; opacity: 0.85;">Activa el <strong>Juego Base</strong> o algún pack compatible para poder generar el reto con estas opciones.</div>
            `;
        }
    }
}
window.actualizarAvisoDisponibilidadReto = actualizarAvisoDisponibilidadReto;
window.actualizarAvisoTipoSolar = actualizarAvisoDisponibilidadReto; // Alias de retrocompatibilidad

function generarReto(esAleatorio = false) {
    const packsUsuario = obtenerPacksSeleccionadosUsuario();

    if (packsUsuario.length === 0) {
        alert("Debes tener al menos un pack seleccionado.");
        return;
    }

    // Validación preventiva obligatoria antes de generar
    if (!esAleatorio) {
        const problemas = validarDisponibilidadReto();
        if (problemas.length > 0) {
            actualizarAvisoDisponibilidadReto();
            return;
        }
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

        // Leer opciones extra seleccionadas por el usuario (excluyendo el botón padre tipo-solar que se resuelve abajo)
        document.querySelectorAll("#opcionesExtraRetos .opcionFiltro.seleccionada").forEach(btn => {
            const op = btn.getAttribute("data-opcion");
            if (op && op !== "tipo-solar") opcionesActivas.push(op);
        });

        // Leer opciones de ayuda seleccionadas por el usuario
        document.querySelectorAll("#opcionesAyudaRetos .opcionFiltro.seleccionada").forEach(btn => {
            const ayudaKey = btn.getAttribute("data-ayuda");
            if (ayudaKey) opcionesActivas.push(ayudaKey);
        });

        // Leer opción de tipo de solar (solo si el botón padre tipo-solar está seleccionado)
        const btnPadreTipoSolar = document.querySelector('#opcionesExtraRetos .opcionFiltro[data-opcion="tipo-solar"]');
        const tipoSolarActivado = btnPadreTipoSolar ? btnPadreTipoSolar.classList.contains("seleccionada") : true;

        if (tipoSolarActivado) {
            const btnTipoSolar = document.querySelector("#tipoSolarOpciones .opcionSubmenuTipoSolar.seleccionada, #tipoSolarOpciones .opcionFiltro.seleccionada");
            if (btnTipoSolar) {
                const op = btnTipoSolar.getAttribute("data-opcion");
                if (op && op !== "sin-tipo-solar") {
                    opcionesActivas.push(op);
                }
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

    // Construir secuencias de animación
    const secuencias = typeof construirSecuenciasReto === "function"
        ? construirSecuenciasReto(retoActual, contexto)
        : {};

    if (typeof abrirVentana === "function") {
        abrirVentana("ventanaRetoResultado");
    }

    // Ejecutar animación de ruleta vertical o renderizado directo
    if (typeof animarGeneracionReto === "function" && Object.keys(secuencias).length > 0) {
        animarGeneracionReto(retoActual, secuencias);
    } else if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }

    // Emitir el evento completo a OBS con secuencias para sincronización idéntica
    if (typeof window.emitirEventoOBS === 'function' && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("RETO_GENERADO", {
            reto: serializarRetoParaOBS(retoActual),
            animar: true,
            secuencias: secuencias
        });
    }

    // Actualizar URL con el token v1 autosuficiente del reto generado
    if (typeof serializarRetoAToken === "function" && typeof actualizarHashURL === "function") {
        const token = serializarRetoAToken(retoActual);
        if (token) {
            actualizarHashURL("reto-generado/v1/" + token);
        }
    }
}

// Limpia el objeto retoActual de propiedades no serializables (funciones)
// para poder transmitirlo por WebRTC. Solo conserva datos puros.
function serializarRetoParaOBS(reto) {
    if (!reto) return null;
    const copia = {
        tipo: reto.tipo,
        solar: reto.solar,
        rerollsSolar: reto.rerollsSolar,
        dificultad: reto.dificultad,
        dificultadExtra: reto.dificultadExtra,
        categorias: {}
    };
    if (reto.categorias) {
        Object.keys(reto.categorias).forEach(catId => {
            const cat = reto.categorias[catId];
            const tituloModulo = cat.modulo ? cat.modulo.titulo : (RetoModulos[catId] ? RetoModulos[catId].titulo : "");
            copia.categorias[catId] = {
                resultado: cat.resultado,
                rerollsRestantes: cat.rerollsRestantes,
                moduloId: cat.modulo ? cat.modulo.id : catId,
                modulo: { id: cat.modulo ? cat.modulo.id : catId, titulo: tituloModulo || "" }
            };
        });
    }
    return copia;
}
window.serializarRetoParaOBS = serializarRetoParaOBS;

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

    sincronizarTemporizadorConReto();

    // Construir secuencia de animación de reroll
    const secuencia = typeof construirSecuenciaCategoria === "function"
        ? construirSecuenciaCategoria(categoriaId, retoActual, retoActual.contexto)
        : [];

    if (typeof animarRerollTarjeta === "function" && secuencia.length > 0) {
        animarRerollTarjeta(categoriaId, retoActual, secuencia);
    } else if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }

    if (typeof window.emitirEventoOBS === 'function' && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("RETO_REROLL", {
            categoriaId: categoriaId,
            reto: serializarRetoParaOBS(retoActual),
            secuencia: secuencia
        });
    }

    // Actualizar URL con el nuevo estado del reto post-reroll
    if (typeof serializarRetoAToken === "function" && typeof actualizarHashURL === "function") {
        const nuevoToken = serializarRetoAToken(retoActual);
        if (nuevoToken) {
            actualizarHashURL("reto-generado/v1/" + nuevoToken);
        }
    }
}
window.rerollCategoria = rerollCategoria;

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

    const secuencia = typeof construirSecuenciaCategoria === "function"
        ? construirSecuenciaCategoria("solar", retoActual, retoActual.contexto)
        : [];

    if (typeof animarRerollTarjeta === "function" && secuencia.length > 0) {
        animarRerollTarjeta("solar", retoActual, secuencia);
    } else if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }

    if (typeof window.emitirEventoOBS === 'function' && !window.esSincronizacionOBS) {
        window.emitirEventoOBS("RETO_REROLL", {
            categoriaId: "solar",
            reto: serializarRetoParaOBS(retoActual),
            secuencia: secuencia
        });
    }

    // Actualizar URL con el nuevo estado del reto post-reroll
    if (typeof serializarRetoAToken === "function" && typeof actualizarHashURL === "function") {
        const nuevoToken = serializarRetoAToken(retoActual);
        if (nuevoToken) {
            actualizarHashURL("reto-generado/v1/" + nuevoToken);
        }
    }
}
window.rerollSolar = rerollSolar;

// =========================================================
// SISTEMA DE TOKEN v1 PARA RETOS AUTOSUFICIENTES (#reto-generado/v1/<token>)
// =========================================================

const MAPA_CAT_A_CLAVE = {
    estiloExterior: "ext",
    estiloInterior: "int",
    presupuesto: "pre",
    colores: "col",
    habilidades: "hab",
    limiteAltura: "alt",
    tamanoSolar: "tam",
    objetivo: "obj",
    limitePacks: "pck",
    limitanteConstruir: "lc",
    limitanteComprar: "lp",
    ayudaCC: "acc",
    ayudaTrucos: "at",
    ayudaMods: "am",
    temporizador: "temp"
};

const MAPA_CLAVE_A_CAT = {
    ext: "estiloExterior",
    int: "estiloInterior",
    pre: "presupuesto",
    col: "colores",
    hab: "habilidades",
    alt: "limiteAltura",
    tam: "tamanoSolar",
    obj: "objetivo",
    pck: "limitePacks",
    lc: "limitanteConstruir",
    lp: "limitanteComprar",
    acc: "ayudaCC",
    at: "ayudaTrucos",
    am: "ayudaMods",
    temp: "temporizador"
};

function codificarBase64URL(cadena) {
    const bytes = new TextEncoder().encode(cadena);
    let binario = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binario += String.fromCharCode(bytes[i]);
    }
    return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodificarBase64URL(base64url) {
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
}

function serializarRetoAToken(reto) {
    if (!reto || typeof reto !== "object") return null;

    try {
        const payload = {
            v: 1,
            t: reto.tipo === "con-solar" ? "con" : "sin",
            c: {}
        };

        if (reto.tipo === "con-solar" && reto.solar) {
            payload.s = reto.solar.id;
            payload.rs = typeof reto.rerollsSolar === "number" ? reto.rerollsSolar : 3;
        }

        if (reto.categorias && typeof reto.categorias === "object") {
            Object.keys(reto.categorias).forEach(catId => {
                const cat = reto.categorias[catId];
                if (!cat || !cat.resultado) return;

                const clave = MAPA_CAT_A_CLAVE[catId];
                if (!clave) return;

                const r = typeof cat.rerollsRestantes === "number" ? cat.rerollsRestantes : 3;
                const res = cat.resultado;

                switch (catId) {
                    case "estiloExterior":
                    case "estiloInterior":
                        payload.c[clave] = [res.id || null, r];
                        break;
                    case "presupuesto":
                        payload.c[clave] = [res.esIlimitado ? -1 : (res.valorNumerico || 0), r];
                        break;
                    case "colores": {
                        const ids = (res.elementos || []).map(c => c.id).filter(Boolean);
                        payload.c[clave] = [ids, r];
                        break;
                    }
                    case "habilidades": {
                        const ids = (res.elementos || []).map(h => Array.isArray(h) ? h[2] : (h.id || "")).filter(Boolean);
                        payload.c[clave] = [ids, r];
                        break;
                    }
                    case "limiteAltura": {
                        const m = String(res.texto || "").match(/\d+/);
                        const plantas = m ? parseInt(m[0], 10) : 1;
                        payload.c[clave] = [plantas, r];
                        break;
                    }
                    case "tamanoSolar":
                        payload.c[clave] = [res.tamanoRequerido || "", r];
                        break;
                    case "objetivo": {
                        const nombre = res.nombre || "Residencial";
                        const esResidencial = (res.tipo === "residencial") || (res.composicion && res.composicion.length > 0);
                        if (esResidencial) {
                            const sims = res.sims || (res.composicion ? res.composicion.length : 1);
                            const etapasIds = (res.composicion || []).map(e => e.idFoto).filter(Boolean);
                            payload.c[clave] = [nombre, sims, etapasIds, r];
                        } else {
                            payload.c[clave] = [nombre, 0, [], r];
                        }
                        break;
                    }
                    case "limitePacks": {
                        const packs = Array.isArray(res.packsPermitidos) ? res.packsPermitidos : [];
                        payload.c[clave] = [packs, r];
                        break;
                    }
                    case "limitanteConstruir":
                    case "limitanteComprar": {
                        const ids = (res.elementos || []).map(l => l.idFoto).filter(Boolean);
                        payload.c[clave] = [ids, r];
                        break;
                    }
                    case "ayudaCC":
                    case "ayudaTrucos":
                    case "ayudaMods":
                        payload.c[clave] = [res.permitido ? 1 : 0, r];
                        break;
                    case "temporizador":
                        payload.c[clave] = [res.minutos || parseInt(res.texto, 10) || 15, r];
                        break;
                }
            });
        }

        const jsonStr = JSON.stringify(payload);
        return codificarBase64URL(jsonStr);
    } catch (e) {
        console.error("Error al serializar reto a token:", e);
        return null;
    }
}
window.serializarRetoAToken = serializarRetoAToken;

function deserializarRetoV1(token) {
    if (!token || typeof token !== "string") return false;

    try {
        const jsonStr = decodificarBase64URL(token.trim());
        const payload = JSON.parse(jsonStr);

        if (!payload || payload.v !== 1 || !payload.t || !payload.c || typeof payload.c !== "object") {
            return false;
        }

        const tipoReto = payload.t === "con" ? "con-solar" : "sin-solar";

        // 1. Resolver solar si corresponde
        let solarEncontrado = null;
        let rerollsSolar = 0;
        if (tipoReto === "con-solar") {
            rerollsSolar = typeof payload.rs === "number" ? payload.rs : 3;
            if (payload.s && database && database.solares) {
                solarEncontrado = database.solares.find(s => s.id === payload.s) || null;
            }
            // Fallback defensivo si el solar ya no existiera
            if (!solarEncontrado && payload.s) {
                solarEncontrado = {
                    id: payload.s,
                    nombre: "Solar (" + payload.s + ")",
                    mundo: "Mundo desconocido",
                    barrio: "",
                    tamaño: "30x20",
                    tipoSolar: "Residencial",
                    tipoLote: "Solar",
                    orientacion: "",
                    acera: ""
                };
            }
        }

        // 2. Resolver categorías activas
        const categorias = {};
        Object.keys(payload.c).forEach(clave => {
            const catId = MAPA_CLAVE_A_CAT[clave];
            if (!catId || !RetoModulos[catId]) return;

            const datos = payload.c[clave];
            if (!Array.isArray(datos)) return;

            const modulo = RetoModulos[catId];
            let resultado = null;
            let rerollsRestantes = 3;

            switch (catId) {
                case "estiloExterior": {
                    const id = datos[0] || null;
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const fila = (database.estilosArquitectonicos || []).find(f => (Array.isArray(f) && f[2]) === id);
                    const nombre = fila ? (Array.isArray(fila) ? fila[0] : fila) : (id || "Cualquiera");
                    resultado = { id: id, nombre: nombre, texto: nombre };
                    break;
                }
                case "estiloInterior": {
                    const id = datos[0] || null;
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const fila = (database.estilosDecoracion || []).find(f => (Array.isArray(f) && f[2]) === id);
                    const nombre = fila ? (Array.isArray(fila) ? fila[0] : fila) : (id || "Cualquiera");
                    resultado = { id: id, nombre: nombre, texto: nombre };
                    break;
                }
                case "presupuesto": {
                    const val = datos[0];
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const esIlimitado = val === -1 || val === Infinity;
                    const valNum = esIlimitado ? Infinity : Number(val);
                    const texto = esIlimitado ? "Presupuesto ILIMITADO" : (valNum.toLocaleString("es-ES") + " §");
                    resultado = { texto: texto, valorNumerico: valNum, esIlimitado: esIlimitado };
                    break;
                }
                case "colores": {
                    const ids = Array.isArray(datos[0]) ? datos[0] : [];
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const elementos = ids.map(id => {
                        const fila = (database.colores || []).find(c => (Array.isArray(c) && c[2]) === id);
                        const nombre = fila ? (Array.isArray(fila) ? fila[0] : fila) : ("Color (" + id + ")");
                        const hex = (fila && Array.isArray(fila) && fila[1]) ? fila[1].trim() : "#CCCCCC";
                        return { id: id, nombre: nombre, hex: hex };
                    });
                    const nombres = elementos.map(c => c.nombre).join(", ");
                    resultado = {
                        texto: `${elementos.length} color(es): ${nombres}`,
                        elementos: elementos
                    };
                    break;
                }
                case "habilidades": {
                    const ids = Array.isArray(datos[0]) ? datos[0] : [];
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const elementos = ids.map(id => {
                        const fila = (database.habilidades || []).find(h => (Array.isArray(h) && h[2]) === id);
                        if (fila) return fila;
                        return ["Habilidad (" + id + ")", "Los Sims 4", id];
                    });
                    const nombres = elementos.map(f => (f[0] || "").trim()).join(", ");
                    resultado = {
                        texto: `${elementos.length} habilidad(es): ${nombres}`,
                        elementos: elementos
                    };
                    break;
                }
                case "limiteAltura": {
                    const plantas = Number(datos[0]) || 1;
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = { texto: `Mínimo ${plantas} ${plantas === 1 ? "planta" : "plantas"}` };
                    break;
                }
                case "tamanoSolar": {
                    const tam = String(datos[0] || "");
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = { texto: `Obligatorio: ${tam}`, tamanoRequerido: tam };
                    break;
                }
                case "objetivo": {
                    const nombre = String(datos[0] || "Residencial");
                    const sims = Number(datos[1]) || 0;
                    const etapasIds = Array.isArray(datos[2]) ? datos[2] : [];
                    rerollsRestantes = typeof datos[3] === "number" ? datos[3] : 3;

                    const fila = (database.objetivos || []).find(f => (f[1] || "").trim().toLowerCase() === nombre.trim().toLowerCase());
                    const tipoObj = fila && fila[0] ? fila[0].trim().toLowerCase() : (sims > 0 ? "residencial" : "comunitario");
                    const imagenRaw = fila && fila[3] ? fila[3].trim() : "";
                    const imagenObj = typeof normalizarRutaIconoTipoSolar === "function" ? normalizarRutaIconoTipoSolar(imagenRaw) : null;

                    if (tipoObj.includes("residencial") || sims > 0) {
                        const numSims = sims > 0 ? sims : Math.max(1, etapasIds.length);
                        const composicion = etapasIds.map(id => {
                            const filaEtapa = (database.etapasVida || []).find(e => (e[1] || "").trim() === id);
                            return {
                                etapa: filaEtapa ? filaEtapa[0].trim() : ("Etapa " + id),
                                idFoto: id,
                                packRequerido: filaEtapa && filaEtapa[2] ? filaEtapa[2].trim() : ""
                            };
                        });
                        resultado = {
                            nombre: nombre,
                            texto: `${nombre} (Vivienda para ${numSims} ${numSims === 1 ? "Sim" : "Sims"})`,
                            tipo: "residencial",
                            sims: numSims,
                            imagen: imagenObj || null,
                            composicion: composicion
                        };
                    } else {
                        resultado = {
                            nombre: nombre,
                            texto: `${nombre} (Solar comunitario)`,
                            tipo: "comunitario",
                            imagen: imagenObj || null
                        };
                    }
                    break;
                }
                case "limitePacks": {
                    const packs = Array.isArray(datos[0]) ? datos[0] : [];
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = {
                        texto: `Máximo ${packs.length} pack(s): ${packs.join(", ")}`,
                        packsPermitidos: packs
                    };
                    break;
                }
                case "limitanteConstruir": {
                    const ids = Array.isArray(datos[0]) ? datos[0] : [];
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const elementos = ids.map(id => {
                        const fila = (database.limitantesConstruir || []).find(l => (l[1] || "").trim() === id);
                        return {
                            nombre: fila ? fila[0].trim() : ("Limitante (" + id + ")"),
                            idFoto: id
                        };
                    });
                    resultado = {
                        texto: `${elementos.length} limitante${elementos.length === 1 ? "" : "s"} de construcción`,
                        elementos: elementos
                    };
                    break;
                }
                case "limitanteComprar": {
                    const ids = Array.isArray(datos[0]) ? datos[0] : [];
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    const elementos = ids.map(id => {
                        const fila = (database.limitantesComprar || []).find(l => (l[1] || "").trim() === id);
                        return {
                            nombre: fila ? fila[0].trim() : ("Limitante (" + id + ")"),
                            idFoto: id
                        };
                    });
                    resultado = {
                        texto: `${elementos.length} limitante${elementos.length === 1 ? "" : "s"} de compra`,
                        elementos: elementos
                    };
                    break;
                }
                case "ayudaCC": {
                    const esPermitido = Boolean(datos[0]);
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = {
                        permitido: esPermitido,
                        dificultadDelta: esPermitido ? -1 : 1,
                        texto: esPermitido ? "✅ SÍ se puede usar CC (-1 Dificultad)" : "❌ NO se puede usar CC (+1 Dificultad)"
                    };
                    break;
                }
                case "ayudaTrucos": {
                    const esPermitido = Boolean(datos[0]);
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = {
                        permitido: esPermitido,
                        dificultadDelta: esPermitido ? -1 : 1,
                        texto: esPermitido ? "✅ SÍ se pueden usar trucos (bb.moveobjects on...) (-1 Dificultad)" : "❌ NO se pueden usar trucos de construcción (+1 Dificultad)"
                    };
                    break;
                }
                case "ayudaMods": {
                    const esPermitido = Boolean(datos[0]);
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = {
                        permitido: esPermitido,
                        dificultadDelta: esPermitido ? -1 : 1,
                        texto: esPermitido ? "✅ SÍ se pueden usar mods de ayuda (T.O.O.L...) (-1 Dificultad)" : "❌ NO se pueden usar mods de ayuda (+1 Dificultad)"
                    };
                    break;
                }
                case "temporizador": {
                    const mins = Number(datos[0]) || 15;
                    rerollsRestantes = typeof datos[1] === "number" ? datos[1] : 3;
                    resultado = { texto: `${mins} minutos`, minutos: mins };
                    break;
                }
            }

            if (resultado) {
                categorias[catId] = {
                    modulo: modulo,
                    resultado: resultado,
                    rerollsRestantes: rerollsRestantes
                };
            }
        });

        // 3. Reconstruir contexto para permitir que futuros rerolls funcionen
        const contexto = {
            packsUsuario: typeof obtenerPacksSeleccionadosUsuario === "function" ? obtenerPacksSeleccionadosUsuario() : [],
            configColores: {
                cantidad: categorias.colores?.resultado?.elementos?.length || 3
            },
            configHabilidades: {
                cantidad: categorias.habilidades?.resultado?.elementos?.length || 3
            },
            configLimitantesConstruir: {
                cantidad: categorias.limitanteConstruir?.resultado?.elementos?.length || 1
            },
            configLimitantesComprar: {
                cantidad: categorias.limitanteComprar?.resultado?.elementos?.length || 1
            },
            configTamano: {
                tamano: categorias.tamanoSolar?.resultado?.tamanoRequerido || null
            },
            configPacks: {
                maxPacks: categorias.limitePacks?.resultado?.packsPermitidos?.length || 3,
                tiposPermitidos: ["Expansión", "Contenido", "Accesorios", "Kits"],
                juegoBasePermitido: true
            },
            resultadosGenerados: {},
            opcionesActivas: []
        };

        Object.keys(categorias).forEach(catId => {
            contexto.resultadosGenerados[catId] = categorias[catId].resultado;
            if (catId === "estiloExterior") contexto.opcionesActivas.push("estilo-exterior");
            else if (catId === "estiloInterior") contexto.opcionesActivas.push("estilo-interior");
            else if (catId === "limitePacks") contexto.opcionesActivas.push("limite-packs");
            else if (catId === "limiteAltura") contexto.opcionesActivas.push("limite-altura");
            else if (catId === "tamanoSolar") contexto.opcionesActivas.push("tamano-solar");
            else if (catId === "presupuesto") contexto.opcionesActivas.push("presupuesto");
            else if (catId === "colores") contexto.opcionesActivas.push("colores");
            else if (catId === "habilidades") contexto.opcionesActivas.push("habilidades");
            else if (catId === "temporizador") contexto.opcionesActivas.push("temporizador");
            else if (catId === "limitanteConstruir") contexto.opcionesActivas.push("construir");
            else if (catId === "limitanteComprar") contexto.opcionesActivas.push("comprar");
            else if (catId === "ayudaCC") contexto.opcionesActivas.push("ayudaCC");
            else if (catId === "ayudaTrucos") contexto.opcionesActivas.push("ayudaTrucos");
            else if (catId === "ayudaMods") contexto.opcionesActivas.push("ayudaMods");
            else if (catId === "objetivo") {
                const esRes = categorias.objetivo.resultado?.tipo === "residencial";
                contexto.opcionesActivas.push(esRes ? "solo-residenciales" : "solo-comunitarios");
            }
        });

        // 4. Recalcular dificultad de forma determinista
        const dif = typeof calcularDificultadTotal === "function" ? calcularDificultadTotal(tipoReto, categorias) : 0;
        const difExtra = typeof calcularDificultadExtra === "function" ? calcularDificultadExtra(categorias) : 0;

        // 5. Ensamblar retoActual
        retoActual = {
            tipo: tipoReto,
            solar: tipoReto === "con-solar" ? solarEncontrado : null,
            rerollsSolar: tipoReto === "con-solar" ? rerollsSolar : 0,
            categorias: categorias,
            dificultad: dif,
            dificultadExtra: difExtra,
            contexto: contexto
        };
        window.retoActual = retoActual;

        // 6. Abrir ventana y renderizar sin animación ni sorteo
        if (typeof abrirVentana === "function") {
            abrirVentana("ventanaRetoResultado", false);
        }
        if (typeof renderizarResultadoReto === "function") {
            renderizarResultadoReto(retoActual);
        }
        if (typeof sincronizarTemporizadorConReto === "function") {
            sincronizarTemporizadorConReto();
        }

        return true;
    } catch (e) {
        console.error("Error al deserializar token de reto:", e);
        return false;
    }
}
window.deserializarRetoV1 = deserializarRetoV1;