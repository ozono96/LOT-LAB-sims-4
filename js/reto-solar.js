/* =========================================================
   RETO SOLAR
   Lógica de selección de solar para el modo retos respetando
   los packs seleccionados por el usuario.
   ========================================================= */

function seleccionarSolarParaReto(packsUsuario = [], categoriasGeneradas = {}) {
    if (!database.solares || database.solares.length === 0) {
        return null;
    }

    function filtrarSolares(soloJuegoBase) {
        return database.solares.filter(solar => {
            const packSolar = (solar.nombrePack || "").trim();
            const tipoPackSolar = (solar.tipoPack || "").trim().toLowerCase();

            const esJuegoBase = tipoPackSolar.includes("base") || packSolar.toLowerCase().includes("juego base") || packSolar.toLowerCase() === "los sims 4";

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

            // Comprobar el tamaño si es requerido
            if (categoriasGeneradas && categoriasGeneradas.tamanoSolar && categoriasGeneradas.tamanoSolar.resultado.tamanoRequerido) {
                const tamRequerido = categoriasGeneradas.tamanoSolar.resultado.tamanoRequerido.trim();
                if ((solar.tamaño || "").trim() !== tamRequerido) {
                    return false;
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
    return solaresValidos[indiceAleatorio];
}
