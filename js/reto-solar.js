/* =========================================================
   RETO SOLAR
   Lógica de selección de solar para el modo retos respetando
   los packs seleccionados por el usuario.
   ========================================================= */

function seleccionarSolarParaReto(packsUsuario = [], categoriasGeneradas = {}) {
    if (!database.solares || database.solares.length === 0) {
        return null;
    }

    // Filtrar solares compatibles con los packs que posee el usuario
    const solaresValidos = database.solares.filter(solar => {
        const packSolar = (solar.nombrePack || "").trim();
        const tipoPackSolar = (solar.tipoPack || "").trim().toLowerCase();

        // 1. Comprobar si el usuario tiene el pack
        let tienePack = false;
        const esJuegoBase = tipoPackSolar.includes("base") || packSolar.toLowerCase().includes("juego base") || packSolar.toLowerCase() === "los sims 4";

        if (esJuegoBase) {
            // Solo válido si el botón "Los Sims 4" está marcado
            tienePack = typeof juegoBaseMarcado === "function" ? juegoBaseMarcado() : true;
        } else {
            tienePack = packsUsuario.some(packSelec => 
                packSelec.toLowerCase() === packSolar.toLowerCase() ||
                packSolar.toLowerCase().includes(packSelec.toLowerCase())
            );
        }

        if (!tienePack) return false;

        // 2. Comprobar el tamaño si es requerido
        if (categoriasGeneradas && categoriasGeneradas.tamanoSolar && categoriasGeneradas.tamanoSolar.resultado.tamanoRequerido) {
            const tamRequerido = categoriasGeneradas.tamanoSolar.resultado.tamanoRequerido.trim();
            if ((solar.tamaño || "").trim() !== tamRequerido) {
                return false;
            }
        }

        return true;
    });

    if (solaresValidos.length === 0) {
        return null;
    }

    const indiceAleatorio = Math.floor(Math.random() * solaresValidos.length);
    return solaresValidos[indiceAleatorio];
}
