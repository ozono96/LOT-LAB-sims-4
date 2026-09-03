/**
 * Construye de forma segura la ruta a la imagen del tipo de solar
 * a partir del valor de la columna D de "Listado de objetivos".
 */
function normalizarRutaIconoTipoSolar(val) {
    if (!val || typeof val !== "string") return null;
    let limpio = val.trim();
    if (!limpio) return null;
    if (limpio.startsWith("http://") || limpio.startsWith("https://") || limpio.startsWith("data:") || limpio.startsWith("img/")) {
        return limpio;
    }
    limpio = limpio.replace(/\.(png|jpg|jpeg|webp)$/i, "");
    limpio += ".webp";
    return `img/iconos-tipo-solar/${limpio}`;
}
window.normalizarRutaIconoTipoSolar = normalizarRutaIconoTipoSolar;

/**
 * Normaliza un nombre de pack para comparación flexible (minúsculas, sin espacios extra).
 */
function _normPack(s) {
    return (s || "").toLowerCase().trim();
}

/**
 * Determina el nombre oficial del Juego Base desde database.packs (columna 10).
 * Devuelve string o null.
 */
function _nombreJuegoBase() {
    if (typeof database === "undefined" || !database.packs) return null;
    for (const fila of database.packs) {
        const jb = (fila[10] || "").trim();
        if (jb) return jb;
    }
    return null;
}

/**
 * Filtra la lista de objetivos (Listado de objetivos) según los packs
 * activos del usuario, aplicando la regla:
 *   - Columna C vacía → requiere Juego Base
 *   - Columna C con nombre → requiere ese pack exacto (comparación flexible)
 *
 * @param {Array[]} lista      - Filas de database.objetivos
 * @param {string[]} packsUsuario - Nombres de packs seleccionados por el usuario
 * @returns {Array[]|null}     - Subconjunto válido, o null si no hay ninguno
 */
function filtrarObjetivosPorPacks(lista, packsUsuario) {
    if (!lista || lista.length === 0) return null;

    const packsNorm = (packsUsuario || []).map(_normPack).filter(Boolean);
    const nombreJB = _nombreJuegoBase();
    const jbNorm = nombreJB ? _normPack(nombreJB) : null;
    const jbActivo = jbNorm ? packsNorm.includes(jbNorm) : false;

    const validos = lista.filter(fila => {
        if (!fila || fila.length === 0) return false;
        const colC = (fila[2] || "").trim();

        if (!colC) {
            // Columna C vacía → Juego Base
            return jbActivo;
        }

        const colCNorm = _normPack(colC);

        // Comparación flexible: incluye o está incluido
        return packsNorm.some(p =>
            p === colCNorm ||
            p.includes(colCNorm) ||
            colCNorm.includes(p)
        );
    });

    return validos.length > 0 ? validos : null;
}
window.filtrarObjetivosPorPacks = filtrarObjetivosPorPacks;

/**
 * Comprueba si hay al menos un objetivo disponible para los packs activos.
 * Devuelve true si hay disponibilidad, false si no hay ninguno.
 */
function hayObjetivosDisponibles(packsUsuario) {
    const lista = (typeof database !== "undefined" && database.objetivos) ? database.objetivos : [];
    return filtrarObjetivosPorPacks(lista, packsUsuario) !== null;
}
window.hayObjetivosDisponibles = hayObjetivosDisponibles;

/**
 * Filtra la lista de habilidades según los packs activos del usuario.
 *   - Columna B vacía o 'base'/'juego base' → requiere Juego Base
 *   - Columna B con nombre de pack → requiere ese pack activo
 */
function filtrarHabilidadesPorPacks(lista, packsUsuario) {
    if (!lista || lista.length === 0) return null;

    const packsNorm = (packsUsuario || []).map(_normPack).filter(Boolean);
    const nombreJB = _nombreJuegoBase();
    const jbNorm = nombreJB ? _normPack(nombreJB) : null;
    const jbActivo = jbNorm ? packsNorm.includes(jbNorm) : (typeof juegoBaseMarcado === "function" ? juegoBaseMarcado() : false);

    const validas = lista.filter(fila => {
        if (!fila || fila.length === 0) return false;
        const packReq = (fila[1] || "").trim();

        if (!packReq || _normPack(packReq) === "base" || _normPack(packReq).includes("juego base") || packReq === "-") {
            return jbActivo;
        }

        const packReqNorm = _normPack(packReq);
        return packsNorm.some(p =>
            p === packReqNorm ||
            p.includes(packReqNorm) ||
            packReqNorm.includes(p)
        );
    });

    return validas.length > 0 ? validas : null;
}
window.filtrarHabilidadesPorPacks = filtrarHabilidadesPorPacks;

