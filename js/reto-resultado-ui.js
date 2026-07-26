/* =========================================================
   RETO RESULTADO UI
   Renderizado del resultado final del reto con soporte de rerolls.
   ========================================================= */

function renderizarResultadoReto(reto) {
    const contenedor = document.getElementById("contenidoRetoResultado");
    if (!contenedor) return;

    let html = "";

    // 1. Dificultad y Cabecera
    const estrellas = "⭐".repeat(reto.dificultad || 1);
    const tipoTexto = reto.tipo === "con-solar" ? "🏡 Reto Con Solar" : "🏗️ Reto Sin Solar";

    html += `
        <div class="cabeceraResultadoReto" style="text-align: center; margin-bottom: 25px;">
            <div class="badgeTipoReto">${tipoTexto}</div>
            <div class="dificultadReto" style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">
                Dificultad: <span style="color: #f39c12;">${estrellas}</span> (${reto.dificultad} pts)
            </div>
        </div>
    `;

    // 2. Solar asignado (si aplica)
    if (reto.tipo === "con-solar") {
        html += `<div class="seccionSolarReto" style="margin-bottom: 30px;">`;
        html += `<h3 style="text-align: center; margin-bottom: 12px;">🏡 Solar Seleccionado</h3>`;
        if (reto.solar) {
            html += typeof crearFichaSolar === "function" ? crearFichaSolar(reto.solar) : `
                <div class="fichaSolar">
                    <strong>${reto.solar.nombre}</strong><br>
                    📦 ${reto.solar.nombrePack} | 🌎 ${reto.solar.mundo} | 📐 ${reto.solar.tamaño}
                </div>
            `;
        } else {
            html += `<p style="text-align:center; color: var(--color-error);">No se encontró ningún solar en los packs seleccionados.</p>`;
        }
        html += `</div>`;
    }

    // 3. Tarjetas de Categorías Activas
    html += `<div class="listaCategoriasReto" style="display: flex; flex-direction: column; gap: 15px; max-width: 650px; margin: 0 auto;">`;

    Object.keys(reto.categorias).forEach(catId => {
        const cat = reto.categorias[catId];
        const rerollsLeft = cat.rerollsRestantes;
        const disabled = rerollsLeft <= 0 ? "disabled" : "";
        const btnClass = rerollsLeft <= 0 ? "btnReroll deshabilitado" : "btnReroll";

        let detalleExtra = "";

        // Si es categoría colores y tiene muestras hex
        if (catId === "colores" && cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += `<div class="muestrasColores" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">`;
            cat.resultado.elementos.forEach(c => {
                detalleExtra += `
                    <span class="chipColor" style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.1); padding: 4px 10px; border-radius: 20px; font-size: 0.9rem;">
                        <span style="width: 16px; height: 16px; border-radius: 50%; background: ${c.hex}; border: 1px solid rgba(255,255,255,0.5); display: inline-block;"></span>
                        ${c.nombre}
                    </span>
                `;
            });
            detalleExtra += `</div>`;
        }

        // Si es categoría límite de packs y tiene lista de packs permitidos → mostrar iconos
        if (catId === "limitePacks" && cat.resultado.packsPermitidos && cat.resultado.packsPermitidos.length > 0) {
            detalleExtra += `<div class="tiraIconosPacks">${htmlIconosPacks(cat.resultado.packsPermitidos)}</div>`;
        }

        html += `
            <div class="tarjetaCategoriaReto" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.15); border: 1px solid var(--borde); padding: 15px 20px; border-radius: var(--radio-normal); flex-wrap: wrap; gap: 10px;">
                <div class="infoCategoria" style="flex: 1; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--color-titulo);">${cat.modulo.titulo}</div>
                    <div style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto}</div>
                    ${detalleExtra}
                </div>
                <button class="${btnClass}" onclick="rerollCategoria('${catId}')" ${disabled} title="Re-generar esta opción (${rerollsLeft}/3)" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem;">
                    🔄 (${rerollsLeft}/3)
                </button>
            </div>
        `;
    });

    html += `</div>`;

    contenedor.innerHTML = html;
}
