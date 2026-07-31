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
        const rerollsSolarLeft = typeof reto.rerollsSolar === "number" ? reto.rerollsSolar : 3;
        const disabledSolar = rerollsSolarLeft <= 0 ? "disabled" : "";
        const btnSolarClass = rerollsSolarLeft <= 0 ? "btnReroll deshabilitado" : "btnReroll";

        const solarHtml = reto.solar
            ? (typeof crearFichaSolar === "function" ? crearFichaSolar(reto.solar) : `
                <div class="fichaSolar">
                    <strong>${reto.solar.nombre}</strong><br>
                    📦 ${reto.solar.nombrePack} | 🌎 ${reto.solar.mundo} | 📐 ${reto.solar.tamaño}
                </div>`)
            : `<p style="color: var(--color-error);">No se encontró ningún solar en los packs seleccionados.</p>`;

        html += `
            <div class="seccionSolarReto" style="margin-bottom: 30px;">
                <h3 style="text-align: center; margin-bottom: 12px;">🏡 Solar Seleccionado</h3>
                <div style="position: relative; display: flex; align-items: center; justify-content: center; min-height: 60px; max-width: 650px; margin: 0 auto; padding: 0 20px;">
                    <div style="display: flex; justify-content: center; align-items: center; width: 100%;">
                        ${solarHtml}
                    </div>
                    <button
                        class="${btnSolarClass}"
                        onclick="rerollSolar()"
                        ${disabledSolar}
                        data-tooltip=" ¡RECUERDA! Solo tienes 3 intentos para regenerar el solar."
                        style="position: absolute; right: 20px; display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem; flex-shrink: 0;"
                    >
                        🔄 (${rerollsSolarLeft}/3)
                    </button>
                </div>
            </div>
        `;
    }




    // 3. Tarjetas de Categorías Activas
    html += `<div class="listaCategoriasReto" style="display: flex; flex-direction: column; gap: 15px; max-width: 650px; margin: 0 auto;">`;

    Object.keys(reto.categorias).forEach(catId => {
        const cat = reto.categorias[catId];
        const rerollsLeft = cat.rerollsRestantes;
        const disabled = rerollsLeft <= 0 ? "disabled" : "";
        const btnClass = rerollsLeft <= 0 ? "btnReroll deshabilitado" : "btnReroll";

        let textoHtml = `<div style="font-size: 1.05rem; margin-top: 4px;">${cat.resultado.texto}</div>`;
        if (catId === "colores") {
            textoHtml = "";
        }

        let detalleExtra = "";

        // Si es categoría colores y tiene muestras hex
        if (catId === "colores" && cat.resultado.elementos && cat.resultado.elementos.length > 0) {
            detalleExtra += `<div class="muestrasColores" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; align-items: center;">`;
            cat.resultado.elementos.forEach(c => {
                detalleExtra += `
                    <span class="chipColor" title="${c.nombre}" data-tooltip="${c.nombre}" style="width: 34px; height: 34px; border-radius: 50%; background: ${c.hex}; border: 2px solid rgba(255,255,255,0.8); display: inline-block; box-shadow: var(--sombra-suave); cursor: pointer; transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'"></span>
                `;
            });
            detalleExtra += `</div>`;
        }

        // Si es categoría límite de packs y tiene lista de packs permitidos → mostrar iconos
        if (catId === "limitePacks" && cat.resultado.packsPermitidos && cat.resultado.packsPermitidos.length > 0) {
            detalleExtra += `<div class="tiraIconosPacks">${htmlIconosPacks(cat.resultado.packsPermitidos)}</div>`;
        }

        // Si es la categoría de tipo de solar y ha salido residencial, mostrar la
        // composición por etapas de vida de la vivienda (icono + cantidad de cada una)
        if (catId === "objetivo" && cat.resultado.tipo === "residencial" && cat.resultado.composicion && cat.resultado.composicion.length > 0 && typeof htmlComposicionVivienda === "function") {
            detalleExtra += `
                <div style="margin-top: 10px; font-weight: bold; font-size: 0.95rem; opacity: 0.85;">
                    👪 Etapas de vida de la vivienda:
                </div>
                ${htmlComposicionVivienda(cat.resultado.composicion)}
            `;
        }

        html += `
            <div class="tarjetaCategoriaReto" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.15); border: 1px solid var(--borde); padding: 15px 20px; border-radius: var(--radio-normal); flex-wrap: wrap; gap: 10px;">
                <div class="infoCategoria" style="flex: 1; min-width: 200px;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--color-titulo);">${cat.modulo.titulo}</div>
                    ${textoHtml}
                    ${detalleExtra}
                </div>
                <button
                    class="${btnClass}"
                    onclick="rerollCategoria('${catId}')"
                    ${disabled}
                    data-tooltip=" ¡RECUERDA! Solo tienes 3 intentos para regenerar cada limitante del reto."
                    style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.95rem;"
                >
                    🔄 (${rerollsLeft}/3)
                </button>
            </div>
        `;
    });

    html += `</div>`;

    contenedor.innerHTML = html;

    // ── Tooltip de los botones de reroll ──
    const tooltip = document.getElementById("tooltipOpciones");
    if (tooltip) {
        contenedor.querySelectorAll(".btnReroll").forEach(boton => {
            boton.addEventListener("mouseenter", function () {
                tooltip.textContent = this.getAttribute("data-tooltip");
                tooltip.style.display = "block";
            });
            boton.addEventListener("mousemove", function (e) {
                tooltip.style.left = e.pageX + "px";
                tooltip.style.top = (e.pageY - 10) + "px";
            });
            boton.addEventListener("mouseleave", function () {
                tooltip.style.display = "none";
            });

            // Versión táctil: el tooltip solo se muestra mientras se mantiene pulsado
            boton.addEventListener("touchstart", function (e) {
                tooltip.textContent = this.getAttribute("data-tooltip");
                const touch = e.touches[0];
                tooltip.style.left = touch.pageX + "px";
                tooltip.style.top = (touch.pageY - 10) + "px";
                tooltip.style.display = "block";
            }, { passive: true });
            boton.addEventListener("touchend", function () {
                tooltip.style.display = "none";
            }, { passive: true });
            boton.addEventListener("touchcancel", function () {
                tooltip.style.display = "none";
            }, { passive: true });
        });
    }
}