/**
 * Comprueba si hay al menos una habilidad disponible para los packs activos.
 */
function hayHabilidadesDisponibles(packsUsuario) {
    const lista = (typeof database !== "undefined" && database.habilidades) ? database.habilidades : [];
    return filtrarHabilidadesPorPacks(lista, packsUsuario) !== null;
}
window.hayHabilidadesDisponibles = hayHabilidadesDisponibles;

/**
 * Comprueba si hay al menos un solar disponible para los packs activos del usuario.
 */
function haySolaresDisponibles(packsUsuario) {
    if (typeof database === "undefined" || !database.solares || database.solares.length === 0) return false;
    const packsNorm = (packsUsuario || []).map(_normPack).filter(Boolean);
    const nombreJB = _nombreJuegoBase();
    const jbNorm = nombreJB ? _normPack(nombreJB) : null;
    const jbActivo = jbNorm ? packsNorm.includes(jbNorm) : (typeof juegoBaseMarcado === "function" ? juegoBaseMarcado() : false);

    return database.solares.some(solar => {
        const packSolar = (solar.nombrePack || "").trim();
        const tipoPackSolar = (solar.tipoPack || "").trim().toLowerCase();

        const esJuegoBase = tipoPackSolar.includes("base") || packSolar.toLowerCase().includes("juego base") || packSolar.toLowerCase() === "los sims 4";

        if ((solar.tipoLote || "").trim().toLowerCase() === "solar oculto") {
            return false;
        }

        if (esJuegoBase) {
            return jbActivo;
        }

        const packSolarNorm = _normPack(packSolar);
        return packsNorm.some(p => p === packSolarNorm || packSolarNorm.includes(p) || p.includes(packSolarNorm));
    });
}
window.haySolaresDisponibles = haySolaresDisponibles;

