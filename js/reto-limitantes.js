/* =========================================================
   RETO LIMITANTES EXTRA
   Lógica de las categorías "Construir" y "Comprar": eligen
   al azar una cantidad de limitantes (sin repetir) de las
   tablas correspondientes de Google Sheets.
   ========================================================= */

// Convierte las filas crudas de la hoja en objetos {nombre, idFoto}
function obtenerLimitantesTabla(tabla) {
    return (tabla || [])
        .filter(fila => fila && fila[0])
        .map(fila => ({
            nombre: (fila[0] || "").trim(),
            idFoto: (fila[1] || "").trim()
        }));
}

// Elige "cantidad" limitantes al azar sin repetir de la tabla indicada
function seleccionarLimitantesAleatorios(tabla, cantidad) {
    const disponibles = obtenerLimitantesTabla(tabla);

    if (disponibles.length === 0) return [];

    const copia = [...disponibles];
    const seleccionados = [];
    const total = Math.min(Math.max(1, cantidad || 1), copia.length);

    for (let i = 0; i < total; i++) {
        const idx = Math.floor(Math.random() * copia.length);
        seleccionados.push(copia.splice(idx, 1)[0]);
    }

    return seleccionados;
}

// Genera el HTML de la tira de limitantes: con foto si hay ID de foto
// (y la imagen carga bien), o como chip de texto si no hay foto o falla.
function htmlListaLimitantes(lista) {
    if (!lista || lista.length === 0) return "";

    return `
        <div class="tiraLimitantes">
            ${lista.map(item => {
                const rutaBase = typeof rutaBaseIconoLimitante === "function" ? rutaBaseIconoLimitante(item.idFoto) : null;

                if (rutaBase) {
                    return `
                        <span class="chipLimitante" title="${item.nombre}" data-tooltip="${item.nombre}">
                            <img src="${rutaBase}.${EXTENSIONES_ICONO_LIMITANTE[0]}" data-ruta-base="${rutaBase}" data-intento="0"
                                alt="${item.nombre}" class="iconoLimitante" onerror="manejarErrorImagenLimitante(this)">
                            <span class="chipLimitanteFallback">${item.nombre}</span>
                        </span>
                    `;
                }

                return `<span class="chipLimitanteTexto">${item.nombre}</span>`;
            }).join("")}
        </div>
    `;
}