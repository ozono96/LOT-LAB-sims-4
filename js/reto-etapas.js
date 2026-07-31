/* =========================================================
   RETO ETAPAS DE VIDA
   Determina, para un reto residencial, cuántos sims de cada
   etapa de vida (Bebé, Niño, Adolescente, Joven Adulto, etc.)
   componen la vivienda, respetando los packs marcados por el
   usuario y la restricción de "Caballo" en solares ND.
   ========================================================= */

// Devuelve las etapas de vida disponibles según los packs del usuario
// y si hay que excluir "Caballo" (solar de tamaño ND).
function obtenerEtapasDisponibles(packsUsuario = [], excluirCaballo = false) {
    const filas = database.etapasVida || [];

    return filas
        .filter(fila => {
            if (!fila || !fila[0]) return false;

            const nombreEtapa = (fila[0] || "").trim();
            const packRequerido = (fila[2] || "").trim();

            // Excluir "Caballo" si el solar asignado es de tamaño ND
            if (excluirCaballo && nombreEtapa.toLowerCase() === "caballo") {
                return false;
            }

            // Si la etapa no requiere ningún pack, siempre está disponible
            if (!packRequerido) return true;

            // Si requiere un pack, debe estar entre los packs marcados por el usuario
            return packsUsuario.some(p =>
                p.toLowerCase().includes(packRequerido.toLowerCase()) ||
                packRequerido.toLowerCase().includes(p.toLowerCase())
            );
        })
        .map(fila => ({
            etapa: (fila[0] || "").trim(),
            idFoto: (fila[1] || "").trim(),
            packRequerido: (fila[2] || "").trim()
        }));
}

// Genera la composición de la vivienda: siempre 1 Joven Adulto/a como mínimo,
// el resto de sims se eligen al azar entre las etapas disponibles.
function generarComposicionVivienda(sims, packsUsuario = [], excluirCaballo = false) {
    const etapasDisponibles = obtenerEtapasDisponibles(packsUsuario, excluirCaballo);

    if (etapasDisponibles.length === 0 || !sims || sims <= 0) {
        return [];
    }

    const etapaJovenAdulto = etapasDisponibles.find(e =>
        e.etapa.toLowerCase().includes("joven adulto")
    );

    const composicion = [];

    if (etapaJovenAdulto) {
        composicion.push(etapaJovenAdulto);
    } else {
        // Si por algún motivo la tabla no tiene "Joven Adulto/a", se elige cualquiera
        // para no bloquear la generación del reto.
        composicion.push(etapasDisponibles[Math.floor(Math.random() * etapasDisponibles.length)]);
    }

    const restantes = Math.max(0, sims - 1);

    for (let i = 0; i < restantes; i++) {
        composicion.push(etapasDisponibles[Math.floor(Math.random() * etapasDisponibles.length)]);
    }

    return composicion;
}

// Recalcula la composición para un reto ya generado (usado en rerolls),
// teniendo en cuenta el solar actualmente asignado (si lo hay).
function recalcularComposicionVivienda(reto) {
    if (!reto || !reto.categorias || !reto.categorias.objetivo) return;

    const catObjetivo = reto.categorias.objetivo;
    if (!catObjetivo.resultado || catObjetivo.resultado.tipo !== "residencial") return;

    const excluirCaballo = !!(
        reto.tipo === "con-solar" &&
        reto.solar &&
        (reto.solar.tamaño || "").trim().toUpperCase() === "ND"
    );

    catObjetivo.resultado.composicion = generarComposicionVivienda(
        catObjetivo.resultado.sims,
        reto.contexto.packsUsuario,
        excluirCaballo
    );
}

// Genera el HTML con los iconos + cantidad de cada etapa (para el resultado del reto)
function htmlComposicionVivienda(composicion) {
    if (!composicion || composicion.length === 0) return "";

    // Agrupamos por etapa para mostrar la cantidad de cada una
    const conteo = {};
    composicion.forEach(item => {
        if (!conteo[item.etapa]) {
            conteo[item.etapa] = { cantidad: 0, idFoto: item.idFoto };
        }
        conteo[item.etapa].cantidad++;
    });

    let html = `<div class="tiraIconosEtapas">`;

    Object.keys(conteo).forEach(etapa => {
        const info = conteo[etapa];
        const rutaBase = typeof rutaBaseIconoEtapa === "function" ? rutaBaseIconoEtapa(info.idFoto) : null;

        if (rutaBase) {
            html += `
                <span class="chipIconoEtapa" title="${etapa}" data-tooltip="${etapa}: ${info.cantidad}">
                    <img src="${rutaBase}.${EXTENSIONES_ICONO_ETAPA[0]}" data-ruta-base="${rutaBase}" data-intento="0"
                        alt="${etapa}" class="iconoEtapa" onerror="manejarErrorImagenEtapa(this)">
                    <span class="chipIconoEtapaCantidad">${info.cantidad}</span>
                </span>
            `;
        } else {
            html += `<span class="chipEtapaTexto">${etapa}: ${info.cantidad}</span>`;
        }
    });

    html += `</div>`;

    return html;
}