const RetoModulos = {
    // 🏛 Estilo Exterior
    estiloExterior: {
        id: "estiloExterior",
        titulo: "🏛 Estilo Exterior",
        generar: function (contexto) {
            const lista = database.estilosArquitectonicos || [];
            if (lista.length === 0) return { id: null, nombre: "Cualquiera", texto: "Cualquiera" };
            const fila = lista[Math.floor(Math.random() * lista.length)];
            const nombre = (Array.isArray(fila) ? fila[0] : fila) || "Cualquiera";
            const id = (Array.isArray(fila) && fila[2]) ? String(fila[2]).trim() : null;
            return { id: id, nombre: nombre, texto: nombre };
        }
    },

    // 🛋 Estilo Interior
    estiloInterior: {
        id: "estiloInterior",
        titulo: "🛋 Estilo Interior",
        generar: function (contexto) {
            const lista = database.estilosDecoracion || [];
            if (lista.length === 0) return { id: null, nombre: "Cualquiera", texto: "Cualquiera" };
            const fila = lista[Math.floor(Math.random() * lista.length)];
            const nombre = (Array.isArray(fila) ? fila[0] : fila) || "Cualquiera";
            const id = (Array.isArray(fila) && fila[2]) ? String(fila[2]).trim() : null;
            return { id: id, nombre: nombre, texto: nombre };
        }
    },

    // 📦 Límite de Packs
    limitePacks: {
        id: "limitePacks",
        titulo: "📦 Límite de Packs",
        generar: function (contexto) {
            const packsUsuario = contexto.packsUsuario || [];
            const maxPacks = contexto.configPacks?.maxPacks || 3;
            const tiposPermitidos = contexto.configPacks?.tiposPermitidos || ["Expansión", "Contenido", "Accesorios", "Kits"];

            // Crear mapa de pack -> tipo usando database.packs
            const packTipoMap = {};
            if (database.packs && Array.isArray(database.packs)) {
                database.packs.forEach(fila => {
                    if (fila[0] && fila[0].trim()) packTipoMap[fila[0].trim().toLowerCase()] = "Expansión";
                    if (fila[2] && fila[2].trim()) packTipoMap[fila[2].trim().toLowerCase()] = "Contenido";
                    if (fila[4] && fila[4].trim()) packTipoMap[fila[4].trim().toLowerCase()] = "Accesorios";
                    if (fila[6] && fila[6].trim()) packTipoMap[fila[6].trim().toLowerCase()] = "Kits";
                    if (fila[8] && fila[8].trim()) packTipoMap[fila[8].trim().toLowerCase()] = "Gratis";
                    if (fila[10] && fila[10].trim()) packTipoMap[fila[10].trim().toLowerCase()] = "Juego Base";
                });
            }

            // Filtrar únicamente los packs que el usuario ha seleccionado previamente Y que coinciden con los tipos permitidos
            const juegoBasePermitido = contexto.configPacks?.juegoBasePermitido !== false;

            const poolFiltrado = packsUsuario.filter(packNombre => {
                const packClean = packNombre.trim().toLowerCase();
                let tipoPack = packTipoMap[packClean];

                // Fallback por si acaso en solares
                if (!tipoPack && database.solares) {
                    const s = database.solares.find(sol => (sol.nombrePack || "").trim().toLowerCase() === packClean);
                    if (s && s.tipoPack) tipoPack = s.tipoPack.trim();
                }

                // Excluir Juego Base si no está permitido en el límite
                if (!juegoBasePermitido && (tipoPack === "Juego Base" || packClean === "los sims 4")) {
                    return false;
                }

                if (!tipoPack) return true; // Si no se encuentra tipo, no descartar estrictamente

                return tiposPermitidos.some(t => tipoPack.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(tipoPack.toLowerCase()));
            });

            if (poolFiltrado.length === 0) {
                return {
                    texto: `No posees packs de los tipos seleccionados (${tiposPermitidos.join(", ")})`,
                    packsPermitidos: []
                };
            }

            // Seleccionar aleatoriamente hasta maxPacks entre los packs filtrados
            const seleccionados = [];
            const copia = [...poolFiltrado];
            const cantidad = Math.min(maxPacks, copia.length);

            for (let i = 0; i < cantidad; i++) {
                const idx = Math.floor(Math.random() * copia.length);
                seleccionados.push(copia.splice(idx, 1)[0]);
            }

            if (seleccionados.length === 0) {
                return { texto: `Máximo ${maxPacks} pack(s)` };
            }

            return {
                texto: `Máximo ${maxPacks} pack(s): ${seleccionados.join(", ")}`,
                packsPermitidos: seleccionados
            };
        }
    },

    // 💰 Presupuesto
    presupuesto: {
        id: "presupuesto",
        titulo: "💰 Presupuesto",
        generar: function (contexto) {
            const rand = Math.random() * 100;
            let valor;
            let esIlimitado = false;

            if (rand < 96) {
                // 96% entre 20.000 § y 200.000 §
                valor = Math.floor(Math.random() * (200000 - 20000 + 1)) + 20000;
            } else if (rand < 99) {
                // 3% Ilimitado
                esIlimitado = true;
            } else {
                // 1% entre 5.000 § y 19.999 §
                valor = Math.floor(Math.random() * (19999 - 5000 + 1)) + 5000;
            }

            if (esIlimitado) {
                return { texto: "Presupuesto ILIMITADO", valorNumerico: Infinity, esIlimitado: true };
            }

            const formateado = valor.toLocaleString("es-ES") + " §";
            return { texto: formateado, valorNumerico: valor, esIlimitado: false };
        }
    },

    // 🏢 Límite de altura
    limiteAltura: {
        id: "limiteAltura",
        titulo: "🏢 Límite de altura",
        generar: function (contexto) {
            const plantas = Math.floor(Math.random() * 5) + 1; // 1 a 5
            return { texto: `Mínimo ${plantas} ${plantas === 1 ? "planta" : "plantas"}` };
        }
    },

    // 📏 Tamaño de solar
    tamanoSolar: {
        id: "tamanoSolar",
        titulo: "📏 Tamaño de solar",
        generar: function (contexto) {
            const tamano = contexto.configTamano?.tamano;
            if (!tamano) {
                // Si por algún motivo no hay tamaño configurado, devuelve uno al azar genérico o error
                return { texto: "Cualquier tamaño" };
            }
            return {
                texto: `Obligatorio: ${tamano}`,
                tamanoRequerido: tamano
            };
        }
    },

    // 🎯 Tipo de solar (antes objetivo)
    objetivo: {
        id: "objetivo",
        titulo: "🎯 Tipo de solar",
        generar: function (contexto) {
            const packsUsuario = contexto.packsUsuario || [];
            const lista = (typeof database !== "undefined" && database.objetivos) ? database.objetivos : [];
            const opcionesActivas = contexto.opcionesActivas || [];

            // Averiguar qué modo está activo
            const esSoloResidencial = opcionesActivas.includes("solo-residenciales");
            const esSoloComunitario = opcionesActivas.includes("solo-comunitarios");
            const esAleatorio = opcionesActivas.includes("tipo-solar-aleatorio");

            // ── Filtrado centralizado (columna C vacía = Juego Base) ──
            const objetivosValidos = filtrarObjetivosPorPacks(lista, packsUsuario);
            if (!objetivosValidos) {
                return { texto: "⚠️ Sin packs disponibles", tipo: "_error_sin_packs" };
            }

            // Filtrar por modo elegido
            const poolResidencial = objetivosValidos.filter(f => (f[0] || "").trim().toLowerCase().includes("residencial"));
            const poolComunitario = objetivosValidos.filter(f => !(f[0] || "").trim().toLowerCase().includes("residencial"));

            let poolElegido = objetivosValidos;

            if (esSoloResidencial && poolResidencial.length > 0) {
                poolElegido = poolResidencial;
            } else if (esSoloResidencial && poolResidencial.length === 0) {
                // Modo residencial pero sin residenciales disponibles con packs actuales
                return { texto: "⚠️ Sin tipos residenciales disponibles", tipo: "_error_sin_packs" };
            } else if (esSoloComunitario && poolComunitario.length > 0) {
                poolElegido = poolComunitario;
            } else if (esSoloComunitario && poolComunitario.length === 0) {
                return { texto: "⚠️ Sin tipos comunitarios disponibles", tipo: "_error_sin_packs" };
            } else if (esAleatorio) {
                // 60% residencial, 40% comunitario
                if (Math.random() < 0.60 && poolResidencial.length > 0) {
                    poolElegido = poolResidencial;
                } else if (poolComunitario.length > 0) {
                    poolElegido = poolComunitario;
                }
            }

            if (poolElegido.length === 0) return { texto: "⚠️ Sin tipos de solar disponibles", tipo: "_error_sin_packs" };

            const filaElegida = poolElegido[Math.floor(Math.random() * poolElegido.length)];
            const tipoObj = (filaElegida[0] || "").trim().toLowerCase();
            const nombreObj = filaElegida[1] || "Construcción libre";
            const imagenRaw = (filaElegida[3] || "").trim();
            const imagenObj = normalizarRutaIconoTipoSolar(imagenRaw);

            if (tipoObj.includes("residencial")) {
                const sims = Math.floor(Math.random() * 8) + 1;
                return {
                    nombre: nombreObj,
                    texto: `${nombreObj} (Vivienda para ${sims} ${sims === 1 ? "Sim" : "Sims"})`,
                    tipo: "residencial",
                    sims: sims,
                    imagen: imagenObj || null
                };
            } else {
                return {
                    nombre: nombreObj,
                    texto: `${nombreObj} (Solar comunitario)`,
                    tipo: "comunitario",
                    imagen: imagenObj || null
                };
            }
        }
    },

    // 🎨 Colores
    colores: {
        id: "colores",
        titulo: "🎨 Colores",
        generar: function (contexto) {
            const numColores = contexto.configColores?.cantidad || 3;
            const lista = database.colores || [];

            if (lista.length === 0) return { texto: "Cualquier color", elementos: [] };

            const copia = [...lista];
            const seleccionados = [];
            const cantidad = Math.min(numColores, copia.length);

            for (let i = 0; i < cantidad; i++) {
                const idx = Math.floor(Math.random() * copia.length);
                const fila = copia.splice(idx, 1)[0];
                const nombre = (Array.isArray(fila) ? fila[0] : fila) || "Color";
                const hex = (Array.isArray(fila) && fila[1]) ? fila[1].trim() : "#CCCCCC";
                const id = (Array.isArray(fila) && fila[2]) ? String(fila[2]).trim() : null;
                seleccionados.push({ id: id, nombre: nombre, hex: hex });
            }

            const nombres = seleccionados.map(c => c.nombre).join(", ");
            return {
                texto: `${seleccionados.length} color(es): ${nombres}`,
                elementos: seleccionados
            };
        }
    },

    // ⏱ Temporizador
    temporizador: {
        id: "temporizador",
        titulo: "⏱ Temporizador",
        generar: function (contexto) {
            const presup = contexto.resultadosGenerados?.presupuesto;
            let minutos;

            if (presup && !presup.esIlimitado && presup.valorNumerico < 20000) {
                // Inferior a 20.000 § -> Máximo 5 minutos
                minutos = Math.floor(Math.random() * 5) + 1;
            } else {
                // Superior o ilimitado: normalmente 5 a 30 min, baja prob hasta 60 min
                const rand = Math.random() * 100;
                if (rand < 90) {
                    minutos = Math.floor(Math.random() * (30 - 5 + 1)) + 5;
                } else {
                    minutos = Math.floor(Math.random() * (60 - 31 + 1)) + 31;
                }
            }

            return { texto: `${minutos} minutos`, minutos: minutos };
        }
    },

    // 🔨 Limitantes de Construir
    limitanteConstruir: {
        id: "limitanteConstruir",
        titulo: "🔨 Limitantes (Elementos que no puedes usar en tus construcciones): Modo Construir",
        generar: function (contexto) {
            const cantidad = contexto.configLimitantesConstruir?.cantidad || 1;
            const seleccionados = typeof seleccionarLimitantesAleatorios === "function"
                ? seleccionarLimitantesAleatorios(database.limitantesConstruir, cantidad)
                : [];

            if (seleccionados.length === 0) {
                return { texto: "No hay limitantes disponibles en la tabla.", elementos: [] };
            }

            return {
                texto: `${seleccionados.length} limitante${seleccionados.length === 1 ? "" : "s"} de construcción`,
                elementos: seleccionados
            };
        }
    },

    // 🛒 Limitantes de Comprar
    limitanteComprar: {
        id: "limitanteComprar",
        titulo: "🛒 Limitantes (Elementos que no puedes usar en tus construcciones): Modo Comprar",
        generar: function (contexto) {
            const cantidad = contexto.configLimitantesComprar?.cantidad || 1;
            const seleccionados = typeof seleccionarLimitantesAleatorios === "function"
                ? seleccionarLimitantesAleatorios(database.limitantesComprar, cantidad)
                : [];

            if (seleccionados.length === 0) {
                return { texto: "No hay limitantes disponibles en la tabla.", elementos: [] };
            }

            return {
                texto: `${seleccionados.length} limitante${seleccionados.length === 1 ? "" : "s"} de compra`,
                elementos: seleccionados
            };
        }
    },

    // 🎨 Usar CC (Contenido Personalizado)
    ayudaCC: {
        id: "ayudaCC",
        titulo: "🎨 Contenido Personalizado (CC)",
        generar: function (contexto) {
            const esPermitido = Math.random() < 0.5;
            return {
                permitido: esPermitido,
                dificultadDelta: esPermitido ? -1 : 1,
                texto: esPermitido
                    ? "✅ SÍ se puede usar CC (-1 Dificultad)"
                    : "❌ NO se puede usar CC (+1 Dificultad)"
            };
        }
    },

    // 🏗️ Trucos de Construcción
    ayudaTrucos: {
        id: "ayudaTrucos",
        titulo: "🏗️ Trucos de Construcción",
        generar: function (contexto) {
            const esPermitido = Math.random() < 0.5;
            return {
                permitido: esPermitido,
                dificultadDelta: esPermitido ? -1 : 1,
                texto: esPermitido
                    ? "✅ SÍ se pueden usar trucos (bb.moveobjects on...) (-1 Dificultad)"
                    : "❌ NO se pueden usar trucos de construcción (+1 Dificultad)"
            };
        }
    },

    // 🛠️ Mods de Ayuda
    ayudaMods: {
        id: "ayudaMods",
        titulo: "🛠️ Mods de Ayuda",
        generar: function (contexto) {
            const esPermitido = Math.random() < 0.5;
            return {
                permitido: esPermitido,
                dificultadDelta: esPermitido ? -1 : 1,
                texto: esPermitido
                    ? "✅ SÍ se pueden usar mods de ayuda (T.O.O.L...) (-1 Dificultad)"
                    : "❌ NO se pueden usar mods de ayuda (+1 Dificultad)"
            };
        }
    },

    // 🧠 Habilidades al azar
    habilidades: {
        id: "habilidades",
        titulo: "🧠 Habilidades Requeridas",
        generar: function (contexto) {
            const lista = (typeof database !== "undefined" && database.habilidades) ? database.habilidades : [];
            const packsUsuario = contexto.packsUsuario || [];
            const cantidad = contexto.configHabilidades?.cantidad || 3;

            const disponibles = filtrarHabilidadesPorPacks(lista, packsUsuario);

            if (!disponibles || disponibles.length === 0) {
                return { texto: "No hay habilidades disponibles para tus packs.", elementos: [], tipo: "_error_sin_packs" };
            }

            const copia = [...disponibles];
            const seleccionadas = [];
            const n = Math.min(cantidad, copia.length);
            for (let i = 0; i < n; i++) {
                const idx = Math.floor(Math.random() * copia.length);
                seleccionadas.push(copia.splice(idx, 1)[0]);
            }

            const nombres = seleccionadas.map(f => (f[0] || "").trim()).join(", ");
            return {
                texto: `${seleccionadas.length} habilidad(es): ${nombres}`,
                elementos: seleccionadas
            };
        }
    }
};

