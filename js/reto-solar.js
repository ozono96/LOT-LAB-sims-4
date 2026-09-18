/* =========================================================
   RETO SOLAR
   Lógica de selección de solar para el modo retos respetando
   los packs seleccionados por el usuario.
   ========================================================= */

function seleccionarSolarParaReto(packsUsuario = [], categoriasGeneradas = {}) {
    if (!database.solares || database.solares.length === 0) {
        return null;
    }

    // Leer el tipo del objetivo generado, si existe y es válido.
    // Valores reconocidos: "residencial" | "comunitario"
    // Si no hay objetivo activo, o su tipo es un error (_error_sin_packs, etc.),
    // tipoObjetivo queda como null y NO se aplica ningún filtro de tipo.
    const tipoObjetivoRaw = categoriasGeneradas?.objetivo?.resultado?.tipo;
    const tipoObjetivo = (typeof tipoObjetivoRaw === "string" && !tipoObjetivoRaw.startsWith("_error"))
        ? tipoObjetivoRaw.trim().toLowerCase()
        : null;

    // Construir el conjunto de tipoSolar específicos que corresponden a "Comunitario"
    // según database.todosTiposSolares ([0] = categoría, [1] = nombre tipoSolar).
    // Se construye aquí (fuera del bucle de filter) para eficiencia.
    // Residencial se trata aparte: solo acepta "Residencial" y "Vacio".
    let tiposSolaresComunitarios = null;
    if (tipoObjetivo === "comunitario" && Array.isArray(database.todosTiposSolares)) {
        tiposSolaresComunitarios = new Set();
        database.todosTiposSolares.forEach(fila => {
            const categoria = (fila[0] || "").trim().toLowerCase();
            const nombreTipo = (fila[1] || "").trim().toLowerCase();
            if (categoria === "comunitario" && nombreTipo) {
                tiposSolaresComunitarios.add(nombreTipo);
            }
        });
    }

    function filtrarSolares(soloJuegoBase) {
        return database.solares.filter(solar => {
            const packSolar = (solar.nombrePack || "").trim();
            const tipoPackSolar = (solar.tipoPack || "").trim().toLowerCase();

            const esJuegoBase = tipoPackSolar.includes("base") || packSolar.toLowerCase().includes("juego base") || packSolar.toLowerCase() === "los sims 4";

            // 1. Excluir "Solar Oculto" de la columna G (tipoLote)
            if ((solar.tipoLote || "").trim().toLowerCase() === "solar oculto") {
                return false;
            }

            // 2. Filtrar por Packs disponibles del usuario
            let tienePack;

            if (soloJuegoBase) {
                if (!esJuegoBase) return false;
                tienePack = typeof juegoBaseMarcado === "function" ? juegoBaseMarcado() : true;
            } else if (esJuegoBase) {
                tienePack = typeof juegoBaseMarcado === "function" ? juegoBaseMarcado() : true;
            } else {
                tienePack = packsUsuario.some(packSelec =>
                    packSelec.toLowerCase() === packSolar.toLowerCase() ||
                    packSolar.toLowerCase().includes(packSelec.toLowerCase())
                );
            }

            if (!tienePack) return false;

            // 3. Filtrar por tamaño si es requerido
            if (categoriasGeneradas && categoriasGeneradas.tamanoSolar && categoriasGeneradas.tamanoSolar.resultado.tamanoRequerido) {
                const tamRequerido = categoriasGeneradas.tamanoSolar.resultado.tamanoRequerido.trim();
                if ((solar.tamaño || "").trim() !== tamRequerido) {
                    return false;
                }
            }

            // 4. Filtrar por Tipo de Solar SOLO cuando el objetivo tiene un tipo válido.
            //    Sin objetivo activo (tipoObjetivo === null) no se aplica restricción de tipo.
            //
            //    IMPORTANTE: solar.tipoSolar NO contiene "Comunitario" sino el tipo específico
            //    ("Bar", "Piso", "Biblioteca"...). La categoría se obtiene de todosTiposSolares.
            //
            //    Residencial → acepta tipoSolar "Residencial" o "Vacio" (exacto, case-insensitive)
            //    Comunitario → acepta cualquier tipoSolar presente en tiposSolaresComunitarios
            if (tipoObjetivo !== null) {
                const tipoSolarNorm = (solar.tipoSolar || "").trim().toLowerCase();

                if (tipoObjetivo === "residencial") {
                    const esValido = tipoSolarNorm === "residencial" || tipoSolarNorm === "vacio";
                    if (!esValido) return false;
                } else if (tipoObjetivo === "comunitario") {
                    const esValido = tiposSolaresComunitarios !== null && tiposSolaresComunitarios.has(tipoSolarNorm);
                    if (!esValido) return false;
                }
            }

            return true;
        });
    }

    let solaresValidos = filtrarSolares(false);

    // ── Si el límite de packs deja fuera cualquier pack con solares propios
    //    (ej. solo packs de accesorios/kits sin mundo), recurrimos al Juego Base ──
    if (solaresValidos.length === 0 && categoriasGeneradas && categoriasGeneradas.limitePacks) {
        solaresValidos = filtrarSolares(true);
    }

    if (solaresValidos.length === 0) {
        return null;
    }

    const indiceAleatorio = Math.floor(Math.random() * solaresValidos.length);
    const solarElegido = solaresValidos[indiceAleatorio];

    return solarElegido;
}

