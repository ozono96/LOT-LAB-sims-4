/* =========================================================
   RETO GENERADOR
   Orquestador principal del generador de retos.
   ========================================================= */

// Estado del reto actual para permitir rerolls
let retoActual = null;

function obtenerPacksSeleccionadosUsuario() {
    const seleccionados = [];
    document.querySelectorAll("#listaPacksRetos .opcionFiltro.seleccionada").forEach(btn => {
        const pack = btn.getAttribute("data-pack");
        if (pack) seleccionados.push(pack);
    });
    return seleccionados;
}

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
            "presupuesto", "colores", "estilo-exterior", "estilo-interior",
            "temporizador", "limite-packs", "tipo-solar-aleatorio", "limite-altura", "tamano-solar"
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

        // Leer opción de tipo de solar (solo puede haber una)
        const btnTipoSolar = document.querySelector("#tipoSolarOpciones .opcionFiltro.seleccionada");
        if (btnTipoSolar) {
            const op = btnTipoSolar.getAttribute("data-opcion");
            if (op && op !== "sin-tipo-solar") {
                opcionesActivas.push(op);
            }
        }
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
        "temporizador": RetoModulos.temporizador
    };

    const contexto = {
        packsUsuario: packsUsuario,
        configColores: submenusConfig.colores,
        configPacks: submenusConfig.limitePacks,
        configTamano: submenusConfig.tamanoSolar,
        resultadosGenerados: {},
        opcionesActivas: opcionesActivas // Para pasarlo al módulo de objetivo
    };

    const categoriasGeneradas = {};

    // Orden de ejecución importante: Presupuesto antes de Temporizador
    const ordenEjecucion = [
        "presupuesto", "colores", "estilo-exterior", "estilo-interior",
        "limite-packs", "tamano-solar", "tipo-solar-aleatorio", "solo-comunitarios", "solo-residenciales", "limite-altura", "temporizador"
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

    // Selección de solar si corresponde (respetando restricciones del propio reto)
    let solarSeleccionado = null;
    if (tipoReto === "con-solar") {
        let poolPacksSolar = packsUsuario;
        if (categoriasGeneradas.limitePacks && categoriasGeneradas.limitePacks.resultado.packsPermitidos && categoriasGeneradas.limitePacks.resultado.packsPermitidos.length > 0) {
            poolPacksSolar = categoriasGeneradas.limitePacks.resultado.packsPermitidos;
        }
        solarSeleccionado = seleccionarSolarParaReto(poolPacksSolar, categoriasGeneradas);
    }

    // Calcular dificultad total
    let dificultad = 0;

    // "Reto con solar" suma 1
    if (tipoReto === "con-solar") {
        dificultad++;
    }

    // Categorías activas
    Object.keys(categoriasGeneradas).forEach(catId => {
        if (catId === "tamanoSolar") {
            const cat = categoriasGeneradas[catId];
            if (cat && cat.resultado && cat.resultado.tamanoRequerido) {
                const match = cat.resultado.tamanoRequerido.match(/(\d+)\s*x\s*(\d+)/i);
                if (match) {
                    const area = parseInt(match[1]) * parseInt(match[2]);
                    if (area > 900) {
                        dificultad++;
                    }
                }
            }
        } else {
            // El resto suma 1 siempre
            dificultad++;
        }
    });

    // Crear objeto reto actual
    retoActual = {
        tipo: tipoReto,
        solar: solarSeleccionado,
        categorias: categoriasGeneradas,
        dificultad: dificultad,
        contexto: contexto
    };

    // Renderizar resultado en UI y abrir ventana
    if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }

    if (typeof abrirVentana === "function") {
        abrirVentana("ventanaRetoResultado");
    }
}

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

    // Si la categoría era presupuesto y también está activo el temporizador, actualizar temporizador
    if (categoriaId === "presupuesto" && retoActual.categorias["temporizador"]) {
        const tempCat = retoActual.categorias["temporizador"];
        tempCat.resultado = tempCat.modulo.generar(retoActual.contexto);
    }

    // Si se rerollea limitePacks y el reto es con solar, actualizar el solar asignado
    if (categoriaId === "limitePacks" && retoActual.tipo === "con-solar") {
        let poolPacksSolar = retoActual.contexto.packsUsuario;
        if (resNuevo.packsPermitidos && resNuevo.packsPermitidos.length > 0) {
            poolPacksSolar = resNuevo.packsPermitidos;
        }
        retoActual.solar = seleccionarSolarParaReto(poolPacksSolar, retoActual.categorias);
    }

    // Volver a renderizar UI sin cambiar el resto del reto
    if (typeof renderizarResultadoReto === "function") {
        renderizarResultadoReto(retoActual);
    }
}
