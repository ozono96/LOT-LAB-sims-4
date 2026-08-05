/* =========================================================
   RETO MODULOS
   Módulos independientes para cada categoría del modo retos.
   ========================================================= */

const RetoModulos = {
    // 🏛 Estilo Exterior
    estiloExterior: {
        id: "estiloExterior",
        titulo: "🏛 Estilo Exterior",
        generar: function (contexto) {
            const lista = database.estilosArquitectonicos || [];
            if (lista.length === 0) return { texto: "Cualquiera" };
            const fila = lista[Math.floor(Math.random() * lista.length)];
            const nombre = (Array.isArray(fila) ? fila[0] : fila) || "Cualquiera";
            return { texto: nombre };
        }
    },

    // 🛋 Estilo Interior
    estiloInterior: {
        id: "estiloInterior",
        titulo: "🛋 Estilo Interior",
        generar: function (contexto) {
            const lista = database.estilosDecoracion || [];
            if (lista.length === 0) return { texto: "Cualquiera" };
            const fila = lista[Math.floor(Math.random() * lista.length)];
            const nombre = (Array.isArray(fila) ? fila[0] : fila) || "Cualquiera";
            return { texto: nombre };
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
            const lista = database.objetivos || [];
            const opcionesActivas = contexto.opcionesActivas || [];

            // Averiguar qué modo está activo
            const esSoloResidencial = opcionesActivas.includes("solo-residenciales");
            const esSoloComunitario = opcionesActivas.includes("solo-comunitarios");
            const esAleatorio = opcionesActivas.includes("tipo-solar-aleatorio");

            // Filtrar objetivos por packs del usuario
            let objetivosValidos = lista.filter(fila => {
                if (!fila || fila.length === 0) return false;
                const packRequerido = fila[2] ? fila[2].trim() : "";
                if (!packRequerido || packRequerido.toLowerCase().includes("base")) return true;
                return packsUsuario.some(p => p.toLowerCase().includes(packRequerido.toLowerCase()) || packRequerido.toLowerCase().includes(p.toLowerCase()));
            });

            if (objetivosValidos.length === 0) objetivosValidos = lista;

            // Filtrar según el modo elegido
            let poolResidencial = objetivosValidos.filter(f => (f[0] || "").trim().toLowerCase().includes("residencial"));
            let poolComunitario = objetivosValidos.filter(f => !(f[0] || "").trim().toLowerCase().includes("residencial"));

            let poolElegido = objetivosValidos;

            if (esSoloResidencial && poolResidencial.length > 0) {
                poolElegido = poolResidencial;
            } else if (esSoloComunitario && poolComunitario.length > 0) {
                poolElegido = poolComunitario;
            } else if (esAleatorio) {
                // 60% residencial, 40% comunitario
                if (Math.random() < 0.60 && poolResidencial.length > 0) {
                    poolElegido = poolResidencial;
                } else if (poolComunitario.length > 0) {
                    poolElegido = poolComunitario;
                }
            }

            if (poolElegido.length === 0) return { texto: "Construcción libre" };

            const filaElegida = poolElegido[Math.floor(Math.random() * poolElegido.length)];
            const tipoObj = (filaElegida[0] || "").trim().toLowerCase();
            const nombreObj = filaElegida[1] || "Construcción libre";

            if (tipoObj.includes("residencial")) {
                const sims = Math.floor(Math.random() * 8) + 1; // 1 a 8 Sims
                return {
                    texto: `${nombreObj} (Vivienda para ${sims} ${sims === 1 ? "Sim" : "Sims"})`,
                    tipo: "residencial",
                    sims: sims
                };
            } else {
                return {
                    texto: `${nombreObj} (Solar comunitario)`,
                    tipo: "comunitario"
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
                seleccionados.push({ nombre, hex });
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
        titulo: "🔨 Limitantes: Construir",
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
        titulo: "🛒 Limitantes: Comprar",
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
            const lista = database.habilidades || [];
            const packsUsuario = (contexto.packsUsuario || []).map(p => p.trim().toLowerCase());
            const cantidad = contexto.configHabilidades?.cantidad || 3;

            if (lista.length === 0) {
                return { texto: "No hay habilidades disponibles.", elementos: [] };
            }

            // Filtrar habilidades por packs del usuario (col B = pack requerido)
            const disponibles = lista.filter(fila => {
                const packReq = (fila[1] || "").trim().toLowerCase();
                if (!packReq || packReq === "base" || packReq.includes("juego base") || packReq === "-" || packReq === "") {
                    return true;
                }
                return packsUsuario.some(p => p.includes(packReq) || packReq.includes(p));
            });

            if (disponibles.length === 0) {
                return { texto: "No hay habilidades disponibles para tus packs.", elementos: [] };
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

